import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { generateCampaign } from '@/lib/campaign-generator';
import { BrandProfile, Campaign, Platform, CampaignTypeEnum } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { brandProfileId, platforms, campaignTypes } = await request.json();

    if (!brandProfileId || !platforms || !campaignTypes) {
      return NextResponse.json(
        { error: 'Brand profile ID, platforms, and campaign types are required' },
        { status: 400 }
      );
    }

    // Validate platforms
    const validPlatforms: Platform[] = ['linkedin', 'twitter', 'instagram', 'facebook'];
    const requestedPlatforms = platforms.filter((p: string) => 
      validPlatforms.includes(p as Platform)
    ) as Platform[];

    if (requestedPlatforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid platform is required' },
        { status: 400 }
      );
    }

    // Validate campaign types
    const validTypes: CampaignTypeEnum[] = ['product_launch', 'thought_leadership', 'engagement', 'brand_awareness'];
    const requestedTypes = campaignTypes.filter((t: string) => 
      validTypes.includes(t as CampaignTypeEnum)
    ) as CampaignTypeEnum[];

    if (requestedTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid campaign type is required' },
        { status: 400 }
      );
    }

    console.log(`Generating campaigns for brand profile: ${brandProfileId}`);

    // Fetch brand profile
    const db = await getDb();
    const brandProfile = await db.collection<BrandProfile>('brand_profiles').findOne({
      _id: new ObjectId(brandProfileId)
    });

    if (!brandProfile) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    // Generate campaigns for each platform and type combination
    // Add delays between requests to avoid hitting rate limits
    const DELAY_BETWEEN_CAMPAIGNS = 2000; // 2 seconds between campaigns
    const DELAY_BETWEEN_PLATFORMS = 3000; // 3 seconds between platforms

    for (const platform of requestedPlatforms) {
      console.log(`Generating ${platform} campaigns...`);
      
      const platformCampaigns = [];
      
      for (const type of requestedTypes) {
        console.log(`  - Campaign type: ${type}`);
        
        try {
          const posts = await generateCampaign(
            brandProfile.brandDNA,
            platform,
            type
          );

          platformCampaigns.push({
            type,
            posts
          });
          
          // Add delay between campaign types to avoid rate limits
          if (requestedTypes.indexOf(type) < requestedTypes.length - 1) {
            console.log(`  Waiting ${DELAY_BETWEEN_CAMPAIGNS}ms before next campaign...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_CAMPAIGNS));
          }
        } catch (error) {
          console.error(`Failed to generate ${type} campaign for ${platform}:`, error);
          // Continue with other campaigns even if one fails
        }
      }

      // Save campaign for this platform
      if (platformCampaigns.length > 0) {
        const campaign: Omit<Campaign, '_id'> = {
          brandProfileId: new ObjectId(brandProfileId),
          createdAt: new Date(),
          platform,
          campaigns: platformCampaigns
        };

        await db.collection<Campaign>('campaigns').insertOne(campaign as any);
      }
      
      // Add delay between platforms to avoid rate limits
      if (requestedPlatforms.indexOf(platform) < requestedPlatforms.length - 1) {
        console.log(`Waiting ${DELAY_BETWEEN_PLATFORMS}ms before next platform...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PLATFORMS));
      }
    }

    // Fetch all campaigns for this brand profile
    const campaigns = await db.collection<Campaign>('campaigns')
      .find({ brandProfileId: new ObjectId(brandProfileId) })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`Generated campaigns across ${requestedPlatforms.length} platforms`);

    return NextResponse.json({
      success: true,
      campaigns,
      message: `Successfully generated campaigns for ${requestedPlatforms.join(', ')}`
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandProfileId = searchParams.get('brandProfileId');

    if (!brandProfileId) {
      return NextResponse.json(
        { error: 'Brand profile ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const campaigns = await db.collection<Campaign>('campaigns')
      .find({ brandProfileId: new ObjectId(brandProfileId) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ campaigns });

  } catch (error) {
    console.error('Fetch campaigns error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}