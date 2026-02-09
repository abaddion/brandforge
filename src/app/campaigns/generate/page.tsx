'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const PLATFORMS = [
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: '💼', 
    description: 'Professional networking',
    color: '#0077B5'
  },
  { 
    id: 'twitter', 
    name: 'Twitter/X', 
    icon: '🐦', 
    description: 'Quick, engaging updates',
    color: '#1DA1F2'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: '📸', 
    description: 'Visual storytelling',
    color: '#E4405F'
  },
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: '👥', 
    description: 'Community building',
    color: '#1877F2'
  },
];

const CAMPAIGN_TYPES = [
  { 
    id: 'product_launch', 
    name: 'Product Launch', 
    icon: '🚀', 
    description: 'Announce new features or products',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  { 
    id: 'thought_leadership', 
    name: 'Thought Leadership', 
    icon: '💡', 
    description: 'Share insights and expertise',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  { 
    id: 'engagement', 
    name: 'Engagement', 
    icon: '💬', 
    description: 'Start conversations',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  { 
    id: 'brand_awareness', 
    name: 'Brand Awareness', 
    icon: '🎯', 
    description: 'Introduce your brand',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
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

      router.push(`/campaigns/${brandProfileId}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12 fade-in">
        <h1 className="mb-4">Generate Social Campaigns</h1>
        <p className="hero-subtitle">
          Select platforms and campaign types to generate AI-powered social media content
        </p>
      </div>

      {/* Platform Selection */}
      <div className="card mb-8 fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2>Select Platforms</h2>
          <span className="text-sm text-secondary">
            {selectedPlatforms.length} selected
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {PLATFORMS.map(platform => (
            <button
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`platform-card relative ${selectedPlatforms.includes(platform.id) ? 'selected' : ''}`}
              style={{
                borderColor: selectedPlatforms.includes(platform.id) 
                  ? platform.color 
                  : undefined,
                borderWidth: selectedPlatforms.includes(platform.id) ? '2px' : undefined
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="platform-icon">{platform.icon}</span>
                <div className="text-left">
                  <h3 className="text-xl font-bold mb-1">{platform.name}</h3>
                  <p className="text-sm text-secondary">{platform.description}</p>
                </div>
              </div>
              {selectedPlatforms.includes(platform.id) && (
                <div 
                  className="absolute top-3 right-3 text-2xl"
                  style={{ color: platform.color }}
                >
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Type Selection */}
      <div className="card mb-8 fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2>Select Campaign Types</h2>
          <span className="text-sm text-secondary">
            {selectedTypes.length} selected
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {CAMPAIGN_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => toggleType(type.id)}
              className={`platform-card relative ${selectedTypes.includes(type.id) ? 'selected' : ''}`}
              style={{
                background: selectedTypes.includes(type.id) 
                  ? type.gradient 
                  : undefined,
                borderColor: selectedTypes.includes(type.id)
                  ? 'transparent'
                  : undefined,
                color: selectedTypes.includes(type.id) ? '#fff' : undefined
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="platform-icon">{type.icon}</span>
                <div className="text-left">
                  <h3 className="text-xl font-bold mb-1">{type.name}</h3>
                  <p className="text-sm text-secondary" style={{
                    color: selectedTypes.includes(type.id) ? 'rgba(255,255,255,0.9)' : undefined
                  }}>
                    {type.description}
                  </p>
                </div>
              </div>
              {selectedTypes.includes(type.id) && (
                <div className="absolute top-3 right-3 text-2xl">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error mb-6 fade-in">
          {error}
        </div>
      )}

      {/* Generate Button */}
      <div className="fade-in" style={{ animationDelay: '0.3s' }}>
        <button
          onClick={handleGenerate}
          disabled={loading || selectedPlatforms.length === 0 || selectedTypes.length === 0}
          className="btn btn-primary btn-full btn-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <div className="spinner spinner-sm"></div>
              Generating Campaigns...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Generate {selectedPlatforms.length * selectedTypes.length * 3} Posts
              <span className="text-sm opacity-75">
                ({selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} × {selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''})
              </span>
            </span>
          )}
        </button>
        
        <p className="text-center text-sm text-tertiary mt-4">
          AI will generate 3 unique posts per campaign type for each platform
        </p>
      </div>
    </div>
  );
}

export default function GenerateCampaignsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto">
        <div className="card text-center">
          <div className="spinner-container">
            <div className="spinner spinner-lg"></div>
          </div>
          <h1>Loading...</h1>
        </div>
      </div>
    }>
      <GenerateCampaignsContent />
    </Suspense>
  );
}
