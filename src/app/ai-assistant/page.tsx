// src/app/ai-assistant/page.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import type { MessageData } from 'genkit';
import { continueChat } from '@/ai/flows/conversational-chat';
import { Bot, Send, Loader2, CircleUser, SquareTerminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function AiAssistantChatPage() {
    const [messages, setMessages] = useState<MessageData[]>([
        { role: 'model', content: [{ text: '¡Hola! Soy Obrita, tu asistente de IA para el hogar. ¿En qué puedo ayudarte hoy?' }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newUserMessage: MessageData = { role: 'user', content: [{ text: input }] };
        const newMessages: MessageData[] = [...messages, newUserMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await continueChat(newMessages);

            let assistantResponse = '';
            setMessages(prev => [...prev, { role: 'model', content: [{ text: assistantResponse }] }]);

            for await (const chunk of stream) {
                if (chunk.content) {
                    chunk.content.forEach(part => {
                        if (part.text) {
                            assistantResponse += part.text;
                            setMessages(prev => {
                                const lastMessage = prev[prev.length - 1];
                                if (lastMessage && lastMessage.role === 'model') {
                                    const updatedContent = [{ text: assistantResponse }];
                                    const updatedMessage = { ...lastMessage, content: updatedContent };
                                    return [...prev.slice(0, -1), updatedMessage];
                                }
                                return prev;
                            });
                        }
                        // Optionally handle and display tool calls/responses
                        if (part.toolRequest) {
                            const toolMessage: MessageData = { role: 'model', content: [{ toolRequest: part.toolRequest }] };
                            setMessages(prev => [...prev.slice(0,-1), toolMessage, { role: 'model', content: [{ text: '' }] }]);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error during chat:', error);
            const errorMessage: MessageData = {
                role: 'model',
                content: [{ text: 'Lo siento, algo salió mal. Por favor, intenta de nuevo.' }]
            };
            // Replace the empty message we added for streaming with the error message
            setMessages(prev => {
                if (prev.length > 0 && prev[prev.length-1].role === 'model' && prev[prev.length-1].content[0].text === '') {
                     return [...prev.slice(0,-1), errorMessage];
                }
                return [...prev, errorMessage];
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && e.currentTarget.form) {
            e.preventDefault();
            e.currentTarget.form.requestSubmit();
        }
    };
    
    return (
        <Card className="w-full max-w-2xl mx-auto flex flex-col h-[calc(100vh-12rem)] shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-headline">
                    <Bot className="text-primary"/> Asistente IA "Obrita"
                </CardTitle>
                <CardDescription>Chatea con Obrita para diagnosticar problemas o encontrar operarios.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-full pr-4" ref={scrollAreaRef as any}>
                    <div className="space-y-4">
                        {messages.filter(Boolean).map((message, index) => (
                            <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? "justify-end" : "justify-start")}>
                                {message.role === 'model' && <Bot className="h-8 w-8 text-primary flex-shrink-0" />}
                                <div className={cn("p-3 rounded-lg max-w-md", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                    {message.content.map((part, partIndex) => {
                                        if (part.text) {
                                            return <p key={partIndex} className="whitespace-pre-wrap">{part.text || '\u00A0'}</p>;
                                        }
                                        if (part.toolRequest) {
                                            return (
                                                <div key={partIndex} className="text-xs p-2 rounded bg-background/50 text-muted-foreground">
                                                    <p className="font-mono flex items-center gap-1"><SquareTerminal size={14} /> <strong>Herramienta:</strong> {part.toolRequest.name}</p>
                                                    <p className="font-mono"><strong>Buscando:</strong> {JSON.stringify(part.toolRequest.input)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                                {message.role === 'user' && <CircleUser className="h-8 w-8 text-muted-foreground flex-shrink-0" />}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3 justify-start">
                                <Bot className="h-8 w-8 text-primary flex-shrink-0" />
                                <div className="p-3 rounded-lg bg-muted flex items-center">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter>
                <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
                    <Textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe tu mensaje..."
                        className="flex-1 resize-none"
                        disabled={isLoading}
                        rows={1}
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Enviar</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
