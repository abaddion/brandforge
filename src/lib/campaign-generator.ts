import { generateJSON } from './gemini';
import { generateJSONWithClaude } from './anthropic';
import { BrandDNA, Platform, CampaignTypeEnum, CampaignPost } from '@/types';

interface CompactCampaignContext {
  recentThemes: string[];
  usedHooks: string[];
  usedHashtags: string[];
  campaignNumber: number;
  currentDate: Date;
  seasonalContext?: string;
  seasonalDistribution?: Record<string, number>;
}

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
  campaignType: CampaignTypeEnum,
  context: CompactCampaignContext
): Promise<CampaignPost[]> {
  const prompt = buildCampaignPromptCompact(brandDNA, platform, campaignType, context);
  
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

function buildCampaignPromptCompact(
  brandDNA: BrandDNA,
  platform: Platform,
  campaignType: CampaignTypeEnum,
  context: CompactCampaignContext
): string {
  const specs = PLATFORM_SPECS[platform];
  const typeDescription = CAMPAIGN_TYPE_DESCRIPTIONS[campaignType];
  
  // Get current date and season
  const now = context.currentDate || new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();
  const season = getSeason(now);
  const seasonalContext = context.seasonalContext || getSeasonalContext(season);
  
  // Build compact avoidance list (much smaller token footprint)
  let avoidanceContext = '';
  if (context.usedHooks.length > 0 || context.recentThemes.length > 0) {
    avoidanceContext = `
FRESHNESS CONSTRAINTS (CRITICAL):
==================================
This is Campaign #${context.campaignNumber} for this brand.

AVOID these previously used opening hooks:
${context.usedHooks.slice(0, 10).map((hook, i) => `${i + 1}. "${hook}..."`).join('\n')}

AVOID these overused themes (find NEW angles):
${context.recentThemes.slice(0, 15).join(', ')}

AVOID these hashtags (already heavily used):
${context.usedHashtags.slice(0, 20).map(h => `#${h}`).join(', ')}

${context.seasonalDistribution ? `
Previous seasonal focus:
${Object.entries(context.seasonalDistribution)
  .map(([season, count]) => `- ${season}: ${count} campaigns`)
  .join('\n')}
` : ''}

IMPORTANT: Generate COMPLETELY FRESH content. Different angles, different examples, different hooks.
`;
  }

  return `You are an expert social media strategist creating Campaign #${context.campaignNumber}.

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
- Pain Points: ${brandDNA.target_audience.pain_points.slice(0, 3).join(', ')}

POSITIONING:
- Unique Value: ${brandDNA.positioning.unique_value}

${avoidanceContext}

CURRENT CONTEXT:
================
- Date: ${month} ${year}
- Season: ${season}
- Seasonal Themes: ${seasonalContext}
- Campaign Number: #${context.campaignNumber}

PLATFORM: ${platform.toUpperCase()}
- Max Length: ${specs.maxLength} chars
- Hashtag Limit: ${specs.hashtagLimit}
- Tone: ${specs.tone}

CAMPAIGN TYPE: ${campaignType}
${typeDescription}

INSTRUCTIONS:
Create 3 COMPLETELY FRESH posts. Must be different from previous ${context.campaignNumber - 1} campaigns.

Requirements:
1. NEW angles and hooks (not in the avoid list above)
2. FRESH examples and references
3. Incorporate ${season} ${year} context
4. Match brand voice perfectly
5. Include strategic hashtags (max ${specs.hashtagLimit}, avoid overused ones)
6. Clear CTAs
7. Image prompts for visuals

Return ONLY valid JSON:

{
  "posts": [
    {
      "text": "Post copy here",
      "hashtags": ["new", "fresh", "hashtags"],
      "imagePrompt": "Image description",
      "callToAction": "CTA text",
      "bestTimeToPost": "Timing recommendation"
    },
    {
      "text": "Second post with completely different angle...",
      "hashtags": ["different", "hashtags"],
      "imagePrompt": "Different image concept...",
      "callToAction": "Different CTA...",
      "bestTimeToPost": "Different timing..."
    },
    {
      "text": "Third post with unique fresh approach...",
      "hashtags": ["unique", "hashtags"],
      "imagePrompt": "Unique visual concept...",
      "callToAction": "Specific CTA...",
      "bestTimeToPost": "Optimal timing..."
    }
  ]
}`;
}

// Helper functions for seasonal context
function getSeason(date: Date): string {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

function getSeasonalContext(season: string): string {
  const contexts: Record<string, string> = {
    'Spring': 'New beginnings, growth, renewal, fresh starts',
    'Summer': 'Peak activity, vacations, high energy',
    'Fall': 'Back to business, preparation, new academic year',
    'Winter': 'Holidays, year-end planning, new year goals'
  };
  return contexts[season] || '';
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