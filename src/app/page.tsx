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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1>Forge Your Brand Identity</h1>
        <p className="text-xl text-secondary">
          Analyze any website and generate comprehensive brand DNA profiles with AI-powered social campaigns
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="url">Website URL</label>
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
              <span className="flex items-center justify-center gap-2">
                <div className="spinner spinner-sm"></div>
                Analyzing Website...
              </span>
            ) : (
              'Analyze Website'
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-12">
        <div className="card">
          <div className="text-6xl mb-4">🔍</div>
          <h3>Deep Analysis</h3>
          <p className="text-secondary">
            Scrape and analyze website content, design, and messaging
          </p>
        </div>
        <div className="card">
          <div className="text-6xl mb-4">🧬</div>
          <h3>Brand DNA</h3>
          <p className="text-secondary">
            AI-powered brand identity extraction and profiling
          </p>
        </div>
        <div className="card">
          <div className="text-6xl mb-4">🚀</div>
          <h3>Campaigns</h3>
          <p className="text-secondary">
            Generate platform-specific social media campaigns
          </p>
        </div>
      </div>
    </div>
  );
}