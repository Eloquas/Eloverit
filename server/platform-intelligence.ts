import OpenAI from "openai";

// Enhanced Platform Intelligence Engine with specific technology detection
export class PlatformIntelligenceEngine {
  private openai: OpenAI;

  // Enterprise platforms to specifically highlight
  private readonly ENTERPRISE_PLATFORMS = {
    salesforce: {
      keywords: ['salesforce', 'sfdc', 'crm', 'service cloud', 'marketing cloud', 'sales cloud', 'pardot', 'tableau crm'],
      products: ['Sales Cloud', 'Service Cloud', 'Marketing Cloud', 'Commerce Cloud', 'Analytics Cloud', 'Platform', 'Pardot']
    },
    oracle: {
      keywords: ['oracle', 'netsuite', 'oracle cloud', 'oracle database', 'oracle erp', 'oracle hcm', 'peoplesoft', 'jd edwards'],
      products: ['Oracle ERP Cloud', 'NetSuite', 'Oracle Database', 'Oracle HCM', 'Oracle SCM', 'PeopleSoft', 'JD Edwards']
    },
    sap: {
      keywords: ['sap', 's/4hana', 'sap ecc', 'sap r/3', 'successfactors', 'ariba', 'concur', 'fieldglass', 'sap hana'],
      products: ['SAP S/4HANA', 'SAP ECC', 'SuccessFactors', 'SAP Ariba', 'SAP Concur', 'SAP Fieldglass', 'SAP HANA']
    },
    dynamics365: {
      keywords: ['dynamics 365', 'd365', 'dynamics crm', 'dynamics erp', 'dynamics ax', 'dynamics nav', 'dynamics gp'],
      products: ['Dynamics 365 Sales', 'Dynamics 365 Customer Service', 'Dynamics 365 Finance', 'Dynamics 365 Supply Chain', 'Dynamics 365 Business Central']
    },
    workday: {
      keywords: ['workday', 'workday hcm', 'workday financial', 'workday planning', 'workday student'],
      products: ['Workday HCM', 'Workday Financial Management', 'Workday Planning', 'Workday Student']
    },
    servicenow: {
      keywords: ['servicenow', 'snow', 'itsm', 'itom', 'hr service delivery', 'grc'],
      products: ['IT Service Management', 'IT Operations Management', 'HR Service Delivery', 'GRC', 'Security Operations']
    }
  };

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyzePlatformSystems(companyName: string, researchData: any): Promise<PlatformAnalysis> {
    const prompt = this.buildPlatformAnalysisPrompt(companyName, researchData);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an enterprise platform intelligence expert specializing in identifying and analyzing technology platforms in use at Fortune companies.

            Your task is to analyze all available data and identify which enterprise platforms are currently in use, being implemented, or being considered by ${companyName}.

            PLATFORMS TO SPECIFICALLY IDENTIFY AND HIGHLIGHT:
            1. Salesforce (CRM, Service Cloud, Marketing Cloud, etc.)
            2. Oracle (ERP Cloud, NetSuite, Database, HCM, etc.)
            3. SAP (S/4HANA, ECC, SuccessFactors, Ariba, etc.)
            4. Microsoft Dynamics 365 (CRM, ERP, Finance, Operations)
            5. Workday (HCM, Financial Management, Planning)
            6. ServiceNow (ITSM, ITOM, HR Service Delivery)

            For each platform found, provide:
            - Confidence level (0-100%)
            - Specific evidence from job postings, initiatives, or research
            - Current implementation status
            - Potential QA automation opportunities

            Focus on identifying platforms that would benefit from automated testing solutions.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 3000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return this.structurePlatformAnalysis(analysis, companyName);
    } catch (error) {
      console.error('Platform Intelligence analysis error:', error);
      return this.getFallbackPlatformAnalysis(companyName, researchData);
    }
  }

  private buildPlatformAnalysisPrompt(companyName: string, researchData: any): string {
    return `
    Analyze the following research data for ${companyName} and identify all enterprise platforms in use or being implemented:

    RESEARCH DATA:
    ${JSON.stringify(researchData, null, 2)}

    ANALYSIS REQUIREMENTS:

    1. PLATFORM IDENTIFICATION:
       - Scan for mentions of Salesforce, Oracle, SAP, Dynamics 365, Workday, ServiceNow
       - Include specific product names (e.g., "Service Cloud", "S/4HANA", "NetSuite")
       - Look for implementation projects, upgrades, migrations
       - Identify integration requirements between platforms

    2. JOB POSTING ANALYSIS:
       - Platform administrator roles
       - Business analyst positions requiring platform experience
       - Implementation consultant openings
       - Technical roles with platform-specific skills

    3. INITIATIVE DETECTION:
       - Digital transformation projects
       - Platform consolidation efforts
       - Cloud migration initiatives
       - System integration projects

    4. QA AUTOMATION OPPORTUNITIES:
       - Platforms requiring automated testing
       - Integration testing needs
       - Regression testing requirements
       - Performance testing gaps

    Required JSON output structure:
    {
      "platforms_identified": {
        "salesforce": {
          "confidence": 0-100,
          "products_found": ["specific products"],
          "evidence": ["specific evidence from data"],
          "implementation_status": "planning|implementing|in_use|upgrading",
          "qa_opportunities": ["automation opportunities"],
          "job_postings": ["relevant job titles"]
        },
        "oracle": { ... },
        "sap": { ... },
        "dynamics365": { ... },
        "workday": { ... },
        "servicenow": { ... }
      },
      "platform_priorities": [
        {
          "platform": "platform name",
          "priority_score": 0-100,
          "automation_potential": "high|medium|low",
          "timeline": "immediate|3-6months|6-12months",
          "decision_makers": ["relevant roles"]
        }
      ],
      "integration_landscape": {
        "primary_erp": "identified ERP system",
        "primary_crm": "identified CRM system",
        "integration_challenges": ["identified challenges"],
        "testing_complexity": "high|medium|low"
      },
      "recommendations": {
        "immediate_opportunities": ["quick wins"],
        "strategic_initiatives": ["long-term opportunities"],
        "contact_strategy": ["recommended approach"]
      }
    }

    Focus on factual evidence from the provided data. Highlight specific technology platforms mentioned.
    `;
  }

  private structurePlatformAnalysis(analysis: any, companyName: string): PlatformAnalysis {
    return {
      companyName,
      platformsIdentified: analysis.platforms_identified || {},
      platformPriorities: analysis.platform_priorities || [],
      integrationLandscape: analysis.integration_landscape || {},
      recommendations: analysis.recommendations || {},
      analysisDate: new Date(),
      dataQuality: 'high',
      confidence: this.calculateOverallConfidence(analysis.platforms_identified || {})
    };
  }

  private calculateOverallConfidence(platforms: any): number {
    const confidenceScores = Object.values(platforms)
      .map((p: any) => p.confidence || 0)
      .filter(score => score > 0);
    
    return confidenceScores.length > 0 
      ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
      : 0;
  }

  private getFallbackPlatformAnalysis(companyName: string, researchData: any): PlatformAnalysis {
    // Basic platform detection from research data using keyword matching
    const text = JSON.stringify(researchData).toLowerCase();
    const detected: any = {};

    for (const [platform, config] of Object.entries(this.ENTERPRISE_PLATFORMS)) {
      const found = config.keywords.some(keyword => text.includes(keyword.toLowerCase()));
      if (found) {
        detected[platform] = {
          confidence: 60,
          products_found: config.products.filter(product => 
            text.includes(product.toLowerCase())
          ),
          evidence: [`Keyword match in research data`],
          implementation_status: 'unknown',
          qa_opportunities: ['Automated testing implementation', 'Integration testing'],
          job_postings: []
        };
      }
    }

    return {
      companyName,
      platformsIdentified: detected,
      platformPriorities: [],
      integrationLandscape: {},
      recommendations: {
        immediate_opportunities: ['Conduct deeper platform research'],
        strategic_initiatives: ['Platform-specific automation assessment'],
        contact_strategy: ['Discovery call to understand current systems']
      },
      analysisDate: new Date(),
      dataQuality: 'basic',
      confidence: Object.keys(detected).length > 0 ? 40 : 0
    };
  }

  // Enhanced current systems analysis highlighting specific platforms
  enhanceCurrentSystemsAnalysis(currentSystems: string): EnhancedSystemsAnalysis {
    const text = currentSystems.toLowerCase();
    const detectedPlatforms: DetectedPlatform[] = [];
    const qaOpportunities: string[] = [];

    for (const [platform, config] of Object.entries(this.ENTERPRISE_PLATFORMS)) {
      const matchedKeywords = config.keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      const matchedProducts = config.products.filter(product => 
        text.includes(product.toLowerCase())
      );

      if (matchedKeywords.length > 0 || matchedProducts.length > 0) {
        const confidence = Math.min(95, (matchedKeywords.length + matchedProducts.length) * 20);
        
        detectedPlatforms.push({
          platform: platform,
          confidence,
          products: matchedProducts,
          keywords_matched: matchedKeywords,
          qa_priority: this.calculateQAPriority(platform, confidence)
        });

        // Add platform-specific QA opportunities
        qaOpportunities.push(...this.getPlatformQAOpportunities(platform));
      }
    }

    return {
      original_text: currentSystems,
      detected_platforms: detectedPlatforms,
      qa_opportunities: [...new Set(qaOpportunities)], // Remove duplicates
      automation_potential: detectedPlatforms.length > 0 ? 'high' : 'medium',
      integration_complexity: detectedPlatforms.length > 2 ? 'high' : 'medium',
      recommended_focus: detectedPlatforms
        .filter(p => p.qa_priority === 'high')
        .map(p => p.platform)
    };
  }

  private calculateQAPriority(platform: string, confidence: number): 'high' | 'medium' | 'low' {
    // Platforms with complex workflows get higher QA priority
    const highPriorityPlatforms = ['salesforce', 'sap', 'oracle', 'dynamics365'];
    
    if (highPriorityPlatforms.includes(platform) && confidence > 70) {
      return 'high';
    } else if (confidence > 50) {
      return 'medium';
    }
    return 'low';
  }

  private getPlatformQAOpportunities(platform: string): string[] {
    const opportunities: { [key: string]: string[] } = {
      salesforce: [
        'Automated testing for custom Lightning components',
        'Salesforce deployment validation',
        'Integration testing with external systems',
        'Data migration testing'
      ],
      oracle: [
        'Oracle ERP transaction testing',
        'Database performance testing',
        'Oracle Cloud application testing',
        'Integration testing between Oracle modules'
      ],
      sap: [
        'SAP S/4HANA migration testing',
        'SAP Fiori application testing',
        'SAP integration testing',
        'SAP performance and load testing'
      ],
      dynamics365: [
        'Dynamics 365 workflow automation testing',
        'Power Platform integration testing',
        'Dynamics 365 customization testing',
        'Multi-tenant testing scenarios'
      ],
      workday: [
        'Workday HCM process testing',
        'Workday report and dashboard testing',
        'Workday integration testing',
        'Workday security testing'
      ],
      servicenow: [
        'ServiceNow workflow testing',
        'ITSM process automation testing',
        'ServiceNow custom application testing',
        'ServiceNow integration testing'
      ]
    };

    return opportunities[platform] || ['General automated testing opportunities'];
  }
}

