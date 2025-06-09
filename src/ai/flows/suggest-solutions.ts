
'use server';

/**
 * @fileOverview AI assistant that suggests potential solutions and relevant handyman skills based on a customer's problem description.
 *
 * - suggestSolutions - A function that handles the suggestion process.
 * - SuggestSolutionsInput - The input type for the suggestSolutions function.
 * - SuggestSolutionsOutput - The return type for the suggestSolutions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSolutionsInputSchema = z.object({
  problemDescription: z.string().describe('Detailed description of the customer\u0027s problem.'),
});
export type SuggestSolutionsInput = z.infer<typeof SuggestSolutionsInputSchema>;

const SuggestSolutionsOutputSchema = z.object({
  suggestedSolutions: z.array(z.string()).describe('Lista de posibles soluciones al problema, en ESPAÑOL.'),
  relevantSkills: z.array(z.string()).describe('Lista de habilidades de operario relevantes para las soluciones, en ESPAÑOL.'),
});
export type SuggestSolutionsOutput = z.infer<typeof SuggestSolutionsOutputSchema>;

export async function suggestSolutions(input: SuggestSolutionsInput): Promise<SuggestSolutionsOutput> {
  return suggestSolutionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSolutionsPrompt',
  input: {schema: SuggestSolutionsInputSchema},
  output: {schema: SuggestSolutionsOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `Eres un asistente de IA que ayuda a los clientes a encontrar soluciones a sus problemas de mantenimiento del hogar.

  Basándote en la descripción del problema proporcionada por el cliente, sugiere posibles soluciones e identifica las habilidades de operario relevantes necesarias para implementar esas soluciones.

  La descripción del problema es: {{{problemDescription}}}

  IMPORTANTE: El contenido de las listas "suggestedSolutions" y "relevantSkills" DEBE estar en ESPAÑOL.
  Asegúrate de que el formato de salida sea un objeto JSON que coincida con el esquema de salida proporcionado.
  `,
});

const suggestSolutionsFlow = ai.defineFlow(
  {
    name: 'suggestSolutionsFlow',
    inputSchema: SuggestSolutionsInputSchema,
    outputSchema: SuggestSolutionsOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        console.error('AI prompt returned undefined or null output');
        throw new Error('La IA no pudo generar una respuesta.');
      }
      // Ensure the arrays exist, even if empty, as per schema
      output.suggestedSolutions = output.suggestedSolutions || [];
      output.relevantSkills = output.relevantSkills || [];
      return output;
    } catch (flowError) {
      console.error('Error within suggestSolutionsFlow:', flowError);
      throw flowError; 
    }
  }
);

