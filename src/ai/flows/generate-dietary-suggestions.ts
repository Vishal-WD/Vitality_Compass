
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
  bmi: z.number().describe('The BMI (Body Mass Index) of the user.'),
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
  name: z.string().describe("Name of the food item or food category."),
  reason: z.string().describe("A brief, one-sentence reason why this food is suggested or should be limited, specifically tied to the user's health metrics."),
});
export type SuggestionItem = z.infer<typeof SuggestionItemSchema>;


const AnalysisItemSchema = z.object({
    metric: z.enum(["Blood Pressure", "Cholesterol", "Sugar Levels", "Fats"]),
    status: z.enum(["High", "Low", "Normal"]),
    comment: z.string().describe("A brief, one-sentence comment on this specific metric.")
});

const GenerateDietarySuggestionsOutputSchema = z.object({
    analysis: z.array(AnalysisItemSchema).length(4).describe("An array of 4 analysis points, one for each key metric: Blood Pressure, Cholesterol, Sugar Levels, and Fats. It MUST cover all four."),
    summary: z.string().describe("A brief, encouraging summary (2-3 sentences) of the overall dietary advice based on the analysis."),
    fruits: z.array(SuggestionItemSchema).min(3).describe("A list of exactly 3 recommended fruits."),
    vegetables: z.array(SuggestionItemSchema).min(3).describe("A list of exactly 3 recommended vegetables."),
    proteins: z.array(SuggestionItemSchema).min(3).describe("A list of exactly 3 recommended lean proteins."),
    seedsAndNuts: z.array(SuggestionItemSchema).min(3).describe("A list of exactly 3 recommended seeds and nuts."),
    foodsToLimit: z.array(SuggestionItemSchema).min(3).describe("A list of exactly 3 foods or food types to limit or avoid, with reasons tied to the user's metrics."),
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
  prompt: `You are a highly analytical and meticulous registered dietician. Your task is to generate a dietary plan that is hyper-personalized and avoids all generic advice. Every recommendation must be directly and clearly justified by the user's specific health metrics, even minor deviations from the norm.

  **Core Instructions:**
  1.  **Analyze Holistically:** Do not look at metrics in isolation. Consider how they interplay. For example, how does high cholesterol combined with high blood pressure influence your recommendations?
  2.  **Justify Everything:** For every single food item you suggest or advise against, you MUST provide a "reason" that explicitly links back to one or more of the user's metrics. Generic reasons like "it's healthy" are forbidden. The reason must be specific, e.g., "Limit processed cheese because its high sodium content can negatively impact your high blood pressure."
  3.  **Be Precise:** Use the provided reference ranges to determine the status of each metric.

  **Output Structure:**
  
  **Part 1: Metric Analysis**
  Provide a structured analysis for each of the four key metrics: Blood Pressure, Cholesterol, Sugar Levels, and Fats. For each, state if its status is 'High', 'Low', or 'Normal' based on these ranges:
  - Blood Pressure: Normal is around 120/80 mmHg.
  - Cholesterol: Normal total cholesterol is below 200 mg/dL.
  - Sugar Levels (fasting): Normal is below 100 mg/dL.
  - Fats (%): For an average adult, 20-30% is a general healthy range.
  Provide a brief, interpretive comment for each.

  **Part 2: Encouraging Summary**
  Write a brief, 2-3 sentence summary of the dietary approach based on your analysis.

  **Part 3: Specific Food Recommendations**
  Provide exactly 3 items for each category: fruits, vegetables, proteins, and seeds/nuts. The 'reason' for each must be scientifically sound and tied to the user's data.

  **Part 4: Specific Foods to Limit**
  Create a list of exactly 3 foods or food types to limit. The 'reason' for each must be a direct consequence of the user's metrics.

  **User's Health Metrics:**
  - Height: {{height}} cm
  - Weight: {{weight}} kg
  - Age: {{age}} years
  - BMI: {{bmi}}
  - Blood Pressure: {{bloodPressure}}
  - Cholesterol: {{cholesterol}} mg/dL
  - Sugar Levels: {{sugarLevels}} mg/dL
  - Fats: {{fats}}%
  - Blood Points: {{bloodPoints}}

  Now, generate the hyper-personalized and strictly justified dietary plan.`,
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
