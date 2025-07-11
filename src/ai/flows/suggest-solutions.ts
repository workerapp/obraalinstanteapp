'use server';

/**
 * @fileOverview AI assistant that analyzes a home maintenance problem and suggests a diagnosis, solutions, relevant professional skills, and materials.
 * The flow has been optimized to reduce cost: it now makes a single AI call to get an analysis and a list of skills,
 * then queries for professionals locally instead of using an AI tool.
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

const ProfessionalSchema = z.object({
    id: z.string().describe('The unique ID of the professional.'),
    name: z.string().describe('The name of the professional.'),
    rating: z.number().describe('The average rating of the professional.'),
    reviewsCount: z.number().describe('The number of reviews the professional has.'),
});

const AISuggestionSchema = z.object({
  analysis: z.string().describe('Un breve análisis y diagnóstico del problema, explicando la posible causa. En ESPAÑOL.'),
  suggestedSolutions: z.array(z.string()).describe('Lista de posibles soluciones al problema, en ESPAÑOL.'),
  relevantSkills: z.array(z.string()).describe('Lista de habilidades de profesional relevantes para las soluciones, en ESPAÑOL.'),
  suggestedMaterials: z.array(z.string()).describe('Lista de posibles materiales y herramientas necesarios para las soluciones, en ESPAÑOL.'),
});

const SuggestSolutionsOutputSchema = AISuggestionSchema.extend({
  recommendedProfessionals: z.array(ProfessionalSchema).describe('A list of up to 3 top-rated professionals recommended for the job. In SPANISH.')
});

export type SuggestSolutionsOutput = z.infer<typeof SuggestSolutionsOutputSchema>;

// This function is no longer a Genkit tool, but a regular async function exported for local use.
async function findTopRatedProfessionals(skills: string[]): Promise<z.infer<typeof ProfessionalSchema>[]> {
  console.log(`[Local Function] findTopRatedProfessionals received skills for matching: ${JSON.stringify(skills)}`);

  if (!skills || skills.length === 0) {
    console.log('[Local Function] No skills provided, returning empty array.');
    return [];
  }
  
  const normalizeString = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // profession: trade
  const skillNormalizationMap: { [key: string]: string } = {
      'plomero': 'plomeria',
      'fontanero': 'plomeria',
      'carpintero': 'carpinteria',
      'electricista': 'electricidad',
      'albanil': 'albanileria',
      'pintor': 'pintura',
      'soldador': 'soldadura'
  };

  // trade: [profession1, profession2]
  const tradeToProfessions: { [key: string]: string[] } = {};
  for (const [profession, trade] of Object.entries(skillNormalizationMap)) {
      if (!tradeToProfessions[trade]) {
          tradeToProfessions[trade] = [];
      }
      tradeToProfessions[trade].push(profession);
  }

  const searchKeywords = new Set<string>();
  skills.forEach(s => {
      const normalizedSkill = normalizeString(s.trim());
      searchKeywords.add(normalizedSkill);

      // Check if it's a profession (e.g., "plomero")
      const relatedTrade = skillNormalizationMap[normalizedSkill];
      if (relatedTrade) {
          searchKeywords.add(relatedTrade); // Add the trade ("plomeria")
          // Add all related professions ("plomero", "fontanero")
          tradeToProfessions[relatedTrade]?.forEach(prof => searchKeywords.add(prof));
      }

      // Check if it's a trade (e.g., "plomeria")
      const relatedProfessions = tradeToProfessions[normalizedSkill];
      if (relatedProfessions) {
          // Add all professions for this trade
          relatedProfessions.forEach(prof => searchKeywords.add(prof));
      }
  });


  console.log(`[Local Function] Expanded search keywords: ${Array.from(searchKeywords).join(', ')}`);
  
  try {
    // 1. Fetch all approved professionals and all active services in parallel for efficiency
    const usersRef = collection(firestore, 'users');
    const professionalsQuery = query(usersRef, where('role', '==', 'handyman'), where('isApproved', '==', true));
    
    const servicesRef = collection(firestore, 'handymanServices');
    const servicesQuery = query(servicesRef, where('isActive', '==', true));

    const [professionalsSnapshot, servicesSnapshot] = await Promise.all([
      getDocs(professionalsQuery),
      getDocs(servicesQuery)
    ]);

    const allProfessionalsDocs = professionalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. Create a map of services grouped by professional UID for efficient lookup
    const servicesByProfessional = new Map<string, any[]>();
    servicesSnapshot.forEach(doc => {
      const service = doc.data();
      if (service.handymanUid) {
        if (!servicesByProfessional.has(service.handymanUid)) {
          servicesByProfessional.set(service.handymanUid, []);
        }
        servicesByProfessional.get(service.handymanUid)!.push(service);
      }
    });

    // 3. Filter professionals based on a richer, more flexible matching logic
    const matchedProfessionals = allProfessionalsDocs.filter(professional => {
        const professionalSkillsNormalized = (professional.skills || []).map((s: string) => normalizeString(s.trim()));
        const offeredServices = servicesByProfessional.get(professional.id) || [];
        const serviceTextNormalized = normalizeString(offeredServices.map(s => `${s.name} ${s.description}`).join(' '));

        // Check if any of the expanded search keywords are found in the professional's data
        for (const keyword of searchKeywords) {
            // Match 1: Check if any professional skill *includes* the keyword.
            if (professionalSkillsNormalized.some(skill => skill.includes(keyword))) {
                return true;
            }
            
            // Match 2: Check if the combined text of offered services contains the keyword.
            if (serviceTextNormalized.includes(keyword)) {
                return true;
            }
        }

        return false; // No match found for this professional
    });

    // 4. Sort by rating and get the top 3
    matchedProfessionals.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const topProfessionals = matchedProfessionals.slice(0, 3).map(data => ({
      id: data.id,
      name: data.displayName || 'Nombre no disponible',
      rating: data.rating || 0,
      reviewsCount: data.reviewsCount || 0,
    }));

    console.log(`[Local Function] Returning ${topProfessionals.length} top-rated professionals after expanded search.`);
    return topProfessionals;

  } catch (e: any) {
    console.error("[Local Function findTopRatedProfessionals] Error:", e.message);
    if (e.code === 'failed-precondition' && e.message.includes('index')) {
        console.error("Firestore index missing. Check the console for a creation link.");
        throw new Error(`Error al buscar profesionales: Firestore requiere un índice. Revisa la consola para crearlo.`);
    }
    throw new Error(`Error al buscar profesionales: ${e.message}`);
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
  prompt: `Eres Obrita, un asistente IA para "Obra al Instante". Tu objetivo es ayudar a los clientes a diagnosticar problemas de mantenimiento del hogar de forma precisa.

IMPORTANTE: Tu respuesta DEBE ser un objeto JSON VÁLIDO que coincida con el esquema de salida. No incluyas ningún texto, explicación o formato markdown como \`\`\`json antes o después del objeto JSON. La respuesta debe empezar con { y terminar con }.

TODO el texto dentro del JSON debe estar en ESPAÑOL.

Pasos a seguir para generar el contenido del JSON:
1.  **Análisis:** De forma MUY BREVE (1-2 frases), basándote en la descripción, diagnostica la causa probable del problema.
2.  **Soluciones:** Lista posibles soluciones al problema.
3.  **Materiales:** Lista materiales y herramientas necesarios para las soluciones.
4.  **Habilidades:** Este es el paso más importante. Analiza cuidadosamente la descripción del cliente. Identifica las **palabras clave** que describen la acción principal (ej: 'soldadura', 'tubería rota', 'pintar', 'instalar baldosa'). A partir de estas palabras, deduce la habilidad más directa y relevante del profesional.
    - **Ejemplo de Razonamiento:** Si el cliente dice "necesito soldadura para una puerta de metal", la palabra clave es "soldadura". La habilidad principal es "Soldadura", no "Carpintería", aunque se mencione una puerta.
    - Prioriza la habilidad más obvia y directa.
    - Usa habilidades comunes como: Plomería, Carpintería, Electricidad, Albañilería, Pintura, Soldadura.
    - La primera letra de cada habilidad debe estar en mayúscula.

Descripción del cliente: {{{problemDescription}}}
{{#if photoDataUri}}
Foto del problema: {{media url=photoDataUri}}
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

      // Step 2: Use the skills identified by the AI to search for professionals locally.
      let recommendedProfessionals: z.infer<typeof ProfessionalSchema>[] = [];
      if (aiSuggestion.relevantSkills && aiSuggestion.relevantSkills.length > 0) {
        console.log(`AI identified skills: ${aiSuggestion.relevantSkills}. Searching locally...`);
        recommendedProfessionals = await findTopRatedProfessionals(aiSuggestion.relevantSkills);
      } else {
         console.log('AI did not identify relevant skills. Skipping professional search.');
      }

      // Step 3: Combine the AI analysis with the locally-fetched professionals and return.
      return {
        ...aiSuggestion,
        recommendedProfessionals,
      };

    } catch (flowError: any) {
      console.error('Error within suggestSolutionsFlow:', flowError);
      throw new Error(flowError.message || 'Ocurrió un error al procesar la solicitud con la IA.'); 
    }
  }
);
