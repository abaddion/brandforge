import { generateJSON } from './gemini';
import { generateJSONWithClaude } from './anthropic';
import { BrandDNA, Platform, CampaignTypeEnum, CampaignPost } from '@/types';

interface PlatformSpecs {
  maxLength: number;
  hashtagLimit: number;
  tone: string;
  bestPractices: string[];
}

const PLATFORM_SPECS: Record<Platform, PlatformSpecs> = {
  linkedin: {
    maxLength: 3000,
    hashtagLimit: 5,
    tone: 'Professional, thought-leadership focused',
    bestPractices: [
      'Start with a hook in the first line',
      'Use line breaks for readability',
      'Include a call-to-action',
      'Tag relevant people or companies when appropriate',
      'Pose questions to drive engagement'
    ]
  },
  twitter: {
    maxLength: 280,
    hashtagLimit: 3,
    tone: 'Concise, punchy, engaging',
    bestPractices: [
      'Front-load the key message',
      'Use numbers and data when possible',
      'Create urgency or curiosity',
      'Keep hashtags minimal and relevant',
      'Leave room for retweets with comments'
    ]
  },
  instagram: {
    maxLength: 2200,
    hashtagLimit: 10,
    tone: 'Visual-first, storytelling, authentic',
    bestPractices: [
      'Write captivating first line (preview text)',
      'Tell a story',
      'Use emojis strategically',
      'Include strong call-to-action',
      'Mix popular and niche hashtags'
    ]
  },
  facebook: {
    maxLength: 63206,
    hashtagLimit: 5,
    tone: 'Conversational, community-focused',
    bestPractices: [
      'Ask questions to spark conversation',
      'Share relatable content',
      'Use emotional hooks',
      'Include clear call-to-action',
      'Keep it authentic and personal'
    ]
  }
};

const CAMPAIGN_TYPE_DESCRIPTIONS: Record<CampaignTypeEnum, string> = {
  product_launch: 'Announcing a new product, feature, or service with excitement and clear value proposition',
  thought_leadership: 'Establishing authority and sharing insights on industry trends, challenges, or innovations',
  engagement: 'Starting conversations, asking questions, and building community interaction',
  brand_awareness: 'Introducing the brand, sharing company culture, values, and building brand recognition'
};

export async function generateCampaign(
  brandDNA: BrandDNA,
  platform: Platform,
  campaignType: CampaignTypeEnum
): Promise<CampaignPost[]> {
  const prompt = buildCampaignPrompt(brandDNA, platform, campaignType);
  
  // Check if Anthropic fallback is disabled
  const useAnthropicFallback = process.env.USE_ANTHROPIC_FALLBACK !== 'false' && process.env.ANTHROPIC_API_KEY;
  
  // Try Gemini first
  try {
    console.log(`Attempting to generate ${platform} campaign with Gemini...`);
    const result = await generateJSON(prompt);
    
    if (!result.posts || !Array.isArray(result.posts)) {
      throw new Error('Invalid campaign response structure');
    }
    
    console.log(`✅ Successfully generated ${platform} campaign with Gemini`);
    return result.posts;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    
    // Check if this is a rate limit error (should NOT use expensive Anthropic)
    const isRateLimit = error?.status === 429 || errorMessage.includes('quota') || errorMessage.includes('rate limit');
    
    if (isRateLimit) {
      console.error(`❌ Gemini rate limit hit for ${platform}. NOT using expensive Anthropic fallback. Error:`, errorMessage);
      throw new Error(`Gemini API rate limit exceeded for ${platform} campaign. Please try again in a few moments. Anthropic fallback disabled for rate limits to save costs.`);
    }
    
    // Only use Anthropic for permanent failures (not rate limits)
    if (useAnthropicFallback) {
      console.warn(`⚠️  WARNING: Using expensive Anthropic fallback for ${platform}. Gemini failed with:`, errorMessage);
      console.warn('⚠️  This will incur costs. Consider checking Gemini API status or quota.');
      
      try {
        console.log(`Attempting to generate ${platform} campaign with Anthropic (EXPENSIVE)...`);
        const result = await generateJSONWithClaude(prompt);
        
        if (!result.posts || !Array.isArray(result.posts)) {
          throw new Error('Invalid campaign response structure');
        }
        
        console.warn(`⚠️  Successfully generated ${platform} campaign with Anthropic (EXPENSIVE)`);
        return result.posts;
      } catch (claudeError) {
        console.error(`Anthropic also failed for ${platform} campaign:`, claudeError);
        throw new Error(`Failed to generate ${platform} campaign with both Gemini and Anthropic`);
      }
    } else {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error(`Failed to generate ${platform} campaign. Gemini failed and Anthropic API key is not configured.`);
      } else {
        throw new Error(`Failed to generate ${platform} campaign. Gemini failed and Anthropic fallback is disabled (USE_ANTHROPIC_FALLBACK=false).`);
      }
    }
  }
}

