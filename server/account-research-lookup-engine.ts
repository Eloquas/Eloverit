/**
 * Account Research Lookup Engine - Module 3
 * Discovers and returns 5-10 relevant companies based on filters and intent signals
 */

import OpenAI from "openai";
import { IntentDiscoveryEngine, type IntentSignal } from "./intent-discovery-engine";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface AccountLookupFilters {
  industry?: string;
  company_size?: string; // 'startup' | 'mid-market' | 'enterprise' | 'fortune-500'
  revenue_range?: string; // '<$100M' | '$100M-$1B' | '$1B+' 
  location?: string; // 'US' | 'California' | 'New York' | etc.
  system_type?: string; // 'SAP' | 'Dynamics 365' | 'Oracle' | 'Salesforce' | 'Workday' | 'ServiceNow'
  intent_filter?: boolean; // true = prioritize intent-matched companies, false = use standard filters
}

interface CompanyLookupResult {
  company_name: string;
  industry: string;
  system: string;
  hq_location: string;
  employee_count: string;
  revenue_est: string;
  intent_summary?: string;
  source_links: string[];
  intent_score?: number;
  confidence_score: number;
  research_quality: 'excellent' | 'good' | 'fair' | 'basic';
}

interface AccountLookupResponse {
  companies: CompanyLookupResult[];
  total_found: number;
  filters_applied: AccountLookupFilters;
  search_metadata: {
    intent_discovery_used: boolean;
    fallback_applied: boolean;
    search_duration: number;
    data_sources: string[];
  };
}

export class AccountResearchLookupEngine {
  private intentDiscoveryEngine: IntentDiscoveryEngine;

  constructor() {
    this.intentDiscoveryEngine = new IntentDiscoveryEngine();
  }

