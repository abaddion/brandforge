'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function GenerateBrandDNAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');
  
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!analysisId) {
      setStatus('error');
      setError('No analysis ID provided');
      return;
    }

    generateBrandDNA();
  }, [analysisId]);

  const generateBrandDNA = async () => {
    try {
      setStatus('loading');
      
      const response = await fetch('/api/generate-brand-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate brand DNA');
      }

      setStatus('success');
      
      // Redirect to brand DNA page after a brief delay
      setTimeout(() => {
        router.push(`/brand-dna/${data.brandProfileId}`);
      }, 1500);

    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="card">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <svg className="animate-spin h-16 w-16 text-accent-gold" viewBox="0 0 24 24">
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
            <h1 className="text-3xl font-bold mb-4">Generating Brand DNA</h1>
            <p className="text-gray-400 mb-4">
              Our AI is analyzing the website data to create a comprehensive brand profile...
            </p>
            <div className="space-y-2 text-left max-w-md mx-auto text-sm text-gray-500">
              <p>✓ Analyzing content and messaging</p>
              <p>✓ Evaluating visual identity</p>
              <p>✓ Identifying target audience</p>
              <p>✓ Determining brand positioning</p>
              <p className="animate-pulse">🔄 Generating insights...</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-4">Brand DNA Generated!</h1>
            <p className="text-gray-400">Redirecting to your brand profile...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold mb-4">Generation Failed</h1>
            <p className="text-red-400 mb-6">{error}</p>
            <button 
              onClick={() => router.back()}
              className="btn-primary"
            >
              Go Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function GenerateBrandDNAPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto text-center">
        <div className="card">
          <div className="flex justify-center mb-6">
            <svg className="animate-spin h-16 w-16 text-accent-gold" viewBox="0 0 24 24">
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
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <GenerateBrandDNAContent />
    </Suspense>
  );
}