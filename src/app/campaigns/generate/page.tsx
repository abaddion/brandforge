'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', description: 'Professional networking' },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', description: 'Quick, engaging updates' },
  { id: 'instagram', name: 'Instagram', icon: '📸', description: 'Visual storytelling' },
  { id: 'facebook', name: 'Facebook', icon: '👥', description: 'Community building' },
];

const CAMPAIGN_TYPES = [
  { id: 'product_launch', name: 'Product Launch', icon: '🚀', description: 'Announce new features or products' },
  { id: 'thought_leadership', name: 'Thought Leadership', icon: '💡', description: 'Share insights and expertise' },
  { id: 'engagement', name: 'Engagement', icon: '💬', description: 'Start conversations and build community' },
  { id: 'brand_awareness', name: 'Brand Awareness', icon: '🎯', description: 'Introduce your brand and values' },
];

function GenerateCampaignsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandProfileId = searchParams.get('brandProfileId');

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin']);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['thought_leadership']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const handleGenerate = async () => {
    if (selectedPlatforms.length === 0 || selectedTypes.length === 0) {
      setError('Please select at least one platform and one campaign type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandProfileId,
          platforms: selectedPlatforms,
          campaignTypes: selectedTypes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate campaigns');
      }

      // Redirect to campaigns view
      router.push(`/campaigns/${brandProfileId}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Generate Social Campaigns</h1>
        <p className="text-gray-400">
          Select platforms and campaign types to generate AI-powered social media content
        </p>
      </div>

      {/* Platform Selection */}
      <div className="card mb-6">
        <h2 className="text-2xl font-bold mb-4">Select Platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map(platform => (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedPlatforms.includes(platform.id)
                  ? 'border-accent-gold bg-accent-gold/10'
                  : 'border-dark-border hover:border-primary'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{platform.icon}</span>
                <h3 className="text-xl font-semibold">{platform.name}</h3>
              </div>
              <p className="text-sm text-gray-400">{platform.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Type Selection */}
      <div className="card mb-6">
        <h2 className="text-2xl font-bold mb-4">Select Campaign Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAMPAIGN_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => toggleType(type.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTypes.includes(type.id)
                  ? 'border-accent-gold bg-accent-gold/10'
                  : 'border-dark-border hover:border-primary'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{type.icon}</span>
                <h3 className="text-xl font-semibold">{type.name}</h3>
              </div>
              <p className="text-sm text-gray-400">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || selectedPlatforms.length === 0 || selectedTypes.length === 0}
        className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating Campaigns...
          </span>
        ) : (
          `Generate Campaigns (${selectedPlatforms.length} platform${selectedPlatforms.length !== 1 ? 's' : ''}, ${selectedTypes.length} type${selectedTypes.length !== 1 ? 's' : ''})`
        )}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        This will generate 3 posts per campaign type for each selected platform
      </p>
    </div>
  );
}

export default function GenerateCampaignsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto">
        <div className="card text-center">
          <div className="flex justify-center mb-6">
            <svg className="animate-spin h-12 w-12 text-accent-gold" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <GenerateCampaignsContent />
    </Suspense>
  );
}