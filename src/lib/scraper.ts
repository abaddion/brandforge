import { WebsiteAnalysis } from '@/types';

// Check if we're in a Vercel production environment
const isVercelProduction = process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';

// Dynamic imports
let puppeteer: any = null;
let scrapeSimple: any = null;

if (!isVercelProduction) {
  // Only import Puppeteer in development or local environments
  try {
    puppeteer = require('puppeteer');
  } catch (error) {
    console.warn('Puppeteer not available, will use simple scraper');
  }
} else {
  // Use simple scraper in Vercel production
  const simpleModule = require('./scraper-simple');
  scrapeSimple = simpleModule.scrapeSimple;
}

interface ScraperResult {
  content: WebsiteAnalysis['content'];
  visual: WebsiteAnalysis['visual'];
  technical: WebsiteAnalysis['technical'];
}

export class WebsiteScraper {
  private browser: any = null;

  async initialize() {
    if (isVercelProduction) {
      // No browser needed for simple scraper
      return null;
    }
    
    if (!this.browser && puppeteer) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async scrape(url: string): Promise<ScraperResult> {
    // Use simple scraper in Vercel production
    if (isVercelProduction && scrapeSimple) {
      return await scrapeSimple(url);
    }

    // Use Puppeteer for local/development
    if (!puppeteer) {
      // Fallback to simple scraper if Puppeteer is not available
      if (!scrapeSimple) {
        const simpleModule = require('./scraper-simple');
        scrapeSimple = simpleModule.scrapeSimple;
      }
      return await scrapeSimple(url);
    }

    const startTime = Date.now();
    let page: any = null;

    try {
      await this.initialize();
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }
      page = await this.browser.newPage();

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      );

      // Navigate to the page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Extract all data in parallel
      const [content, visual, technical] = await Promise.all([
        this.extractContent(page),
        this.extractVisual(page, url),
        this.extractTechnical(page, url, startTime)
      ]);

      return { content, visual, technical };
    } catch (error) {
      console.error('Scraping error:', error);
      throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (page) await page.close();
    }
  }

  private async extractContent(page: any): Promise<WebsiteAnalysis['content']> {
    const data = await page.evaluate(() => {
      // Get title
      const title = document.title || '';

      // Get meta description
      const metaDescription = 
        document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

      // Get all headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map(h => h.textContent?.trim())
        .filter(Boolean) as string[];

      // Get main content - try to find main content area
      const mainSelectors = [
        'main',
        '[role="main"]',
        'article',
        '.content',
        '#content',
        'body'
      ];

      let mainElement = null;
      for (const selector of mainSelectors) {
        mainElement = document.querySelector(selector);
        if (mainElement) break;
      }

      // Remove unwanted elements
      const unwantedSelectors = [
        'script',
        'style',
        'nav',
        'header',
        'footer',
        '.cookie',
        '#cookie',
        '[class*="cookie"]',
        '[id*="cookie"]'
      ];

      const clone = mainElement?.cloneNode(true) as HTMLElement;
      if (clone) {
        unwantedSelectors.forEach(selector => {
          clone.querySelectorAll(selector).forEach(el => el.remove());
        });
      }

      const bodyText = clone?.textContent
        ?.replace(/\s+/g, ' ')
        .trim()
        .substring(0, 10000) || ''; // Limit to 10k chars

      return {
        title,
        metaDescription,
        headings,
        bodyText
      };
    });

    // Extract key phrases (simple frequency analysis)
    const keyPhrases = this.extractKeyPhrases(data.bodyText);

    return {
      ...data,
      keyPhrases
    };
  }

  private async extractVisual(page: any, url: string): Promise<WebsiteAnalysis['visual']> {
    const data = await page.evaluate(() => {
      // Extract colors from computed styles
      const colors = new Set<string>();
      const elements = document.querySelectorAll('*');
      
      // Sample elements (not all to avoid performance issues)
      const sampleSize = Math.min(elements.length, 200);
      const step = Math.floor(elements.length / sampleSize);

      for (let i = 0; i < elements.length; i += step) {
        const el = elements[i] as HTMLElement;
        const styles = window.getComputedStyle(el);
        
        // Get background colors
        const bgColor = styles.backgroundColor;
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          colors.add(bgColor);
        }

        // Get text colors
        const textColor = styles.color;
        if (textColor) {
          colors.add(textColor);
        }

        // Get border colors
        const borderColor = styles.borderColor;
        if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)' && borderColor !== 'transparent') {
          colors.add(borderColor);
        }
      }

      // Extract fonts
      const fonts = new Set<string>();
      for (let i = 0; i < Math.min(elements.length, 100); i += 5) {
        const el = elements[i] as HTMLElement;
        const styles = window.getComputedStyle(el);
        const fontFamily = styles.fontFamily;
        if (fontFamily) {
          fonts.add(fontFamily.split(',')[0].replace(/['"]/g, '').trim());
        }
      }

      // Find logo
      const logoSelectors = [
        'img[alt*="logo" i]',
        'img[class*="logo" i]',
        'img[id*="logo" i]',
        '.logo img',
        '#logo img',
        'header img:first-of-type'
      ];

      let logoUrl = '';
      for (const selector of logoSelectors) {
        const logo = document.querySelector(selector) as HTMLImageElement;
        if (logo?.src) {
          logoUrl = logo.src;
          break;
        }
      }

      // Get hero/featured images
      const heroImages = Array.from(
        document.querySelectorAll('img')
      )
        .filter(img => {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;
          return width >= 400 && height >= 300; // Minimum size for hero images
        })
        .slice(0, 5)
        .map(img => img.src);

      return {
        colors: Array.from(colors),
        fonts: Array.from(fonts),
        logoUrl,
        heroImages
      };
    });

    // Convert colors to hex and categorize
    const { primaryColors, secondaryColors } = this.categorizeColors(data.colors);

    return {
      primaryColors,
      secondaryColors,
      fonts: data.fonts,
      logoUrl: data.logoUrl || undefined,
      heroImages: data.heroImages
    };
  }

  private async extractTechnical(
    page: any,
    url: string,
    startTime: number
  ): Promise<WebsiteAnalysis['technical']> {
    const loadTime = Date.now() - startTime;
    const parsedUrl = new URL(url);

    // Check mobile optimization
    const mobileOptimized = await page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]');
      return !!viewport;
    });

    return {
      domain: parsedUrl.hostname,
      hasSSL: parsedUrl.protocol === 'https:',
      loadTime,
      mobileOptimized
    };
  }

  private extractKeyPhrases(text: string): string[] {
    // Simple keyword extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4); // Only words longer than 4 chars

    // Count frequency
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Get top 20 most frequent words
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  private rgbToHex(rgb: string): string {
    // Parse rgb(r, g, b) or rgba(r, g, b, a)
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb;

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    return '#' + [r, g, b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  }

  private categorizeColors(colors: string[]): {
    primaryColors: string[];
    secondaryColors: string[];
  } {
    // Convert to hex and count occurrences
    const hexColors = colors.map(c => this.rgbToHex(c));
    const colorCounts: Record<string, number> = {};

    hexColors.forEach(color => {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    });

    // Filter out very common colors (white, black, grays)
    const filtered = Object.entries(colorCounts)
      .filter(([color]) => {
        // Skip if it's white, black, or very light/dark gray
        if (color === '#ffffff' || color === '#000000') return false;
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        // Skip if grayscale
        if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10) {
          return false;
        }
        
        return true;
      })
      .sort(([, a], [, b]) => b - a);

    const primaryColors = filtered.slice(0, 3).map(([color]) => color);
    const secondaryColors = filtered.slice(3, 8).map(([color]) => color);

    return { primaryColors, secondaryColors };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Singleton instance
let scraperInstance: WebsiteScraper | null = null;

export async function getScraper(): Promise<WebsiteScraper> {
  if (isVercelProduction) {
    // Return a mock scraper that uses the simple method
    return {
      scrape: async (url: string) => {
        if (!scrapeSimple) {
          const simpleModule = require('./scraper-simple');
          scrapeSimple = simpleModule.scrapeSimple;
        }
        return await scrapeSimple(url);
      },
      close: async () => {},
      initialize: async () => {}
    } as any;
  }

  if (!scraperInstance) {
    scraperInstance = new WebsiteScraper();
  }
  return scraperInstance;
}