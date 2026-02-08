import { WebsiteAnalysis } from '@/types';

interface ScraperResult {
  content: WebsiteAnalysis['content'];
  visual: WebsiteAnalysis['visual'];
  technical: WebsiteAnalysis['technical'];
}

export async function scrapeSimple(url: string): Promise<ScraperResult> {
  const startTime = Date.now();
  
  try {
    // Fetch the HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const parsedUrl = new URL(url);

    // Extract content using regex and string manipulation
    const content = extractContent(html);
    const visual = extractVisual(html);
    const technical = {
      domain: parsedUrl.hostname,
      hasSSL: parsedUrl.protocol === 'https:',
      loadTime: Date.now() - startTime,
      mobileOptimized: html.includes('viewport') || html.includes('mobile')
    };

    return { content, visual, technical };
  } catch (error) {
    throw new Error(`Failed to scrape: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractContent(html: string): WebsiteAnalysis['content'] {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract meta description
  const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const metaDescription = metaMatch ? metaMatch[1].trim() : '';

  // Extract headings
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [];
  const headings = [...h1Matches, ...h2Matches]
    .map(h => h.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .slice(0, 10);

  // Extract body text (remove scripts, styles, tags)
  let bodyText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000);

  // Extract key phrases
  const words = bodyText.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4);

  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  const keyPhrases = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);

  return {
    title,
    metaDescription,
    headings,
    bodyText,
    keyPhrases
  };
}

function extractVisual(html: string): WebsiteAnalysis['visual'] {
  // Extract colors from inline styles and style tags
  const colorMatches = html.match(/#[0-9A-Fa-f]{6}|rgb\([^)]+\)|rgba\([^)]+\)/g) || [];
  const uniqueColors = [...new Set(colorMatches)];

  const primaryColors = uniqueColors.slice(0, 3);
  const secondaryColors = uniqueColors.slice(3, 8);

  // Extract fonts
  const fontMatches = html.match(/font-family:\s*([^;}"']+)/gi) || [];
  const fonts = [...new Set(
    fontMatches
      .map(m => m.replace(/font-family:\s*/i, '').split(',')[0].trim().replace(/['"]/g, ''))
  )].slice(0, 5);

  // Extract logo
  const logoMatch = html.match(/<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i);
  const logoUrl = logoMatch ? logoMatch[1] : undefined;

  // Extract images
  const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
  const heroImages = imgMatches
    .map(img => {
      const srcMatch = img.match(/src=["']([^"']+)["']/);
      return srcMatch ? srcMatch[1] : '';
    })
    .filter(Boolean)
    .slice(0, 5);

  return {
    primaryColors,
    secondaryColors,
    fonts,
    logoUrl,
    heroImages
  };
}
