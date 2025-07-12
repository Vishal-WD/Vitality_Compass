'use server';

/**
 * @fileOverview Generates workout suggestions based on a comprehensive set of user health metrics.
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
  bloodPressure: z.string().describe('The blood pressure of the user, e.g., 120/80.'),
  cholesterol: z.number().describe('The cholesterol level of the user in mg/dL.'),
  sugarLevels: z.number().describe('The blood sugar levels of the user in mg/dL.'),
  fats: z.number().describe('The body fat percentage of the user.'),
  bloodPoints: z.number().describe('A metric representing overall blood health.'),
});
export type WorkoutSuggestionsInput = z.infer<typeof WorkoutSuggestionsInputSchema>;

const ExerciseSchema = z.object({
  name: z.string().describe('The name of the exercise (e.g., "Push-ups", "Running", "Yoga").'),
  sets: z.string().describe('The number of sets (e.g., "3 sets").'),
  reps: z.string().describe('The number of repetitions or duration (e.g., "10-12 reps", "30 minutes").'),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

const DailyPlanSchema = z.object({
  day: z.string().describe('The day of the week (e.g., Monday, Tuesday).'),
  title: z.string().describe('A catchy title for the day\'s workout (e.g., "Cardio Blast", "Strength & Core", "Rest & Recovery").'),
  description: z.string().describe('A brief description of the workout for the day.'),
  exercises: z.array(ExerciseSchema).describe("An array of exercises for the day. If it's a rest day, this array can be empty.")
});

const AnalysisItemSchema = z.object({
    metric: z.enum(["BMI", "Blood Pressure", "Cholesterol", "Sugar Levels", "Fats"]),
    status: z.enum(["High", "Low", "Normal", "Underweight", "Healthy", "Overweight", "Obese"]),
    comment: z.string().describe("A brief, one-sentence comment on this specific metric.")
});

const WorkoutSuggestionsOutputSchema = z.object({
  analysis: z.array(AnalysisItemSchema).length(5).describe("An array of 5 analysis points, one for each key metric: BMI, Blood Pressure, Cholesterol, Sugar Levels, and Fats. It MUST cover all five."),
  summary: z.string().describe("A brief, encouraging summary (2-3 sentences) of the overall workout advice based on the analysis."),
  weeklyPlan: z.array(DailyPlanSchema).length(7).describe("A 7-day workout plan tailored to the user.")
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
  prompt: `You are a world-class personal trainer and dietician. Your task is to generate a comprehensive 7-day workout plan based on a user's health metrics.

First, provide a structured analysis for each of the following five metrics: BMI, Blood Pressure, Cholesterol, Sugar Levels, and Fats. For each metric, you MUST state its status and provide a short comment. Use the following reference ranges:
- BMI: Underweight (<18.5), Healthy (18.5-24.9), Overweight (25.0-29.9), Obese (>=30.0)
- Blood Pressure: Normal is around 120/80. Anything significantly higher is High.
- Cholesterol: Normal is below 200 mg/dL.
- Sugar Levels (fasting): Normal is below 100 mg/dL.
- Fats (%): This varies, but for an average adult, 20-30% is a general healthy range. Use 'High', 'Low', or 'Normal'.

After the analysis, write a brief, encouraging summary of the overall workout philosophy for this user.

Finally, create a 7-day workout plan. The plan should be tailored to address the user's specific health data.
- If blood pressure is high, recommend more consistent, moderate-intensity cardio.
- If sugar levels are high, incorporate resistance training and HIIT to improve insulin sensitivity.
- If cholesterol is high, focus on aerobic exercises.
- If BMI is high (Overweight or Obese), create a calorie-burning routine with a mix of cardio and strength.
- If fats are outside the normal range, adjust cardio and strength training accordingly.
The plan must include a mix of cardio, strength training, and at least one rest day. For each day, provide a title, a short description, and a list of specific exercises with sets and reps.

User Metrics:
- Age: {{age}} years
- Weight: {{weight}} kg
- BMI: {{bmi}}
- Blood Pressure: {{bloodPressure}}
- Cholesterol: {{cholesterol}} mg/dL
- Sugar Levels: {{sugarLevels}} mg/dL
- Fats: {{fats}}%
- Blood Points: {{bloodPoints}}

Provide your structured workout plan.`,
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
