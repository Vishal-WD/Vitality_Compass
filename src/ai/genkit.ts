import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const GEMINI_API_KEY = 'AIzaSyADrmwyKmf2o5vB5UXy_ocnM4BFKyfmyCQ';

// Configure googleAI plugin with the API key
const googleAIPlugin = googleAI({
  apiKey: GEMINI_API_KEY,
});

export const ai = genkit({
  plugins: [googleAIPlugin],
  model: 'googleai/gemini-1.5-flash-latest',
});
