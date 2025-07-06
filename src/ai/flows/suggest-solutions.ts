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
    console.log(`[findTopRatedHandymen Tool] Executing with skills: ${JSON.stringify(input.skills)}`);

    const skillsToQuery = [...new Set(input.skills.flatMap(skill => [skill, skill.toLowerCase(), skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase()]))];
    
    console.log(`[findTopRatedHandymen Tool] Querying Firestore with skill variants: ${JSON.stringify(skillsToQuery)}`);

    if (!skillsToQuery || skillsToQuery.length === 0) {
      console.log('[findTopRatedHandymen Tool] No skills provided, returning empty array.');
      return [];
    }
    
    try {
      const usersRef = collection(firestore, 'users');
      
      const q = query(
        usersRef,
        where('role', '==', 'handyman'),
        where('isApproved', '==', true),
        where('skills', 'array-contains-any', skillsToQuery),
        orderBy('rating', 'desc'),
        limit(3)
      );

      const querySnapshot = await getDocs(q);
      
      const handymen = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.displayName || 'Nombre no disponible',
            rating: data.rating || 0,
            reviewsCount: data.reviewsCount || 0,
          };
      });

      console.log(`[findTopRatedHandymen Tool] Found ${handymen.length} handymen.`);
      return handymen;

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
  prompt: `Eres Obrita, un asistente de IA amigable y experto de la plataforma "Obra al Instante". Tu tono debe ser servicial, claro y tranquilizador. Tu objetivo es ayudar a los clientes a diagnosticar problemas de mantenimiento del hogar y encontrar las soluciones adecuadas.

Basándote en la descripción del problema proporcionada por el cliente, sigue estos pasos en tu razonamiento:
1.  **Analiza el problema:** Desglosa la descripción del cliente. Identifica el objeto principal (p. ej., puerta, grifo, pared) y la acción requerida (p. ej., reparar, instalar, construir).
2.  **Genera un Diagnóstico (Campo 'analysis'):** Basado en tu análisis, proporciona una explicación breve y clara de cuál podría ser la causa raíz del problema. Empieza la frase con "¡Entendido! Esto es lo que creo que podría estar pasando:" o algo similar y amigable.
3.  **Genera Soluciones (Campo 'suggestedSolutions'):** Propón una lista de posibles soluciones. Sé claro y conciso.
4.  **Genera Materiales y Herramientas (Campo 'suggestedMaterials'):** Basado en las soluciones, crea una lista de posibles materiales y herramientas que se necesitarían para el trabajo.
5.  **Identifica Habilidades Relevantes (Campo 'relevantSkills'):** A partir de las soluciones y los posibles materiales/contextos, crea una lista de las habilidades de operario necesarias. Utiliza términos comunes y bien definidos, como "Plomería", "Electricidad", "Carpintería", "Albañilería", "Pintura", "Soldadura". Es MUY IMPORTANTE que la habilidad tenga la primera letra en mayúscula (ej: "Soldadura", no "soldadura").
6.  **Recomienda Operarios (Campo 'recommendedHandymen'):** Una vez que hayas identificado las habilidades en 'relevantSkills', DEBES usar la herramienta 'findTopRatedHandymen' para encontrar hasta 3 de los operarios mejor calificados y **aprobados** que posean esas habilidades. Es fundamental que uses la herramienta y coloques su respuesta (incluso si es un array vacío) en el campo 'recommendedHandymen' de la salida JSON. Si la herramienta no devuelve a nadie, el array simplemente estará vacío.

La descripción del problema es: {{{problemDescription}}}

IMPORTANTE: TODO el contenido de texto en los campos de salida DEBE estar en ESPAÑOL y mantener un tono amigable y servicial.
Asegúrate de que el formato de salida sea un objeto JSON que coincida con el esquema de salida proporcionado, incluyendo las recomendaciones de operarios si la herramienta los encuentra.
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
