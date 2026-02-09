import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { generateCampaign } from '@/lib/campaign-generator';
import { CampaignContextBuilder } from '@/lib/campaign-context-builder';
import { BrandProfile, Campaign, Platform, CampaignTypeEnum } from '@/types';

function getSeason(date: Date): string {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

export async function POST(request: NextRequest) {
  try {
    const { brandProfileId, platforms, campaignTypes } = await request.json();

    if (!brandProfileId || !platforms || !campaignTypes) {
      return NextResponse.json(
        { error: 'Brand profile ID, platforms, and campaign types are required' },
        { status: 400 }
      );
    }

    // Validate inputs
    const validPlatforms: Platform[] = ['linkedin', 'twitter', 'instagram', 'facebook'];
    const requestedPlatforms = platforms.filter((p: string) => 
      validPlatforms.includes(p as Platform)
    ) as Platform[];

    const validTypes: CampaignTypeEnum[] = ['product_launch', 'thought_leadership', 'engagement', 'brand_awareness'];
    const requestedTypes = campaignTypes.filter((t: string) => 
      validTypes.includes(t as CampaignTypeEnum)
    ) as CampaignTypeEnum[];

    if (requestedPlatforms.length === 0 || requestedTypes.length === 0) {
      return NextResponse.json(
        { error: 'Invalid platforms or campaign types' },
        { status: 400 }
      );
    }

    console.log(`[${brandProfileId}] Generating campaigns`);

    // Fetch brand profile
    const db = await getDb();
    const brandProfile = await db.collection<BrandProfile>('brand_profiles').findOne({
      _id: new ObjectId(brandProfileId)
    });

    if (!brandProfile) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // Initialize context builder
    const contextBuilder = new CampaignContextBuilder();
    await contextBuilder.initialize();

    // Get campaign count (fast - uses index)
    const campaignCount = await contextBuilder.getCampaignCount(brandProfileId);
    const campaignNumber = campaignCount + 1;

    console.log(`[${brandProfileId}] Campaign #${campaignNumber}`);

    // Generate campaigns for each platform
    const DELAY_BETWEEN_CAMPAIGNS = 2000; // 2 seconds between campaigns
    const DELAY_BETWEEN_PLATFORMS = 3000; // 3 seconds between platforms

    for (const platform of requestedPlatforms) {
      const platformCampaigns = [];

      for (const type of requestedTypes) {
        try {
          // Get compact context (fast - aggregation pipeline, limited results)
          const compactContext = await contextBuilder.getCompactContext(
            brandProfileId,
            platform,
            type
          );

          console.log(`[${brandProfileId}] ${platform}/${type} - Found ${compactContext.usedHooks.length} previous hooks to avoid`);

          // Generate with compact context
          const posts = await generateCampaign(
            brandProfile.brandDNA,
            platform,
            type,
            {
              ...compactContext,
              campaignNumber,
              currentDate: new Date()
            }
          );

          platformCampaigns.push({ type, posts });

          // Add delay between campaign types to avoid rate limits
          if (requestedTypes.indexOf(type) < requestedTypes.length - 1) {
            console.log(`  Waiting ${DELAY_BETWEEN_CAMPAIGNS}ms before next campaign...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CAMPAIGNS));
          }
        } catch (error) {
          console.error(`[${brandProfileId}] Failed ${platform}/${type}:`, error);
        }
      }

      // Save campaign with fingerprint
      if (platformCampaigns.length > 0) {
        const now = new Date();
        const campaign: Omit<Campaign, '_id'> = {
          brandProfileId: new ObjectId(brandProfileId),
          createdAt: now,
          platform,
          campaigns: platformCampaigns,
          campaignNumber,
          seasonGenerated: getSeason(now),
          monthGenerated: now.getMonth() + 1,
          yearGenerated: now.getFullYear()
        };

        // Create fingerprint for future reference
        campaign.fingerprint = contextBuilder.createFingerprint(campaign as Campaign);

        await db.collection<Campaign>('campaigns').insertOne(campaign as any);
      }

      // Add delay between platforms to avoid rate limits
      if (requestedPlatforms.indexOf(platform) < requestedPlatforms.length - 1) {
        console.log(`Waiting ${DELAY_BETWEEN_PLATFORMS}ms before next platform...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PLATFORMS));
      }
    }

    // Fetch updated campaigns (limit to recent for performance)
    const campaigns = await db.collection<Campaign>('campaigns')
      .find({ brandProfileId: new ObjectId(brandProfileId) })
      .sort({ createdAt: -1 })
      .limit(50) // Only return recent campaigns to UI
      .toArray();

    return NextResponse.json({
      success: true,
      campaigns,
      campaignNumber,
      message: `Campaign #${campaignNumber} generated successfully`
    });

  } catch (error) {
    console.error('Campaign generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate campaigns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Keep existing GET route
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandProfileId = searchParams.get('brandProfileId');

    if (!brandProfileId) {
      return NextResponse.json({ error: 'Brand profile ID required' }, { status: 400 });
    }

    const db = await getDb();
    const campaigns = await db.collection<Campaign>('campaigns')
      .find({ brandProfileId: new ObjectId(brandProfileId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ campaigns });

  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
