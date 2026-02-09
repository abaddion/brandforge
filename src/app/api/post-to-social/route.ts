import { NextRequest, NextResponse } from 'next/server';
import { postToLinkedIn, postToTwitter, postToFacebook } from '@/lib/social-posting';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { CampaignMetrics, PublishedPost, SocialAccount } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { 
      platform, 
      content, 
      hashtags, 
      accessToken, 
      userId, 
      campaignId,
      brandProfileId 
    } = await request.json();

    if (!platform || !content || !accessToken) {
      return NextResponse.json(
        { error: 'Platform, content, and access token are required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (platform.toLowerCase()) {
      case 'linkedin':
        if (!userId) {
          return NextResponse.json(
            { error: 'LinkedIn requires userId' },
            { status: 400 }
          );
        }
        result = await postToLinkedIn(accessToken, userId, content, hashtags);
        break;
      
      case 'twitter':
      case 'x':
        result = await postToTwitter(accessToken, content, hashtags);
        break;
      
      case 'facebook':
        if (!userId) {
          return NextResponse.json(
            { error: 'Facebook requires pageId' },
            { status: 400 }
          );
        }
        result = await postToFacebook(accessToken, userId, content, hashtags);
        break;
      
      default:
        return NextResponse.json(
          { error: `Unsupported platform: ${platform}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to post' },
        { status: 500 }
      );
    }

    const db = await getDb();
    
    // Store metrics entry (initialized with 0, will be updated via webhook or polling)
    if (campaignId && brandProfileId) {
      await db.collection<CampaignMetrics>('campaign_metrics').insertOne({
        campaignId: new ObjectId(campaignId),
        brandProfileId: new ObjectId(brandProfileId),
        platform: platform.toLowerCase(),
        postId: result.postId,
        impressions: 0,
        engagements: 0,
        clicks: 0,
        shares: 0,
        comments: 0,
        likes: 0,
        engagementRate: 0,
        ctr: 0,
        recordedAt: new Date(),
        postText: content,
        hashtags: hashtags || [],
      });
    }

    // ✅ Auto-save to published_posts when posting from BrandForge
    if (brandProfileId && result.postId) {
      try {
        // Find social account by platform and brandProfileId
        const socialAccount = await db.collection<SocialAccount>('social_accounts').findOne({
          brandProfileId: new ObjectId(brandProfileId),
          platform: platform.toLowerCase()
        });

        if (socialAccount) {
          // Create fingerprint
          const hook = content.substring(0, 60).trim();
          const words = content.toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 5);
          const keyThemes = [...new Set(words.slice(0, 5))];
          
          // Extract hashtags
          const hashtagMatches = content.match(/#[\w]+/g) || [];
          const hashtagsArray = hashtagMatches.map(h => h.substring(1).toLowerCase());

          const publishedPost: Omit<PublishedPost, '_id'> = {
            socialAccountId: socialAccount._id!,
            brandProfileId: new ObjectId(brandProfileId),
            platform: platform.toLowerCase() as any,
            platformPostId: result.postId,
            content,
            publishedAt: new Date(),
            fingerprint: {
              hook,
              keyThemes,
              hashtags: hashtagsArray
            },
            lastSyncedAt: new Date()
          };

          await db.collection<PublishedPost>('published_posts').insertOne(publishedPost as any);
          console.log(`[Post] Auto-saved published post ${result.postId} to database`);
        }
      } catch (error) {
        // Don't fail the post if saving fails
        console.error('[Post] Failed to auto-save published post:', error);
      }
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      url: result.url,
      message: `Successfully posted to ${platform}`,
    });

  } catch (error) {
    console.error('Post to social error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to post to social media',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
