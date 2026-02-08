'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Campaign, CampaignPost } from '@/types';

const PLATFORM_INFO: Record<string, { icon: string; color: string; name: string }> = {
  linkedin: { icon: '💼', color: '#0077B5', name: 'LinkedIn' },
  twitter: { icon: '🐦', color: '#1DA1F2', name: 'Twitter/X' },
  instagram: { icon: '📸', color: '#E4405F', name: 'Instagram' },
  facebook: { icon: '👥', color: '#1877F2', name: 'Facebook' },
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
      <div className="max-w-6xl mx-auto text-center py-12">
        <div className="animate-spin h-12 w-12 border-4 border-accent-gold border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Loading campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-3xl font-bold mb-4">Error Loading Campaigns</h1>
        <p className="text-red-400 mb-6">{error}</p>
        <Link href={`/brand-dna/${brandProfileId}`} className="btn-primary inline-block">
          Back to Brand DNA
        </Link>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-6xl mb-4">📭</div>
        <h1 className="text-3xl font-bold mb-4">No Campaigns Yet</h1>
        <p className="text-gray-400 mb-6">Generate your first campaign to get started</p>
        <Link 
          href={`/campaigns/generate?brandProfileId=${brandProfileId}`}
          className="btn-primary inline-block"
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
        <Link href={`/brand-dna/${brandProfileId}`} className="text-accent-gold hover:underline mb-4 inline-block">
          ← Back to Brand DNA
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Social Media Campaigns</h1>
            <p className="text-gray-400">AI-generated content ready to publish</p>
          </div>
          <Link 
            href={`/campaigns/generate?brandProfileId=${brandProfileId}`}
            className="btn-primary"
          >
            + Generate More
          </Link>
        </div>
      </div>

      {/* Campaigns by Platform */}
      {campaigns.map((campaign) => {
        const platformInfo = PLATFORM_INFO[campaign.platform] || {
          icon: '📱',
          color: '#666',
          name: campaign.platform.charAt(0).toUpperCase() + campaign.platform.slice(1)
        };
        
        return (
          <div key={campaign._id?.toString()} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{platformInfo.icon}</span>
              <h2 className="text-3xl font-bold">{platformInfo.name}</h2>
            </div>

            {campaign.campaigns.map((campaignType, typeIndex) => (
              <div key={typeIndex} className="mb-6">
                <h3 className="text-xl font-semibold mb-4 text-accent-gold capitalize">
                  {campaignType.type.replace(/_/g, ' ')}
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {campaignType.posts.map((post, postIndex) => {
                    const postId = `${campaign._id}-${typeIndex}-${postIndex}`;
                    
                    return (
                      <div key={postIndex} className="card hover:border-primary transition-colors">
                        {/* Post Text */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-400">
                              Post {postIndex + 1}
                            </span>
                            <button
                              onClick={() => copyToClipboard(post.text, postId)}
                              className="text-xs text-accent-gold hover:underline"
                            >
                              {copiedId === postId ? '✓ Copied!' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-gray-300 whitespace-pre-wrap mb-3">
                            {post.text}
                          </p>
                          
                          {/* Hashtags */}
                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {post.hashtags.map((tag, i) => (
                                <span key={i} className="text-sm text-primary">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="border-t border-dark-border pt-4 space-y-2 text-sm">
                          {post.imagePrompt && (
                            <div>
                              <span className="text-gray-500">📸 Image:</span>
                              <p className="text-gray-400 mt-1">{post.imagePrompt}</p>
                            </div>
                          )}
                          {post.callToAction && (
                            <div>
                              <span className="text-gray-500">👆 CTA:</span>
                              <p className="text-gray-400 mt-1">{post.callToAction}</p>
                            </div>
                          )}
                          {post.bestTimeToPost && (
                            <div>
                              <span className="text-gray-500">⏰ Best time:</span>
                              <p className="text-gray-400 mt-1">{post.bestTimeToPost}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-4 border-t border-dark-border">
                          <button 
                            onClick={() => copyToClipboard(
                              `${post.text}\n\n${post.hashtags?.map(t => `#${t}`).join(' ') || ''}`,
                              `${postId}-full`
                            )}
                            className="btn-secondary w-full text-sm py-2"
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