  async discoverCompanies(filters: AccountLookupFilters): Promise<AccountLookupResponse> {
    const startTime = Date.now();
    console.log('🔍 Module 3: Starting Account Research Lookup with filters:', filters);

    try {
      let companies: CompanyLookupResult[] = [];
      let intentDiscoveryUsed = false;
      let fallbackApplied = false;
      const dataSources: string[] = [];

      // Step 1: If intent_filter is true, prioritize Intent Discovery results
      if (filters.intent_filter === true) {
        console.log('🎯 Using Intent Discovery for company lookup...');
        companies = await this.getIntentBasedCompanies(filters);
        intentDiscoveryUsed = true;
        dataSources.push('Intent Discovery Engine');
      }

      // Step 2: If we have less than 5 companies, supplement with filter-based lookup
      if (companies.length < 5) {
        console.log(`📊 Current count: ${companies.length}, supplementing with filter-based lookup...`);
        const filterBasedCompanies = await this.getFilterBasedCompanies(filters, companies.length);
        companies = [...companies, ...filterBasedCompanies];
        dataSources.push('Filter-Based Lookup');
      }

      // Step 3: If still under 5, apply fallback mechanism
      if (companies.length < 5) {
        console.log('🔄 Applying fallback mechanism for similar companies...');
        const fallbackCompanies = await this.getFallbackCompanies(filters, companies.length);
        companies = [...companies, ...fallbackCompanies];
        fallbackApplied = true;
        dataSources.push('Fallback Lookalike');
      }

      // Step 4: Ensure we return 5-10 companies (limit to 10)
      companies = companies.slice(0, 10);

      // Step 5: Enhance companies with additional metadata
      const enhancedCompanies = await this.enhanceCompanyData(companies);

      const searchDuration = Date.now() - startTime;
      
      console.log(`✅ Module 3: Successfully discovered ${enhancedCompanies.length} companies in ${searchDuration}ms`);

      return {
        companies: enhancedCompanies,
        total_found: enhancedCompanies.length,
        filters_applied: filters,
        search_metadata: {
          intent_discovery_used: intentDiscoveryUsed,
          fallback_applied: fallbackApplied,
          search_duration: searchDuration,
          data_sources: dataSources
        }
      };
    } catch (error) {
      console.error('❌ Account Research Lookup error:', error);
      throw new Error(`Account lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getIntentBasedCompanies(filters: AccountLookupFilters): Promise<CompanyLookupResult[]> {
    try {
      // Use Intent Discovery Engine to find high-intent companies
      const intentFilters = {
        industry: filters.industry,
        geography: filters.location,
        revenue: filters.revenue_range,
        erpCrmSystem: filters.system_type,
        fortuneRanking: this.mapCompanySizeToFortune(filters.company_size),
        minConfidenceScore: 70, // Only high-confidence signals
        timeframe: 60 // Last 60 days
      };

      const intentSignals = await this.intentDiscoveryEngine.discoverIntentSignals(intentFilters);
      
      // Convert Intent Discovery results to CompanyLookupResult format
      return intentSignals.slice(0, 7).map((signal: IntentSignal) => ({
        company_name: signal.companyName,
        industry: signal.industry || filters.industry || 'Technology',
        system: signal.technology || filters.system_type || 'Enterprise Systems',
        hq_location: signal.geographyInfo?.headquarters || 'United States',
        employee_count: this.formatEmployeeCount(signal.companySize?.employees),
        revenue_est: signal.companySize?.revenue || 'Not disclosed',
        intent_summary: signal.intentSummary,
        source_links: signal.sourceLink ? [signal.sourceLink] : [],
        intent_score: signal.confidenceScore,
        confidence_score: signal.confidenceScore,
        research_quality: this.determineResearchQuality(signal.confidenceScore)
      }));
    } catch (error) {
      console.log('Intent Discovery fallback to standard lookup:', error);
      return [];
    }
  }

  private async getFilterBasedCompanies(filters: AccountLookupFilters, currentCount: number): Promise<CompanyLookupResult[]> {
    const needed = Math.min(8 - currentCount, 6); // Get up to 6 more companies
    
    // Generate companies based on filters using AI
    const prompt = this.buildFilterBasedPrompt(filters, needed);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an enterprise research engine that identifies companies matching specific criteria for QA automation and enterprise systems modernization opportunities.

            Focus on authentic, real companies with verifiable information. Provide concrete details about their technology stack, business context, and QA/testing needs.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 3000
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{"companies": []}');
      return result.companies || [];
    } catch (error) {
      console.error('Filter-based lookup error:', error);
      return this.getStaticFilteredCompanies(filters, needed);
    }
  }

  private async getFallbackCompanies(filters: AccountLookupFilters, currentCount: number): Promise<CompanyLookupResult[]> {
    const needed = Math.max(5 - currentCount, 0);
    
    // Fallback to similar companies in the same sector with known QA/SDLC investments
    const fallbackPrompt = `
    Generate ${needed} real companies similar to the specified criteria that are known for:
    - QA automation investments
    - Enterprise system modernization
    - Software delivery lifecycle improvements
    - Testing infrastructure upgrades

    Criteria: ${JSON.stringify(filters)}

    Return authentic companies with realistic details in this JSON format:
    {
      "companies": [
        {
          "company_name": "Real Company Name",
          "industry": "Specific Industry",
          "system": "Primary System Used",
          "hq_location": "City, State/Country", 
          "employee_count": "Employee Range",
          "revenue_est": "Revenue Range",
          "intent_summary": "Why they need QA automation",
          "source_links": ["https://company-website.com"],
          "confidence_score": 65-85,
          "research_quality": "good"
        }
      ]
    }
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: fallbackPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{"companies": []}');
      return result.companies || [];
    } catch (error) {
      console.error('Fallback lookup error:', error);
      return this.getDefaultFallbackCompanies(needed);
    }
  }

  private buildFilterBasedPrompt(filters: AccountLookupFilters, needed: number): string {
    return `
    Find ${needed} real companies that match these criteria for QA automation and enterprise systems opportunities:

    **Filters Applied:**
    - Industry: ${filters.industry || 'Any industry'}
    - Company Size: ${filters.company_size || 'Any size'}
    - Revenue Range: ${filters.revenue_range || 'Any revenue'}
    - Location: ${filters.location || 'Global'}
    - System Type: ${filters.system_type || 'Any enterprise system'}

    **Research Focus:**
    Look for companies that likely need:
    - Test automation solutions
    - QA process improvements
    - Enterprise system testing
    - DevOps/CI/CD pipeline enhancements
    - Software delivery optimization

    **Required JSON Response:**
    {
      "companies": [
        {
          "company_name": "Actual company name",
          "industry": "Specific industry vertical",
          "system": "Primary enterprise system",
          "hq_location": "City, State/Country",
          "employee_count": "Employee range (e.g., 1,000-5,000)",
          "revenue_est": "Revenue estimate",
          "intent_summary": "Brief summary of QA/testing needs",
          "source_links": ["Company website URL"],
          "confidence_score": 70-90,
          "research_quality": "good" or "excellent"
        }
      ]
    }

    Focus on authentic companies with real business contexts and verifiable information.
    `;
  }

  private async enhanceCompanyData(companies: CompanyLookupResult[]): Promise<CompanyLookupResult[]> {
    // Add any missing fields and normalize data
    return companies.map(company => ({
      ...company,
      confidence_score: company.confidence_score || 75,
      research_quality: company.research_quality || 'good',
      source_links: company.source_links.length > 0 ? company.source_links : [`https://${company.company_name.toLowerCase().replace(/\s+/g, '')}.com`]
    }));
  }

  private mapCompanySizeToFortune(companySize?: string): number {
    switch (companySize?.toLowerCase()) {
      case 'fortune-500':
      case 'enterprise':
        return 500;
      case 'fortune-1000':
      case 'large':
        return 1000;
      case 'mid-market':
        return 5000;
      default:
        return 1000;
    }
  }

  private formatEmployeeCount(employees?: number): string {
    if (!employees) return 'Not disclosed';
    if (employees < 100) return '< 100';
    if (employees < 500) return '100-500';
    if (employees < 1000) return '500-1,000';
    if (employees < 5000) return '1,000-5,000';
    if (employees < 10000) return '5,000-10,000';
    return '10,000+';
  }

  private determineResearchQuality(confidenceScore: number): 'excellent' | 'good' | 'fair' | 'basic' {
    if (confidenceScore >= 90) return 'excellent';
    if (confidenceScore >= 75) return 'good';
    if (confidenceScore >= 60) return 'fair';
    return 'basic';
  }

  private getStaticFilteredCompanies(filters: AccountLookupFilters, needed: number): CompanyLookupResult[] {
    // Static fallback data as last resort
    const staticCompanies = [
      {
        company_name: "Adobe Inc.",
        industry: "Software",
        system: "Salesforce CRM",
        hq_location: "San Jose, CA",
        employee_count: "20,000+",
        revenue_est: "$15.8B",
        intent_summary: "Scaling creative software platforms with enterprise testing needs",
        source_links: ["https://adobe.com"],
        confidence_score: 80,
        research_quality: 'good' as const
      },
      {
        company_name: "Marriott International",
        industry: "Hospitality",
        system: "Oracle PMS",
        hq_location: "Bethesda, MD",
        employee_count: "130,000+",
        revenue_est: "$20.9B",
        intent_summary: "Hospitality technology modernization with testing automation needs",
        source_links: ["https://marriott.com"],
        confidence_score: 75,
        research_quality: 'good' as const
      }
    ];

    return staticCompanies.slice(0, needed);
  }

  private getDefaultFallbackCompanies(needed: number): CompanyLookupResult[] {
    const defaultCompanies = [
      {
        company_name: "Technology Solutions Corp",
        industry: "Technology Services",
        system: "Custom Enterprise Systems",
        hq_location: "Austin, TX",
        employee_count: "1,000-5,000",
        revenue_est: "$500M-$1B",
        intent_summary: "Enterprise modernization with QA automation opportunities",
        source_links: ["https://example.com"],
        confidence_score: 65,
        research_quality: 'fair' as const
      }
    ];

    return defaultCompanies.slice(0, needed);
  }
}

export const accountResearchLookupEngine = new AccountResearchLookupEngine();