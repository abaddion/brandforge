import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Please add your Gemini API key to .env.local');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Try models in order of preference (using only available models as of 2025)
const MODEL_FALLBACKS = [
  'gemini-2.5-flash',      // Latest stable, fastest
  'gemini-2.5-pro',        // Latest stable, most capable
  'gemini-2.0-flash',      // Stable fallback
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateText(prompt: string, model?: string): Promise<string> {
  const modelsToTry = model ? [model, ...MODEL_FALLBACKS] : MODEL_FALLBACKS;
  
  let lastError: any;
  let allRateLimited = true;
  
  for (const modelToTry of modelsToTry) {
    try {
      console.log(`Attempting to use model: ${modelToTry}`);
      const generativeModel = genAI.getGenerativeModel({ model: modelToTry });
      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      console.log(`Successfully used model: ${modelToTry}`);
      return response.text();
    } catch (error: any) {
      console.error(`Model ${modelToTry} failed:`, error?.message || error);
      lastError = error;
      
      // Handle rate limits (429) - don't retry immediately, try next model instead
      // Retrying immediately wastes time and likely hits the same rate limit
      if (error?.status === 429) {
        console.log(`Rate limit hit for ${modelToTry}. Trying next model instead of waiting...`);
        // Extract retry delay for logging purposes
        let retryAfter = 0;
        if (error?.errorDetails && Array.isArray(error.errorDetails)) {
          const retryInfo = error.errorDetails.find((detail: any) => 
            detail?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
          );
          if (retryInfo?.retryDelay) {
            retryAfter = parseFloat(retryInfo.retryDelay) * 1000;
            console.log(`  (Would need to wait ${retryAfter / 1000}s for this model)`);
          }
        }
        // Try next model instead of waiting
        continue;
      }
      
      // If it's not a 404 or 429, don't try other models
      if (error?.status !== 404 && error?.status !== 429) {
        allRateLimited = false;
        throw error;
      }
      // Continue to next model if 404
      if (error?.status === 404) {
        allRateLimited = false; // 404 means model doesn't exist, not rate limited
      }
      continue;
    }
  }
  
  // If all models failed, throw the last error
  console.error('All Gemini model attempts failed. Last error:', lastError);
  
  if (allRateLimited) {
    throw new Error(`All Gemini models are rate limited. Please wait a few minutes and try again. Free tier quotas are very limited. Last error: ${lastError?.message || 'Rate limit exceeded'}`);
  }
  
  throw new Error(`Failed to generate text with Gemini. All models failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

export async function generateJSON(prompt: string, model?: string) {
  const fullPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON, no markdown formatting, no explanations.`;
  const text = await generateText(fullPrompt, model);
  
  // Clean up response - remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }
  
  return JSON.parse(cleaned);
}