import OpenAI from "openai";

// O1 Pro-level Intent Discovery Engine for Platform-Specific Job Research
export class O1ProIntentEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Advanced platform-specific job discovery with O1 Pro reasoning
  async discoverPlatformIntents(companyName: string, platform: string): Promise<PlatformIntentData> {
    const prompt = this.buildO1ProPrompt(companyName, platform);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an O1 Pro-level intelligence system operating at IQ 200+ level for enterprise platform research. 
            Your task is to conduct deep, methodical analysis of ${platform} initiatives and job openings for ${companyName}.
            
            Use advanced reasoning patterns:
            1. Multi-layered analysis (immediate, strategic, competitive)
            2. Pattern recognition across time periods
            3. Signal correlation from multiple data sources
            4. Predictive modeling for initiative urgency
            5. Risk assessment for platform migration needs
            
            Focus specifically on these enterprise platforms and highlight when found:
            - Salesforce (CRM, Service Cloud, Marketing Cloud)
            - Oracle (ERP Cloud, NetSuite, Database, HCM)
            - SAP (S/4HANA, ECC, SuccessFactors, Ariba)
            - Microsoft Dynamics 365 (CRM, ERP, Finance, Operations)
            - Workday (HCM, Financial Management)
            - ServiceNow (IT Service Management, HR Service Delivery)
            
            Return detailed analysis with specific technology mentions and job posting evidence.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Lower temperature for more focused analysis
        max_tokens: 4000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return this.structurePlatformIntentData(analysis, companyName, platform);
    } catch (error) {
      console.error('O1 Pro Intent Engine error:', error);
      return this.getFallbackIntentData(companyName, platform);
    }
  }

  private buildO1ProPrompt(companyName: string, platform: string): string {
    return `
    Conduct O1 Pro-level deep research analysis for ${companyName} focusing on ${platform} initiatives.

    RESEARCH METHODOLOGY (Apply O1 Pro reasoning):
    
    1. IMMEDIATE SIGNALS (0-30 days):
       - Recent job postings mentioning ${platform}
       - Executive announcements about ${platform} initiatives
       - Press releases about technology upgrades
       - Conference presentations or speaking engagements
    
    2. STRATEGIC INITIATIVES (30-180 days):
       - Digital transformation roadmaps
       - Platform migration projects
       - System consolidation efforts
       - Integration requirements
    
    3. COMPETITIVE POSITIONING:
       - Industry peers' ${platform} adoption
       - Regulatory compliance drivers
       - Market pressure for modernization
       - Operational efficiency requirements
    
    4. HIRING PATTERNS & JOB ANALYSIS:
       - ${platform} administrator roles
       - Implementation consultants
       - Business analysts with ${platform} experience
       - Project managers for ${platform} initiatives
       - Technical architects and developers
    
    5. PLATFORM-SPECIFIC INTELLIGENCE:
       For each technology platform found, identify:
       - Current version/edition in use
       - Upgrade/migration needs
       - Integration requirements
       - Training and adoption challenges
       - Budget allocation signals
    
    REQUIRED JSON OUTPUT STRUCTURE:
    {
      "intent_score": 0-100,
      "urgency_level": "low|medium|high|critical",
      "platform_signals": {
        "salesforce": { "confidence": 0-100, "evidence": [], "initiatives": [] },
        "oracle": { "confidence": 0-100, "evidence": [], "initiatives": [] },
        "sap": { "confidence": 0-100, "evidence": [], "initiatives": [] },
        "dynamics365": { "confidence": 0-100, "evidence": [], "initiatives": [] },
        "workday": { "confidence": 0-100, "evidence": [], "initiatives": [] },
        "servicenow": { "confidence": 0-100, "evidence": [], "initiatives": [] }
      },
      "job_postings": [
        {
          "title": "specific job title",
          "department": "department name",
          "platform_focus": "primary platform mentioned",
          "urgency_indicators": ["list of urgency signals"],
          "posted_date": "estimated timeframe",
          "key_requirements": ["specific skills/experience"]
        }
      ],
      "strategic_initiatives": [
        {
          "initiative_name": "specific project name",
          "platform": "primary platform",
          "timeline": "estimated timeline",
          "budget_signals": ["indicators of investment level"],
          "success_metrics": ["expected outcomes"]
        }
      ],
      "decision_makers": [
        {
          "role": "executive title",
          "department": "department",
          "platform_influence": "level of influence on platform decisions",
          "contact_priority": "high|medium|low"
        }
      ],
      "research_methodology": "explanation of data sources and analysis approach",
      "confidence_level": "overall confidence in findings (0-100%)",
      "next_research_steps": ["recommended follow-up research areas"]
    }
    
    CRITICAL REQUIREMENTS:
    - Focus specifically on ${platform} when provided
    - Highlight ALL enterprise platforms found (Salesforce, Oracle, SAP, Dynamics, etc.)
    - Provide specific evidence for each claim
    - Use O1 Pro-level reasoning to connect patterns across data sources
    - Estimate timeline and urgency based on multiple signals
    - Identify specific job posting requirements and decision maker roles
    `;
  }

  private structurePlatformIntentData(analysis: any, companyName: string, platform: string): PlatformIntentData {
    return {
      companyName,
      targetPlatform: platform,
      intentScore: analysis.intent_score || 0,
      urgencyLevel: analysis.urgency_level || 'low',
      platformSignals: analysis.platform_signals || {},
      jobPostings: analysis.job_postings || [],
      strategicInitiatives: analysis.strategic_initiatives || [],
      decisionMakers: analysis.decision_makers || [],
      researchMethodology: analysis.research_methodology || 'O1 Pro-level multi-source analysis',
      confidenceLevel: analysis.confidence_level || 50,
      nextResearchSteps: analysis.next_research_steps || [],
      lastUpdated: new Date(),
      dataQuality: 'high'
    };
  }

  private getFallbackIntentData(companyName: string, platform: string): PlatformIntentData {
    return {
      companyName,
      targetPlatform: platform,
      intentScore: 0,
      urgencyLevel: 'low',
      platformSignals: {},
      jobPostings: [],
      strategicInitiatives: [],
      decisionMakers: [],
      researchMethodology: 'Fallback data due to API limitations',
      confidenceLevel: 0,
      nextResearchSteps: ['Verify API connectivity', 'Retry with manual research'],
      lastUpdated: new Date(),
      dataQuality: 'low'
    };
  }
}

