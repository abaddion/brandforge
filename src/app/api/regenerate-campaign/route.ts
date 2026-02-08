import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { regenerateSinglePost } from '@/lib/campaign-generator';
import { BrandProfile, Platform, CampaignTypeEnum } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { brandProfileId, platform, campaignType, instructions } = await request.json();

    if (!brandProfileId || !platform || !campaignType || !instructions) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    console.log(`Regenerating post for ${platform} - ${campaignType}`);

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

    // Regenerate the post
    const newPost = await regenerateSinglePost(
      brandProfile.brandDNA,
      platform as Platform,
      campaignType as CampaignTypeEnum,
      instructions
    );

    return NextResponse.json({
      success: true,
      post: newPost
    });

  } catch (error) {
    console.error('Post regeneration error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to regenerate post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}