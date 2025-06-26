
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
  prompt: `Eres un asistente de IA experto que ayuda a los clientes a diagnosticar problemas de mantenimiento del hogar y encontrar las soluciones adecuadas. Tu objetivo es proporcionar un análisis detallado y sugerir las habilidades de operario más relevantes.

Basándote en la descripción del problema proporcionada por el cliente, sigue estos pasos en tu razonamiento:
1.  **Analiza el problema:** Desglosa la descripción del cliente. Identifica el objeto principal (p. ej., puerta, grifo, pared) y la acción requerida (p. ej., reparar, instalar, construir).
2.  **Considera materiales y contextos:** Piensa en los diferentes materiales con los que podría estar hecho el objeto. Por ejemplo, una puerta puede ser de madera, metal o vidrio. Un problema eléctrico puede requerir un electricista, pero si implica romper una pared, también podría necesitar un albañil.
3.  **Genera soluciones:** Basado en tu análisis, propón una lista de posibles soluciones. Sé claro y conciso.
4.  **Identifica habilidades relevantes:** A partir de las soluciones y los posibles materiales/contextos, crea una lista de las habilidades de operario necesarias. Es crucial que consideres todas las posibilidades relevantes. Si una puerta puede ser de madera o metal, debes incluir tanto 'Carpintería' como 'Metalistería' en las habilidades.

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

