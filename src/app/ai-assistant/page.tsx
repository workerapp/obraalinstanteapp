
// src/app/ai-assistant/page.tsx (previously AiChatPage)
"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, User, Bot, Send } from 'lucide-react';
import { continueChat } from '@/ai/flows/conversational-chat';
import type { MessageData } from 'genkit';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { marked } from 'marked';

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history: MessageData[] = messages.map((msg) => ({
      role: msg.role,
      content: [{ text: msg.content }],
    }));
    history.push({ role: 'user', content: [{ text: input }] });

    try {
      const stream = await continueChat(history);

      let modelResponse = '';
      setMessages((prev) => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        // Robust check to ensure the chunk and its content are valid before processing.
        if (chunk?.content) {
            for (const part of chunk.content) {
                if (part.text) {
                    modelResponse += part.text;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'model') {
                         newMessages[newMessages.length - 1].content = modelResponse;
                      }
                      return newMessages;
                    });
                }
            }
        }
      }
    } catch (err) {
      console.error("Error en el chat IA:", err);
      setMessages((prev) => [...prev, { role: 'model', content: "Lo siento, algo salió mal. Por favor, intenta de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
             viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);
  
  const escapeHtml = (unsafe: string) => {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }

  const renderMarkdown = (content: string) => {
    try {
        const rawMarkup = marked.parse(content, { gfm: true, breaks: true, smartypants: false });
        const sanitizedMarkup = typeof rawMarkup === 'string' ? rawMarkup.replace(/<script.*?>.*?<\/script>/gi, '') : '';
        return { __html: sanitizedMarkup };
    } catch (e) {
        console.error("Error rendering markdown, falling back to plain text:", e);
        return { __html: escapeHtml(content) };
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-w-3xl mx-auto">
      <Card className="flex-1 flex flex-col shadow-xl">
        <CardHeader className="text-center border-b">
          <Sparkles className="mx-auto h-12 w-12 text-accent mb-2" />
          <CardTitle className="text-3xl font-headline">Chat de Asistencia IA</CardTitle>
          <CardDescription>
            Habla con "Obrita", nuestro asistente IA, para encontrar operarios o resolver tus dudas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-6">
               {messages.length === 0 && (
                 <div className="text-center text-muted-foreground p-8">
                   <Bot size={48} className="mx-auto mb-4" />
                   <p>¡Hola! Soy Obrita. ¿Cómo puedo ayudarte hoy?</p>
                   <p className="text-sm">Puedes preguntarme por operarios, por ejemplo: "¿Tienes plomeros disponibles?"</p>
                 </div>
                )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'model' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20}/></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-prose rounded-lg px-4 py-2 prose prose-sm dark:prose-invert ${
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <div dangerouslySetInnerHTML={renderMarkdown(message.content)} />
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-muted text-muted-foreground"><User size={20}/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20}/></AvatarFallback>
                  </Avatar>
                  <div className="max-w-md rounded-lg px-4 py-2 bg-muted flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Escribe tu mensaje aquí..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                 {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Enviar</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
