import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Please add your Gemini API key to .env.local');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Try models in order of preference
const MODEL_FALLBACKS = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-pro',
  'gemini-2.0-flash',
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateText(prompt: string, model?: string): Promise<string> {
  const modelsToTry = model ? [model, ...MODEL_FALLBACKS] : MODEL_FALLBACKS;
  
  let lastError: any;
  
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
      
      // Handle rate limits (429) - retry after delay or fallback
      if (error?.status === 429) {
        // Extract retry delay from error message or errorDetails
        let retryAfter = 30000; // Default 30 seconds
        
        // Try to extract from errorDetails array
        if (error?.errorDetails && Array.isArray(error.errorDetails)) {
          const retryInfo = error.errorDetails.find((detail: any) => 
            detail?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
          );
          if (retryInfo?.retryDelay) {
            retryAfter = parseFloat(retryInfo.retryDelay) * 1000;
          }
        }
        
        // Try to extract from error message (e.g., "Please retry in 27.46s")
        const messageMatch = error?.message?.match(/retry in ([\d.]+)s/i);
        if (messageMatch) {
          retryAfter = parseFloat(messageMatch[1]) * 1000;
        }
        
        console.log(`Rate limit hit for ${modelToTry}. Retrying after ${retryAfter / 1000}s...`);
        await sleep(retryAfter);
        
        // Retry once
        try {
          const generativeModel = genAI.getGenerativeModel({ model: modelToTry });
          const result = await generativeModel.generateContent(prompt);
          const response = await result.response;
          console.log(`Successfully used model: ${modelToTry} after retry`);
          return response.text();
        } catch (retryError: any) {
          console.error(`Retry also failed for ${modelToTry}:`, retryError?.message);
          // If retry also fails with 429, try next model or fallback to Anthropic
          if (retryError?.status === 429) {
            continue; // Try next model
          }
          throw retryError;
        }
      }
      
      // If it's not a 404 or 429, don't try other models
      if (error?.status !== 404 && error?.status !== 429) {
        throw error;
      }
      // Continue to next model if 404
      continue;
    }
  }
  
  // If all models failed, throw the last error
  console.error('All Gemini model attempts failed. Last error:', lastError);
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