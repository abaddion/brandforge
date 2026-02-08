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

export interface Campaign {
  _id?: ObjectId;
  brandProfileId: ObjectId;
  createdAt: Date;
  platform: string;
  campaigns: CampaignType[];
}

export type Platform = 'linkedin' | 'twitter' | 'instagram' | 'facebook';
export type CampaignTypeEnum = 'product_launch' | 'thought_leadership' | 'engagement' | 'brand_awareness';