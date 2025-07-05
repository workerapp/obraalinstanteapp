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
import {z} from 'genkit';
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
    description: 'Finds the top-rated, approved handymen based on a list of required skills. Returns up to 3.',
    inputSchema: z.object({
      skills: z.array(z.string()).describe("A list of skills to search for. For example: ['Plomería', 'Electricidad']."),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      name: z.string(),
      rating: z.number(),
      reviewsCount: z.number(),
    })),
  },
  async (input) => {
    if (!input.skills || input.skills.length === 0) {
      return [];
    }
    
    // Create a set of the required skills, all lowercase, for efficient, case-insensitive lookup.
    const requiredSkillsLower = new Set(input.skills.map(skill => skill.toLowerCase()));
    
    try {
      const usersRef = collection(firestore, 'users');
      
      // 1. Fetch ALL approved handymen. This is less efficient at scale but avoids complex index requirements.
      const q = query(
        usersRef,
        where('role', '==', 'handyman'),
        where('isApproved', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const allApprovedHandymen: any[] = [];
      querySnapshot.forEach((doc) => {
        allApprovedHandymen.push({ id: doc.id, ...doc.data() });
      });

      // 2. Filter the results in code, case-insensitively.
      const matchingHandymen = allApprovedHandymen.filter(handyman => {
        if (!handyman.skills || !Array.isArray(handyman.skills)) {
          return false;
        }
        // Check if the handyman has at least one of the required skills.
        return handyman.skills.some((userSkill: string) => requiredSkillsLower.has(userSkill.toLowerCase()));
      }).map(data => ({
        id: data.id,
        name: data.displayName || 'Nombre no disponible',
        rating: data.rating || 0,
        reviewsCount: data.reviewsCount || 0,
      }));

      // 3. Sort by rating to get the top-rated ones.
      matchingHandymen.sort((a, b) => b.rating - a.rating);

      // 4. Return the top 3.
      return matchingHandymen.slice(0, 3);

    } catch (e: any) {
      console.error("Error executing findTopRatedHandymen tool:", e);
      // If the basic query fails, it's likely a permissions issue or a needed simple index.
      throw new Error(`Error al buscar operarios. Es posible que falte un índice simple en Firestore. Detalle: ${e.message}`);
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
5.  **Identifica Habilidades Relevantes (Campo 'relevantSkills'):** A partir de las soluciones y los posibles materiales/contextos, crea una lista de las habilidades de operario necesarias. Utiliza términos comunes y bien definidos, como "Plomería", "Electricidad", "Carpintería", "Albañilería", "Pintura", "Soldadura". La herramienta buscará coincidencias exactas con los perfiles de los operarios.
6.  **Recomienda Operarios (Campo 'recommendedHandymen'):** Una vez que hayas identificado las habilidades en 'relevantSkills', DEBES usar la herramienta 'findTopRatedHandymen' para encontrar hasta 3 de los operarios mejor calificados que posean esas habilidades. Es fundamental que uses la herramienta y coloques su respuesta (incluso si es un array vacío) en el campo 'recommendedHandymen' de la salida JSON. Si la herramienta no devuelve a nadie, el array simplemente estará vacío.

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
    } catch (flowError) {
      console.error('Error within suggestSolutionsFlow:', flowError);
      throw new Error('Ocurrió un error al procesar la solicitud con la IA.'); 
    }
  }
);
