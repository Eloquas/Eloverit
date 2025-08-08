import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import crypto from 'crypto';

// Content fetcher for extracting readable facts from web pages
export class ContentFetcher {
  private timeout: number = 10000; // 10 second timeout
  private maxContentLength: number = 5000; // Max content per page

  // Fetch and parse content from URLs to extract facts
  async fetchAndExtractFacts(
    urls: string[], 
    companyName: string,
    sessionId: string
  ): Promise<ExtractedFact[]> {
    const facts: ExtractedFact[] = [];
    
    for (const url of urls) {
      try {
        const extractedFacts = await this.processUrl(url, companyName, sessionId);
        facts.push(...extractedFacts);
      } catch (error) {
        console.warn(`Failed to fetch content from ${url}:`, error);
        // Continue with other URLs - don't fail entire process
      }
    }

    return facts;
  }

  // Process a single URL to extract relevant facts
  private async processUrl(
    url: string, 
    companyName: string,
    sessionId: string
  ): Promise<ExtractedFact[]> {
    // Fetch HTML content
    const htmlContent = await this.fetchHtmlContent(url);
    if (!htmlContent) {
      return [];
    }

    // Extract readable content using Readability
    const readableContent = this.extractReadableContent(htmlContent, url);
    if (!readableContent) {
      return [];
    }

    // Extract relevant snippets mentioning the company or target technologies
    const snippets = this.extractRelevantSnippets(
      readableContent.textContent, 
      companyName,
      url
    );

    // Convert snippets to facts with metadata
    return snippets.map(snippet => ({
      snippetText: snippet.text,
      snippetHash: this.generateSnippetHash(snippet.text),
      url: url,
      title: readableContent.title,
      publishedAt: this.extractPublishedDate(htmlContent) || null,
      sessionId: sessionId,
      companyName: companyName,
      relevanceScore: snippet.relevanceScore,
      extractedAt: new Date().toISOString()
    }));
  }

  // Fetch HTML content with proper error handling
  private async fetchHtmlContent(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        maxContentLength: this.maxContentLength * 2, // Allow for HTML overhead
        validateStatus: (status) => status >= 200 && status < 400
      });

      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.warn(`Timeout fetching ${url}`);
      } else if (error.response?.status === 403 || error.response?.status === 429) {
        console.warn(`Access denied for ${url}: ${error.response.status}`);
      } else {
        console.warn(`Failed to fetch ${url}:`, error.message);
      }
      return null;
    }
  }

  // Extract readable content using Mozilla's Readability
  private extractReadableContent(htmlContent: string, url: string): any | null {
    try {
      const dom = new JSDOM(htmlContent, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();
      
      if (!article || !article.textContent || article.textContent.length < 200) {
        console.warn(`Insufficient content extracted from ${url}`);
        return null;
      }

      return {
        title: article.title || 'No title',
        textContent: article.textContent.substring(0, this.maxContentLength),
        excerpt: article.excerpt || ''
      };
    } catch (error) {
      console.warn(`Readability parsing failed for ${url}:`, error);
      return null;
    }
  }

  // Extract relevant snippets that mention the company or target technologies
  private extractRelevantSnippets(
    content: string, 
    companyName: string,
    url: string
  ): Array<{ text: string; relevanceScore: number }> {
    const snippets: Array<{ text: string; relevanceScore: number }> = [];
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 50);
    
    // Keywords indicating intent signals
    const intentKeywords = [
      'implementation', 'deployment', 'upgrade', 'migration', 'integration',
      'dynamics 365', 'd365', 'microsoft dynamics', 'oracle', 'sap', 's/4hana',
      'qa automation', 'test automation', 'quality assurance', 'testing',
      'devops', 'digital transformation', 'sdlc', 'agile', 'scrum',
      'enterprise software', 'erp', 'crm', 'database', 'cloud migration'
    ];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      let relevanceScore = 0;

      // Check for company name mentions
      if (sentence.toLowerCase().includes(companyName.toLowerCase())) {
        relevanceScore += 3;
      }

      // Check for intent keywords
      for (const keyword of intentKeywords) {
        if (sentence.toLowerCase().includes(keyword)) {
          relevanceScore += 1;
        }
      }

      // Include context for high-relevance sentences
      if (relevanceScore >= 2) {
        const contextStart = Math.max(0, i - 1);
        const contextEnd = Math.min(sentences.length - 1, i + 1);
        const contextText = sentences.slice(contextStart, contextEnd + 1).join('. ');
        
        if (contextText.length <= 800 && contextText.length >= 100) {
          snippets.push({
            text: contextText,
            relevanceScore: relevanceScore
          });
        }
      }
    }

    // Sort by relevance and limit to top snippets
    return snippets
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3); // Max 3 snippets per URL
  }

  // Extract published date from HTML content
  private extractPublishedDate(htmlContent: string): string | null {
    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      
      // Try common date selectors
      const dateSelectors = [
        'meta[property="article:published_time"]',
        'meta[name="date"]',
        'meta[name="pubdate"]',
        'time[datetime]',
        '.published',
        '.post-date',
        '.article-date'
      ];

      for (const selector of dateSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const dateStr = element.getAttribute('content') || 
                         element.getAttribute('datetime') || 
                         element.textContent;
          
          if (dateStr) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
          }
        }
      }
    } catch (error) {
      console.warn('Date extraction failed:', error);
    }
    
    return null;
  }

  // Generate hash for snippet deduplication
  private generateSnippetHash(text: string): string {
    return crypto.createHash('md5').update(text.trim().toLowerCase()).digest('hex').substring(0, 12);
  }

  // Get fetcher status for health checks
  getStatus() {
    return {
      timeout: this.timeout,
      maxContentLength: this.maxContentLength,
      status: 'operational'
    };
  }
}

// Extracted fact interface
export interface ExtractedFact {
  snippetText: string;
  snippetHash: string;
  url: string;
  title: string;
  publishedAt: string | null;
  sessionId: string;
  companyName: string;
  relevanceScore: number;
  extractedAt: string;
}

// Export singleton instance
export const contentFetcher = new ContentFetcher();