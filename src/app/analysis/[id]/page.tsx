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
        <h1 className="text-3xl font-bold mb-4">Analysis Not Found</h1>
        <Link href="/" className="btn-primary inline-block">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-accent-gold hover:underline mb-4 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold mb-2">Website Analysis</h1>
        <a 
          href={analysis.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {analysis.url}
        </a>
        <p className="text-gray-400 text-sm mt-2">
          Analyzed: {new Date(analysis.analyzedAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Content Analysis */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4 text-accent-gold">📝 Content</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Title</h3>
              <p className="text-gray-300">{analysis.content.title || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Meta Description</h3>
              <p className="text-gray-300">{analysis.content.metaDescription || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Main Headings</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {analysis.content.headings.slice(0, 5).map((heading, i) => (
                  <li key={i}>{heading}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Key Phrases</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.content.keyPhrases.slice(0, 10).map((phrase, i) => (
                  <span key={i} className="bg-primary/20 px-3 py-1 rounded-full text-sm">
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Analysis */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4 text-accent-gold">🎨 Visual Identity</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Primary Colors</h3>
              <div className="flex gap-2 flex-wrap">
                {analysis.visual.primaryColors.map((color, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div 
                      className="w-16 h-16 rounded-lg border border-dark-border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs mt-1 text-gray-400">{color}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Secondary Colors</h3>
              <div className="flex gap-2 flex-wrap">
                {analysis.visual.secondaryColors.slice(0, 5).map((color, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div 
                      className="w-12 h-12 rounded-lg border border-dark-border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs mt-1 text-gray-400">{color}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Fonts Detected</h3>
              <ul className="list-disc list-inside text-gray-300">
                {analysis.visual.fonts.slice(0, 5).map((font, i) => (
                  <li key={i}>{font}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4 text-accent-gold">⚙️ Technical</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h3 className="font-semibold mb-1">Domain</h3>
            <p className="text-gray-300">{analysis.technical.domain}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">SSL</h3>
            <p className="text-gray-300">
              {analysis.technical.hasSSL ? '✅ Enabled' : '❌ Disabled'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Load Time</h3>
            <p className="text-gray-300">{(analysis.technical.loadTime / 1000).toFixed(2)}s</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Mobile Optimized</h3>
            <p className="text-gray-300">
              {analysis.technical.mobileOptimized ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>
      </div>

      {/* Next Step */}
      <div className="card bg-gradient-primary">
        <h2 className="text-2xl font-bold mb-4">Ready for the next step?</h2>
        <p className="mb-6 text-gray-200">
          Generate a comprehensive brand DNA profile using AI analysis of this website's content, design, and messaging.
        </p>
        <Link 
          href={`/brand-dna/generate?analysisId=${id}`}
          className="btn-secondary inline-block"
        >
          Generate Brand DNA →
        </Link>
      </div>
    </div>
  );
}
