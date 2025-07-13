/**
 * Platform-Specific Research Engine
 * Focuses on enterprise platform initiatives and testing requirements
 */

import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface PlatformResearchResult {
  platform: string;
  companyName: string;
  initiatives: PlatformInitiative[];
  hiringSignals: HiringSignal[];
  testingRequirements: TestingRequirement[];
  migrationProjects: MigrationProject[];
  keyPersonnel: KeyPersonnel[];
  researchQuality: string;
  lastUpdated: string;
}

interface PlatformInitiative {
  title: string;
  description: string;
  stage: string; // planning, implementation, testing, rollout
  timeline: string;
  testingNeeds: string[];
  source: string;
}

interface HiringSignal {
  jobTitle: string;
  department: string;
  postedDate: string;
  keyRequirements: string[];
  testingMentions: string[];
  urgencyLevel: string; // low, medium, high
  source: string;
}

interface TestingRequirement {
  area: string; // integration, performance, security, user acceptance
  description: string;
  priority: string;
  platforms: string[];
  automationOpportunity: string;
}

interface MigrationProject {
  fromSystem: string;
  toSystem: string;
  scope: string;
  timeline: string;
  testingChallenges: string[];
  riskLevel: string;
}

interface KeyPersonnel {
  name?: string;
  title: string;
  department: string;
  linkedInProfile?: string;
  relevanceScore: number;
}

export class PlatformResearchEngine {
  
  async researchPlatformInitiatives(
    companyName: string, 
    platform: 'salesforce' | 'sap' | 'oracle' | 'dynamics'
  ): Promise<PlatformResearchResult> {
    
    const researchPrompt = this.buildResearchPrompt(companyName, platform);
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert enterprise systems research analyst specializing in ${platform.toUpperCase()} implementations, migrations, and testing requirements. You conduct deep research across job boards, news sources, company websites, press releases, and industry publications to identify real initiatives and testing needs.

CRITICAL: Only return findings based on publicly available information. If you cannot find specific information about a company's ${platform.toUpperCase()} initiatives, clearly state this rather than making assumptions.

Your research should focus on:
1. Current ${platform.toUpperCase()} implementation or migration projects
2. Job postings for ${platform.toUpperCase()}-related roles with testing requirements
3. Recent announcements about ${platform.toUpperCase()} initiatives
4. Testing, QA, and quality challenges mentioned in context of ${platform.toUpperCase()}
5. Key personnel leading ${platform.toUpperCase()} initiatives

Format your response as structured JSON with the exact schema provided.`
          },
          {
            role: "user",
            content: researchPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      // Parse the JSON response
      const researchData = JSON.parse(response);
      
      return {
        platform,
        companyName,
        ...researchData,
        researchQuality: "ai-enhanced",
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Platform research failed for ${companyName} (${platform}):`, error);
      
