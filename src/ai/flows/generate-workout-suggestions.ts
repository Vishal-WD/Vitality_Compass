'use server';

/**
 * @fileOverview Generates workout suggestions based on user's age, weight, and BMI.
 *
 * - generateWorkoutSuggestions - A function that generates workout suggestions.
 * - WorkoutSuggestionsInput - The input type for the generateWorkoutSuggestions function.
 * - WorkoutSuggestionsOutput - The return type for the generateWorkoutSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkoutSuggestionsInputSchema = z.object({
  age: z.number().describe('The age of the user in years.'),
  weight: z.number().describe('The weight of the user in kilograms.'),
  bmi: z.number().describe('The BMI (Body Mass Index) of the user.'),
});
export type WorkoutSuggestionsInput = z.infer<typeof WorkoutSuggestionsInputSchema>;

const WorkoutSuggestionsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('Workout suggestions tailored to the user based on their age, weight, and BMI.'),
});
export type WorkoutSuggestionsOutput = z.infer<typeof WorkoutSuggestionsOutputSchema>;

export async function generateWorkoutSuggestions(
  input: WorkoutSuggestionsInput
): Promise<WorkoutSuggestionsOutput> {
  return generateWorkoutSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'workoutSuggestionsPrompt',
  input: {schema: WorkoutSuggestionsInputSchema},
  output: {schema: WorkoutSuggestionsOutputSchema},
  prompt: `You are a personal trainer. Generate workout suggestions based on the user's age, weight, and BMI.

Age: {{{age}}}
Weight: {{{weight}}} kg
BMI: {{{bmi}}}

Suggest workouts that are appropriate for their age, weight and BMI.`,
});

const generateWorkoutSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateWorkoutSuggestionsFlow',
    inputSchema: WorkoutSuggestionsInputSchema,
    outputSchema: WorkoutSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
