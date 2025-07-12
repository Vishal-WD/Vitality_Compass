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

const DailyPlanSchema = z.object({
  day: z.string().describe('The day of the week (e.g., Monday, Tuesday).'),
  title: z.string().describe('A catchy title for the day\'s workout (e.g., "Cardio Blast", "Strength & Core", "Rest & Recovery").'),
  description: z.string().describe('A brief description of the workout for the day.'),
  exercises: z.array(z.object({
    name: z.string().describe('The name of the exercise (e.g., "Push-ups", "Running", "Yoga").'),
    sets: z.string().describe('The number of sets (e.g., "3 sets").'),
    reps: z.string().describe('The number of repetitions or duration (e.g., "10-12 reps", "30 minutes").'),
    imageHint: z.string().describe('A one or two-word hint for a relevant image (e.g., "pushups", "running", "yoga", "weight lifting").')
  })).describe("An array of exercises for the day. If it's a rest day, this array can be empty.")
});

const WorkoutSuggestionsOutputSchema = z.object({
  weeklyPlan: z.array(DailyPlanSchema).describe("A 7-day workout plan tailored to the user.")
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
  prompt: `You are a world-class personal trainer. Generate a comprehensive 7-day workout plan based on the user's age, weight, and BMI.

User Metrics:
- Age: {{age}} years
- Weight: {{weight}} kg
- BMI: {{bmi}}

Create a weekly plan that includes a mix of cardio, strength training, and at least one rest day. For each day, provide a title, a short description, and a list of specific exercises with sets and reps. For each exercise, provide a simple one or two-word 'imageHint' that can be used to find a representative photo.`,
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
