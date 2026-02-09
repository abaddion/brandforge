import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { fetchUserPosts } from '@/lib/linkedin-fetcher';
import { SocialAccount, PublishedPost } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { socialAccountId } = await request.json();

    if (!socialAccountId) {
      return NextResponse.json(
        { error: 'Social account ID required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Get social account
    const account = await db.collection<SocialAccount>('social_accounts').findOne({
      _id: new ObjectId(socialAccountId)
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Social account not found' },
        { status: 404 }
      );
    }

    // Check token expiry
    if (account.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Access token expired. Please reconnect.' },
        { status: 401 }
      );
    }

    console.log(`[Sync] Fetching posts from ${account.platform} for account ${socialAccountId}`);

    let syncedCount = 0;

    if (account.platform === 'linkedin') {
      // Fetch posts from LinkedIn
      const posts = await fetchUserPosts(account.accessToken, account.profileId);
      
      console.log(`[Sync] Found ${posts.length} posts from LinkedIn`);

      // Store each post
      for (const post of posts) {
        // Check if already exists
        const existing = await db.collection<PublishedPost>('published_posts').findOne({
          platformPostId: post.id,
          socialAccountId: new ObjectId(socialAccountId)
        });

        if (existing) {
          // Update engagement stats
          await db.collection<PublishedPost>('published_posts').updateOne(
            { _id: existing._id },
            {
              $set: {
                engagement: post.engagement,
                lastSyncedAt: new Date()
              }
            }
          );
          continue;
        }

        // Create fingerprint
        const hook = post.text.substring(0, 60).trim();
        const words = post.text.toLowerCase()
          .split(/\s+/)
          .filter((w: string) => w.length > 5);
        const keyThemes = [...new Set(words.slice(0, 5))];
        
        // Extract hashtags
        const hashtagMatches = post.text.match(/#[\w]+/g) || [];
        const hashtags = hashtagMatches.map((h: string) => h.substring(1).toLowerCase());

        // Store post
        const publishedPost: Omit<PublishedPost, '_id'> = {
          socialAccountId: new ObjectId(socialAccountId),
          brandProfileId: account.brandProfileId!,
          platform: account.platform,
          platformPostId: post.id,
          content: post.text,
          publishedAt: post.createdAt,
          engagement: post.engagement,
          fingerprint: {
            hook,
            keyThemes,
            hashtags
          },
          lastSyncedAt: new Date()
        };

        await db.collection<PublishedPost>('published_posts').insertOne(publishedPost as any);
        syncedCount++;
      }
    } else {
      return NextResponse.json(
        { error: `Sync not yet implemented for ${account.platform}` },
        { status: 501 }
      );
    }

    console.log(`[Sync] Synced ${syncedCount} new posts`);

    return NextResponse.json({
      success: true,
      syncedCount,
      totalPosts: await db.collection<PublishedPost>('published_posts').countDocuments({
        socialAccountId: new ObjectId(socialAccountId)
      }),
      message: `Synced ${syncedCount} new posts from ${account.platform}`
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync posts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
