/**
 * Image Generation for Campaign Posts
 * Supports multiple image generation APIs
 */

// Using Stability AI (Stable Diffusion) as primary
export async function generateCampaignImage(imagePrompt: string): Promise<string> {
  // For now, return enhanced prompt for manual generation
  // In production, this would call an image generation API
  return imagePrompt;
}

/**
 * Generate image using Stability AI (Stable Diffusion)
 * Requires STABILITY_API_KEY in .env.local
 */
export async function generateImageWithSD(prompt: string): Promise<Buffer | null> {
  const apiKey = process.env.STABILITY_API_KEY;
  
  if (!apiKey) {
    console.warn('STABILITY_API_KEY not configured. Skipping image generation.');
    return null;
  }

  try {
    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt, weight: 1 }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Stability AI error:', error);
      return null;
    }

    const data = await response.json();
    
    if (data.artifacts && data.artifacts.length > 0) {
      return Buffer.from(data.artifacts[0].base64, 'base64');
    }

    return null;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}

/**
 * Generate image using DALL-E (OpenAI)
 * Requires OPENAI_API_KEY in .env.local
 */
export async function generateImageWithDALLE(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not configured. Skipping image generation.');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('DALL-E error:', error);
      return null;
    }

    const data = await response.json();
    return data.data[0]?.url || null;
  } catch (error) {
    console.error('DALL-E generation error:', error);
    return null;
  }
}

/**
 * Enhanced prompt for better image generation
 */
export function enhanceImagePrompt(basePrompt: string, brandStyle?: string): string {
  let enhanced = basePrompt;
  
  if (brandStyle) {
    enhanced = `${enhanced}, ${brandStyle}`;
  }
  
  enhanced += ', high quality, professional, social media ready, optimized for engagement';
  
  return enhanced;
}