// Enhanced SCIPAB Framework Generator using GPT-4o
export class SCIPABFrameworkEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateSCIPABFramework(intentData: PlatformIntentData, researchData: any): Promise<SCIPABFramework> {
    const prompt = this.buildSCIPABPrompt(intentData, researchData);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a SCIPAB framework expert using GPT-4o to model consultative sales methodology.
            Generate precise SCIPAB analysis based ONLY on research data provided.
            
            SCIPAB Framework:
            - Situation: Current state analysis
            - Complication: Problems and challenges
            - Implication: Business impact and consequences  
            - Position: Our unique value proposition
            - Ask: Specific request for action
            - Benefit: Quantified outcomes and value
            
            Focus on QA automation value propositions:
            - 80% faster testing cycles
            - 60% reduction in bugs reaching production
            - 40% decrease in manual testing effort
            - $2M+ annual savings through automation
            - 95% test coverage improvement`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 2000
      });

      const scipab = JSON.parse(response.choices[0].message.content || '{}');
      return this.structureSCIPABFramework(scipab, intentData);
    } catch (error) {
      console.error('SCIPAB Framework generation error:', error);
      return this.getFallbackSCIPAB(intentData);
    }
  }

  private buildSCIPABPrompt(intentData: PlatformIntentData, researchData: any): string {
    return `
    Generate a SCIPAB framework for ${intentData.companyName} based on the following research data:
    
    PLATFORM FOCUS: ${intentData.targetPlatform}
    INTENT SCORE: ${intentData.intentScore}/100
    URGENCY: ${intentData.urgencyLevel}
    
    RESEARCH FINDINGS:
    ${JSON.stringify(researchData, null, 2)}
    
    PLATFORM SIGNALS:
    ${JSON.stringify(intentData.platformSignals, null, 2)}
    
    JOB POSTINGS EVIDENCE:
    ${JSON.stringify(intentData.jobPostings, null, 2)}
    
    Required JSON output:
    {
      "situation": {
        "current_state": "2-3 sentences about current platform situation",
        "key_systems": ["list of identified enterprise platforms"],
        "team_structure": "current QA/testing organization"
      },
      "complication": {
        "primary_challenges": ["main problems identified"],
        "platform_gaps": ["specific platform-related issues"],
        "testing_bottlenecks": ["QA automation challenges"]
      },
      "implication": {
        "business_impact": "quantified consequences",
        "financial_risk": "cost of inaction",
        "competitive_disadvantage": "market positioning risk"
      },
      "position": {
        "unique_value": "our differentiated approach",
        "platform_expertise": "specific platform capabilities",
        "proven_results": "relevant case studies or metrics"
      },
      "ask": {
        "primary_request": "specific next step",
        "meeting_purpose": "focused agenda",
        "decision_timeline": "proposed timeframe"
      },
      "benefit": {
        "quantified_outcomes": ["specific measurable benefits"],
        "timeline_to_value": "time to see results",
        "roi_projection": "expected return on investment"
      }
    }
    
