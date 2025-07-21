import { O1ProIntentEngine, type PlatformIntentData } from '../o1-pro-intent-engine';

// O1 Pro Intent Discovery API Routes for advanced platform-specific research
export class O1ProIntentDiscoveryAPI {
  private intentEngine: O1ProIntentEngine;

  constructor() {
    this.intentEngine = new O1ProIntentEngine();
  }

  // Advanced F1000 intent discovery with O1 Pro reasoning
  async searchF1000Intents(query: {
    companies?: string[];
    platforms?: string[];
    fortuneRanking?: '100' | '250' | '500' | '1000';
    industryFocus?: string[];
    urgencyLevel?: 'immediate' | '3-6months' | '6-12months';
    timeframe?: '30days' | '60days' | '90days';
  }): Promise<F1000IntentResults> {
    const companies = query.companies || this.getF1000Companies(query.fortuneRanking);
    const platforms = query.platforms || ['salesforce', 'oracle', 'sap', 'dynamics365', 'workday', 'servicenow'];
    
    const results: F1000CompanyIntent[] = [];
    
    for (const company of companies.slice(0, 50)) { // Process in batches for demo
      try {
        const companyIntents: PlatformIntentData[] = [];
        
        // Analyze each platform for the company
        for (const platform of platforms) {
          const intent = await this.intentEngine.discoverPlatformIntents(company, platform);
          if (intent.intentScore > 30) { // Only include meaningful intent signals
            companyIntents.push(intent);
          }
        }
        
        if (companyIntents.length > 0) {
          const highestIntent = companyIntents.reduce((prev, current) => 
            (prev.intentScore > current.intentScore) ? prev : current
          );
          
          results.push({
            companyName: company,
            overallIntentScore: Math.round(companyIntents.reduce((sum, intent) => sum + intent.intentScore, 0) / companyIntents.length),
            urgencyLevel: highestIntent.urgencyLevel,
            primaryPlatform: highestIntent.targetPlatform,
            platformIntents: companyIntents,
            jobPostingsCount: companyIntents.reduce((sum, intent) => sum + intent.jobPostings.length, 0),
            initiativesCount: companyIntents.reduce((sum, intent) => sum + intent.strategicInitiatives.length, 0),
            lastAnalyzed: new Date()
          });
        }
      } catch (error) {
        console.error(`F1000 intent analysis failed for ${company}:`, error);
      }
    }
    
    // Sort by intent score and urgency
    results.sort((a, b) => {
      if (a.urgencyLevel === 'critical' && b.urgencyLevel !== 'critical') return -1;
      if (b.urgencyLevel === 'critical' && a.urgencyLevel !== 'critical') return 1;
      return b.overallIntentScore - a.overallIntentScore;
    });
    
    return {
      totalCompaniesAnalyzed: companies.length,
      highIntentCompanies: results.filter(r => r.overallIntentScore > 70),
      mediumIntentCompanies: results.filter(r => r.overallIntentScore >= 40 && r.overallIntentScore <= 70),
      lowIntentCompanies: results.filter(r => r.overallIntentScore < 40),
      results: results.slice(0, 100), // Return top 100 results
      analysisDate: new Date(),
      methodology: 'O1 Pro-level multi-platform intent discovery with job posting analysis',
      confidenceLevel: 85
    };
  }

  // Trending platform initiatives across F1000
  async getTrendingPlatformInitiatives(timeframe: '30days' | '60days' | '90days' = '60days'): Promise<TrendingInitiatives> {
    const platforms = ['salesforce', 'oracle', 'sap', 'dynamics365', 'workday', 'servicenow'];
    const f1000Companies = this.getF1000Companies('1000').slice(0, 100); // Sample for demo
    
    const trends: { [platform: string]: PlatformTrend } = {};
    
    for (const platform of platforms) {
      const initiatives: string[] = [];
      const jobPostings: number[] = [];
      const urgencySignals: string[] = [];
      
      for (const company of f1000Companies) {
        try {
          const intent = await this.intentEngine.discoverPlatformIntents(company, platform);
          
          initiatives.push(...intent.strategicInitiatives.map(i => i.initiative_name));
          jobPostings.push(intent.jobPostings.length);
          
          if (intent.urgencyLevel === 'high' || intent.urgencyLevel === 'critical') {
            urgencySignals.push(`${company}: ${intent.urgencyLevel} urgency`);
          }
        } catch (error) {
          console.error(`Trending analysis failed for ${company} ${platform}:`, error);
        }
      }
      
      trends[platform] = {
        platform,
        totalInitiatives: initiatives.length,
        averageJobPostings: jobPostings.length > 0 ? Math.round(jobPostings.reduce((a, b) => a + b, 0) / jobPostings.length) : 0,
        urgencySignals: urgencySignals.slice(0, 10), // Top 10 urgent signals
        topInitiatives: this.getTopInitiatives(initiatives),
        growthTrend: this.calculateGrowthTrend(platform, timeframe),
        confidence: Math.min(95, Math.max(50, initiatives.length * 2))
      };
    }
    
    return {
      timeframe,
      platforms: Object.values(trends).sort((a, b) => b.totalInitiatives - a.totalInitiatives),
      summary: {
        mostActivePlatform: Object.values(trends).reduce((prev, current) => 
          (prev.totalInitiatives > current.totalInitiatives) ? prev : current
        ).platform,
        totalInitiativesTracked: Object.values(trends).reduce((sum, trend) => sum + trend.totalInitiatives, 0),
        averageUrgencyLevel: this.calculateAverageUrgency(Object.values(trends))
      },
      lastUpdated: new Date()
    };
  }

