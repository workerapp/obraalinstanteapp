
// src/components/home/ai-assistant-home-widget.tsx
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Sparkles, Lightbulb, Wrench, Send } from 'lucide-react';
import { suggestSolutions, type SuggestSolutionsOutput } from '@/ai/flows/suggest-solutions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  problemDescription: z.string().min(10, {
    message: "Describe brevemente tu problema (mín. 10 caracteres).",
  }).max(500, {
    message: "La descripción es muy larga (máx. 500 caracteres)."
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function AiAssistantHomeWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<SuggestSolutionsOutput | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      problemDescription: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAiResponse(null);
    console.log("Enviando al Asistente IA (Widget):", data.problemDescription);
    try {
      const response = await suggestSolutions({ problemDescription: data.problemDescription });
      console.log("Respuesta del Asistente IA (Widget):", response);
      if (response && response.suggestedSolutions && response.relevantSkills) {
        setAiResponse(response);
      } else {
        console.error("Respuesta inesperada de la IA:", response);
        setError("La IA devolvió una respuesta inesperada. Inténtalo de nuevo.");
        setAiResponse(null); 
      }
    } catch (err: any) {
      console.error("Error completo del Asistente IA (Widget):", err);
      setError(err.message || "Lo sentimos, algo salió mal al obtener sugerencias. Por favor, inténtalo de nuevo.");
      setAiResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  const currentProblemDescription = form.getValues("problemDescription");

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <Lightbulb className="mx-auto h-12 w-12 text-accent mb-3" />
        <CardTitle className="text-2xl font-headline">Asistente IA Rápido</CardTitle>
        <CardDescription>
          ¿Tienes un problema en casa? Descríbelo y obtén sugerencias al instante.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="problemDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Describe tu Problema</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Mi lavadora no desagua, o tengo una gotera en el techo..."
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Obteniendo Sugerencias...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Obtener Sugerencias
                </>
              )}
            </Button>
          </form>
        </Form>

        {error && !isLoading && (
          <div className="mt-6">
            <Alert variant="destructive" className="w-full">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {aiResponse && !isLoading && (
          <div className="mt-6 space-y-4">
            <Separator />
            <h3 className="text-xl font-semibold font-headline text-primary">Sugerencias de la IA:</h3>
            
            {aiResponse.suggestedSolutions && aiResponse.suggestedSolutions.length > 0 ? (
              <div className="w-full p-4 border rounded-md bg-background">
                <h4 className="text-lg font-medium mb-2 flex items-center"><Lightbulb className="text-yellow-500 mr-2 h-5 w-5" />Posibles Soluciones:</h4>
                <ul className="list-disc list-inside space-y-1 text-foreground/90">
                  {aiResponse.suggestedSolutions.map((solution, index) => (
                    <li key={`widget-sol-${index}`}>{solution}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {aiResponse.relevantSkills && aiResponse.relevantSkills.length > 0 ? (
               <div className="w-full p-4 border rounded-md bg-background">
                <h4 className="text-lg font-medium mb-2 flex items-center"><Wrench className="text-gray-600 mr-2 h-5 w-5" />Habilidades de Operario Relevantes:</h4>
                <div className="flex flex-wrap gap-2">
                  {aiResponse.relevantSkills.map((skill, index) => (
                    <Link key={`widget-skill-${index}`} href={`/handymen?category=${encodeURIComponent(skill)}`}>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors">
                          {skill}
                        </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            
            {(!aiResponse.suggestedSolutions || aiResponse.suggestedSolutions.length === 0) &&
             (!aiResponse.relevantSkills || aiResponse.relevantSkills.length === 0) && (
              <p className="text-muted-foreground">La IA no pudo generar sugerencias específicas para este problema en este momento.</p>
            )}

             <Button variant="link" asChild className="mt-4 self-center">
                <Link href={`/request-quotation?problem=${encodeURIComponent(currentProblemDescription)}`}>Solicita una cotización para este problema &rarr;</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
