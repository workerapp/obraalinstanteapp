
// src/app/ai-assistant/page.tsx
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Sparkles, Lightbulb, Wrench, Send, AlertTriangle, Search, MessageSquare, ClipboardList } from 'lucide-react';
import { suggestSolutions, type SuggestSolutionsOutput } from '@/ai/flows/suggest-solutions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  problemDescription: z.string().min(10, {
    message: "Describe brevemente tu problema (mín. 10 caracteres).",
  }).max(1000, {
    message: "La descripción es muy larga (máx. 1000 caracteres)."
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function AiAssistantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<SuggestSolutionsOutput | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { problemDescription: "" },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAiResponse(null);
    try {
      const response = await suggestSolutions({ problemDescription: data.problemDescription });
      if (response) {
        setAiResponse(response);
      } else {
        setError("La IA devolvió una respuesta inesperada. Inténtalo de nuevo.");
      }
    } catch (err: any) {
      setError(err.message || "Lo sentimos, algo salió mal al obtener sugerencias.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentProblemDescription = form.watch("problemDescription");

  return (
    <div className="max-w-3xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <Sparkles className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">Asistente de IA</CardTitle>
          <CardDescription>
            Describe tu problema o necesidad y nuestra IA te dará un diagnóstico, soluciones y los operarios que necesitas.
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
                    <FormLabel className="sr-only">Describe tu problema o necesidad</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Tengo una gotera en el techo del baño, aparece cuando llueve fuerte y ha dejado una mancha amarilla."
                        rows={4}
                        className="resize-y text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analizando...</>
                ) : (
                  <><Send className="mr-2 h-5 w-5" /> Obtener Análisis de IA</>
                )}
              </Button>
            </form>
          </Form>

          {isLoading && (
            <div className="mt-6 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">"Obrita" está pensando...</p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error de Análisis</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {aiResponse && !isLoading && (
            <div className="mt-8 space-y-6 animate-in fade-in-50 duration-500">
              <Separator />
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold font-headline text-primary flex items-center"><Lightbulb className="mr-3 h-6 w-6" />Análisis del Problema</h3>
                <p className="text-foreground/90 bg-muted p-4 rounded-md border">{aiResponse.analysis}</p>
              </div>

              {aiResponse.suggestedMaterials && aiResponse.suggestedMaterials.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold font-headline text-primary flex items-center"><ClipboardList className="mr-3 h-6 w-6" />Materiales y Herramientas Sugeridos</h3>
                  <Card>
                    <CardContent className="p-4">
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                        {aiResponse.suggestedMaterials.map((material, index) => (
                          <li key={`mat-${index}`}>{material}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-2xl font-semibold font-headline text-primary flex items-center"><Wrench className="mr-3 h-6 w-6" />Soluciones y Habilidades Sugeridas</h3>
                <Card>
                  <CardContent className="p-4 space-y-4">
                    {aiResponse.suggestedSolutions && aiResponse.suggestedSolutions.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Posibles Soluciones:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                          {aiResponse.suggestedSolutions.map((solution, index) => (
                            <li key={`sol-${index}`}>{solution}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                     {aiResponse.suggestedSolutions.length > 0 && aiResponse.relevantSkills.length > 0 && <Separator />}
                    {aiResponse.relevantSkills && aiResponse.relevantSkills.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Operarios Recomendados:</h4>
                        <div className="flex flex-wrap gap-2">
                          {aiResponse.relevantSkills.map((skill, index) => (
                            <Button key={`skill-${index}`} asChild variant="secondary" size="sm">
                              <Link href={`/handymen?category=${encodeURIComponent(skill)}`}>
                                <Search className="mr-1.5 h-4 w-4" /> Buscar {skill}
                              </Link>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <CardFooter className="flex-col items-center gap-2 text-center p-4 border-t">
                  <p className="text-sm text-muted-foreground">¿Listo para dar el siguiente paso?</p>
                  <Button asChild>
                    <Link href={`/request-quotation?problem=${encodeURIComponent(currentProblemDescription)}`}>
                      <MessageSquare className="mr-2 h-4 w-4"/> Pedir una Cotización con esta Descripción
                    </Link>
                  </Button>
              </CardFooter>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