      // Return minimal structure indicating research failed
      return {
        platform,
        companyName,
        initiatives: [],
        hiringSignals: [],
        testingRequirements: [],
        migrationProjects: [],
        keyPersonnel: [],
        researchQuality: "research-unavailable",
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private buildResearchPrompt(companyName: string, platform: string): string {
    const platformSpecs = {
      salesforce: {
        roles: ['Salesforce Admin', 'Salesforce Architect', 'Salesforce Developer', 'Salesforce Business Analyst', 'CRM Manager'],
        keywords: ['Salesforce implementation', 'CRM migration', 'Sales Cloud', 'Service Cloud', 'Marketing Cloud', 'Lightning migration'],
        testingAreas: ['Salesforce testing', 'CRM data migration testing', 'integration testing', 'user acceptance testing', 'automation testing']
      },
      sap: {
        roles: ['SAP Lead', 'SAP Business Analyst', 'SAP Functional Consultant', 'SAP Technical Consultant', 'ERP Manager'],
        keywords: ['SAP implementation', 'S/4HANA migration', 'ERP upgrade', 'SAP Fiori', 'SAP SuccessFactors'],
        testingAreas: ['SAP testing', 'ERP migration testing', 'integration testing', 'performance testing', 'regression testing']
      },
      oracle: {
        roles: ['Oracle DBA', 'Oracle Functional Consultant', 'Oracle Technical Lead', 'ERP Business Analyst'],
        keywords: ['Oracle Fusion', 'Oracle Cloud', 'ERP implementation', 'Oracle EBS upgrade', 'database migration'],
        testingAreas: ['Oracle testing', 'database migration testing', 'ERP testing', 'performance testing', 'data validation']
      },
      dynamics: {
        roles: ['Dynamics 365 Consultant', 'Power Platform Developer', 'Business Applications Analyst', 'CRM Administrator'],
        keywords: ['Dynamics 365', 'Power Platform', 'Microsoft CRM', 'Business Central', 'Power Apps'],
        testingAreas: ['Dynamics testing', 'Power Platform testing', 'CRM testing', 'workflow testing', 'integration testing']
      }
    };

    const spec = platformSpecs[platform as keyof typeof platformSpecs];

    return `Research ${companyName} for ${platform.toUpperCase()} platform initiatives and testing requirements.

Focus on finding:

1. **${platform.toUpperCase()} INITIATIVES & PROJECTS:**
   - Recent announcements about ${spec.keywords.join(', ')}
   - Implementation timelines and project stages
   - Budget allocations and strategic priorities
   - Partnership announcements with ${platform.toUpperCase()} vendors

2. **HIRING SIGNALS & JOB POSTINGS:**
   - Recent postings for: ${spec.roles.join(', ')}
   - Job descriptions mentioning: ${spec.testingAreas.join(', ')}
   - Contract vs full-time hiring patterns
   - Urgency indicators in job postings

3. **TESTING & QA REQUIREMENTS:**
   - Specific mentions of: ${spec.testingAreas.join(', ')}
   - Quality assurance challenges in ${platform.toUpperCase()} context
   - Automation testing needs
   - Integration testing requirements

4. **MIGRATION & IMPLEMENTATION PROJECTS:**
   - Legacy system migrations to ${platform.toUpperCase()}
   - Upgrade projects and modernization efforts
   - Timeline pressures and go-live dates
   - Testing bottlenecks and challenges

5. **KEY PERSONNEL:**
   - Leaders of ${platform.toUpperCase()} initiatives
   - Recently hired ${platform.toUpperCase()} specialists
   - Consultants and implementation partners

Return findings in this exact JSON structure:
{
  "initiatives": [
    {
      "title": "string",
      "description": "string", 
      "stage": "planning|implementation|testing|rollout",
      "timeline": "string",
      "testingNeeds": ["array of testing requirements"],
      "source": "string (where you found this information)"
    }
  ],
  "hiringSignals": [
    {
      "jobTitle": "string",
      "department": "string", 
      "postedDate": "string",
      "keyRequirements": ["array of key requirements"],
      "testingMentions": ["array of testing-related requirements"],
      "urgencyLevel": "low|medium|high",
      "source": "string"
    }
  ],
  "testingRequirements": [
    {
      "area": "integration|performance|security|user_acceptance|automation",
      "description": "string",
      "priority": "low|medium|high", 
      "platforms": ["array of systems to test"],
      "automationOpportunity": "string"
    }
  ],
  "migrationProjects": [
    {
      "fromSystem": "string",
      "toSystem": "string",
      "scope": "string",
      "timeline": "string", 
      "testingChallenges": ["array of testing challenges"],
      "riskLevel": "low|medium|high"
    }
  ],
  "keyPersonnel": [
    {
      "title": "string",
      "department": "string",
      "relevanceScore": 0-100
    }
  ]
}

If you cannot find specific information about ${companyName}'s ${platform.toUpperCase()} initiatives, return empty arrays for each section and note this in the response.`;
  }

  // Helper method to extract testing opportunities from platform research
  getTestingOpportunities(research: PlatformResearchResult): {
    automationOpportunities: string[];
    highPriorityAreas: string[];
    migrationRisks: string[];
  } {
    const automationOpportunities = research.testingRequirements
      .filter(req => req.automationOpportunity && req.automationOpportunity !== 'None')
      .map(req => req.automationOpportunity);

    const highPriorityAreas = research.testingRequirements
      .filter(req => req.priority === 'high')
      .map(req => req.area);

    const migrationRisks = research.migrationProjects
      .filter(proj => proj.riskLevel === 'high')
      .flatMap(proj => proj.testingChallenges);

    return {
      automationOpportunities,
      highPriorityAreas,
      migrationRisks
    };
  }
}

export const platformResearchEngine = new PlatformResearchEngine();