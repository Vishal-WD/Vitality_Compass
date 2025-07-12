'use server';

/**
 * @fileOverview Generates an image based on a text prompt.
 *
 * - generateImage - A function that takes a text hint and returns a data URI for a generated image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImageInputSchema = z.object({
    hint: z.string().describe("A short text hint to generate an image from (e.g., 'avocado', 'person running')."),
    style: z.enum(['photorealistic', 'anime']).optional().default('photorealistic').describe("The style of the image to generate."),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
    imageUrl: z.string().describe("The data URI of the generated image."),
});

export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;


export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
    return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
    {
        name: 'generateImageFlow',
        inputSchema: GenerateImageInputSchema,
        outputSchema: GenerateImageOutputSchema,
    },
    async (input) => {
        const stylePrompt = input.style === 'anime' 
            ? `a dynamic, high-quality anime-style illustration of ${input.hint}, clean vibrant colors, digital painting`
            : `a high-quality, photorealistic image of ${input.hint}, on a clean, light gray background`;

        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: stylePrompt,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        if (!media) {
            throw new Error("Image generation failed to return media.");
        }

        return {
            imageUrl: media.url,
        };
    }
);
