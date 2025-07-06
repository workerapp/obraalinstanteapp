// src/app/api/ai-assistant/route.ts
import { NextResponse } from 'next/server';
import { suggestSolutions, type SuggestSolutionsInput } from '@/ai/flows/suggest-solutions';
import { z } from 'zod';

const InputSchema = z.object({
  problemDescription: z.string().min(10, 'La descripción es muy corta').max(1000, 'La descripción es muy larga'),
});

export async function POST(request: Request) {
  try {
    const body: SuggestSolutionsInput = await request.json();
    
    // Validamos el cuerpo de la solicitud contra nuestro esquema
    const validation = InputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Entrada inválida.', details: validation.error.format() }, { status: 400 });
    }

    // Si la validación es exitosa, llamamos al flujo de IA
    const result = await suggestSolutions(body);
    
    // Devolvemos el resultado exitoso
    return NextResponse.json(result);

  } catch (error: any) {
    // Si algo sale mal en el flujo de la IA, lo capturamos aquí
    console.error('[AI Assistant API Error]', error);
    
    // Devolvemos una respuesta de error clara al cliente
    return NextResponse.json(
      { error: error.message || 'Ocurrió un error inesperado en el servidor.' },
      { status: 500 }
    );
  }
}
