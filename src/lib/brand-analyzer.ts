import { generateJSON } from './gemini';
import { generateJSONWithClaude } from './anthropic';
import { WebsiteAnalysis, BrandDNA } from '@/types';

export async function generateBrandDNA(analysis: WebsiteAnalysis): Promise<{
  brandDNA: BrandDNA;
  confidence_score: number;
}> {
  const prompt = buildBrandDNAPrompt(analysis);
  
  // Check if Anthropic fallback is disabled
  const useAnthropicFallback = process.env.USE_ANTHROPIC_FALLBACK !== 'false' && process.env.ANTHROPIC_API_KEY;
  
  // Try Gemini first
  try {
    console.log('Attempting to generate Brand DNA with Gemini...');
    const result = await generateJSON(prompt);
    
    // Validate the response structure
    if (!result.brandDNA || !result.confidence_score) {
      throw new Error('Invalid response structure from AI');
    }
    
    console.log('✅ Successfully generated Brand DNA with Gemini');
    return result;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    
    // Check if this is a rate limit error (should NOT use expensive Anthropic)
    const isRateLimit = error?.status === 429 || errorMessage.includes('quota') || errorMessage.includes('rate limit');
    
    if (isRateLimit) {
      console.error('❌ Gemini rate limit hit. NOT using expensive Anthropic fallback. Error:', errorMessage);
      throw new Error('Gemini API rate limit exceeded. Please try again in a few moments. Anthropic fallback disabled for rate limits to save costs.');
    }
    
    // Only use Anthropic for permanent failures (not rate limits)
    if (useAnthropicFallback) {
      console.warn('⚠️  WARNING: Using expensive Anthropic fallback. Gemini failed with:', errorMessage);
      console.warn('⚠️  This will incur costs. Consider checking Gemini API status or quota.');
      
      try {
        console.log('Attempting to generate Brand DNA with Anthropic (EXPENSIVE)...');
        const result = await generateJSONWithClaude(prompt);
        
        // Validate the response structure
        if (!result.brandDNA || !result.confidence_score) {
          throw new Error('Invalid response structure from AI');
        }
        
        console.warn('⚠️  Successfully generated Brand DNA with Anthropic (EXPENSIVE)');
        return result;
      } catch (claudeError) {
        console.error('Anthropic also failed:', claudeError);
        throw new Error('Failed to generate brand DNA profile with both Gemini and Anthropic');
      }
    } else {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Failed to generate brand DNA profile. Gemini failed and Anthropic API key is not configured.');
      } else {
        throw new Error('Failed to generate brand DNA profile. Gemini failed and Anthropic fallback is disabled (USE_ANTHROPIC_FALLBACK=false).');
      }
    }
  }
}

function buildBrandDNAPrompt(analysis: WebsiteAnalysis): string {
  return `You are an expert brand strategist and marketing consultant. Analyze the following website data and generate a comprehensive brand DNA profile.

WEBSITE DATA:
============

URL: ${analysis.url}
Domain: ${analysis.technical.domain}

CONTENT ANALYSIS:
- Title: ${analysis.content.title}
- Meta Description: ${analysis.content.metaDescription}
- Main Headings: ${analysis.content.headings.slice(0, 10).join(', ')}
- Key Phrases: ${analysis.content.keyPhrases.join(', ')}
- Body Content Sample: ${analysis.content.bodyText.substring(0, 2000)}

VISUAL IDENTITY:
- Primary Colors: ${analysis.visual.primaryColors.join(', ')}
- Secondary Colors: ${analysis.visual.secondaryColors.join(', ')}
- Fonts: ${analysis.visual.fonts.join(', ')}

TECHNICAL:
- SSL Enabled: ${analysis.technical.hasSSL}
- Mobile Optimized: ${analysis.technical.mobileOptimized}
- Load Time: ${analysis.technical.loadTime}ms

INSTRUCTIONS:
============

Analyze this website data and generate a detailed brand DNA profile. Be specific, insightful, and actionable. 

Consider:
1. The messaging and language used
2. The visual design choices and what they communicate
3. The target audience based on content and tone
4. The brand's positioning and unique value proposition
5. The overall personality and voice

Return your analysis in the following JSON structure (and ONLY JSON, no markdown):

{
  "brandDNA": {
    "voice": {
      "tone": "string - Primary tone (e.g., 'Professional and Approachable', 'Bold and Innovative', 'Warm and Trustworthy')",
      "personality": ["array of 3-5 personality traits that define the brand"],
      "language_style": "string - Describe the language style (e.g., 'Technical but accessible', 'Conversational and friendly', 'Authoritative and expert')"
    },
    "values": ["array of 4-6 core brand values inferred from content and messaging"],
    "target_audience": {
      "demographics": "string - Describe the primary demographic (age, profession, tech-savviness, etc.)",
      "psychographics": "string - Describe their mindset, goals, and motivations",
      "pain_points": ["array of 3-5 specific pain points this brand addresses"]
    },
    "positioning": {
      "category": "string - Market category/industry",
      "unique_value": "string - What makes this brand unique and different",
      "competitors_differentiation": "string - How this brand likely differentiates from competitors"
    },
    "visual_identity": {
      "color_psychology": "string - What the color choices communicate about the brand",
      "design_style": "string - Overall design aesthetic (e.g., 'Minimalist and modern', 'Bold and vibrant', 'Classic and elegant')",
      "imagery_themes": ["array of 3-4 visual themes that would align with this brand"]
    }
  },
  "confidence_score": number between 60-100 indicating how confident you are in this analysis based on data quality
}

Be specific and avoid generic statements. Use concrete insights from the actual data provided.`;
}

// Helper function to validate brand DNA structure
export function validateBrandDNA(data: any): data is { brandDNA: BrandDNA; confidence_score: number } {
  if (!data || typeof data !== 'object') return false;
  if (!data.brandDNA || typeof data.brandDNA !== 'object') return false;
  if (typeof data.confidence_score !== 'number') return false;
  
  const dna = data.brandDNA;
  
  // Validate voice
  if (!dna.voice || typeof dna.voice !== 'object') return false;
  if (typeof dna.voice.tone !== 'string') return false;
  if (!Array.isArray(dna.voice.personality)) return false;
  if (typeof dna.voice.language_style !== 'string') return false;
  
  // Validate values
  if (!Array.isArray(dna.values)) return false;
  
  // Validate target_audience
  if (!dna.target_audience || typeof dna.target_audience !== 'object') return false;
  if (typeof dna.target_audience.demographics !== 'string') return false;
  if (typeof dna.target_audience.psychographics !== 'string') return false;
  if (!Array.isArray(dna.target_audience.pain_points)) return false;
  
  // Validate positioning
  if (!dna.positioning || typeof dna.positioning !== 'object') return false;
  if (typeof dna.positioning.category !== 'string') return false;
  if (typeof dna.positioning.unique_value !== 'string') return false;
  if (typeof dna.positioning.competitors_differentiation !== 'string') return false;
  
  // Validate visual_identity
  if (!dna.visual_identity || typeof dna.visual_identity !== 'object') return false;
  if (typeof dna.visual_identity.color_psychology !== 'string') return false;
  if (typeof dna.visual_identity.design_style !== 'string') return false;
  if (!Array.isArray(dna.visual_identity.imagery_themes)) return false;
  
  return true;
}