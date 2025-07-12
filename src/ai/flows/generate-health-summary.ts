// use server'
'use server';

/**
 * @fileOverview Generates a summary of health progress by comparing two data points.
 * 
 * - generateHealthSummary - A function that analyzes the change between two health data entries.
 * - GenerateHealthSummaryInput - The input type for the function.
 * - GenerateHealthSummaryOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { healthDataSchema } from '@/lib/types';

const GenerateHealthSummaryInputSchema = z.object({
    previousData: healthDataSchema.describe("The user's previous health data entry."),
    latestData: healthDataSchema.describe("The user's most recent health data entry."),
});
export type GenerateHealthSummaryInput = z.infer<typeof GenerateHealthSummaryInputSchema>;

const MetricChangeSchema = z.object({
    metric: z.enum(["Weight", "BMI", "Blood Pressure", "Cholesterol", "Sugar Levels", "Fats"]),
    change: z.string().describe("A short description of the change, e.g., '-2 kg', '+5 mg/dL', 'Maintained'."),
    comment: z.string().describe("A brief, one-sentence comment on the change."),
    status: z.enum(["Improved", "Declined", "Maintained"]),
});

const GenerateHealthSummaryOutputSchema = z.object({
    overallStatus: z.enum(["Improved", "Declined", "Maintained"]).describe("The overall assessment of the user's progress."),
    summaryText: z.string().describe("A brief, encouraging summary (2-3 sentences) of the overall progress, mentioning key achievements and areas for focus."),
    metricChanges: z.array(MetricChangeSchema).length(6).describe("An array of 6 analysis points, one for each key metric. It MUST cover all six."),
});
export type GenerateHealthSummaryOutput = z.infer<typeof GenerateHealthSummaryOutputSchema>;

export async function generateHealthSummary(input: GenerateHealthSummaryInput): Promise<GenerateHealthSummaryOutput> {
    return generateHealthSummaryFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateHealthSummaryPrompt',
    input: { schema: GenerateHealthSummaryInputSchema },
    output: { schema: GenerateHealthSummaryOutputSchema },
    prompt: `You are a health and wellness coach. Your task is to analyze a user's health progress by comparing their latest health data with their previous data.

Your response must be structured.

First, determine the 'overallStatus' of the user's progress. This can be 'Improved', 'Declined', or 'Maintained' based on the changes in key metrics.

Second, provide a 'summaryText' that is encouraging and summarizes the key changes. Congratulate them on improvements and gently point out areas that need attention.

Third, provide a detailed breakdown in 'metricChanges' for each of the following 6 metrics: Weight, BMI, Blood Pressure, Cholesterol, Sugar Levels, and Fats. For each metric:
- 'metric': The name of the metric.
- 'change': A short string representing the change (e.g., "-2 kg", "+5 mg/dL", "Maintained"). For Blood Pressure, note changes in both numbers if applicable.
- 'comment': A brief, one-sentence interpretive comment.
- 'status': Indicate if the change is an 'Improved', 'Declined', or 'Maintained' state for that metric. Lower is generally better, except for maybe Fats if it was too low.

Previous Data:
- Weight: {{previousData.weight}} kg
- Height: {{previousData.height}} cm
- BMI: {{previousData.bmi}}
- Blood Pressure: {{previousData.bloodPressure}}
- Cholesterol: {{previousData.cholesterol}} mg/dL
- Sugar Levels: {{previousData.sugarLevels}} mg/dL
- Fats: {{previousData.fats}}%

Latest Data:
- Weight: {{latestData.weight}} kg
- Height: {{latestData.height}} cm
- BMI: {{latestData.bmi}}
- Blood Pressure: {{latestData.bloodPressure}}
- Cholesterol: {{latestData.cholesterol}} mg/dL
- Sugar Levels: {{latestData.sugarLevels}} mg/dL
- Fats: {{latestData.fats}}%

Provide your structured health progress summary.`,
});

const generateHealthSummaryFlow = ai.defineFlow(
    {
        name: 'generateHealthSummaryFlow',
        inputSchema: GenerateHealthSummaryInputSchema,
        outputSchema: GenerateHealthSummaryOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
