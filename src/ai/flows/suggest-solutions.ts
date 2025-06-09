
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
  suggestedSolutions: z.array(z.string()).describe('List of potential solutions to the problem.'),
  relevantSkills: z.array(z.string()).describe('List of relevant handyman skills for the solutions.'),
});
export type SuggestSolutionsOutput = z.infer<typeof SuggestSolutionsOutputSchema>;

export async function suggestSolutions(input: SuggestSolutionsInput): Promise<SuggestSolutionsOutput> {
  return suggestSolutionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSolutionsPrompt',
  input: {schema: SuggestSolutionsInputSchema},
  output: {schema: SuggestSolutionsOutputSchema},
  model: 'googleai/gemini-1.5-flash-latest', // Explicitly specify the model
  prompt: `You are an AI assistant helping customers find solutions to their home maintenance problems.

  Based on the problem description provided by the customer, suggest potential solutions and identify the relevant handyman skills required to implement those solutions.

  Problem Description: {{{problemDescription}}}

  Format the output as a JSON object with "suggestedSolutions" and "relevantSkills" arrays.
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
      // Re-throw the error to be caught by the calling component
      // Or transform it into a more user-friendly error object if needed
      throw flowError; 
    }
  }
);
