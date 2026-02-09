import { ObjectId } from 'mongodb';

export interface WebsiteAnalysis {
  _id?: ObjectId;
  url: string;
  analyzedAt: Date;
  content: {
    title: string;
    metaDescription: string;
    headings: string[];
    bodyText: string;
    keyPhrases: string[];
  };
  visual: {
    primaryColors: string[];
    secondaryColors: string[];
    fonts: string[];
    logoUrl?: string;
    heroImages: string[];
  };
  technical: {
    domain: string;
    hasSSL: boolean;
    loadTime: number;
    mobileOptimized: boolean;
  };
}

export interface BrandDNA {
  voice: {
    tone: string;
    personality: string[];
    language_style: string;
  };
  values: string[];
  target_audience: {
    demographics: string;
    psychographics: string;
    pain_points: string[];
  };
  positioning: {
    category: string;
    unique_value: string;
    competitors_differentiation: string;
  };
  visual_identity: {
    color_psychology: string;
    design_style: string;
    imagery_themes: string[];
  };
}

export interface BrandProfile {
  _id?: ObjectId;
  analysisId: ObjectId;
  url: string;
  generatedAt: Date;
  brandDNA: BrandDNA;
  confidence_score: number;
}

export interface CampaignPost {
  text: string;
  hashtags: string[];
  imagePrompt: string;
  callToAction: string;
  bestTimeToPost: string;
}

export interface CampaignType {
  type: string;
  posts: CampaignPost[];
}

// Compact representation of a campaign for context
export interface CampaignFingerprint {
  _id?: ObjectId;
  brandProfileId: ObjectId;
  platform: string;
  campaignType: string;
  createdAt: Date;
  // Compact summary data
  keyThemes: string[]; // Top 5-10 themes/topics
  hooks: string[]; // Opening lines (first 50 chars)
  hashtags: string[]; // All hashtags used
  callToActions: string[]; // CTAs used
  // Metadata
  seasonGenerated: string;
  monthGenerated: number;
  yearGenerated: number;
  campaignNumber: number;
}

export interface Campaign {
  _id?: ObjectId;
  brandProfileId: ObjectId;
  createdAt: Date;
  platform: string;
  campaigns: CampaignType[];
  // Campaign metadata
  campaignNumber?: number;
  seasonGenerated?: string;
  monthGenerated?: number;
  yearGenerated?: number;
  // NEW: Auto-generated fingerprint for future reference
  fingerprint?: {
    keyThemes: string[];
    hooks: string[];
    hashtags: string[];
  };
}

export interface CampaignMetrics {
  _id?: ObjectId;
  campaignId: ObjectId;
  brandProfileId: ObjectId;
  platform: string;
  postId?: string; // Social media post ID
  // Metrics
  impressions: number;
  engagements: number;
  clicks: number;
  shares: number;
  comments: number;
  likes: number;
  // Calculated
  engagementRate: number;
  ctr: number; // Click-through rate
  // Timestamp
  recordedAt: Date;
  // Post details for reference
  postText?: string;
  hashtags?: string[];
}

export interface ScheduledPost {
  _id?: ObjectId;
  brandProfileId: ObjectId;
  campaignId: ObjectId;
  platform: string;
  content: string;
  hashtags: string[];
  imagePrompt?: string;
  scheduledFor: Date;
  posted: boolean;
  postId?: string;
  createdAt: Date;
}

export type Platform = 'linkedin' | 'twitter' | 'instagram' | 'facebook';
export type CampaignTypeEnum = 'product_launch' | 'thought_leadership' | 'engagement' | 'brand_awareness';