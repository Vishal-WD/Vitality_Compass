
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
  prompt: `You are a registered dietician. Based on the following health metrics, provide highly specific and personalized dietary suggestions to improve the user's health. 
  
  Your response must be structured and directly reference the user's data.
  
  First, provide a structured analysis for each of the following four metrics: Blood Pressure, Cholesterol, Sugar Levels, and Fats. For each metric, you MUST state if its status is 'High', 'Low', or 'Normal' and provide a short comment.
  Use the following reference ranges:
  - Blood Pressure: Normal is around 120/80. Anything significantly higher is high.
  - Cholesterol: Normal is below 200 mg/dL.
  - Sugar Levels (fasting): Normal is below 100 mg/dL.
  - Fats (%): This varies by age and sex, but for an average adult, 20-30% is a general healthy range.
  
  After the analysis, write a brief, encouraging summary of the overall advice.
  
  Next, provide food recommendations. The reasons for your suggestions MUST be specific to the user's metrics. For example, if cholesterol is high, recommend oatmeal because it contains soluble fiber. If blood pressure is high, recommend spinach because it's rich in potassium. List exactly 3 items for each category: fruits, vegetables, proteins, and seeds/nuts.

  Finally, create a list of exactly 3 'foodsToLimit'. These should be foods or food categories that are directly detrimental based on the user's metrics. For each, provide a specific reason (e.g., "Limit sugary drinks because your sugar levels are high").

Health Metrics:
- Height: {{height}} cm
- Weight: {{weight}} kg
- Age: {{age}} years
- BMI: {{bmi}}
- Blood Pressure: {{bloodPressure}}
- Cholesterol: {{cholesterol}} mg/dL
- Sugar Levels: {{sugarLevels}} mg/dL
- Fats: {{fats}}%
- Blood Points: {{bloodPoints}}

Provide your structured and highly specific dietary suggestions.`,
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