function buildCampaignPrompt(
  brandDNA: BrandDNA,
  platform: Platform,
  campaignType: CampaignTypeEnum
): string {
  const specs = PLATFORM_SPECS[platform];
  const typeDescription = CAMPAIGN_TYPE_DESCRIPTIONS[campaignType];

  return `You are an expert social media strategist. Create a ${platform.toUpperCase()} campaign based on the following brand DNA.

BRAND DNA PROFILE:
==================

VOICE & PERSONALITY:
- Tone: ${brandDNA.voice.tone}
- Personality: ${brandDNA.voice.personality.join(', ')}
- Language Style: ${brandDNA.voice.language_style}

CORE VALUES:
${brandDNA.values.map(v => `- ${v}`).join('\n')}

TARGET AUDIENCE:
- Demographics: ${brandDNA.target_audience.demographics}
- Psychographics: ${brandDNA.target_audience.psychographics}
- Pain Points: ${brandDNA.target_audience.pain_points.join(', ')}

POSITIONING:
- Category: ${brandDNA.positioning.category}
- Unique Value: ${brandDNA.positioning.unique_value}
- Differentiation: ${brandDNA.positioning.competitors_differentiation}

VISUAL IDENTITY:
- Design Style: ${brandDNA.visual_identity.design_style}
- Color Psychology: ${brandDNA.visual_identity.color_psychology}
- Imagery Themes: ${brandDNA.visual_identity.imagery_themes.join(', ')}

PLATFORM: ${platform.toUpperCase()}
==================================

Platform Specifications:
- Maximum Character Length: ${specs.maxLength}
- Hashtag Limit: ${specs.hashtagLimit}
- Tone: ${specs.tone}

Best Practices:
${specs.bestPractices.map(bp => `- ${bp}`).join('\n')}

CAMPAIGN TYPE: ${campaignType}
${typeDescription}

INSTRUCTIONS:
=============

Create 3 DISTINCT, HIGH-QUALITY social media posts for this campaign. Each post should:

1. PERFECTLY match the brand's voice, tone, and personality
2. Speak directly to the target audience's pain points and aspirations
3. Align with the brand's core values and positioning
4. Follow ${platform} best practices and stay within character limits
5. Be SPECIFIC and ACTIONABLE (avoid generic corporate speak)
6. Include strategic hashtags (max ${specs.hashtagLimit})
7. Have a clear call-to-action
8. Include an image prompt describing the ideal visual to accompany the post

IMPORTANT GUIDELINES:
- Posts should feel authentic to this specific brand, not generic templates
- Use the brand's language style consistently
- Reference the brand's unique value proposition naturally
- Each post should have a different angle or hook
- For ${platform}, respect the ${specs.tone} nature of the platform
- Stay WELL under ${specs.maxLength} characters (aim for optimal length for ${platform})

Return ONLY valid JSON in this exact structure (no markdown, no explanations):

{
  "posts": [
    {
      "text": "The actual post copy that would be published",
      "hashtags": ["relevant", "hashtags", "here"],
      "imagePrompt": "Detailed description of the ideal image/visual to accompany this post",
      "callToAction": "Specific action you want audience to take",
      "bestTimeToPost": "Recommended day/time for maximum engagement (e.g., 'Tuesday 9-11 AM')"
    },
    {
      "text": "Second post with different angle...",
      "hashtags": ["different", "hashtags"],
      "imagePrompt": "Different image concept...",
      "callToAction": "Different CTA...",
      "bestTimeToPost": "Different timing..."
    },
    {
      "text": "Third post with unique approach...",
      "hashtags": ["unique", "hashtags"],
      "imagePrompt": "Unique visual concept...",
      "callToAction": "Specific CTA...",
      "bestTimeToPost": "Optimal timing..."
    }
  ]
}`;
}

