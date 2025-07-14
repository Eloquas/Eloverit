/**
 * Hybrid Research Engine
 * Combines PDL API data with AI-powered web research for comprehensive company intelligence
 */

import OpenAI from "openai";
import { PDLService } from "./pdl-service";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "default_key"
});

interface HybridResearchResult {
  companyName: string;
  dataSource: 'hybrid' | 'pdl-only' | 'ai-only';
  pdlData?: {
    industry: string;
    companySize: string;
    systems: string[];
    jobPostings: any[];
    technologies: string[];
  };
  aiResearch?: {
    initiatives: string[];
    newsSignals: string[];
    competitiveIntel: string[];
    migrationProjects: string[];
    testingChallenges: string[];
  };
  combinedInsights: {
    keyInitiatives: string[];
    hiringSignals: string[];
    testingOpportunities: string[];
    migrationRisks: string[];
    competitiveAdvantages: string[];
  };
  researchQuality: number; // 0-100 score
  lastUpdated: string;
}

export class HybridResearchEngine {
  private pdlService: PDLService;

  constructor() {
    this.pdlService = new PDLService();
  }

  async conductHybridResearch(companyName: string): Promise<HybridResearchResult> {
    const startTime = Date.now();
    
    // Step 1: Attempt PDL data gathering
    let pdlData = null;
    try {
      pdlData = await this.pdlService.analyzeCompanyForSCIPAB(companyName);
      console.log(`PDL research completed for ${companyName}: ${pdlData?.systems?.length || 0} systems identified`);
    } catch (error) {
      console.log(`PDL research failed for ${companyName}, proceeding with AI-only research`);
    }

    // Step 2: Conduct AI-powered web research
    let aiResearch = null;
    try {
      aiResearch = await this.conductDeepWebResearch(companyName, pdlData);
      console.log(`AI research completed for ${companyName}: ${aiResearch?.initiatives?.length || 0} initiatives found`);
    } catch (error) {
      console.error(`AI research failed for ${companyName}:`, error);
    }

    // Step 3: Combine and synthesize insights
    const combinedInsights = this.synthesizeInsights(pdlData, aiResearch);
    
    // Step 4: Calculate research quality score
    const researchQuality = this.calculateQualityScore(pdlData, aiResearch);

    const endTime = Date.now();
    console.log(`Hybrid research for ${companyName} completed in ${endTime - startTime}ms`);

    return {
      companyName,
      dataSource: this.determineDataSource(pdlData, aiResearch),
      pdlData: pdlData ? {
        industry: pdlData.industry,
        companySize: pdlData.companySize,
        systems: pdlData.systems,
        jobPostings: pdlData.hiringPatterns,
        technologies: []
      } : undefined,
      aiResearch,
      combinedInsights,
      researchQuality,
      lastUpdated: new Date().toISOString()
    };
  }

