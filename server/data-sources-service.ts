// Real data sources service to eliminate hallucinations
import crypto from 'crypto';

interface DataSource {
  id: string;
  url: string;
  title: string;
  content: string;
  sourceType: 'financial_filing' | 'press_release' | 'job_posting' | 'blog_post' | 'news_article';
  publishedDate?: string;
  hash: string;
}

interface Initiative {
  title: string;
  summary: string;
  signals: string[];
  confidence: number; // 0-1
  citationIds: string[];
}

export class DataSourcesService {
  private sources: Map<string, DataSource> = new Map();

  // Collect real data sources for a company
  async collectCompanySources(companyName: string, domain: string, targetSystems: string[]): Promise<{
    sources: DataSource[];
    status: 'success' | 'insufficient_data' | 'error';
    message?: string;
  }> {
    try {
      console.log(`Collecting real data sources for ${companyName} (${domain})`);
      
      const sources: DataSource[] = [];
      
      // 1. Collect job postings (real source)
      const jobSources = await this.collectJobPostings(companyName, domain, targetSystems);
      sources.push(...jobSources);
      
      // 2. Collect SEC filings (real source)  
      const secSources = await this.collectSECFilings(companyName, domain);
      sources.push(...secSources);
      
      // 3. Collect press releases (real source)
      const pressSources = await this.collectPressReleases(companyName, domain, targetSystems);
      sources.push(...pressSources);
      
      // 4. Collect engineering blogs (real source)
      const blogSources = await this.collectEngineeringBlogs(companyName, domain, targetSystems);
      sources.push(...blogSources);

      // Store sources for later reference
      sources.forEach(source => {
        this.sources.set(source.id, source);
      });
      
      if (sources.length === 0) {
        return {
          sources: [],
          status: 'insufficient_data',
          message: 'No real data sources found for this company'
        };
      }

      console.log(`Collected ${sources.length} real data sources for ${companyName}`);
      
      return {
        sources,
        status: 'success'
      };

    } catch (error) {
      console.error('Data collection error:', error);
      return {
        sources: [],
        status: 'error',
        message: `Data collection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Analyze collected sources for intent signals using GPT
  async analyzeSourcesForIntent(
    sources: DataSource[], 
    targetSystems: string[],
    companyName: string
  ): Promise<{
    initiatives: Initiative[];
    status: 'success' | 'insufficient_evidence' | 'error';
    message?: string;
  }> {
    try {
      if (sources.length === 0) {
        return {
          initiatives: [],
          status: 'insufficient_evidence',
          message: 'No sources available for analysis'
        };
      }

      // Build context from real sources only
      const sourceContext = sources.map(source => ({
        id: source.id,
        type: source.sourceType,
        title: source.title,
        content: source.content.substring(0, 1000), // Limit content for context
        url: source.url
      }));

      const analysisPrompt = this.buildAnalysisPrompt(companyName, targetSystems, sourceContext);
      
      // Use GPT to analyze ONLY the provided sources
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Using GPT-4o for now, will upgrade to o3-pro when available
          messages: [
            {
              role: 'system',
              content: `You are an expert analyst. You must ONLY analyze the provided sources and NEVER invent information. If there is insufficient evidence for a claim, respond with "INSUFFICIENT_EVIDENCE".`
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1 // Low temperature for factual analysis
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const analysis = JSON.parse(result.choices[0].message.content);

      if (analysis.status === 'INSUFFICIENT_EVIDENCE') {
        return {
          initiatives: [],
          status: 'insufficient_evidence',
          message: 'Insufficient evidence in available sources'
        };
      }

      const initiatives: Initiative[] = analysis.initiatives.map((init: any) => ({
        title: init.title,
        summary: init.summary,
        signals: init.signals,
        confidence: Math.min(1.0, Math.max(0.0, init.confidence)),
        citationIds: init.citationIds.filter((id: string) => this.sources.has(id))
      }));

      return {
        initiatives,
        status: 'success'
      };

    } catch (error) {
      console.error('Source analysis error:', error);
      return {
        initiatives: [],
        status: 'error',
        message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Collect job postings (simulated API call to job boards)
  private async collectJobPostings(companyName: string, domain: string, targetSystems: string[]): Promise<DataSource[]> {
    // In production, this would call actual job board APIs
    // For now, return empty array to avoid hallucinations
    console.log(`Searching job postings for ${companyName}...`);
    return [];
  }

  // Collect SEC filings (real API available)
  private async collectSECFilings(companyName: string, domain: string): Promise<DataSource[]> {
    // In production, this would call SEC EDGAR API
    console.log(`Searching SEC filings for ${companyName}...`);
    return [];
  }

  // Collect press releases (real API available)
  private async collectPressReleases(companyName: string, domain: string, targetSystems: string[]): Promise<DataSource[]> {
    // In production, this would call news APIs
    console.log(`Searching press releases for ${companyName}...`);
    return [];
  }

  // Collect engineering blogs (real source)
  private async collectEngineeringBlogs(companyName: string, domain: string, targetSystems: string[]): Promise<DataSource[]> {
    // In production, this would search company engineering blogs
    console.log(`Searching engineering blogs for ${companyName}...`);
    return [];
  }

  // Build analysis prompt with real sources only
  private buildAnalysisPrompt(companyName: string, targetSystems: string[], sources: any[]): string {
    return `
Analyze the following REAL SOURCES for ${companyName} to identify intent signals related to ${targetSystems.join(', ')}.

STRICT RULES:
1. ONLY use information from the provided sources
2. If there is insufficient evidence, respond with: {"status": "INSUFFICIENT_EVIDENCE"}
3. NEVER invent or extrapolate information
4. Each initiative must cite specific source IDs

PROVIDED SOURCES:
${sources.map(source => `
Source ID: ${source.id}
Type: ${source.type}
Title: ${source.title}
Content: ${source.content}
URL: ${source.url}
`).join('\n')}

Find intent signals for:
${targetSystems.map(system => `- ${system} implementations, upgrades, or migrations`).join('\n')}
- QA automation initiatives
- SDLC improvements  
- Enterprise systems projects

Response format:
{
  "status": "SUCCESS" | "INSUFFICIENT_EVIDENCE",
  "initiatives": [
    {
      "title": "Clear initiative title",
      "summary": "Brief summary based ONLY on sources",
      "signals": ["Specific signals from sources"],
      "confidence": 0.0-1.0,
      "citationIds": ["source_id_1", "source_id_2"]
    }
  ]
}
`;
  }

  // Generate hash for source content
  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  // Get source by ID
  getSource(id: string): DataSource | undefined {
    return this.sources.get(id);
  }

  // Get sources by IDs
  getSources(ids: string[]): DataSource[] {
    return ids.map(id => this.sources.get(id)).filter(Boolean) as DataSource[];
  }
}

export const dataSourcesService = new DataSourcesService();