import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const GEMINI_API_KEY = 'AIzaSyBSizLbiKd8kacHov54K-Ao-bbObVcDn3s';

// Configure googleAI plugin with the API key
const googleAIPlugin = googleAI({
  apiKey: GEMINI_API_KEY,
});

export const ai = genkit({
  plugins: [googleAIPlugin],
  model: 'googleai/gemini-1.5-flash-latest',
});
