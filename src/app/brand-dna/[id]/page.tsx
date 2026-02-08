import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { BrandProfile } from '@/types';
import Link from 'next/link';

async function getBrandProfile(id: string): Promise<BrandProfile | null> {
  try {
    const db = await getDb();
    const profile = await db.collection<BrandProfile>('brand_profiles').findOne({
      _id: new ObjectId(id)
    });
    return profile;
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    return null;
  }
}

export default async function BrandDNAPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getBrandProfile(id);

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="mb-4">Brand Profile Not Found</h1>
        <Link href="/" className="btn btn-primary inline-block">
          Back to Home
        </Link>
      </div>
    );
  }

  const { brandDNA, confidence_score } = profile;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="back-link">
          ← Back to Home
        </Link>
        <div className="flex items-center justify-between mb-4">
          <h1>Brand DNA Profile</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary">Confidence Score:</span>
            <span className="text-2xl font-bold text-gold">{confidence_score}%</span>
          </div>
        </div>
        <a 
          href={profile.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary"
        >
          {profile.url}
        </a>
        <p className="text-tertiary text-sm mt-2">
          Generated: {new Date(profile.generatedAt).toLocaleString()}
        </p>
      </div>

      {/* Voice & Personality */}
      <div className="card mb-6">
        <h2 className="mb-4">
          <span className="text-gold">🎤</span> Voice & Personality
        </h2>
        <div className="mb-4">
          <h3 className="font-semibold text-primary mb-2">Tone</h3>
          <p className="text-secondary">{brandDNA.voice.tone}</p>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold text-primary mb-2">Personality Traits</h3>
          <div className="flex flex-wrap gap-2">
            {brandDNA.voice.personality.map((trait, i) => (
              <span key={i} className="tag">
                {trait}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-primary mb-2">Language Style</h3>
          <p className="text-secondary">{brandDNA.voice.language_style}</p>
        </div>
      </div>

      {/* Values & Positioning */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="mb-4">
            <span className="text-gold">💎</span> Core Values
          </h2>
          <ul className="list-disc">
            {brandDNA.values.map((value, i) => (
              <li key={i} className="text-secondary mb-2">{value}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="mb-4">
            <span className="text-gold">🎯</span> Positioning
          </h2>
          <div className="mb-3">
            <h3 className="font-semibold text-primary mb-1">Category</h3>
            <p className="text-secondary">{brandDNA.positioning.category}</p>
          </div>
          <div className="mb-3">
            <h3 className="font-semibold text-primary mb-1">Unique Value</h3>
            <p className="text-secondary">{brandDNA.positioning.unique_value}</p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Differentiation</h3>
            <p className="text-secondary">{brandDNA.positioning.competitors_differentiation}</p>
          </div>
        </div>
      </div>

      {/* Target Audience */}
      <div className="card mb-6">
        <h2 className="mb-4">
          <span className="text-gold">👥</span> Target Audience
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-primary mb-2">Demographics</h3>
            <p className="text-secondary">{brandDNA.target_audience.demographics}</p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-2">Psychographics</h3>
            <p className="text-secondary">{brandDNA.target_audience.psychographics}</p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-2">Pain Points</h3>
            <ul className="list-disc">
              {brandDNA.target_audience.pain_points.map((point, i) => (
                <li key={i} className="text-secondary text-sm mb-1">{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Visual Identity */}
      <div className="card mb-8">
        <h2 className="mb-4">
          <span className="text-gold">🎨</span> Visual Identity
        </h2>
        <div className="mb-4">
          <h3 className="font-semibold text-primary mb-2">Color Psychology</h3>
          <p className="text-secondary">{brandDNA.visual_identity.color_psychology}</p>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold text-primary mb-2">Design Style</h3>
          <p className="text-secondary">{brandDNA.visual_identity.design_style}</p>
        </div>
        <div>
          <h3 className="font-semibold text-primary mb-2">Imagery Themes</h3>
          <div className="flex flex-wrap gap-2">
            {brandDNA.visual_identity.imagery_themes.map((theme, i) => (
              <span key={i} className="tag">
                {theme}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Next Step - Generate Campaigns */}
      <div className="card card-gradient">
        <h2 className="mb-4">Ready to create campaigns?</h2>
        <p className="mb-6 text-secondary">
          Use this brand DNA profile to generate platform-specific social media campaigns that perfectly align with your brand identity.
        </p>
        <Link 
          href={`/campaigns/generate?brandProfileId=${id}`}
          className="btn btn-secondary inline-block"
        >
          Generate Campaigns →
        </Link>
      </div>
    </div>
  );
}
