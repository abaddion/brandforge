# Creating MongoDB Indexes

You have several options to create the indexes. Choose the method that works best for you:

## Option 1: Using the Script (Recommended)

1. First, install `tsx` to run TypeScript files:
   ```bash
   npm install --save-dev tsx
   ```

2. Make sure your `.env.local` file has your `MONGODB_URI` set correctly.

3. Run the script:
   ```bash
   npm run create-indexes
   ```

This will automatically create all the required indexes.

## Option 2: Using MongoDB Atlas UI (Easiest - No Code)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and log in
2. Select your cluster
3. Click on "Browse Collections" 
4. Select the `brandforge` database
5. For each collection, click on it, then:
   - Click the "Indexes" tab
   - Click "Create Index"
   - Add the index fields as shown below:

### For `website_analyses` collection:
- Index 1: Field: `url`, Type: `1` (Ascending)
- Index 2: Field: `analyzedAt`, Type: `-1` (Descending)

### For `brand_profiles` collection:
- Index 1: Field: `analysisId`, Type: `1` (Ascending)
- Index 2: Field: `url`, Type: `1` (Ascending)

### For `campaigns` collection:
- Index 1: Field: `brandProfileId`, Type: `1` (Ascending)

## Option 3: Using MongoDB Compass

1. Download and install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using your MongoDB connection string from `.env.local`
3. Navigate to the `brandforge` database
4. For each collection, click on it, go to the "Indexes" tab, and create the indexes manually

## Option 4: Using MongoDB Shell (mongosh)

If you have `mongosh` installed:

1. Connect to your cluster:
   ```bash
   mongosh "your-mongodb-connection-string"
   ```

2. Switch to your database:
   ```javascript
   use brandforge
   ```

3. Run these commands:
   ```javascript
   // Collection: website_analyses
   db.website_analyses.createIndex({ "url": 1 })
   db.website_analyses.createIndex({ "analyzedAt": -1 })

   // Collection: brand_profiles
   db.brand_profiles.createIndex({ "analysisId": 1 })
   db.brand_profiles.createIndex({ "url": 1 })

   // Collection: campaigns
   db.campaigns.createIndex({ "brandProfileId": 1 })
   ```

## What These Indexes Do

- **`url` index on website_analyses**: Speeds up lookups by URL
- **`analyzedAt` index on website_analyses**: Speeds up sorting by analysis date (newest first)
- **`analysisId` index on brand_profiles**: Speeds up finding profiles by analysis ID
- **`url` index on brand_profiles**: Speeds up lookups by URL
- **`brandProfileId` index on campaigns**: Speeds up finding campaigns by brand profile ID

These indexes will significantly improve query performance as your database grows!
