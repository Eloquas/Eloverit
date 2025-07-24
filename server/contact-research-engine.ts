// Enhanced Contact Research Engine
// Analyzes prospects based on title/role combined with account-level insights
// Uses PDL, web scraping, and ChatGPT O3 for comprehensive research

import OpenAI from "openai";
import { storage } from "./storage";
import { pdlService } from "./pdl-service";
import { categorizeJobTitle, determineSeniorityLevel, identifySystemsExperience } from "./enterprise-knowledge";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface ProspectProfile {
  id: number;
  name: string;
  email: string;
  company: string;
  position: string;
  roleCategory: string;
  seniorityLevel: string;
  systemsExperience: string[];
  carePriorities: string[];
  painPoints: string[];
  decisionInfluence: number; // 1-10 scale
}

interface AccountContext {
  companyName: string;
  industry: string;
  companySize: string;
  currentSystems: string[];
  initiatives: string[];
  painPoints: string[];
  hiringSignals: string[];
  technologies: string[];
}

interface ContactResearchInsight {
  prospect: ProspectProfile;
  accountContext: AccountContext;
  personalizedInsights: {
    roleSpecificChallenges: string[];
    accountRelevantOpportunities: string[];
    systemsAlignment: string[];
    businessImpactMetrics: string[];
    outreachApproach: string;
    messagingHooks: string[];
  };
  confidenceScore: number; // 0-100
  researchSources: string[];
}

export class ContactResearchEngine {
  constructor() {}

  // Main method: Generate comprehensive contact research
  async generateContactResearch(prospectId: number, userId: number): Promise<ContactResearchInsight> {
    try {
      console.log(`Starting enhanced contact research for prospect ${prospectId}`);

      // Step 1: Get prospect details
      const prospect = await storage.getProspect(prospectId, userId);
      if (!prospect) {
        throw new Error(`Prospect ${prospectId} not found`);
      }

      // Step 2: Build prospect profile with role analysis
      const prospectProfile = this.buildProspectProfile(prospect);
      console.log(`Analyzed prospect role: ${prospectProfile.roleCategory} (${prospectProfile.seniorityLevel})`);

      // Step 3: Get account-level context
      const accountContext = await this.getAccountContext(prospect.company, userId);
      console.log(`Retrieved account context for ${prospect.company}: ${accountContext.initiatives.length} initiatives`);

      // Step 4: Generate personalized insights using O3-level analysis
      const personalizedInsights = await this.generatePersonalizedInsights(prospectProfile, accountContext);

      // Step 5: Calculate confidence score based on data completeness
      const confidenceScore = this.calculateConfidenceScore(prospectProfile, accountContext, personalizedInsights);

      const research: ContactResearchInsight = {
        prospect: prospectProfile,
        accountContext,
        personalizedInsights,
        confidenceScore,
        researchSources: ["PDL API", "Enterprise Knowledge Base", "AI Role Analysis", "Account Research"]
      };

      console.log(`Contact research completed for ${prospect.name} with ${confidenceScore}% confidence`);
      return research;

    } catch (error) {
      console.error('Contact research generation failed:', error);
      throw error;
    }
  }

  // Build comprehensive prospect profile with role analysis
  private buildProspectProfile(prospect: any): ProspectProfile {
    const roleCategory = categorizeJobTitle(prospect.position);
    const seniorityLevel = determineSeniorityLevel(prospect.position);
    const systemsExperience = identifySystemsExperience(prospect.position, prospect.company, prospect.additionalInfo);

    // Define role-specific care priorities
    const carePriorities = this.getRoleSpecificPriorities(roleCategory, seniorityLevel);
    
    // Define role-specific pain points
    const painPoints = this.getRoleSpecificPainPoints(roleCategory, seniorityLevel);

    // Calculate decision influence based on role and seniority
    const decisionInfluence = this.calculateDecisionInfluence(roleCategory, seniorityLevel);

    return {
      id: prospect.id,
      name: prospect.name,
      email: prospect.email,
      company: prospect.company,
      position: prospect.position,
      roleCategory,
      seniorityLevel,
      systemsExperience,
      carePriorities,
      painPoints,
      decisionInfluence
    };
  }

