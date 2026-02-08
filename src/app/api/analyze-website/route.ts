import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getScraper } from '@/lib/scraper';
import { WebsiteAnalysis } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format. Must start with http:// or https://' },
        { status: 400 }
      );
    }

    console.log(`Starting analysis for: ${url}`);

    // Check if we already analyzed this URL recently (within last 24 hours)
    const db = await getDb();
    const existingAnalysis = await db.collection<WebsiteAnalysis>('website_analyses').findOne({
      url: parsedUrl.href,
      analyzedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (existingAnalysis) {
      console.log('Returning cached analysis');
      return NextResponse.json({
        analysisId: existingAnalysis._id?.toString(),
        data: existingAnalysis,
        cached: true
      });
    }

    // Scrape the website
    const scraper = await getScraper();
    const scrapedData = await scraper.scrape(parsedUrl.href);

    // Create analysis document
    const analysis: Omit<WebsiteAnalysis, '_id'> = {
      url: parsedUrl.href,
      analyzedAt: new Date(),
      ...scrapedData
    };

    // Save to database
    const result = await db.collection<WebsiteAnalysis>('website_analyses').insertOne(analysis as any);

    console.log(`Analysis complete. ID: ${result.insertedId}`);

    return NextResponse.json({
      analysisId: result.insertedId.toString(),
      data: { ...analysis, _id: result.insertedId },
      cached: false
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze website',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const { ObjectId } = await import('mongodb');
    
    const analysis = await db.collection<WebsiteAnalysis>('website_analyses').findOne({
      _id: new ObjectId(id)
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: analysis });

  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}