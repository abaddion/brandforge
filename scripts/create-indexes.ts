// Load environment variables from .env.local BEFORE importing MongoDB
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
const envPath = resolve(process.cwd(), '.env.local');
const result = config({ path: envPath });

if (result.error) {
  console.error('❌ Error loading .env.local:', result.error);
  process.exit(1);
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  console.error('Please make sure MONGODB_URI is set in .env.local');
  process.exit(1);
}

console.log('✓ Environment variables loaded');

// Use dynamic import to ensure env vars are loaded first
async function createIndexes() {
  try {
    // Dynamically import after env vars are loaded
    const { getDb } = await import('../src/lib/mongodb');
    const db = await getDb();
    
    console.log('Creating indexes...');
    
    // Collection: website_analyses
    console.log('Creating indexes for website_analyses...');
    await db.collection('website_analyses').createIndex({ url: 1 });
    await db.collection('website_analyses').createIndex({ analyzedAt: -1 });
    console.log('✓ website_analyses indexes created');
    
    // Collection: brand_profiles
    console.log('Creating indexes for brand_profiles...');
    await db.collection('brand_profiles').createIndex({ analysisId: 1 });
    await db.collection('brand_profiles').createIndex({ url: 1 });
    console.log('✓ brand_profiles indexes created');
    
    // Collection: campaigns
    console.log('Creating indexes for campaigns...');
    await db.collection('campaigns').createIndex({ brandProfileId: 1 });
    console.log('✓ campaigns indexes created');
    
    console.log('\n✅ All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
}

// Run the async function
createIndexes().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
