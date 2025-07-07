'use server';

/**
 * @fileOverview AI assistant that analyzes a home maintenance problem and suggests a diagnosis, solutions, relevant handyman skills, and materials.
 * The flow has been optimized to reduce cost: it now makes a single AI call to get an analysis and a list of skills,
 * then queries for handymen locally instead of using an AI tool.
 *
 * - suggestSolutions - A function that handles the analysis process.
 * - SuggestSolutionsInput - The input type for the suggestSolutions function.
 * - SuggestSolutionsOutput - The return type for the suggestSolutions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs } from 'firebase/firestore';

const SuggestSolutionsInputSchema = z.object({
  problemDescription: z.string().describe('Detailed description of the customer\u0027s problem.'),
  photoDataUri: z.string().optional().describe(
      "An optional photo of the problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestSolutionsInput = z.infer<typeof SuggestSolutionsInputSchema>;

const HandymanSchema = z.object({
    id: z.string().describe('The unique ID of the handyman.'),
    name: z.string().describe('The name of the handyman.'),
    rating: z.number().describe('The average rating of the handyman.'),
    reviewsCount: z.number().describe('The number of reviews the handyman has.'),
});

const AISuggestionSchema = z.object({
  analysis: z.string().describe('Un breve análisis y diagnóstico del problema, explicando la posible causa. En ESPAÑOL.'),
  suggestedSolutions: z.array(z.string()).describe('Lista de posibles soluciones al problema, en ESPAÑOL.'),
  relevantSkills: z.array(z.string()).describe('Lista de habilidades de operario relevantes para las soluciones, en ESPAÑOL.'),
  suggestedMaterials: z.array(z.string()).describe('Lista de posibles materiales y herramientas necesarios para las soluciones, en ESPAÑOL.'),
});

const SuggestSolutionsOutputSchema = AISuggestionSchema.extend({
  recommendedHandymen: z.array(HandymanSchema).describe('A list of up to 3 top-rated handymen recommended for the job. In SPANISH.')
});

export type SuggestSolutionsOutput = z.infer<typeof SuggestSolutionsOutputSchema>;

// This function is no longer a Genkit tool, but a regular async function exported for local use.
async function findTopRatedHandymen(skills: string[]): Promise<z.infer<typeof HandymanSchema>[]> {
  console.log(`[Local Function] findTopRatedHandymen received skills: ${JSON.stringify(skills)}`);

  if (!skills || skills.length === 0) {
    console.log('[Local Function] No skills provided, returning empty array.');
    return [];
  }

  const requiredSkillsLower = new Set(skills.map(s => s.toLowerCase()));
  
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('role', '==', 'handyman'));
    
    const querySnapshot = await getDocs(q);
    const allHandymenDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const approvedAndSkilledHandymen = allHandymenDocs.filter(handyman => {
      if (handyman.isApproved !== true) return false;
      if (!handyman.skills || !Array.isArray(handyman.skills)) return false;
      
      const handymanSkillsLower = handyman.skills.map((s: string) => s.toLowerCase());
      return handymanSkillsLower.some((skill: string) => requiredSkillsLower.has(skill));
    });

    approvedAndSkilledHandymen.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const topHandymen = approvedAndSkilledHandymen.slice(0, 3).map(data => ({
      id: data.id,
      name: data.displayName || 'Nombre no disponible',
      rating: data.rating || 0,
      reviewsCount: data.reviewsCount || 0,
    }));

    console.log(`[Local Function] Returning ${topHandymen.length} top-rated handymen.`);
    return topHandymen;

  } catch (e: any) {
    console.error("[Local Function findTopRatedHandymen] Error:", e.message);
    throw new Error(`Error al buscar operarios: ${e.message}`);
  }
}

export async function suggestSolutions(input: SuggestSolutionsInput): Promise<SuggestSolutionsOutput> {
  return suggestSolutionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSolutionsPrompt',
  input: {schema: SuggestSolutionsInputSchema},
  output: {schema: AISuggestionSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `Eres Obrita, un asistente IA para "Obra al Instante". Tu objetivo es ayudar a los clientes a diagnosticar problemas de mantenimiento del hogar.
Tu respuesta DEBE ser un objeto JSON que coincida con el esquema de salida.
TODO el texto debe estar en ESPAÑOL.

Pasos a seguir:
1.  **Análisis:** De forma MUY BREVE (1-2 frases), basándote en la descripción y la foto (si existe), diagnostica la causa probable del problema.
2.  **Soluciones:** Lista posibles soluciones.
3.  **Materiales:** Lista materiales y herramientas necesarios.
4.  **Habilidades:** Identifica habilidades de operario relevantes (ej: Plomería, Carpintería, Electricidad). La primera letra debe estar en mayúscula. No inventes habilidades, usa las más comunes y generales.

Descripción del cliente: {{{problemDescription}}}
{{#if photoDataUri}}
Foto: {{media url=photoDataUri}}
{{/if}}
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
      // Step 1: Make a single, cost-effective call to the AI to get analysis and skills.
      const {output: aiSuggestion} = await prompt(input);
      if (!aiSuggestion) {
        throw new Error('La IA no pudo generar una respuesta inicial.');
      }

      // Step 2: Use the skills identified by the AI to search for handymen locally.
      let recommendedHandymen: z.infer<typeof HandymanSchema>[] = [];
      if (aiSuggestion.relevantSkills && aiSuggestion.relevantSkills.length > 0) {
        console.log(`AI identified skills: ${aiSuggestion.relevantSkills}. Searching locally...`);
        recommendedHandymen = await findTopRatedHandymen(aiSuggestion.relevantSkills);
      } else {
         console.log('AI did not identify relevant skills. Skipping handyman search.');
      }

      // Step 3: Combine the AI analysis with the locally-fetched handymen and return.
      return {
        ...aiSuggestion,
        recommendedHandymen,
      };

    } catch (flowError: any) {
      console.error('Error within suggestSolutionsFlow:', flowError);
      throw new Error(flowError.message || 'Ocurrió un error al procesar la solicitud con la IA.'); 
    }
  }
);
