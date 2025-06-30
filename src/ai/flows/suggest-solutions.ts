
'use server';

/**
 * @fileOverview AI assistant that analyzes a home maintenance problem and suggests a diagnosis, solutions, relevant handyman skills, and materials.
 *
 * - suggestSolutions - A function that handles the analysis process.
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
  analysis: z.string().describe('Un breve análisis y diagnóstico del problema, explicando la posible causa. En ESPAÑOL.'),
  suggestedSolutions: z.array(z.string()).describe('Lista de posibles soluciones al problema, en ESPAÑOL.'),
  relevantSkills: z.array(z.string()).describe('Lista de habilidades de operario relevantes para las soluciones, en ESPAÑOL.'),
  suggestedMaterials: z.array(z.string()).describe('Lista de posibles materiales y herramientas necesarios para las soluciones, en ESPAÑOL.')
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
  prompt: `Eres Obrita, un asistente de IA amigable y experto de la plataforma "Obra al Instante". Tu tono debe ser servicial, claro y tranquilizador. Tu objetivo es ayudar a los clientes a diagnosticar problemas de mantenimiento del hogar y encontrar las soluciones adecuadas. Proporcionarás un análisis detallado, sugerirás soluciones, una lista de materiales y las habilidades de operario más relevantes.

Basándote en la descripción del problema proporcionada por el cliente, sigue estos pasos en tu razonamiento:
1.  **Analiza el problema:** Desglosa la descripción del cliente. Identifica el objeto principal (p. ej., puerta, grifo, pared) y la acción requerida (p. ej., reparar, instalar, construir).
2.  **Genera un Diagnóstico (Campo 'analysis'):** Basado en tu análisis, proporciona una explicación breve y clara de cuál podría ser la causa raíz del problema. Empieza la frase con "¡Entendido! Esto es lo que creo que podría estar pasando:" o algo similar y amigable.
3.  **Genera Soluciones (Campo 'suggestedSolutions'):** Propón una lista de posibles soluciones. Sé claro y conciso.
4.  **Genera Materiales y Herramientas (Campo 'suggestedMaterials'):** Basado en las soluciones, crea una lista de posibles materiales y herramientas que se necesitarían para el trabajo.
5.  **Identifica Habilidades Relevantes (Campo 'relevantSkills'):** A partir de las soluciones y los posibles materiales/contextos, crea una lista de las habilidades de operario necesarias. Es crucial que consideres todas las posibilidades relevantes.

La descripción del problema es: {{{problemDescription}}}

IMPORTANTE: TODO el contenido de texto en los campos de salida DEBE estar en ESPAÑOL y mantener un tono amigable y servicial.
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
      // Ensure the fields exist, even if empty, as per schema
      output.analysis = output.analysis || "No se pudo generar un análisis.";
      output.suggestedSolutions = output.suggestedSolutions || [];
      output.relevantSkills = output.relevantSkills || [];
      output.suggestedMaterials = output.suggestedMaterials || [];
      return output;
    } catch (flowError) {
      console.error('Error within suggestSolutionsFlow:', flowError);
      throw new Error('Ocurrió un error al procesar la solicitud con la IA.'); 
    }
  }
);
