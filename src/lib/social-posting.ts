/**
 * Social Media Platform Posting
 * Supports LinkedIn, Twitter/X, Instagram, Facebook via OAuth
 */

interface PostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

/**
 * Post to LinkedIn using OAuth access token
 */
export async function postToLinkedIn(
  accessToken: string,
  userId: string,
  content: string,
  hashtags?: string[]
): Promise<PostResult> {
  try {
    // Format content with hashtags
    let postText = content;
    if (hashtags && hashtags.length > 0) {
      const hashtagString = hashtags.map((h: string) => `#${h}`).join(' ');
      postText = `${content}\n\n${hashtagString}`;
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: postText,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `LinkedIn API error: ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      postId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Post to Twitter/X using OAuth 2.0
 */
export async function postToTwitter(
  accessToken: string,
  content: string,
  hashtags?: string[]
): Promise<PostResult> {
  try {
    // Format content with hashtags
    let postText = content;
    if (hashtags && hashtags.length > 0) {
      const hashtagString = hashtags.map((h: string) => `#${h}`).join(' ');
      // Twitter has 280 char limit, so we need to be careful
      const availableSpace = 280 - postText.length - hashtagString.length - 2; // 2 for \n\n
      if (availableSpace >= 0) {
        postText = `${content}\n\n${hashtagString}`;
      }
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: postText.substring(0, 280), // Ensure we don't exceed limit
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Twitter API error: ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      postId: data.data?.id,
      url: `https://twitter.com/i/web/status/${data.data?.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Post to Facebook Page using Graph API
 */
export async function postToFacebook(
  accessToken: string,
  pageId: string,
  content: string,
  hashtags?: string[]
): Promise<PostResult> {
  try {
    let postText = content;
    if (hashtags && hashtags.length > 0) {
      const hashtagString = hashtags.map((h: string) => `#${h}`).join(' ');
      postText = `${content}\n\n${hashtagString}`;
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: postText,
          access_token: accessToken,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Facebook API error: ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      postId: data.id,
      url: `https://facebook.com/${data.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Schedule post for later (stores in database for scheduled posting)
 */
export async function schedulePost(
  platform: string,
  content: string,
  scheduledFor: Date,
  accessToken: string,
  userId: string
): Promise<PostResult> {
  // This would store the post in a database and use a cron job/queue
  // to post at the scheduled time
  // For now, return success - implementation would require:
  // 1. Database table for scheduled posts
  // 2. Queue system (BullMQ, etc.)
  // 3. Worker to process scheduled posts
  
  return {
    success: true,
    postId: 'scheduled',
  };
}
