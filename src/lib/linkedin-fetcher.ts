export interface LinkedInPost {
  id: string;
  text: string;
  createdAt: Date;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export async function fetchUserPosts(
  accessToken: string,
  profileId: string,
  limit: number = 50
): Promise<LinkedInPost[]> {
  try {
    // Fetch user's posts using LinkedIn UGC Posts API
    // Note: This requires the user to have granted 'r_ugcPosts' permission
    const response = await fetch(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:${profileId})&count=${limit}&sortBy=LAST_MODIFIED`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    if (!response.ok) {
      // If UGC Posts API fails, try alternative endpoint
      if (response.status === 403 || response.status === 404) {
        console.warn('[LinkedIn] UGC Posts API not available, trying Share API...');
        return await fetchUserPostsViaShares(accessToken, profileId, limit);
      }
      throw new Error(`LinkedIn API error: ${response.statusText}`);
    }

    const data = await response.json();
    const posts: LinkedInPost[] = [];

    for (const element of data.elements || []) {
      // Extract text content from UGC Post
      const text = element.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '';
      
      // Get engagement stats
      const socialDetail = element.socialDetail || {};
      
      posts.push({
        id: element.id,
        text,
        createdAt: new Date(element.created?.time || Date.now()),
        engagement: {
          likes: socialDetail.totalSocialActivityCounts?.numLikes || 0,
          comments: socialDetail.totalSocialActivityCounts?.numComments || 0,
          shares: socialDetail.totalSocialActivityCounts?.numShares || 0
        }
      });
    }

    return posts;
  } catch (error) {
    console.error('Failed to fetch LinkedIn posts:', error);
    throw error;
  }
}

/**
 * Alternative method using Share API (if UGC Posts API is not available)
 */
async function fetchUserPostsViaShares(
  accessToken: string,
  profileId: string,
  limit: number = 50
): Promise<LinkedInPost[]> {
  try {
    // Try using the Shares API as fallback
    const response = await fetch(
      `https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:person:${profileId}&count=${limit}&sortBy=CREATED`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`LinkedIn Share API error: ${response.statusText}`);
    }

    const data = await response.json();
    const posts: LinkedInPost[] = [];

    for (const element of data.elements || []) {
      const text = element.text?.text || '';
      
      posts.push({
        id: element.id,
        text,
        createdAt: new Date(element.created?.time || Date.now()),
        engagement: {
          likes: 0, // Share API doesn't provide engagement stats
          comments: 0,
          shares: 0
        }
      });
    }

    return posts;
  } catch (error) {
    console.error('Failed to fetch LinkedIn posts via Shares API:', error);
    // Return empty array if both methods fail
    return [];
  }
}