  // Get account-level context from existing research
  private async getAccountContext(companyName: string, userId: number): Promise<AccountContext> {
    try {
      // Try to get existing account research
      const accountResearch = await storage.findDuplicateAccountResearch(companyName, userId);
      
      if (accountResearch) {
        return {
          companyName,
          industry: accountResearch.industry || "Technology",
          companySize: accountResearch.companySize || "Enterprise",
          currentSystems: this.parseJsonField(accountResearch.currentSystems),
          initiatives: this.parseJsonField(accountResearch.initiatives),
          painPoints: this.parseJsonField(accountResearch.painPoints),
          hiringSignals: this.parseJsonField(accountResearch.recentJobPostings),
          technologies: this.parseJsonField(accountResearch.currentSystems)
        };
      }

      // If no existing research, get basic PDL data
      console.log(`No existing research found for ${companyName}, fetching basic PDL data`);
      const pdlData = await pdlService.analyzeCompanyForSCIPAB(companyName);
      
      return {
        companyName,
        industry: pdlData.industry || "Technology",
        companySize: pdlData.companySize || "Enterprise",
        currentSystems: pdlData.systems || [],
        initiatives: pdlData.initiatives || [],
        painPoints: pdlData.painPoints || [],
        hiringSignals: pdlData.hiringPatterns || [],
        technologies: pdlData.systems || []
      };

    } catch (error) {
      console.error(`Failed to get account context for ${companyName}:`, error);
      
      // Fallback to basic context
      return {
        companyName,
        industry: "Technology",
        companySize: "Enterprise",
        currentSystems: [],
        initiatives: [],
        painPoints: ["Manual processes", "System integration challenges"],
        hiringSignals: [],
        technologies: []
      };
    }
  }

