import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { SocialAccount } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandProfileId = searchParams.get('brandProfileId');

    if (!brandProfileId) {
      return NextResponse.json(
        { error: 'Brand profile ID required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    const accounts = await db.collection<SocialAccount>('social_accounts')
      .find({
        brandProfileId: new ObjectId(brandProfileId)
      })
      .toArray();

    return NextResponse.json({
      success: true,
      accounts: accounts.map(acc => ({
        _id: acc._id,
        platform: acc.platform,
        profileId: acc.profileId,
        displayName: acc.displayName,
        profileUrl: acc.profileUrl,
        avatarUrl: acc.avatarUrl,
        connectedAt: acc.connectedAt,
        expiresAt: acc.expiresAt
      }))
    });

  } catch (error) {
    console.error('Get social accounts error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch social accounts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