// Type definitions for platform intelligence
export interface PlatformAnalysis {
  companyName: string;
  platformsIdentified: { [platform: string]: PlatformDetails };
  platformPriorities: PlatformPriority[];
  integrationLandscape: IntegrationLandscape;
  recommendations: PlatformRecommendations;
  analysisDate: Date;
  dataQuality: 'high' | 'medium' | 'basic';
  confidence: number;
}

export interface PlatformDetails {
  confidence: number;
  products_found: string[];
  evidence: string[];
  implementation_status: 'planning' | 'implementing' | 'in_use' | 'upgrading' | 'unknown';
  qa_opportunities: string[];
  job_postings: string[];
}

export interface PlatformPriority {
  platform: string;
  priority_score: number;
  automation_potential: 'high' | 'medium' | 'low';
  timeline: 'immediate' | '3-6months' | '6-12months';
  decision_makers: string[];
}

export interface IntegrationLandscape {
  primary_erp?: string;
  primary_crm?: string;
  integration_challenges?: string[];
  testing_complexity?: 'high' | 'medium' | 'low';
}

export interface PlatformRecommendations {
  immediate_opportunities: string[];
  strategic_initiatives: string[];
  contact_strategy: string[];
}

export interface EnhancedSystemsAnalysis {
  original_text: string;
  detected_platforms: DetectedPlatform[];
  qa_opportunities: string[];
  automation_potential: 'high' | 'medium' | 'low';
  integration_complexity: 'high' | 'medium' | 'low';
  recommended_focus: string[];
}

export interface DetectedPlatform {
  platform: string;
  confidence: number;
  products: string[];
  keywords_matched: string[];
  qa_priority: 'high' | 'medium' | 'low';
}

export const platformIntelligenceEngine = new PlatformIntelligenceEngine();