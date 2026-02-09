# Published Posts Sync System

## Overview

BrandForge now checks your **actual published posts** on LinkedIn/Twitter before generating campaigns, ensuring you never repeat content that's already live on your social media accounts.

## How It Works

### 1. Connect Social Account
- User connects LinkedIn via OAuth
- Access token stored securely in database
- Account linked to brand profile

### 2. Sync Existing Posts (First Time)
- Click "🔄 Sync LinkedIn Posts" button
- Fetches last 50 posts from LinkedIn API
- Stores posts in `published_posts` collection with fingerprints
- Shows: "✓ Synced 50 posts!"

### 3. Generate Campaigns
- System checks **BOTH**:
  - BrandForge generated campaigns (from `campaigns` collection)
  - Published LinkedIn posts (from `published_posts` collection)
- AI generates NEW content avoiding both sources
- Ensures completely fresh campaigns

### 4. Post to LinkedIn
- When posting from BrandForge, post is automatically saved
- Next generation will avoid this post too
- No manual sync needed for BrandForge posts

## Architecture

### Database Collections

#### `published_posts`
```typescript
{
  _id: ObjectId,
  socialAccountId: ObjectId,
  brandProfileId: ObjectId,
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook',
  platformPostId: string, // LinkedIn post ID
  content: string, // Full post text
  publishedAt: Date,
  engagement?: {
    likes: number,
    comments: number,
    shares: number
  },
  fingerprint: {
    hook: string, // First 60 chars
    keyThemes: string[],
    hashtags: string[]
  },
  lastSyncedAt: Date
}
```

#### `social_accounts`
```typescript
{
  _id: ObjectId,
  brandProfileId: ObjectId,
  platform: Platform,
  profileId: string, // LinkedIn person URN
  accessToken: string,
  refreshToken?: string,
  expiresAt: Date,
  connectedAt: Date,
  displayName?: string,
  profileUrl?: string,
  avatarUrl?: string
}
```

### API Routes

#### `POST /api/social/sync`
Syncs published posts from LinkedIn.

**Request:**
```json
{
  "socialAccountId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "syncedCount": 50,
  "totalPosts": 50,
  "message": "Synced 50 new posts from linkedin"
}
```

#### `GET /api/social/accounts?brandProfileId=...`
Gets connected social accounts for a brand profile.

#### `POST /api/post-to-social`
Now auto-saves published posts when posting from BrandForge.

### Campaign Context Builder

Enhanced `getFullContext()` method:
- Gets context from BrandForge campaigns (as before)
- **NEW:** Gets context from published posts
- Merges both contexts
- Passes to AI with explicit avoidance instructions

### Campaign Generator Prompt

Updated prompt includes:

```
🔴 CRITICAL: ALREADY PUBLISHED ON LINKEDIN (NEVER REPEAT THESE):
===================================================================================
The user has ALREADY published these posts on their actual LinkedIn account.
You MUST generate completely different content that doesn't overlap with these.

Published opening hooks to AVOID:
1. "First 60 chars of published post..."
2. ...

Published themes to AVOID:
theme1, theme2, ...

Published hashtags to AVOID:
#hashtag1, #hashtag2, ...

This is REAL content already on LinkedIn. Your new campaigns must be COMPLETELY DIFFERENT.
```

## User Flow

```
Step 1: Connect LinkedIn
└─> OAuth flow completes
    └─> Account stored in database

Step 2: Sync Existing Posts (FIRST TIME)
└─> User clicks "🔄 Sync LinkedIn Posts"
    └─> Fetches last 50 posts from LinkedIn API
        └─> Stores in published_posts collection
            └─> "✓ Synced 50 posts!"

Step 3: Generate Campaign
└─> User clicks "Generate Campaigns"
    └─> System checks:
        ├─> BrandForge generated campaigns
        └─> Published LinkedIn posts
    └─> AI generates NEW content avoiding both
        └─> Shows 9 fresh posts

Step 4: Post to LinkedIn
└─> User clicks "📤 Post to LinkedIn"
    └─> Post goes live on LinkedIn
        └─> Automatically saved to published_posts
            └─> Next generation will avoid this post too!
```

## Database Indexes

Run `npm run create-indexes-optimized` to create:

```javascript
// published_posts collection
db.published_posts.createIndex({ 
  "brandProfileId": 1, 
  "platform": 1, 
  "publishedAt": -1 
});
db.published_posts.createIndex({ "socialAccountId": 1 });
db.published_posts.createIndex({ 
  "platformPostId": 1, 
  "socialAccountId": 1 
}, { unique: true });

// social_accounts collection
db.social_accounts.createIndex({ 
  "brandProfileId": 1, 
  "platform": 1 
});
```

## Files Added/Modified

### New Files
- `src/lib/linkedin-fetcher.ts` - LinkedIn API integration
- `src/app/api/social/sync/route.ts` - Sync API endpoint
- `src/app/api/social/accounts/route.ts` - Get connected accounts

### Modified Files
- `src/types/index.ts` - Added `PublishedPost` and `SocialAccount` interfaces
- `src/lib/campaign-context-builder.ts` - Added `getPublishedPostsContext()` and `getFullContext()`
- `src/lib/campaign-generator.ts` - Updated prompt to include published posts avoidance
- `src/app/api/generate-campaigns/route.ts` - Uses `getFullContext()` instead of `getCompactContext()`
- `src/app/api/post-to-social/route.ts` - Auto-saves published posts
- `src/app/campaigns/[brandProfileId]/page.tsx` - Added sync button UI
- `scripts/create-indexes-optimized.ts` - Added indexes for published_posts and social_accounts

## Benefits

✅ **No Repetition**: Never repeat content already on LinkedIn  
✅ **Automatic**: Auto-saves when posting from BrandForge  
✅ **Manual Sync**: Refresh from LinkedIn anytime  
✅ **Scalable**: Efficient queries with proper indexes  
✅ **Future-Proof**: Ready for Twitter, Instagram, Facebook  

## Next Steps

1. **LinkedIn OAuth Integration**: Implement OAuth flow to connect accounts
2. **Twitter Sync**: Add Twitter API integration
3. **Auto-Sync**: Periodic background sync (daily/weekly)
4. **Engagement Tracking**: Update engagement stats from API
5. **Content Calendar**: Show published posts timeline
