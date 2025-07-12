import { config } from 'dotenv';
config();

import '@/ai/flows/generate-workout-suggestions.ts';
import '@/ai/flows/generate-dietary-suggestions.ts';
import '@/ai/flows/generate-health-summary.ts';
