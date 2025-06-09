
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
import { Lightbulb, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  problemDescription: z.string().min(10, {
    message: "Describe brevemente tu problema (mín. 10 caracteres).",
  }).max(500, {
    message: "La descripción es muy larga (máx. 500 caracteres)."
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function AiAssistantHomeWidget() {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      problemDescription: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    const encodedDescription = encodeURIComponent(data.problemDescription);
    router.push(`/ai-assistant?problem=${encodedDescription}`);
  };

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
            <Button type="submit" className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Obtener Sugerencias
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
