import { runGroqQuery } from './groq';
import { runGeminiQuery } from './gemini';

/**
 * Runs a query using the primary AI service (Groq) and falls back to a secondary service (Gemini) on failure.
 * This provides resilience if one of the API keys is invalid or a service is down.
 * @param prompt The prompt to send to the AI model.
 * @returns A promise that resolves to the AI's response as a string.
 * @throws An error if both services fail.
 */
export async function runQuery(prompt: string): Promise<string> {
  try {
    // Prioritize Groq for its speed.
    return await runGroqQuery(prompt);
  } catch (groqError: any) {
    console.warn("Groq API failed, attempting fallback to Gemini.", groqError.message);
    
    // Check for specific, recoverable errors from Groq before falling back.
    const isRecoverableError = 
      (groqError.message && (groqError.message.includes('Invalid API Key') || groqError.message.includes('not configured'))) ||
      (groqError.message && groqError.message.includes('billing'));

    if (isRecoverableError) {
        try {
            console.log("Falling back to Gemini API...");
            return await runGeminiQuery(prompt);
        } catch (geminiError: any) {
            console.error("Gemini API fallback also failed:", geminiError.message);
            // Provide a clear, actionable error message if both fail.
            throw new Error("Both AI services failed. Please check your VITE_GROQ_API_KEY and VITE_GEMINI_API_KEY in the .env file.");
        }
    }
    
    // If the Groq error was not a key/config issue, re-throw it.
    throw groqError;
  }
}
