'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Campaign } from '@/types';

const PLATFORM_INFO: Record<string, { icon: string; name: string; color: string }> = {
  linkedin: { icon: '💼', name: 'LinkedIn', color: '#0077B5' },
  twitter: { icon: '🐦', name: 'Twitter/X', color: '#1DA1F2' },
  instagram: { icon: '📸', name: 'Instagram', color: '#E4405F' },
  facebook: { icon: '👥', name: 'Facebook', color: '#1877F2' },
};

const CAMPAIGN_TYPE_INFO: Record<string, { gradient: string }> = {
  product_launch: { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  thought_leadership: { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  engagement: { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  brand_awareness: { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
};

export default function CampaignsPage() {
  const params = useParams();
  const brandProfileId = params.brandProfileId as string;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (brandProfileId) {
      fetchCampaigns();
    }
  }, [brandProfileId]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`/api/generate-campaigns?brandProfileId=${brandProfileId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch campaigns');
      }

      setCampaigns(data.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center" style={{ paddingTop: '3rem' }}>
        <div className="spinner mx-auto mb-4" style={{ width: '4rem', height: '4rem' }}></div>
        <p className="text-secondary">Loading your campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="mb-4">Error Loading Campaigns</h1>
        <p className="text-error mb-8">{error}</p>
        <Link href={`/brand-dna/${brandProfileId}`} className="btn btn-primary inline-block">
          ← Back to Brand DNA
        </Link>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-6xl mb-6">📭</div>
        <h1 className="mb-4">No Campaigns Yet</h1>
        <p className="text-secondary mb-8">
          Generate your first campaign to get started with AI-powered social media content
        </p>
        <Link 
          href={`/campaigns/generate?brandProfileId=${brandProfileId}`}
          className="btn btn-primary inline-block"
        >
          Generate Your First Campaign →
        </Link>
      </div>
    );
  }

  // Calculate stats
  const totalPosts = campaigns.reduce((acc, campaign) => 
    acc + campaign.campaigns.reduce((sum, c) => sum + c.posts.length, 0), 0
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 fade-in">
        <Link href={`/brand-dna/${brandProfileId}`} className="back-link">
          ← Back to Brand DNA
        </Link>
        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="mb-2">Social Media Campaigns</h1>
            <p className="text-secondary">
              {totalPosts} AI-generated posts ready to publish across {campaigns.length} platform{campaigns.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href={`/analytics/${brandProfileId}`}
              className="btn btn-secondary"
            >
              📊 Analytics
            </Link>
            <Link 
              href={`/campaigns/generate?brandProfileId=${brandProfileId}`}
              className="btn btn-primary"
            >
              + Generate More
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8 fade-in" style={{ animationDelay: '0.1s' }}>
        {campaigns.slice(0, 4).map((campaign, idx) => {
          const platformInfo = PLATFORM_INFO[campaign.platform];
          const postCount = campaign.campaigns.reduce((sum, c) => sum + c.posts.length, 0);
          
          return (
            <div key={idx} className="stat-card">
              <div className="text-4xl mb-2">{platformInfo.icon}</div>
              <div className="stat-value" style={{ fontSize: '2rem' }}>{postCount}</div>
              <div className="stat-label">{platformInfo.name} Posts</div>
            </div>
          );
        })}
      </div>

      {/* Campaigns by Platform */}
      {campaigns.map((campaign, campaignIdx) => {
        const platformInfo = PLATFORM_INFO[campaign.platform];
        
        return (
          <div 
            key={campaign._id?.toString()} 
            className="mb-12 fade-in" 
            style={{ animationDelay: `${0.2 + campaignIdx * 0.1}s` }}
          >
            {/* Platform Header */}
            <div 
              className="card mb-6" 
              style={{ 
                borderColor: platformInfo.color,
                borderWidth: '2px'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{platformInfo.icon}</span>
                  <div>
                    <h2 className="mb-1">{platformInfo.name}</h2>
                    <p className="text-sm text-tertiary">
                      Campaign #{campaign.campaignNumber || 'N/A'} • 
                      {new Date(campaign.createdAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="stat-value" style={{ fontSize: '2rem' }}>
                    {campaign.campaigns.reduce((sum, c) => sum + c.posts.length, 0)}
                  </div>
                  <div className="stat-label">Total Posts</div>
                </div>
              </div>
            </div>

            {/* Campaign Types */}
            {campaign.campaigns.map((campaignType, typeIndex) => {
              const typeInfo = CAMPAIGN_TYPE_INFO[campaignType.type];
              
              return (
                <div key={typeIndex} className="mb-8">
                  <div 
                    className="inline-block px-4 py-2 rounded-lg mb-4"
                    style={{ 
                      background: typeInfo.gradient,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      fontSize: '1.125rem'
                    }}
                  >
                    {campaignType.type.replace('_', ' ')}
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {campaignType.posts.map((post, postIndex) => {
                      const postId = `${campaign._id}-${typeIndex}-${postIndex}`;
                      
                      return (
                        <div 
                          key={postIndex} 
                          className="card hover-lift"
                          style={{ padding: '1.5rem' }}
                        >
                          {/* Post Header */}
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-gold">
                              Post #{postIndex + 1}
                            </span>
                            <button
                              onClick={() => copyToClipboard(post.text, postId)}
                              className="text-xs px-3 py-1 rounded-full transition"
                              style={{
                                background: copiedId === postId 
                                  ? 'rgba(34, 197, 94, 0.2)' 
                                  : 'rgba(251, 191, 36, 0.1)',
                                color: copiedId === postId 
                                  ? 'var(--success)' 
                                  : 'var(--accent-gold)',
                                border: '1px solid',
                                borderColor: copiedId === postId
                                  ? 'var(--success)'
                                  : 'var(--accent-gold)'
                              }}
                            >
                              {copiedId === postId ? '✓ Copied!' : 'Copy Text'}
                            </button>
                          </div>

                          {/* Post Content */}
                          <div className="mb-4">
                            <p className="text-secondary whitespace-pre-wrap mb-3" style={{ lineHeight: '1.6' }}>
                              {post.text}
                            </p>
                            
                            {/* Hashtags */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {post.hashtags.map((tag, i) => (
                                <span 
                                  key={i} 
                                  className="text-sm"
                                  style={{ color: platformInfo.color }}
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="border-t pt-4 text-sm" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <div className="mb-3">
                              <div className="text-tertiary mb-1">📸 Visual Concept</div>
                              <p className="text-secondary text-xs">{post.imagePrompt}</p>
                            </div>
                            <div className="mb-3">
                              <div className="text-tertiary mb-1">🎯 Call-to-Action</div>
                              <p className="text-secondary text-xs">{post.callToAction}</p>
                            </div>
                            <div>
                              <div className="text-tertiary mb-1">⏰ Best Time</div>
                              <p className="text-secondary text-xs">{post.bestTimeToPost}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <button 
                              onClick={() => copyToClipboard(
                                `${post.text}\n\n${post.hashtags.map(t => `#${t}`).join(' ')}`,
                                `${postId}-full`
                              )}
                              className="btn btn-secondary btn-full text-sm"
                              style={{ padding: '0.5rem' }}
                            >
                              {copiedId === `${postId}-full` ? '✓ Copied with Hashtags!' : 'Copy with Hashtags'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Generate More CTA */}
      <div className="card card-gradient text-center fade-in">
        <h2 className="mb-4">Need More Content?</h2>
        <p className="text-secondary mb-6 max-w-2xl mx-auto">
          Generate fresh campaigns for different platforms or campaign types. Our AI ensures each campaign is unique and optimized for maximum engagement.
        </p>
        <Link 
          href={`/campaigns/generate?brandProfileId=${brandProfileId}`}
          className="btn btn-secondary inline-block"
        >
          Generate New Campaign →
        </Link>
      </div>
    </div>
  );
}
