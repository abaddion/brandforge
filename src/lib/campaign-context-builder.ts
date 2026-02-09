import { getDb } from './mongodb';
import { ObjectId } from 'mongodb';
import { CampaignFingerprint, Campaign, Platform, CampaignTypeEnum } from '@/types';

interface ContextSummary {
  recentThemes: string[];
  usedHooks: string[];
  usedHashtags: string[];
  campaignCount: number;
  seasonalDistribution: Record<string, number>;
}

export class CampaignContextBuilder {
  private db: any;

  constructor() {}

  async initialize() {
    if (!this.db) {
      this.db = await getDb();
    }
  }

  /**
   * Get compact context for campaign generation
   * This is optimized for scale - only fetches fingerprints, not full campaigns
   */
  async getCompactContext(
    brandProfileId: string,
    platform: Platform,
    campaignType: CampaignTypeEnum
  ): Promise<ContextSummary> {
    await this.initialize();

    // Use aggregation pipeline for efficiency
    const pipeline = [
      {
        $match: {
          brandProfileId: new ObjectId(brandProfileId),
          platform: platform
        }
      },
      {
        $unwind: '$campaigns'
      },
      {
        $match: {
          'campaigns.type': campaignType
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: 10 // Only last 10 campaigns of this type
      },
      {
        $project: {
          'campaigns.posts': 1,
          'seasonGenerated': 1,
          'createdAt': 1
        }
      }
    ];

    const recentCampaigns = await this.db.collection('campaigns')
      .aggregate(pipeline)
      .toArray();

    // Extract themes, hooks, hashtags
    const themes = new Set<string>();
    const hooks = new Set<string>();
    const hashtags = new Set<string>();
    const seasonalDist: Record<string, number> = {};

    for (const campaign of recentCampaigns) {
      // Track seasonal distribution
      const season = campaign.seasonGenerated || 'Unknown';
      seasonalDist[season] = (seasonalDist[season] || 0) + 1;

      // Extract from posts
      const posts = campaign.campaigns?.posts || [];
      for (const post of posts) {
        // First 60 chars as "hook"
        const hook = post.text.substring(0, 60).trim();
        hooks.add(hook);

        // Extract key themes from text (simple keyword extraction)
        const words = post.text.toLowerCase()
          .split(/\s+/)
          .filter((w: string) => w.length > 5);
        words.slice(0, 3).forEach((w: string) => themes.add(w));

        // Hashtags
        post.hashtags?.forEach((h: string) => hashtags.add(h));
      }
    }

    return {
      recentThemes: Array.from(themes).slice(0, 20),
      usedHooks: Array.from(hooks).slice(0, 15),
      usedHashtags: Array.from(hashtags).slice(0, 30),
      campaignCount: await this.getCampaignCount(brandProfileId),
      seasonalDistribution: seasonalDist
    };
  }

  /**
   * Get total campaign count efficiently (uses index)
   */
  async getCampaignCount(brandProfileId: string): Promise<number> {
    await this.initialize();
    
    return await this.db.collection('campaigns').countDocuments({
      brandProfileId: new ObjectId(brandProfileId)
    });
  }

  /**
   * Create fingerprint when saving new campaign
   */
  createFingerprint(campaign: Campaign): Campaign['fingerprint'] {
    const themes = new Set<string>();
    const hooks: string[] = [];
    const hashtags = new Set<string>();

    for (const campaignType of campaign.campaigns) {
      for (const post of campaignType.posts) {
        // Hook (first line)
        hooks.push(post.text.split('\n')[0].substring(0, 60));

        // Themes (simple extraction)
        const words = post.text.toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 5);
        words.slice(0, 3).forEach(w => themes.add(w));

        // Hashtags
        post.hashtags.forEach(h => hashtags.add(h));
      }
    }

    return {
      keyThemes: Array.from(themes).slice(0, 10),
      hooks: hooks.slice(0, 5),
      hashtags: Array.from(hashtags)
    };
  }

  /**
   * Get context from REAL published posts on social media
   * This ensures we don't repeat what's already live on their LinkedIn/Twitter
   */
  async getPublishedPostsContext(
    brandProfileId: string,
    platform: Platform
  ): Promise<{
    publishedHooks: string[];
    publishedThemes: string[];
    publishedHashtags: string[];
    totalPublished: number;
  }> {
    await this.initialize();

    // Get all published posts for this brand on this platform
    const publishedPosts = await this.db.collection('published_posts')
      .find({
        brandProfileId: new ObjectId(brandProfileId),
        platform: platform
      })
      .sort({ publishedAt: -1 })
      .limit(50) // Last 50 published posts
      .toArray();

    const hooks = new Set<string>();
    const themes = new Set<string>();
    const hashtags = new Set<string>();

    for (const post of publishedPosts) {
      if (post.fingerprint) {
        hooks.add(post.fingerprint.hook);
        post.fingerprint.keyThemes?.forEach((t: string) => themes.add(t));
        post.fingerprint.hashtags?.forEach((h: string) => hashtags.add(h));
      }
    }

    return {
      publishedHooks: Array.from(hooks),
      publishedThemes: Array.from(themes),
      publishedHashtags: Array.from(hashtags),
      totalPublished: publishedPosts.length
    };
  }

  /**
   * Enhanced context that includes BOTH generated campaigns AND published posts
   */
  async getFullContext(
    brandProfileId: string,
    platform: Platform,
    campaignType: CampaignTypeEnum
  ): Promise<ContextSummary & {
    publishedHooks?: string[];
    publishedThemes?: string[];
    publishedHashtags?: string[];
  }> {
    // Get context from BrandForge campaigns
    const campaignContext = await this.getCompactContext(
      brandProfileId,
      platform,
      campaignType
    );

    // Get context from REAL published posts
    const publishedContext = await this.getPublishedPostsContext(
      brandProfileId,
      platform
    );

    // Merge both contexts
    return {
      ...campaignContext,
      publishedHooks: publishedContext.publishedHooks,
      publishedThemes: publishedContext.publishedThemes,
      publishedHashtags: publishedContext.publishedHashtags
    };
  }
}