    Base all content on the actual research data provided. Avoid generic statements.
    `;
  }

  private structureSCIPABFramework(scipab: any, intentData: PlatformIntentData): SCIPABFramework {
    return {
      companyName: intentData.companyName,
      platform: intentData.targetPlatform,
      situation: scipab.situation || { current_state: 'Analysis pending', key_systems: [], team_structure: 'Unknown' },
      complication: scipab.complication || { primary_challenges: [], platform_gaps: [], testing_bottlenecks: [] },
      implication: scipab.implication || { business_impact: 'To be determined', financial_risk: 'Analysis needed', competitive_disadvantage: 'Unknown' },
      position: scipab.position || { unique_value: 'QA automation expertise', platform_expertise: 'Multi-platform support', proven_results: 'Industry-leading results' },
      ask: scipab.ask || { primary_request: 'Schedule discovery call', meeting_purpose: 'Assess automation needs', decision_timeline: '30 days' },
      benefit: scipab.benefit || { quantified_outcomes: ['Faster testing', 'Fewer bugs', 'Cost savings'], timeline_to_value: '90 days', roi_projection: 'Positive ROI within 6 months' },
      createdAt: new Date(),
      confidence: intentData.confidenceLevel,
      dataQuality: intentData.dataQuality
    };
  }

  private getFallbackSCIPAB(intentData: PlatformIntentData): SCIPABFramework {
    return {
      companyName: intentData.companyName,
      platform: intentData.targetPlatform,
      situation: { 
        current_state: `${intentData.companyName} requires deeper research to understand current ${intentData.targetPlatform} implementation.`,
        key_systems: [intentData.targetPlatform],
        team_structure: 'Analysis pending'
      },
      complication: { 
        primary_challenges: ['Limited research data available'],
        platform_gaps: ['Requires manual investigation'],
        testing_bottlenecks: ['Unknown without discovery']
      },
      implication: { 
        business_impact: 'Cannot quantify without proper research',
        financial_risk: 'Potential missed opportunities',
        competitive_disadvantage: 'Delayed automation initiatives'
      },
      position: { 
        unique_value: 'Comprehensive QA automation platform',
        platform_expertise: `Deep ${intentData.targetPlatform} integration experience`,
        proven_results: '80% faster testing, 60% fewer bugs'
      },
      ask: { 
        primary_request: 'Schedule research and discovery session',
        meeting_purpose: 'Understand current state and automation needs',
        decision_timeline: 'Initial assessment within 2 weeks'
      },
      benefit: { 
        quantified_outcomes: ['80% faster testing cycles', '60% reduction in production bugs', '$2M+ annual savings'],
        timeline_to_value: '90-120 days',
        roi_projection: 'Positive ROI within 6 months'
      },
      createdAt: new Date(),
      confidence: 0,
      dataQuality: 'low'
    };
  }
}

// Type definitions
export interface PlatformIntentData {
  companyName: string;
  targetPlatform: string;
  intentScore: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  platformSignals: { [platform: string]: { confidence: number; evidence: string[]; initiatives: string[] } };
  jobPostings: Array<{
    title: string;
    department: string;
    platform_focus: string;
    urgency_indicators: string[];
    posted_date: string;
    key_requirements: string[];
  }>;
  strategicInitiatives: Array<{
    initiative_name: string;
    platform: string;
    timeline: string;
    budget_signals: string[];
    success_metrics: string[];
  }>;
  decisionMakers: Array<{
    role: string;
    department: string;
    platform_influence: string;
    contact_priority: 'high' | 'medium' | 'low';
  }>;
  researchMethodology: string;
  confidenceLevel: number;
  nextResearchSteps: string[];
  lastUpdated: Date;
  dataQuality: 'high' | 'medium' | 'low';
}

export interface SCIPABFramework {
  companyName: string;
  platform: string;
  situation: {
    current_state: string;
    key_systems: string[];
    team_structure: string;
  };
  complication: {
    primary_challenges: string[];
    platform_gaps: string[];
    testing_bottlenecks: string[];
  };
  implication: {
    business_impact: string;
    financial_risk: string;
    competitive_disadvantage: string;
  };
  position: {
    unique_value: string;
    platform_expertise: string;
    proven_results: string;
  };
  ask: {
    primary_request: string;
    meeting_purpose: string;
    decision_timeline: string;
  };
  benefit: {
    quantified_outcomes: string[];
    timeline_to_value: string;
    roi_projection: string;
  };
  createdAt: Date;
  confidence: number;
  dataQuality: 'high' | 'medium' | 'low';
}