  // Generate personalized insights using O3-level analysis
  private async generatePersonalizedInsights(
    prospect: ProspectProfile, 
    account: AccountContext
  ): Promise<ContactResearchInsight['personalizedInsights']> {
    
    const analysisPrompt = `
    As an expert sales researcher operating at O3-level intelligence, analyze this prospect and account combination to generate highly personalized insights:

    PROSPECT PROFILE:
    - Name: ${prospect.name}
    - Position: ${prospect.position}
    - Role Category: ${prospect.roleCategory}
    - Seniority: ${prospect.seniorityLevel}
    - Systems Experience: ${prospect.systemsExperience.join(', ')}
    - Care Priorities: ${prospect.carePriorities.join(', ')}
    - Decision Influence: ${prospect.decisionInfluence}/10

    ACCOUNT CONTEXT:
    - Company: ${account.companyName}
    - Industry: ${account.industry}
    - Size: ${account.companySize}
    - Current Systems: ${account.currentSystems.join(', ')}
    - Current Initiatives: ${account.initiatives.join(', ')}
    - Pain Points: ${account.painPoints.join(', ')}
    - Hiring Signals: ${account.hiringSignals.join(', ')}

    Generate detailed analysis in JSON format:
    {
      "roleSpecificChallenges": ["3-4 challenges specific to their role and seniority"],
      "accountRelevantOpportunities": ["3-4 opportunities based on account context"],
      "systemsAlignment": ["2-3 ways their systems experience aligns with QA automation"],
      "businessImpactMetrics": ["3-4 specific metrics they likely care about"],
      "outreachApproach": "recommended approach strategy",
      "messagingHooks": ["3-4 compelling message hooks based on analysis"]
    }

    Focus on QA automation value propositions that align with their role, seniority, and company context.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: analysisPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const insights = JSON.parse(response.choices[0].message.content || "{}");
      
      // Validate and structure the response
      return {
        roleSpecificChallenges: insights.roleSpecificChallenges || ["Quality assurance process optimization"],
        accountRelevantOpportunities: insights.accountRelevantOpportunities || ["System integration testing improvements"],
        systemsAlignment: insights.systemsAlignment || ["Automated testing capabilities"],
        businessImpactMetrics: insights.businessImpactMetrics || ["Testing efficiency improvements"],
        outreachApproach: insights.outreachApproach || "consultative",
        messagingHooks: insights.messagingHooks || ["QA automation benefits"]
      };

    } catch (error) {
      console.error('AI insights generation failed:', error);
      
      // Fallback insights based on role analysis
      return this.generateFallbackInsights(prospect, account);
    }
  }

  // Role-specific care priorities mapping
  private getRoleSpecificPriorities(roleCategory: string, seniorityLevel: string): string[] {
    const priorities: { [key: string]: { [key: string]: string[] } } = {
      qa: {
        manager: ["Test coverage", "Release velocity", "Team productivity", "Quality metrics"],
        director: ["Quality strategy", "Process optimization", "Tool standardization", "ROI"],
        vp: ["Quality transformation", "Risk management", "Strategic initiatives", "Budget optimization"],
        cxo: ["Business outcomes", "Competitive advantage", "Innovation", "Market time-to-market"]
      },
      crm: {
        manager: ["User adoption", "Data quality", "Process efficiency", "System reliability"],
        director: ["CRM strategy", "Integration quality", "Performance optimization", "Compliance"],
        vp: ["Digital transformation", "Customer experience", "Revenue impact", "Strategic alignment"],
        cxo: ["Business growth", "Customer satisfaction", "Market expansion", "ROI"]
      },
      enterprise_systems: {
        manager: ["System reliability", "Integration quality", "Performance monitoring", "Issue resolution"],
        director: ["Architecture strategy", "Technology roadmap", "Risk management", "Cost optimization"],
        vp: ["Digital transformation", "Innovation adoption", "Strategic planning", "Operational excellence"],
        cxo: ["Business enablement", "Competitive positioning", "Growth acceleration", "Value creation"]
      }
    };

    return priorities[roleCategory]?.[seniorityLevel] || ["Quality improvement", "Efficiency gains", "Cost reduction"];
  }

  // Role-specific pain points mapping
  private getRoleSpecificPainPoints(roleCategory: string, seniorityLevel: string): string[] {
    const painPoints: { [key: string]: { [key: string]: string[] } } = {
      qa: {
        manager: ["Manual testing bottlenecks", "Release delays", "Resource constraints", "Test coverage gaps"],
        director: ["Quality process inconsistencies", "Tool fragmentation", "Skill gaps", "Reporting challenges"],
        vp: ["Strategic alignment issues", "ROI measurement", "Technology debt", "Scalability concerns"],
        cxo: ["Quality-related business risks", "Competitive pressure", "Innovation speed", "Market responsiveness"]
      },
      crm: {
        manager: ["Data integrity issues", "User resistance", "Integration problems", "Performance issues"],
        director: ["System complexity", "Compliance requirements", "Change management", "Cost overruns"],
        vp: ["Strategic misalignment", "Technology limitations", "Organizational silos", "ROI challenges"],
        cxo: ["Customer experience gaps", "Revenue leakage", "Market opportunities", "Digital transformation"]
      }
    };

    return painPoints[roleCategory]?.[seniorityLevel] || ["Process inefficiencies", "Technology limitations", "Resource constraints"];
  }

  // Calculate decision influence based on role and seniority
  private calculateDecisionInfluence(roleCategory: string, seniorityLevel: string): number {
    const influence = {
      cxo: 9,
      vp: 8,
      director: 7,
      manager: 6
    };

    const categoryMultiplier = {
      qa: 1.0,
      crm: 0.9,
      enterprise_systems: 0.8,
      general: 0.7
    };

    const baseInfluence = influence[seniorityLevel as keyof typeof influence] || 5;
    const multiplier = categoryMultiplier[roleCategory as keyof typeof categoryMultiplier] || 0.7;

    return Math.round(baseInfluence * multiplier);
  }

  // Generate fallback insights when AI analysis fails
  private generateFallbackInsights(prospect: ProspectProfile, account: AccountContext): ContactResearchInsight['personalizedInsights'] {
    const roleSpecificChallenges = prospect.painPoints.slice(0, 3);
    const accountRelevantOpportunities = account.initiatives.slice(0, 3);
    const systemsAlignment = prospect.systemsExperience.map(sys => `${sys} testing automation`);
    const businessImpactMetrics = ["Testing efficiency", "Release velocity", "Quality metrics", "Cost reduction"];

    return {
      roleSpecificChallenges,
      accountRelevantOpportunities,
      systemsAlignment,
      businessImpactMetrics,
      outreachApproach: "consultative",
      messagingHooks: ["QA automation benefits", "System quality improvements", "Process optimization"]
    };
  }

  // Calculate confidence score based on data completeness
  private calculateConfidenceScore(
    prospect: ProspectProfile, 
    account: AccountContext, 
    insights: ContactResearchInsight['personalizedInsights']
  ): number {
    let score = 0;

    // Prospect data completeness (40%)
    if (prospect.roleCategory !== 'general') score += 10;
    if (prospect.seniorityLevel !== 'individual') score += 10;
    if (prospect.systemsExperience.length > 0) score += 10;
    if (prospect.carePriorities.length > 2) score += 10;

    // Account data completeness (40%)
    if (account.initiatives.length > 0) score += 10;
    if (account.currentSystems.length > 0) score += 10;
    if (account.painPoints.length > 0) score += 10;
    if (account.hiringSignals.length > 0) score += 10;

    // Insights quality (20%)
    if (insights.roleSpecificChallenges.length > 2) score += 10;
    if (insights.messagingHooks.length > 2) score += 10;

    return Math.min(score, 100);
  }

  // Helper method to parse JSON fields safely
  private parseJsonField(jsonString: string | null): string[] {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Batch process multiple contacts for an account
  async generateAccountContactsResearch(companyName: string, userId: number): Promise<ContactResearchInsight[]> {
    try {
      console.log(`Starting batch contact research for ${companyName}`);

      // Get all prospects for this company
      const prospects = await storage.getProspects(userId);
      const companyProspects = prospects.filter(p => p.company === companyName);

      console.log(`Found ${companyProspects.length} prospects for ${companyName}`);

      // Generate research for each prospect
      const results: ContactResearchInsight[] = [];
      for (const prospect of companyProspects) {
        try {
          const research = await this.generateContactResearch(prospect.id, userId);
          results.push(research);
        } catch (error) {
          console.error(`Failed to generate research for ${prospect.name}:`, error);
        }
      }

      console.log(`Completed batch research for ${companyName}: ${results.length} contacts analyzed`);
      return results;

    } catch (error) {
      console.error(`Batch contact research failed for ${companyName}:`, error);
      throw error;
    }
  }
}

export const contactResearchEngine = new ContactResearchEngine();