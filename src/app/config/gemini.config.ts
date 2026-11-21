/**
 * Google Gemini API Setup
 */

import { GoogleGenAI } from "@google/genai";
import { envVars } from "./env";

export const gemini = new GoogleGenAI({
  apiKey: envVars.GEMINI_API_KEY,
});