  private async conductDeepWebResearch(companyName: string, pdlContext?: any): Promise<{
    initiatives: string[];
    newsSignals: string[];
    competitiveIntel: string[];
    migrationProjects: string[];
    testingChallenges: string[];
  }> {
    
    const contextPrompt = pdlContext ? 
      `Additional context from structured data: Industry: ${pdlContext.industry}, Systems in use: ${pdlContext.systems?.join(', ')}, Recent hiring: ${pdlContext.hiringPatterns?.slice(0, 3)?.join(', ')}` :
      'No structured data available - conduct comprehensive web research.';

    const researchPrompt = `You are conducting deep research on ${companyName} for enterprise systems and QA automation opportunities. Research across job boards, news sources, press releases, industry publications, and company announcements.

${contextPrompt}

Focus on finding:

1. **CURRENT INITIATIVES & PROJECTS:**
   - Enterprise system implementations (Salesforce, SAP, Oracle, Dynamics 365)
   - Digital transformation projects
   - Technology modernization efforts
   - Quality improvement initiatives
   - Testing automation projects

2. **NEWS & MARKET SIGNALS:**
   - Recent funding announcements
   - Partnership deals with enterprise vendors
   - Executive appointments in technology roles
   - Regulatory compliance requirements
   - Market expansion plans

3. **COMPETITIVE INTELLIGENCE:**
   - Technology stack modernization compared to competitors
   - Quality issues mentioned in news or reviews
   - Customer satisfaction challenges
   - Performance or reliability incidents

4. **MIGRATION & IMPLEMENTATION PROJECTS:**
   - Legacy system replacements
   - Cloud migration initiatives
   - ERP/CRM system upgrades
   - Integration projects between systems

5. **TESTING & QA CHALLENGES:**
   - Quality issues mentioned in job postings
   - Testing bottlenecks in system implementations
   - Compliance testing requirements
   - Performance testing needs

CRITICAL: Only return findings based on publicly available information. If you cannot find specific information, clearly indicate this rather than making assumptions.

Return findings in this exact JSON structure:
{
  "initiatives": ["array of current initiatives with brief descriptions"],
  "newsSignals": ["array of recent news items relevant to enterprise systems"],
  "competitiveIntel": ["array of competitive insights and market positioning"],
  "migrationProjects": ["array of migration or implementation projects"],
  "testingChallenges": ["array of testing and QA challenges identified"]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert enterprise systems research analyst who conducts comprehensive web research to identify real business initiatives, testing challenges, and technology implementations. You only report findings based on publicly available information. Always respond with valid JSON only, no markdown formatting."
          },
          {
            role: "user",
            content: researchPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 3000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      // Clean the response by removing markdown code blocks
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        return JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('JSON parsing failed, raw response:', response);
        console.error('Cleaned response:', cleanedResponse);
        throw parseError;
      }

    } catch (error) {
      console.error(`AI web research failed for ${companyName}:`, error);
      return {
        initiatives: [],
        newsSignals: [],
        competitiveIntel: [],
        migrationProjects: [],
        testingChallenges: []
      };
    }
  }

  private synthesizeInsights(pdlData: any, aiResearch: any): {
    keyInitiatives: string[];
    hiringSignals: string[];
    testingOpportunities: string[];
    migrationRisks: string[];
    competitiveAdvantages: string[];
  } {
    const keyInitiatives = [
      ...(pdlData?.initiatives || []),
      ...(aiResearch?.initiatives || [])
    ].slice(0, 8); // Top 8 initiatives

    const hiringSignals = [
      ...(pdlData?.hiringPatterns || []),
      ...this.extractHiringFromNews(aiResearch?.newsSignals || [])
    ].slice(0, 10); // Top 10 hiring signals

    const testingOpportunities = [
      ...this.extractTestingFromPDL(pdlData),
      ...(aiResearch?.testingChallenges || [])
    ].slice(0, 6); // Top 6 testing opportunities

    const migrationRisks = [
      ...this.extractMigrationFromPDL(pdlData),
      ...(aiResearch?.migrationProjects || [])
    ].slice(0, 5); // Top 5 migration risks

    const competitiveAdvantages = [
      ...(aiResearch?.competitiveIntel || []),
      ...this.extractCompetitiveFromPDL(pdlData)
    ].slice(0, 4); // Top 4 competitive advantages

    return {
      keyInitiatives,
      hiringSignals,
      testingOpportunities,
      migrationRisks,
      competitiveAdvantages
    };
  }

  private extractHiringFromNews(newsSignals: string[]): string[] {
    return newsSignals
      .filter(signal => 
        signal.toLowerCase().includes('hire') || 
        signal.toLowerCase().includes('team') ||
        signal.toLowerCase().includes('talent')
      )
      .map(signal => `News: ${signal}`);
  }

  private extractTestingFromPDL(pdlData: any): string[] {
    if (!pdlData) return [];
    
    const testingSignals = [];
    
    // Extract from systems
    if (pdlData.systems?.includes('SAP ERP')) {
      testingSignals.push('SAP ERP testing and validation requirements');
    }
    if (pdlData.systems?.includes('Salesforce CRM')) {
      testingSignals.push('Salesforce CRM integration and workflow testing');
    }
    if (pdlData.systems?.includes('Dynamics 365')) {
      testingSignals.push('Dynamics 365 implementation testing and QA');
    }

    return testingSignals;
  }

  private extractMigrationFromPDL(pdlData: any): string[] {
    if (!pdlData?.initiatives) return [];
    
    return pdlData.initiatives
      .filter((init: string) => 
        init.toLowerCase().includes('migration') || 
        init.toLowerCase().includes('upgrade') ||
        init.toLowerCase().includes('implementation')
      )
      .map((init: string) => `PDL: ${init}`);
  }

  private extractCompetitiveFromPDL(pdlData: any): string[] {
    if (!pdlData) return [];
    
    const advantages = [];
    
    if (pdlData.systems?.length > 3) {
      advantages.push('Complex multi-system environment requiring comprehensive testing');
    }
    
    if (pdlData.industry?.includes('Financial') || pdlData.industry?.includes('Healthcare')) {
      advantages.push('Regulated industry with high quality and compliance testing needs');
    }

    return advantages;
  }

  private calculateQualityScore(pdlData: any, aiResearch: any): number {
    let score = 0;
    
    // PDL data quality (40 points max)
    if (pdlData) {
      score += pdlData.industry ? 10 : 0;
      score += pdlData.systems?.length > 0 ? 15 : 0;
      score += pdlData.hiringPatterns?.length > 0 ? 15 : 0;
    }
    
    // AI research quality (60 points max)
    if (aiResearch) {
      score += aiResearch.initiatives?.length > 0 ? 20 : 0;
      score += aiResearch.newsSignals?.length > 0 ? 15 : 0;
      score += aiResearch.migrationProjects?.length > 0 ? 15 : 0;
      score += aiResearch.testingChallenges?.length > 0 ? 10 : 0;
    }

    return Math.min(score, 100);
  }

  private determineDataSource(pdlData: any, aiResearch: any): 'hybrid' | 'pdl-only' | 'ai-only' {
    if (pdlData && aiResearch) return 'hybrid';
    if (pdlData && !aiResearch) return 'pdl-only';
    return 'ai-only';
  }
}

export const hybridResearchEngine = new HybridResearchEngine();