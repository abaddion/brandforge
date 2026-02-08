import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { generateBrandDNA, validateBrandDNA } from '@/lib/brand-analyzer';
import { WebsiteAnalysis, BrandProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { analysisId } = await request.json();

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    console.log(`Generating brand DNA for analysis: ${analysisId}`);

    // Fetch the website analysis
    const db = await getDb();
    const analysis = await db.collection<WebsiteAnalysis>('website_analyses').findOne({
      _id: new ObjectId(analysisId)
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Check if brand DNA already exists for this analysis
    const existingProfile = await db.collection<BrandProfile>('brand_profiles').findOne({
      analysisId: new ObjectId(analysisId)
    });

    if (existingProfile) {
      console.log('Returning existing brand profile');
      return NextResponse.json({
        brandProfileId: existingProfile._id?.toString(),
        data: existingProfile,
        cached: true
      });
    }

    // Generate brand DNA using Gemini
    console.log('Calling Gemini API for brand DNA generation...');
    const result = await generateBrandDNA(analysis);

    // Validate the result
    if (!validateBrandDNA(result)) {
      throw new Error('Invalid brand DNA structure returned from AI');
    }

    // Create brand profile document
    const brandProfile: Omit<BrandProfile, '_id'> = {
      analysisId: new ObjectId(analysisId),
      url: analysis.url,
      generatedAt: new Date(),
      brandDNA: result.brandDNA,
      confidence_score: result.confidence_score
    };

    // Save to database
    const insertResult = await db.collection<BrandProfile>('brand_profiles').insertOne(brandProfile as any);

    console.log(`Brand DNA generated. ID: ${insertResult.insertedId}`);

    return NextResponse.json({
      brandProfileId: insertResult.insertedId.toString(),
      data: { ...brandProfile, _id: insertResult.insertedId },
      cached: false
    });

  } catch (error) {
    console.error('Brand DNA generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate brand DNA',
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
        { error: 'Brand profile ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const profile = await db.collection<BrandProfile>('brand_profiles').findOne({
      _id: new ObjectId(id)
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: profile });

  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand profile' },
      { status: 500 }
    );
  }
}