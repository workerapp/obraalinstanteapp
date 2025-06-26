'use server';
/**
 * @fileOverview A conversational AI agent for Obra al Instante.
 * This flow can search for handymen based on skills.
 *
 * - continueChat - A streaming function to continue a conversation.
 */

import {ai} from '@/ai/genkit';
import {firestore} from '@/firebase/clientApp';
import {collection, getDocs, query, where} from 'firebase/firestore';
import {z} from 'zod';
import type { MessageData } from 'genkit';

// Tool to find handymen from Firestore
const findHandymen = ai.defineTool(
  {
    name: 'findHandymen',
    description:
      'Find available and approved handymen with a specific skill or category.',
    input: z.object({
      skill: z
        .string()
        .describe(
          'The skill or category to search for (e.g., "Plomería", "Carpintería").'
        ),
    }),
    output: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        skills: z.array(z.string()),
      })
    ),
  },
  async ({skill}) => {
    console.log(`Tool: Searching for handymen with skill: ${skill}`);
    try {
        const usersRef = collection(firestore, 'users');
        const q = query(
          usersRef,
          where('role', '==', 'handyman'),
          where('isApproved', '==', true),
          where('skills', 'array-contains', skill)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          return [];
        }

        const handymen = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.displayName || 'Sin Nombre',
            skills: data.skills || [],
          };
        });
        return handymen;
    } catch (e: any) {
        console.error(`Error in findHandymen tool for skill "${skill}":`, e);
        // It's often better to return an empty array and let the model know nothing was found
        // than to throw an error that stops the flow.
        return [];
    }
  }
);

// The system prompt to be used directly in the streaming call
const systemPrompt = `Eres "Obrita", un asistente de IA amigable y servicial para "Obra al Instante", una plataforma que conecta clientes con operarios de mantenimiento del hogar en Colombia.
Tu objetivo es tener una conversación natural con el usuario para ayudarlo a resolver sus problemas.
- Sé conversador, amigable y proactivo.
- Si el usuario describe un problema, ayúdalo a diagnosticarlo y sugiere qué tipo de especialista podría necesitar.
- Si el usuario pregunta si hay operarios con una habilidad específica (como "plomeros" o "electricistas"), USA la herramienta 'findHandymen' para buscar en la base de datos.
- Cuando uses la herramienta, informa al usuario de los resultados. Si encuentras operarios, menciona sus nombres. Si no encuentras, informa al usuario y sugiérele buscar una habilidad más general o diferente.
- Proporciona respuestas en español.
- Cuando menciones a un operario encontrado por la herramienta, formatea su nombre como un enlace markdown a su perfil. El formato del enlace es: '/handymen/[ID_DEL_OPERARIO]'. Por ejemplo, si encuentras un operario llamado 'Juan Pérez' con ID 'xyz123', debes mostrarlo como: '[Juan Pérez](/handymen/xyz123)'.`;

// The streaming flow function, now using ai.generateStream directly
export async function continueChat(history: MessageData[]) {
  const { stream } = ai.generateStream({
    history,
    tools: [findHandymen],
    system: systemPrompt,
  });

  return stream;
}
