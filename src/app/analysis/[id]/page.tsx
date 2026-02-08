import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { WebsiteAnalysis } from '@/types';
import Link from 'next/link';

async function getAnalysis(id: string): Promise<WebsiteAnalysis | null> {
  try {
    const db = await getDb();
    const analysis = await db.collection<WebsiteAnalysis>('website_analyses').findOne({
      _id: new ObjectId(id)
    });
    return analysis;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const analysis = await getAnalysis(id);

  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="mb-4">Analysis Not Found</h1>
        <Link href="/" className="btn btn-primary inline-block">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="back-link">
          ← Back to Home
        </Link>
        <h1 className="mb-2">Website Analysis</h1>
        <a 
          href={analysis.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary"
        >
          {analysis.url}
        </a>
        <p className="text-tertiary text-sm mt-2">
          Analyzed: {new Date(analysis.analyzedAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Content Analysis */}
        <div className="card">
          <h2 className="text-gold mb-4">📝 Content</h2>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Title</h3>
            <p className="text-secondary">{analysis.content.title || 'N/A'}</p>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Meta Description</h3>
            <p className="text-secondary">{analysis.content.metaDescription || 'N/A'}</p>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Main Headings</h3>
            <ul className="list-disc text-secondary">
              {analysis.content.headings.slice(0, 5).map((heading, i) => (
                <li key={i}>{heading}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Key Phrases</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.content.keyPhrases.slice(0, 10).map((phrase, i) => (
                <span key={i} className="tag">
                  {phrase}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Analysis */}
        <div className="card">
          <h2 className="text-gold mb-4">🎨 Visual Identity</h2>
          <div className="mb-4">
            <h3 className="font-semibold mb-3">Primary Colors</h3>
            <div className="flex gap-2 flex-wrap">
              {analysis.visual.primaryColors.map((color, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div 
                    className="color-swatch"
                    style={{ backgroundColor: color }}
                  />
                  <span className="color-label">{color}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold mb-3">Secondary Colors</h3>
            <div className="flex gap-2 flex-wrap">
              {analysis.visual.secondaryColors.slice(0, 5).map((color, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div 
                    className="color-swatch color-swatch-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="color-label">{color}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Fonts Detected</h3>
            <ul className="list-disc text-secondary">
              {analysis.visual.fonts.slice(0, 5).map((font, i) => (
                <li key={i}>{font}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="card mb-8">
        <h2 className="text-gold mb-4">⚙️ Technical</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Domain</h3>
            <p className="text-secondary">{analysis.technical.domain}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">SSL</h3>
            <p className="text-secondary">
              {analysis.technical.hasSSL ? '✅ Enabled' : '❌ Disabled'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Load Time</h3>
            <p className="text-secondary">{(analysis.technical.loadTime / 1000).toFixed(2)}s</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Mobile Optimized</h3>
            <p className="text-secondary">
              {analysis.technical.mobileOptimized ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>
      </div>

      {/* Next Step */}
      <div className="card card-gradient">
        <h2 className="mb-4">Ready for the next step?</h2>
        <p className="mb-6 text-secondary">
          Generate a comprehensive brand DNA profile using AI analysis of this website's content, design, and messaging.
        </p>
        <Link 
          href={`/brand-dna/generate?analysisId=${id}`}
          className="btn btn-secondary inline-block"
        >
          Generate Brand DNA →
        </Link>
      </div>
    </div>
  );
}
