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
              <div className="spinner" style={{ width: '4rem', height: '4rem', borderColor: 'rgba(255,215,0,0.2)', borderTopColor: 'var(--accent-gold)' }}></div>
            </div>
            <h1 className="mb-4">Generating Brand DNA</h1>
            <p className="text-secondary mb-6">
              Our AI is analyzing the website data to create a comprehensive brand profile...
            </p>
            <div className="text-left max-w-md mx-auto text-sm text-tertiary">
              <p className="mb-2">✓ Analyzing content and messaging</p>
              <p className="mb-2">✓ Evaluating visual identity</p>
              <p className="mb-2">✓ Identifying target audience</p>
              <p className="mb-2">✓ Determining brand positioning</p>
              <p style={{ animation: 'pulse 2s infinite' }}>🔄 Generating insights...</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="mb-4">Brand DNA Generated!</h1>
            <p className="text-secondary">Redirecting to your brand profile...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="mb-4">Generation Failed</h1>
            <p className="text-error mb-6">{error}</p>
            <button 
              onClick={() => router.back()}
              className="btn btn-primary"
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
          <div className="spinner-container">
            <div className="spinner spinner-lg"></div>
          </div>
          <h1>Loading...</h1>
        </div>
      </div>
    }>
      <GenerateBrandDNAContent />
    </Suspense>
  );
}