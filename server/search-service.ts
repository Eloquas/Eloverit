import axios from 'axios';

// Web Search Service for grounded research
export class SearchService {
  private provider: string;
  private apiKey: string;
  private maxResults: number;

  constructor() {
    this.provider = process.env.SEARCH_PROVIDER || 'tavily';
    this.apiKey = process.env.SEARCH_API_KEY || '';
    this.maxResults = parseInt(process.env.MAX_RESULTS || '8');
  }

  // Search for company-specific intent signals across multiple sources
  async searchCompanyIntentSignals(
    companyName: string, 
    targetSystems: string[]
  ): Promise<SearchResult[]> {
    const queries = this.buildSearchQueries(companyName, targetSystems);
    const allResults: SearchResult[] = [];
    
    for (const query of queries) {
      try {
        const results = await this.executeSearch(query);
        allResults.push(...results);
      } catch (error) {
        console.warn(`Search failed for query: ${query}`, error);
      }
    }

    // Deduplicate by domain and return top results
    return this.deduplicateResults(allResults).slice(0, this.maxResults);
  }

  // Build targeted search queries for different intent signals
  private buildSearchQueries(companyName: string, targetSystems: string[]): string[] {
    const queries: string[] = [];
    
    // System-specific implementation searches
    for (const system of targetSystems) {
      if (system === 'dynamics') {
        queries.push(`"${companyName}" "Microsoft Dynamics 365" implementation OR upgrade OR migration`);
        queries.push(`site:linkedin.com/jobs "${companyName}" "Dynamics 365" OR "D365"`);
      }
      if (system === 'oracle') {
        queries.push(`"${companyName}" "Oracle" database OR ERP implementation OR upgrade`);
        queries.push(`site:linkedin.com/jobs "${companyName}" "Oracle" developer OR administrator`);
      }
      if (system === 'sap') {
        queries.push(`"${companyName}" "SAP" S/4HANA OR implementation OR migration`);
        queries.push(`site:linkedin.com/jobs "${companyName}" "SAP" consultant OR developer`);
      }
    }

    // QA and automation intent signals
    queries.push(`"${companyName}" "QA automation" OR "test automation" OR "quality assurance"`);
    queries.push(`site:linkedin.com/jobs "${companyName}" "QA Engineer" OR "Test Automation"`);
    
    // SDLC and digital transformation signals
    queries.push(`"${companyName}" "digital transformation" OR "SDLC" OR "DevOps"`);
    queries.push(`site:${companyName.toLowerCase().replace(/\s+/g, '')}.com "technology" OR "engineering" blog`);
    
    // Investor relations and financial signals
    queries.push(`site:sec.gov "${companyName}" 10-K technology investment OR digital initiative`);
    queries.push(`"${companyName}" investor relations technology OR IT investment`);

    return queries.filter(q => q.length > 0);
  }

  // Execute search using configured provider
  private async executeSearch(query: string): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Search API key not configured');
    }

    switch (this.provider) {
      case 'tavily':
        return this.searchWithTavily(query);
      case 'bing':
        return this.searchWithBing(query);
      case 'serpapi':
        return this.searchWithSerpAPI(query);
      default:
        throw new Error(`Unsupported search provider: ${this.provider}`);
    }
  }

  // Tavily search implementation (preferred for research)
  private async searchWithTavily(query: string): Promise<SearchResult[]> {
    try {
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: this.apiKey,
        query: query,
        search_depth: 'advanced',
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: this.maxResults,
        include_domains: [],
        exclude_domains: ['wikipedia.org', 'wikimedia.org']
      });

      return response.data.results.map((result: any) => ({
        title: result.title || 'No title',
        url: result.url,
        snippet: result.content || result.snippet || '',
        publishedAt: result.published_date || null,
        domain: this.extractDomain(result.url),
        score: result.score || 0
      }));
    } catch (error) {
      console.error('Tavily search failed:', error);
      return [];
    }
  }

  // Bing search implementation
  private async searchWithBing(query: string): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey
        },
        params: {
          q: query,
          count: this.maxResults,
          offset: 0,
          mkt: 'en-US',
          safesearch: 'Moderate'
        }
      });

      return response.data.webPages?.value?.map((result: any) => ({
        title: result.name || 'No title',
        url: result.url,
        snippet: result.snippet || '',
        publishedAt: result.dateLastCrawled || null,
        domain: this.extractDomain(result.url),
        score: 1
      })) || [];
    } catch (error) {
      console.error('Bing search failed:', error);
      return [];
    }
  }

  // SerpAPI search implementation
  private async searchWithSerpAPI(query: string): Promise<SearchResult[]> {
    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          api_key: this.apiKey,
          engine: 'google',
          q: query,
          num: this.maxResults,
          gl: 'us',
          hl: 'en'
        }
      });

      return response.data.organic_results?.map((result: any) => ({
        title: result.title || 'No title',
        url: result.link,
        snippet: result.snippet || '',
        publishedAt: result.date || null,
        domain: this.extractDomain(result.link),
        score: result.position ? (this.maxResults - result.position) / this.maxResults : 0.5
      })) || [];
    } catch (error) {
      console.error('SerpAPI search failed:', error);
      return [];
    }
  }

  // Extract domain from URL
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  // Deduplicate results by domain, keeping highest scoring
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const domainMap = new Map<string, SearchResult>();
    
    for (const result of results) {
      const existing = domainMap.get(result.domain);
      if (!existing || result.score > existing.score) {
        domainMap.set(result.domain, result);
      }
    }
    
    return Array.from(domainMap.values())
      .sort((a, b) => b.score - a.score);
  }

  // Get search status for health checks
  getSearchStatus() {
    return {
      provider: this.provider,
      hasApiKey: !!this.apiKey,
      maxResults: this.maxResults
    };
  }
}

// Search result interface
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedAt: string | null;
  domain: string;
  score: number;
}

// Export singleton instance
export const searchService = new SearchService();