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
import { Loader2, Sparkles, Lightbulb, Wrench, Send, AlertTriangle, Search, MessageSquare, ClipboardList, Award, Star, UserCheck, CheckCircle } from 'lucide-react';
import type { SuggestSolutionsOutput } from '@/ai/flows/suggest-solutions';
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
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            problemDescription: data.problemDescription,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Error: ${response.statusText}`);
      }

      setAiResponse(result);

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
            ¡Hola! Soy Obrita, tu asistente personal. Describe tu problema y te daré un diagnóstico, soluciones, y te recomendaré a los mejores profesionales.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Lightbulb className="h-5 w-5 text-primary" />
            <AlertTitle className="font-headline text-primary">Consejos para un mejor resultado</AlertTitle>
            <AlertDescription>
                <p className="mb-3 text-foreground/80">
                  Para darte el mejor análisis, imagina que describes el problema a un amigo. Sigue estos consejos usando un solo ejemplo coherente: <span className="font-semibold">"una mancha de humedad en el techo"</span>.
                </p>
                <ul className="list-none space-y-2 mt-2 text-foreground/80">
                    <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-1 shrink-0 text-green-600" />
                        <span><strong>Sé específico:</strong> En lugar de "techo mojado", prueba "hay una mancha de humedad en el techo de la sala, justo debajo del baño principal, y crece cuando usamos la ducha".</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-1 shrink-0 text-green-600" />
                        <span><strong>Incluye el contexto:</strong> "La mancha es amarillenta y el techo es de drywall. El piso del baño es de cerámica".</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-1 shrink-0 text-green-600" />
                        <span><strong>Menciona el objetivo:</strong> ¿Es reparar, instalar o ambos? "Necesito encontrar y reparar la gotera, y luego reparar el drywall dañado".</span>
                    </li>
                     <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-1 shrink-0 text-green-600" />
                        <span><strong>Sugiere un profesional:</strong> Si tienes una idea, ¡dila! "Sospecho que el problema es de plomería, así que creo que necesito un plomero. Quizás después un pintor."</span>
                    </li>
                </ul>
            </AlertDescription>
          </Alert>
          <Separator className="mb-6"/>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="problemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe tu problema o necesidad</FormLabel>
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
                  <><Send className="mr-2 h-5 w-5" /> Pedir Análisis a Obrita</>
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
                <h3 className="text-2xl font-semibold font-headline text-primary flex items-center"><Lightbulb className="mr-3 h-6 w-6" />Mi Análisis del Problema</h3>
                <p className="text-foreground/90 bg-muted p-4 rounded-md border">{aiResponse.analysis}</p>
              </div>
              
              {/* Recommended Professionals or Search CTA */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold font-headline text-primary flex items-center"><Award className="mr-3 h-6 w-6" />¡Encontremos al Profesional Adecuado!</h3>
                {aiResponse.recommendedProfessionals && aiResponse.recommendedProfessionals.length > 0 ? (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                      <CardTitle className="text-xl text-green-800">Profesionales Recomendados para ti</CardTitle>
                      <CardDescription>Basado en tu problema, estos son los profesionales mejor calificados que pueden ayudarte.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {aiResponse.recommendedProfessionals.map((professional) => (
                        <div key={professional.id} className="flex justify-between items-center bg-background p-3 rounded-lg border">
                          <div>
                            <p className="font-semibold text-base">{professional.name}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-400" />
                              <span>{professional.rating.toFixed(1)} ({professional.reviewsCount} reseñas)</span>
                            </div>
                          </div>
                          <Button asChild size="sm">
                            <Link href={`/professionals/${professional.id}`}>
                              <UserCheck className="mr-2 h-4 w-4" /> Ver Perfil
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : aiResponse.relevantSkills && aiResponse.relevantSkills.length > 0 ? (
                  <Card className="bg-primary/5 border-primary/20 text-center">
                    <CardContent className="p-6">
                      <p className="mb-4 text-foreground/90">No encontramos una recomendación automática específica, ¡pero no te preocupes! Hemos identificado las habilidades que necesitas. Explora el directorio para encontrar al profesional perfecto.</p>
                      <Button asChild size="lg">
                        <Link href={`/professionals?category=${encodeURIComponent(aiResponse.relevantSkills[0])}`}>
                          <Search className="mr-2 h-4 w-4" /> Buscar Profesionales de {aiResponse.relevantSkills[0]}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-muted">
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">La IA no pudo determinar una habilidad específica para tu solicitud. Intenta describiendo tu problema con más detalle o busca en nuestro directorio general.</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {aiResponse.suggestedMaterials && aiResponse.suggestedMaterials.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold font-headline text-primary flex items-center"><ClipboardList className="mr-3 h-6 w-6" />Posibles Materiales y Herramientas</h3>
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
                        <h4 className="font-semibold mb-2">Habilidades Requeridas:</h4>
                        <div className="flex flex-wrap gap-2">
                          {aiResponse.relevantSkills.map((skill, index) => (
                            <Button key={`skill-${index}`} asChild variant="secondary" size="sm">
                              <Link href={`/professionals?category=${encodeURIComponent(skill)}`}>
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
              <CardFooter className="flex-col items-center gap-3 text-center p-4 border-t">
                  <p className="text-sm text-muted-foreground">O si prefieres, puedes enviar una solicitud general con esta descripción.</p>
                  
                  <Button asChild className="w-full max-w-sm">
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