  private getF1000Companies(ranking?: string): string[] {
    // Sample F1000 companies - in production this would come from a database
    const companies = [
      'Apple', 'Microsoft', 'Amazon', 'Google', 'Meta', 'Tesla', 'Berkshire Hathaway',
      'United Airlines', 'JPMorgan Chase', 'General Electric', 'Ford Motor Company',
      'Boeing', 'Coca-Cola', 'IBM', 'Intel', 'Oracle', 'Salesforce', 'SAP',
      'Walmart', 'Target', 'Home Depot', 'Nike', 'McDonald\'s', 'Starbucks',
      'Johnson & Johnson', 'Pfizer', 'Merck', 'Bristol Myers Squibb',
      'Goldman Sachs', 'Morgan Stanley', 'Bank of America', 'Wells Fargo',
      'Citigroup', 'American Express', 'Visa', 'Mastercard', 'PayPal'
    ];
    
    switch (ranking) {
      case '100': return companies.slice(0, 10);
      case '250': return companies.slice(0, 20);
      case '500': return companies.slice(0, 30);
      default: return companies;
    }
  }

  private getTopInitiatives(initiatives: string[]): string[] {
    const counts: { [key: string]: number } = {};
    initiatives.forEach(initiative => {
      counts[initiative] = (counts[initiative] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([initiative]) => initiative);
  }

  private calculateGrowthTrend(platform: string, timeframe: string): 'increasing' | 'stable' | 'decreasing' {
    // Mock growth calculation - in production this would analyze historical data
    const trendFactors = {
      'salesforce': 'increasing',
      'oracle': 'stable', 
      'sap': 'increasing',
      'dynamics365': 'increasing',
      'workday': 'stable',
      'servicenow': 'increasing'
    };
    
    return trendFactors[platform as keyof typeof trendFactors] || 'stable';
  }

  private calculateAverageUrgency(trends: PlatformTrend[]): 'low' | 'medium' | 'high' {
    const urgencyCount = trends.reduce((sum, trend) => sum + trend.urgencySignals.length, 0);
    const totalTrends = trends.length;
    
    const avgUrgency = urgencyCount / totalTrends;
    
    if (avgUrgency > 5) return 'high';
    if (avgUrgency > 2) return 'medium';
    return 'low';
  }
}

// Type definitions for O1 Pro Intent Discovery
export interface F1000IntentResults {
  totalCompaniesAnalyzed: number;
  highIntentCompanies: F1000CompanyIntent[];
  mediumIntentCompanies: F1000CompanyIntent[];
  lowIntentCompanies: F1000CompanyIntent[];
  results: F1000CompanyIntent[];
  analysisDate: Date;
  methodology: string;
  confidenceLevel: number;
}

export interface F1000CompanyIntent {
  companyName: string;
  overallIntentScore: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryPlatform: string;
  platformIntents: PlatformIntentData[];
  jobPostingsCount: number;
  initiativesCount: number;
  lastAnalyzed: Date;
}

export interface TrendingInitiatives {
  timeframe: string;
  platforms: PlatformTrend[];
  summary: {
    mostActivePlatform: string;
    totalInitiativesTracked: number;
    averageUrgencyLevel: 'low' | 'medium' | 'high';
  };
  lastUpdated: Date;
}

export interface PlatformTrend {
  platform: string;
  totalInitiatives: number;
  averageJobPostings: number;
  urgencySignals: string[];
  topInitiatives: string[];
  growthTrend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
}

export const o1ProIntentDiscoveryAPI = new O1ProIntentDiscoveryAPI();