export async function regenerateSinglePost(
  brandDNA: BrandDNA,
  platform: Platform,
  campaignType: CampaignTypeEnum,
  instructions: string
): Promise<CampaignPost> {
  const specs = PLATFORM_SPECS[platform];
  
  const prompt = `You are an expert social media strategist. Create ONE social media post for ${platform.toUpperCase()}.

BRAND DNA (summarized):
- Tone: ${brandDNA.voice.tone}
- Personality: ${brandDNA.voice.personality.join(', ')}
- Target Audience: ${brandDNA.target_audience.demographics}
- Unique Value: ${brandDNA.positioning.unique_value}

CAMPAIGN TYPE: ${campaignType}

PLATFORM SPECS:
- Max Length: ${specs.maxLength} characters
- Hashtag Limit: ${specs.hashtagLimit}
- Tone: ${specs.tone}

SPECIAL INSTRUCTIONS FROM USER:
${instructions}

Create a single post following the brand voice and user instructions.

Return ONLY valid JSON (no markdown):
{
  "text": "Post copy here",
  "hashtags": ["hashtag1", "hashtag2"],
  "imagePrompt": "Image description",
  "callToAction": "CTA text",
  "bestTimeToPost": "Recommended timing"
}`;

  // Check if Anthropic fallback is disabled
  const useAnthropicFallback = process.env.USE_ANTHROPIC_FALLBACK !== 'false' && process.env.ANTHROPIC_API_KEY;
  
  // Try Gemini first
  try {
    console.log(`Attempting to regenerate ${platform} post with Gemini...`);
    const result = await generateJSON(prompt);
    console.log(`✅ Successfully regenerated ${platform} post with Gemini`);
    return result;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    
    // Check if this is a rate limit error (should NOT use expensive Anthropic)
    const isRateLimit = error?.status === 429 || errorMessage.includes('quota') || errorMessage.includes('rate limit');
    
    if (isRateLimit) {
      console.error(`❌ Gemini rate limit hit for post regeneration. NOT using expensive Anthropic fallback. Error:`, errorMessage);
      throw new Error('Gemini API rate limit exceeded. Please try again in a few moments. Anthropic fallback disabled for rate limits to save costs.');
    }
    
    // Only use Anthropic for permanent failures (not rate limits)
    if (useAnthropicFallback) {
      console.warn(`⚠️  WARNING: Using expensive Anthropic fallback for post regeneration. Gemini failed with:`, errorMessage);
      console.warn('⚠️  This will incur costs. Consider checking Gemini API status or quota.');
      
      try {
        console.log(`Attempting to regenerate ${platform} post with Anthropic (EXPENSIVE)...`);
        const result = await generateJSONWithClaude(prompt);
        console.warn(`⚠️  Successfully regenerated ${platform} post with Anthropic (EXPENSIVE)`);
        return result;
      } catch (claudeError) {
        console.error(`Anthropic also failed for post regeneration:`, claudeError);
        throw new Error('Failed to regenerate post with both Gemini and Anthropic');
      }
    } else {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Failed to regenerate post. Gemini failed and Anthropic API key is not configured.');
      } else {
        throw new Error('Failed to regenerate post. Gemini failed and Anthropic fallback is disabled (USE_ANTHROPIC_FALLBACK=false).');
      }
    }
  }
}