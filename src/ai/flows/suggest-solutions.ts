'use server';

/**
 * @fileOverview AI assistant that analyzes a home maintenance problem and suggests a diagnosis, solutions, relevant handyman skills, and materials.
 * It now also recommends top-rated handymen for the job.
 *
 * - suggestSolutions - A function that handles the analysis process.
 * - SuggestSolutionsInput - The input type for the suggestSolutions function.
 * - SuggestSolutionsOutput - The return type for the suggestSolutions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { firestore } from '@/firebase/clientApp';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';

const SuggestSolutionsInputSchema = z.object({
  problemDescription: z.string().describe('Detailed description of the customer\u0027s problem.'),
  photoDataUri: z.string().optional().describe(
      "An optional photo of the problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestSolutionsInput = z.infer<typeof SuggestSolutionsInputSchema>;

const SuggestSolutionsOutputSchema = z.object({
  analysis: z.string().describe('Un breve análisis y diagnóstico del problema, explicando la posible causa. En ESPAÑOL.'),
  suggestedSolutions: z.array(z.string()).describe('Lista de posibles soluciones al problema, en ESPAÑOL.'),
  relevantSkills: z.array(z.string()).describe('Lista de habilidades de operario relevantes para las soluciones, en ESPAÑOL.'),
  suggestedMaterials: z.array(z.string()).describe('Lista de posibles materiales y herramientas necesarios para las soluciones, en ESPAÑOL.'),
  recommendedHandymen: z.array(z.object({
    id: z.string().describe('The unique ID of the handyman.'),
    name: z.string().describe('The name of the handyman.'),
    rating: z.number().describe('The average rating of the handyman.'),
    reviewsCount: z.number().describe('The number of reviews the handyman has.'),
  })).describe('A list of up to 3 top-rated handymen recommended for the job. This should be populated using the findTopRatedHandymen tool. In SPANISH.')
});
export type SuggestSolutionsOutput = z.infer<typeof SuggestSolutionsOutputSchema>;

export async function suggestSolutions(input: SuggestSolutionsInput): Promise<SuggestSolutionsOutput> {
  return suggestSolutionsFlow(input);
}


const findTopRatedHandymen = ai.defineTool(
  {
    name: 'findTopRatedHandymen',
    description: 'Finds the top-rated, approved handymen based on a list of required skills. Only handymen who have been manually approved by an administrator will be returned. Returns up to 3.',
    inputSchema: z.object({
      skills: z.array(z.string()).describe("A list of skills to search for. For example: ['Plomería', 'Electricidad', 'Soldadura']. This search is case-sensitive, so it's best to provide capitalized versions."),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      name: z.string(),
      rating: z.number(),
      reviewsCount: z.number(),
    })),
  },
  async (input) => {
    console.log(`[Tool Start] findTopRatedHandymen received skills: ${JSON.stringify(input.skills)}`);

    if (!input.skills || input.skills.length === 0) {
      console.log('[Tool End] No skills provided, returning empty array.');
      return [];
    }

    // Create a set of lowercase skills to search for, for case-insensitive matching.
    const requiredSkillsLower = new Set(input.skills.map(s => s.toLowerCase()));
    console.log(`[Tool Logic] Will search for handymen with any of these skills (case-insensitive): ${JSON.stringify(Array.from(requiredSkillsLower))}`);

    try {
      // 1. Simple Query: Get all users who are handymen.
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('role', '==', 'handyman'));
      
      console.log('[Tool Firestore] Executing simple query for all handymen...');
      const querySnapshot = await getDocs(q);
      const allHandymenDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`[Tool Firestore] Found ${allHandymenDocs.length} total user(s) with role 'handyman'.`);

      // 2. Filter in Code: Now we apply our complex logic in TypeScript.
      const approvedAndSkilledHandymen = allHandymenDocs.filter(handyman => {
        // Check for approval
        if (handyman.isApproved !== true) {
          return false;
        }
        
        // Check for skills (case-insensitive)
        if (!handyman.skills || !Array.isArray(handyman.skills)) {
          return false;
        }
        
        const handymanSkillsLower = handyman.skills.map((s: string) => s.toLowerCase());
        const hasMatchingSkill = handymanSkillsLower.some((skill: string) => requiredSkillsLower.has(skill));
        
        return hasMatchingSkill;
      });
      console.log(`[Tool Logic] After filtering for approval and skills, found ${approvedAndSkilledHandymen.length} matching handymen.`);

      // 3. Sort in Code:
      approvedAndSkilledHandymen.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      // 4. Limit and Format the result
      const topHandymen = approvedAndSkilledHandymen.slice(0, 3).map(data => ({
        id: data.id,
        name: data.displayName || 'Nombre no disponible',
        rating: data.rating || 0,
        reviewsCount: data.reviewsCount || 0,
      }));

      console.log(`[Tool End] Returning ${topHandymen.length} top-rated handymen to the AI.`);
      return topHandymen;

    } catch (e: any) {
        console.error("================ ERROR EN LA HERRAMIENTA DE BÚSQUEDA ================");
        console.error(`[findTopRatedHandymen Tool] Error Code: ${e.code}`);
        console.error(`[findTopRatedHandymen Tool] Error Message: ${e.message}`);
        console.error("====================================================================");
        
        let errorMessage = `Error al buscar operarios. Detalle: ${e.message}`;
        if (e.code === 'failed-precondition') {
            errorMessage = "¡ÍNDICE DE FIRESTORE REQUERIDO! Revisa la consola del **TERMINAL** donde ejecutas 'npm run dev'. Debería haber un error con un enlace largo para crear el índice que necesita la base de datos. Haz clic en ese enlace, espera unos minutos a que el índice se construya y vuelve a intentarlo.";
        }
        console.error("[findTopRatedHandymen Tool] Propagating error to UI:", errorMessage);
        throw new Error(errorMessage);
    }
  }
);


const prompt = ai.definePrompt({
  name: 'suggestSolutionsPrompt',
  input: {schema: SuggestSolutionsInputSchema},
  output: {schema: SuggestSolutionsOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest',
  tools: [findTopRatedHandymen],
  prompt: `Eres Obrita, un asistente IA para "Obra al Instante". Tu objetivo es ayudar a los clientes a diagnosticar problemas de mantenimiento del hogar.
Tu respuesta DEBE ser un objeto JSON que coincida con el esquema de salida.
TODO el texto debe estar en ESPAÑOL.

Pasos a seguir:
1.  **Análisis:** De forma MUY BREVE (1-2 frases), basándote en la descripción y la foto (si existe), diagnostica la causa probable del problema.
2.  **Soluciones:** Lista posibles soluciones.
3.  **Materiales:** Lista materiales y herramientas necesarios.
4.  **Habilidades:** Identifica habilidades de operario relevantes (ej: Plomería, Carpintería, Electricidad). La primera letra debe estar en mayúscula.
5.  **Recomendaciones:** Usa la herramienta 'findTopRatedHandymen' con las habilidades identificadas para encontrar operarios aprobados. El campo 'recommendedHandymen' en el JSON DEBE contener la respuesta de la herramienta, incluso si es un array vacío.

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
      const {output} = await prompt(input);
      if (!output) {
        console.error('AI prompt returned undefined or null output');
        throw new Error('La IA no pudo generar una respuesta.');
      }
      return output;
    } catch (flowError: any) {
      console.error('Error within suggestSolutionsFlow:', flowError);
      // Propagate the specific error message from the tool if available
      throw new Error(flowError.message || 'Ocurrió un error al procesar la solicitud con la IA.'); 
    }
  }
);
