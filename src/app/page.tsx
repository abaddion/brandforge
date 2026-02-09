'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze website');
      }

      // Redirect to analysis page
      router.push(`/analysis/${data.analysisId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 fade-in">
        <h1 className="hero-title">
          Forge Your Brand Identity
        </h1>
        <p className="hero-subtitle">
          Analyze any website and generate comprehensive brand DNA profiles with AI-powered social campaigns
        </p>
      </div>

      {/* Main Input Card */}
      <div className="card max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="url">Enter Website URL</label>
            <input
              type="url"
              id="url"
              name="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="spinner spinner-sm"></div>
                Analyzing Website...
              </span>
            ) : (
              'Analyze Website →'
            )}
          </button>
        </form>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="feature-card fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="feature-icon">🔍</div>
          <h3 className="mb-3">Deep Analysis</h3>
          <p className="text-secondary text-sm">
            Advanced web scraping to extract content, design patterns, and brand messaging
          </p>
        </div>
        
        <div className="feature-card fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="feature-icon">🧬</div>
          <h3 className="mb-3">Brand DNA</h3>
          <p className="text-secondary text-sm">
            AI-powered identity extraction revealing voice, values, and positioning
          </p>
        </div>
        
        <div className="feature-card fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="feature-icon">🚀</div>
          <h3 className="mb-3">Smart Campaigns</h3>
          <p className="text-secondary text-sm">
            Platform-optimized social content that matches your unique brand identity
          </p>
        </div>
      </div>
    </div>
  );
}