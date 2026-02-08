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
        <h1 className="text-5xl font-bold mb-4">
          Forge Your Brand Identity
        </h1>
        <p className="text-xl text-gray-400">
          Analyze any website and generate comprehensive brand DNA profiles with AI-powered social campaigns
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              Website URL
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="input-field"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
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
                Analyzing Website...
              </span>
            ) : (
              'Analyze Website'
            )}
          </button>
        </form>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">Deep Analysis</h3>
          <p className="text-gray-400">
            Scrape and analyze website content, design, and messaging
          </p>
        </div>
        <div className="card">
          <div className="text-4xl mb-4">🧬</div>
          <h3 className="text-xl font-semibold mb-2">Brand DNA</h3>
          <p className="text-gray-400">
            AI-powered brand identity extraction and profiling
          </p>
        </div>
        <div className="card">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold mb-2">Campaigns</h3>
          <p className="text-gray-400">
            Generate platform-specific social media campaigns
          </p>
        </div>
      </div>
    </div>
  );
}