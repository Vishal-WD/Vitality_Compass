// use server'
'use server';

/**
 * @fileOverview Dietary suggestion AI agent.
 *
 * - generateDietarySuggestions - A function that generates dietary suggestions based on health metrics.
 * - GenerateDietarySuggestionsInput - The input type for the generateDietarySuggestions function.
 * - GenerateDietarySuggestionsOutput - The return type for the generateDietarySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDietarySuggestionsInputSchema = z.object({
  height: z.number().describe('The height of the user in centimeters.'),
  weight: z.number().describe('The weight of the user in kilograms.'),
  age: z.number().describe('The age of the user in years.'),
  bloodPressure: z.string().describe('The blood pressure of the user, e.g., 120/80.'),
  cholesterol: z.number().describe('The cholesterol level of the user in mg/dL.'),
  sugarLevels: z.number().describe('The blood sugar levels of the user in mg/dL.'),
  fats: z.number().describe('The body fat percentage of the user.'),
  bloodPoints: z.number().describe('A metric representing overall blood health.'),
});

export type GenerateDietarySuggestionsInput = z.infer<
  typeof GenerateDietarySuggestionsInputSchema
>;

const SuggestionItemSchema = z.object({
  name: z.string().describe("Name of the food item."),
  reason: z.string().describe("A brief, one-sentence reason why this food is suggested for the user."),
  imageHint: z.string().describe("A one or two-word hint for a relevant image (e.g., 'apple', 'spinach', 'chia seeds').")
});

const GenerateDietarySuggestionsOutputSchema = z.object({
    summary: z.string().describe("A brief, encouraging one or two-sentence summary of the dietary advice."),
    fruits: z.array(SuggestionItemSchema).min(3).describe("A list of exactly 3 recommended fruits."),
    vegetables: z.array(SuggestionItemSchema).min(3).describe("A list of exactly 3 recommended vegetables."),
    proteins: z.array(SuggestionItemSchema).min(3).describe("A list of exactly 3 recommended lean proteins."),
    seedsAndNuts: z.array(SuggestionItemSchema).min(3).describe("A list of exactly 3 recommended seeds and nuts."),
});

export type GenerateDietarySuggestionsOutput = z.infer<
  typeof GenerateDietarySuggestionsOutputSchema
>;

export async function generateDietarySuggestions(
  input: GenerateDietarySuggestionsInput
): Promise<GenerateDietarySuggestionsOutput> {
  return generateDietarySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDietarySuggestionsPrompt',
  input: {schema: GenerateDietarySuggestionsInputSchema},
  output: {schema: GenerateDietarySuggestionsOutputSchema},
  prompt: `You are a registered dietician. Based on the following health metrics, provide dietary suggestions to improve the user's health. 
  
  Your response must be structured. Provide a brief summary, then list exactly 3 items for each category: fruits, vegetables, proteins, and seeds/nuts. For each item, give its name, a short reason for its recommendation, and a simple image hint.

Health Metrics:
- Height: {{height}} cm
- Weight: {{weight}} kg
- Age: {{age}} years
- Blood Pressure: {{bloodPressure}}
- Cholesterol: {{cholesterol}} mg/dL
- Sugar Levels: {{sugarLevels}} mg/dL
- Fats: {{fats}}%
- Blood Points: {{bloodPoints}}

Provide your structured dietary suggestions.`,
});

const generateDietarySuggestionsFlow = ai.defineFlow(
  {
    name: 'generateDietarySuggestionsFlow',
    inputSchema: GenerateDietarySuggestionsInputSchema,
    outputSchema: GenerateDietarySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
