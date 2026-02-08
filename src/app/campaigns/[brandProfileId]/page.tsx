'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Campaign, CampaignPost } from '@/types';

const PLATFORM_INFO: Record<string, { icon: string; name: string }> = {
  linkedin: { icon: '💼', name: 'LinkedIn' },
  twitter: { icon: '🐦', name: 'Twitter/X' },
  instagram: { icon: '📸', name: 'Instagram' },
  facebook: { icon: '👥', name: 'Facebook' },
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
      setLoading(true);
      setError('');
      const response = await fetch(`/api/generate-campaigns?brandProfileId=${brandProfileId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch campaigns');
      }

      setCampaigns(data.campaigns || []);
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
      <div className="max-w-6xl mx-auto text-center" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-secondary">Loading campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="mb-4">Error Loading Campaigns</h1>
        <p className="text-error mb-6">{error}</p>
        <Link href={`/brand-dna/${brandProfileId}`} className="btn btn-primary inline-block">
          Back to Brand DNA
        </Link>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-6xl mb-4">📭</div>
        <h1 className="mb-4">No Campaigns Yet</h1>
        <p className="text-secondary mb-6">Generate your first campaign to get started</p>
        <Link 
          href={`/campaigns/generate?brandProfileId=${brandProfileId}`}
          className="btn btn-primary inline-block"
        >
          Generate Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/brand-dna/${brandProfileId}`} className="back-link">
          ← Back to Brand DNA
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2">Social Media Campaigns</h1>
            <p className="text-secondary">AI-generated content ready to publish</p>
          </div>
          <Link 
            href={`/campaigns/generate?brandProfileId=${brandProfileId}`}
            className="btn btn-primary"
          >
            + Generate More
          </Link>
        </div>
      </div>

      {/* Campaigns by Platform */}
      {campaigns.map((campaign) => {
        const platformInfo = PLATFORM_INFO[campaign.platform];
        
        return (
          <div key={campaign._id?.toString()} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{platformInfo.icon}</span>
              <h2>{platformInfo.name}</h2>
            </div>

            {campaign.campaigns.map((campaignType, typeIndex) => (
              <div key={typeIndex} className="mb-6">
                <h3 className="text-xl font-semibold mb-4 text-gold" style={{ textTransform: 'capitalize' }}>
                  {campaignType.type.replace('_', ' ')}
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  {campaignType.posts.map((post, postIndex) => {
                    const postId = `${campaign._id}-${typeIndex}-${postIndex}`;
                    
                    return (
                      <div key={postIndex} className="card hover-border">
                        {/* Post Text */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-secondary">
                              Post {postIndex + 1}
                            </span>
                            <button
                              onClick={() => copyToClipboard(post.text, postId)}
                              className="text-xs text-gold"
                              style={{ cursor: 'pointer' }}
                            >
                              {copiedId === postId ? '✓ Copied!' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-secondary whitespace-pre-wrap mb-3">
                            {post.text}
                          </p>
                          
                          {/* Hashtags */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.hashtags.map((tag, i) => (
                              <span key={i} className="text-sm text-primary">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="border-t pt-4 text-sm">
                          <div className="mb-2">
                            <span className="text-tertiary">📸 Image:</span>
                            <p className="text-secondary mt-1">{post.imagePrompt}</p>
                          </div>
                          <div className="mb-2">
                            <span className="text-tertiary">👆 CTA:</span>
                            <p className="text-secondary mt-1">{post.callToAction}</p>
                          </div>
                          <div>
                            <span className="text-tertiary">⏰ Best time:</span>
                            <p className="text-secondary mt-1">{post.bestTimeToPost}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-4 border-t">
                          <button 
                            onClick={() => copyToClipboard(
                              `${post.text}\n\n${post.hashtags.map(t => `#${t}`).join(' ')}`,
                              `${postId}-full`
                            )}
                            className="btn btn-secondary btn-full text-sm py-2"
                          >
                            {copiedId === `${postId}-full` ? '✓ Copied!' : 'Copy with Hashtags'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
