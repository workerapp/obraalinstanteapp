// src/app/ai-assistant/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AiAssistantPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] max-w-3xl mx-auto text-center">
      <Card className="shadow-xl w-full">
        <CardHeader>
          <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <CardTitle className="text-3xl font-headline">Asistente IA no disponible</CardTitle>
          <CardDescription>
            Esta función de chat se encuentra actualmente en mantenimiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Puedes utilizar el Asistente IA Rápido en la página de inicio para obtener sugerencias.
          </p>
          <Button asChild>
            <Link href="/">Volver a Inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
