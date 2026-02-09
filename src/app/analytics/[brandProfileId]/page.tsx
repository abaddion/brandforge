import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { CampaignMetrics } from '@/types';
import Link from 'next/link';

async function getMetrics(brandProfileId: string) {
  try {
    const db = await getDb();
    return await db.collection<CampaignMetrics>('campaign_metrics')
      .find({ brandProfileId: new ObjectId(brandProfileId) })
      .sort({ recordedAt: -1 })
      .limit(100)
      .toArray();
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return [];
  }
}

export default async function AnalyticsPage({ params }: { params: Promise<{ brandProfileId: string }> }) {
  const { brandProfileId } = await params;
  const metrics = await getMetrics(brandProfileId);
  
  // Calculate totals
  const totals = metrics.reduce((acc, m) => ({
    impressions: acc.impressions + m.impressions,
    engagements: acc.engagements + m.engagements,
    clicks: acc.clicks + m.clicks,
    shares: acc.shares + m.shares,
    comments: acc.comments + m.comments,
    likes: acc.likes + m.likes,
  }), { 
    impressions: 0, 
    engagements: 0, 
    clicks: 0,
    shares: 0,
    comments: 0,
    likes: 0,
  });

  const engagementRate = totals.impressions > 0 
    ? ((totals.engagements / totals.impressions) * 100).toFixed(1)
    : '0.0';
  
  const ctr = totals.impressions > 0
    ? ((totals.clicks / totals.impressions) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/campaigns/${brandProfileId}`} className="back-link">
          ← Back to Campaigns
        </Link>
        <h1 className="mb-2">Campaign Analytics</h1>
        <p className="text-secondary">
          Track performance metrics for your social media campaigns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="stat-value">{totals.impressions.toLocaleString()}</div>
          <div className="stat-label">Total Impressions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.engagements.toLocaleString()}</div>
          <div className="stat-label">Total Engagements</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.clicks.toLocaleString()}</div>
          <div className="stat-label">Total Clicks</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{engagementRate}%</div>
          <div className="stat-label">Engagement Rate</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="stat-value">{totals.likes.toLocaleString()}</div>
          <div className="stat-label">Total Likes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.comments.toLocaleString()}</div>
          <div className="stat-label">Total Comments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{ctr}%</div>
          <div className="stat-label">Click-Through Rate</div>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="card">
        <h2 className="mb-4">Recent Campaign Performance</h2>
        
        {metrics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary mb-4">No metrics recorded yet</p>
            <p className="text-tertiary text-sm">
              Metrics will appear here once you start posting campaigns to social media platforms
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Platform</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Impressions</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Engagements</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Clicks</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Engagement Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Date</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric._id?.toString()} className="border-b border-dark-border hover:bg-dark-card-hover transition">
                    <td className="py-3 px-4 text-sm capitalize">{metric.platform}</td>
                    <td className="py-3 px-4 text-sm">{metric.impressions.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm">{metric.engagements.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm">{metric.clicks.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm">{metric.engagementRate.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-sm text-tertiary">
                      {new Date(metric.recordedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="card card-gradient mt-8">
        <h2 className="mb-4">📊 Analytics Features</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2 text-gold">Current Features</h3>
            <ul className="list-disc text-secondary space-y-1">
              <li>Impression tracking</li>
              <li>Engagement metrics</li>
              <li>Click-through rates</li>
              <li>Platform-specific analytics</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gold">Coming Soon</h3>
            <ul className="list-disc text-secondary space-y-1">
              <li>Real-time API integration</li>
              <li>Visual charts and graphs</li>
              <li>A/B testing results</li>
              <li>ROI calculations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
