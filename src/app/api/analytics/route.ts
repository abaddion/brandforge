import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { CampaignMetrics } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandProfileId = searchParams.get('brandProfileId');
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!brandProfileId) {
      return NextResponse.json(
        { error: 'Brand profile ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const query: any = {
      brandProfileId: new ObjectId(brandProfileId),
    };

    if (platform) {
      query.platform = platform.toLowerCase();
    }

    const metrics = await db.collection<CampaignMetrics>('campaign_metrics')
      .find(query)
      .sort({ recordedAt: -1 })
      .limit(limit)
      .toArray();

    // Calculate totals
    const totals = metrics.reduce((acc, m) => ({
      impressions: acc.impressions + m.impressions,
      engagements: acc.engagements + m.engagements,
      clicks: acc.clicks + m.clicks,
      shares: acc.shares + m.shares,
      comments: acc.comments + m.comments,
      likes: acc.likes + m.likes,
    }), {
      impressions: 0,
      engagements: 0,
      clicks: 0,
      shares: 0,
      comments: 0,
      likes: 0,
    });

    const engagementRate = totals.impressions > 0
      ? (totals.engagements / totals.impressions) * 100
      : 0;

    const ctr = totals.impressions > 0
      ? (totals.clicks / totals.impressions) * 100
      : 0;

    return NextResponse.json({
      metrics,
      totals: {
        ...totals,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        ctr: parseFloat(ctr.toFixed(2)),
      },
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { campaignId, brandProfileId, platform, metrics: metricsData } = await request.json();

    if (!campaignId || !brandProfileId || !platform || !metricsData) {
      return NextResponse.json(
        { error: 'Campaign ID, brand profile ID, platform, and metrics are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Update or create metrics entry
    const engagementRate = metricsData.impressions > 0
      ? (metricsData.engagements / metricsData.impressions) * 100
      : 0;

    const ctr = metricsData.impressions > 0
      ? (metricsData.clicks / metricsData.impressions) * 100
      : 0;

    await db.collection<CampaignMetrics>('campaign_metrics').updateOne(
      {
        campaignId: new ObjectId(campaignId),
        brandProfileId: new ObjectId(brandProfileId),
        platform: platform.toLowerCase(),
      },
      {
        $set: {
          ...metricsData,
          engagementRate: parseFloat(engagementRate.toFixed(2)),
          ctr: parseFloat(ctr.toFixed(2)),
          recordedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Metrics updated successfully',
    });

  } catch (error) {
    console.error('Analytics update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
