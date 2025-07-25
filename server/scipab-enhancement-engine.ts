import OpenAI from "openai";
import { IntentDiscoveryEngine, IntentSignal } from "./intent-discovery-engine";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ScipabEnhancedInput {
  company_name: string;
  industry?: string;
  role_title: string;  // e.g., Director of QA, Head of IT Ops
  system_type: string; // e.g., Dynamics 365, Oracle, SAP
  intent_signal?: string; // e.g., "migrating to Dynamics 365," "expanding Salesforce footprint"
  pain_points?: string; // optional: defaults pulled from database by industry + role
  urgency_level?: 'critical' | 'high' | 'medium' | 'low';
}

export interface ScipabEnhancedOutput {
  situation: string;
  complication: string;
  implication: string;
  position: string;
  action: string;
  benefit: string;
  tone_profile: 'executive' | 'practitioner';
  confidence_score: number;
  data_sources: string[];
  version: string;
  generated_at: string;
}

export interface ScipabGenerationResponse {
  scipab: ScipabEnhancedOutput;
  intent_data?: IntentSignal;
  markdown_output: string;
  copy_ready: boolean;
}

export class ScipabEnhancementEngine {
  private intentEngine: IntentDiscoveryEngine;

  constructor() {
    this.intentEngine = new IntentDiscoveryEngine();
  }

  async generateEnhancedScipab(input: ScipabEnhancedInput): Promise<ScipabGenerationResponse> {
    console.log(`🚀 Starting SCIPAB Enhancement Engine v1.5 for ${input.company_name}`);
    
    try {
      // Step 1: Pull real-time data from Intent Discovery engine
      const intentData = await this.pullIntentData(input.company_name, input.system_type);
      
      // Step 2: Determine tone profile based on role level
      const toneProfile = this.determineToneProfile(input.role_title);
      
      // Step 3: Build context-aware prompt
      const prompt = this.buildEnhancedPrompt(input, intentData, toneProfile);
      
      // Step 4: Generate SCIPAB with GPT-4o
      const scipabOutput = await this.generateScipabContent(prompt, input, toneProfile);
      
      // Step 5: Format as Markdown
      const markdownOutput = this.formatAsMarkdown(scipabOutput);
      
      const response: ScipabGenerationResponse = {
        scipab: scipabOutput,
        intent_data: intentData,
        markdown_output: markdownOutput,
        copy_ready: true
      };
      
      console.log(`✅ SCIPAB Enhancement complete for ${input.company_name} - Score: ${scipabOutput.confidence_score}`);
      return response;
      
    } catch (error) {
      console.error(`❌ SCIPAB Enhancement error for ${input.company_name}:`, error);
      return this.generateFallbackScipab(input);
    }
  }

  private async pullIntentData(companyName: string, systemType: string): Promise<IntentSignal | undefined> {
    try {
      // Check if company exists in Intent Discovery engine
      console.log(`🔍 Checking Intent Discovery for ${companyName} - ${systemType}`);
      
      // Search for recent intent signals for this company
      const searchFilters = {
        industry: "Technology",
        erpCrmSystem: systemType,
        companyKeywords: companyName,
        timeframe: 90,
        minConfidenceScore: 70,
        searchMode: "semantic" as const
      };
      
      const intentResults = await this.intentEngine.discoverIntentSignals(searchFilters);
      
      // Find most relevant signal for this company
      const relevantSignal = intentResults.find(signal => 
        signal.companyName.toLowerCase().includes(companyName.toLowerCase()) ||
        companyName.toLowerCase().includes(signal.companyName.toLowerCase())
      );
      
      if (relevantSignal) {
        console.log(`✅ Found intent data for ${companyName}: ${relevantSignal.signalType}`);
        return relevantSignal;
      }
      
      console.log(`ℹ️ No specific intent data found for ${companyName}, using generic approach`);
      return undefined;
      
    } catch (error) {
      console.error("Error pulling intent data:", error);
      return undefined;
    }
  }

  private determineToneProfile(roleTitle: string): 'executive' | 'practitioner' {
    const executiveKeywords = ['vp', 'vice president', 'director', 'head of', 'chief', 'cto', 'cio', 'cxo', 'president', 'senior director'];
    const practitionerKeywords = ['engineer', 'analyst', 'specialist', 'coordinator', 'manager', 'lead', 'senior', 'principal'];
    
    const roleLower = roleTitle.toLowerCase();
    
    // Check for executive keywords first (higher priority)
    if (executiveKeywords.some(keyword => roleLower.includes(keyword))) {
      return 'executive';
    }
    
    // Default to practitioner for hands-on roles
    return 'practitioner';
  }

  private buildEnhancedPrompt(
    input: ScipabEnhancedInput, 
    intentData: IntentSignal | undefined, 
    toneProfile: 'executive' | 'practitioner'
  ): string {
    const situationContext = intentData 
      ? `Current intelligence shows ${input.company_name} has recent signals: ${intentData.signalType}. Initiative urgency: ${intentData.urgencyLevel}. Platform focus: ${input.system_type}.`
      : `${input.company_name} operates in the ${input.industry || 'technology'} industry with ${input.system_type} systems. ${input.intent_signal || 'Recent enterprise modernization initiatives identified.'} `;

    const painPointsContext = input.pain_points || this.getDefaultPainPoints(input.industry, input.role_title);
    
    return `
You are an expert B2B sales consultant specializing in QA test automation for enterprise systems. Generate a SCIPAB framework analysis using this exact structure:

**COMPANY CONTEXT:**
- Company: ${input.company_name}
- Industry: ${input.industry || 'Technology'}
- Role: ${input.role_title}
- System Focus: ${input.system_type}
- Intent Signal: ${input.intent_signal || 'System modernization initiatives'}
- Pain Points: ${painPointsContext}
- Intent Data: ${intentData ? `Active - ${intentData.signalType}` : 'Researching - using industry trends'}

**TONE PROFILE:** ${toneProfile === 'executive' ? 'Executive (Risk & ROI focused)' : 'Practitioner (Efficiency & Speed focused)'}

**SCIPAB REQUIREMENTS:**
1. **SITUATION**: ${intentData ? 'Use the intent data as primary context' : 'Use industry trends and role-based challenges'}
2. **COMPLICATION**: Link ${input.system_type} changes to QA/SDLC bottlenecks specific to ${input.role_title}
3. **IMPLICATION**: ${toneProfile === 'executive' ? 'Business risk, financial impact, competitive disadvantage' : 'Team efficiency, manual workload, testing delays'}
4. **POSITION**: Always mention Avo Automation is:
   - Recognized in Gartner's Market Guide
   - Used by Fortune 500 teams for Dynamics 365, SAP, and 200+ technologies  
   - Business-user-friendly (no-code)
   - Specializes in ${input.system_type} testing automation
5. **ACTION**: ${toneProfile === 'executive' ? 'Request strategic meeting to discuss ROI and risk mitigation' : 'Request technical demo to show efficiency gains'}
6. **BENEFIT**: Quantifiable outcomes - 80% faster testing, 60% fewer bugs, $2M+ annual savings

**OUTPUT FORMAT:** Return only JSON with these exact fields:
{
  "situation": "string",
  "complication": "string", 
  "implication": "string",
  "position": "string",
  "action": "string",
  "benefit": "string"
}

Make each section 2-3 sentences maximum. Be specific to ${input.company_name} and ${input.system_type}.
`;
  }

  private async generateScipabContent(
    prompt: string, 
    input: ScipabEnhancedInput, 
    toneProfile: 'executive' | 'practitioner'
  ): Promise<ScipabEnhancedOutput> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert sales consultant specializing in QA automation and enterprise systems. Generate precise, personalized SCIPAB analysis that connects ${input.system_type} initiatives to test automation urgency.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const scipabData = JSON.parse(content);
    
    return {
      situation: scipabData.situation || "Analysis pending for company context",
      complication: scipabData.complication || "System integration challenges identified",
      implication: scipabData.implication || "Operational efficiency and risk concerns",
      position: scipabData.position || "Avo Automation provides comprehensive QA solutions",
      action: scipabData.action || "Schedule discovery call to assess automation opportunities", 
      benefit: scipabData.benefit || "80% faster testing, 60% fewer bugs, significant cost savings",
      tone_profile: toneProfile,
      confidence_score: this.calculateConfidenceScore(input),
      data_sources: this.getDataSources(input),
      version: "SCIPAB_v1.5",
      generated_at: new Date().toISOString()
    };
  }

  private getDefaultPainPoints(industry?: string, roleTitle?: string): string {
    const roleBasedPains: Record<string, string> = {
      'qa': 'Manual testing bottlenecks, regression test overhead, release delays',
      'director': 'Resource allocation challenges, quality assurance scalability, budget optimization',
      'manager': 'Team productivity, testing coverage gaps, automation adoption',
      'engineer': 'Manual test execution, test maintenance overhead, limited test coverage'
    };

    const industryPains: Record<string, string> = {
      'technology': 'Rapid release cycles, complex integrations, multi-platform testing',
      'financial': 'Regulatory compliance testing, data security validation, high reliability requirements',
      'healthcare': 'HIPAA compliance, patient safety validation, regulatory testing requirements',
      'manufacturing': 'ERP system testing, supply chain validation, compliance requirements'
    };

    const roleLower = roleTitle?.toLowerCase() || '';
    const industryLower = industry?.toLowerCase() || '';

    // Find role-based pain points
    const roleKey = Object.keys(roleBasedPains).find(key => roleLower.includes(key));
    const rolePains = roleKey ? roleBasedPains[roleKey] : roleBasedPains['qa'];

    // Find industry-based pain points  
    const industryKey = Object.keys(industryPains).find(key => industryLower.includes(key));
    const sectorPains = industryKey ? industryPains[industryKey] : industryPains['technology'];

    return `${rolePains}. Industry-specific: ${sectorPains}`;
  }

  private calculateConfidenceScore(input: ScipabEnhancedInput): number {
    let score = 70; // Base score
    
    if (input.intent_signal && input.intent_signal.length > 10) score += 15;
    if (input.pain_points && input.pain_points.length > 10) score += 10;
    if (input.industry) score += 5;
    
    return Math.min(score, 95);
  }

  private getDataSources(input: ScipabEnhancedInput): string[] {
    const sources = ['AI Analysis', 'Industry Best Practices'];
    
    if (input.intent_signal) sources.push('Intent Discovery Engine');
    if (input.pain_points) sources.push('Custom Pain Point Analysis');
    
    return sources;
  }

  private formatAsMarkdown(scipab: ScipabEnhancedOutput): string {
    return `# SCIPAB Analysis - ${scipab.version}

**SITUATION:** ${scipab.situation}

**COMPLICATION:** ${scipab.complication}

**IMPLICATION:** ${scipab.implication}

**POSITION:** ${scipab.position}

**ACTION:** ${scipab.action}

**BENEFIT:** ${scipab.benefit}

---
*Generated: ${new Date(scipab.generated_at).toLocaleString()}*  
*Confidence Score: ${scipab.confidence_score}%*  
*Tone Profile: ${scipab.tone_profile}*  
*Data Sources: ${scipab.data_sources.join(', ')}*
`;
  }

  private generateFallbackScipab(input: ScipabEnhancedInput): ScipabGenerationResponse {
    const fallbackScipab: ScipabEnhancedOutput = {
      situation: `${input.company_name} operates in the ${input.industry || 'technology'} sector with ${input.system_type} systems requiring comprehensive quality assurance coverage.`,
      complication: `Manual testing processes and ${input.system_type} integration complexities create bottlenecks for ${input.role_title} and the QA team.`,
      implication: "These testing challenges result in slower release cycles, increased risk of production bugs, and higher operational costs impacting business competitiveness.",
      position: "Avo Automation provides a no-code QA platform specifically designed for ${input.system_type} environments, recognized in Gartner's Market Guide and trusted by Fortune 500 companies.",
      action: `Schedule a ${input.role_title}-focused demo to explore ${input.system_type} testing automation opportunities and discuss implementation strategy.`,
      benefit: "Achieve 80% reduction in testing time, 60% fewer production bugs, and $2M+ annual savings through automated QA processes.",
      tone_profile: this.determineToneProfile(input.role_title),
      confidence_score: 65,
      data_sources: ['Fallback Analysis', 'Industry Standards'],
      version: "SCIPAB_v1.5_Fallback",
      generated_at: new Date().toISOString()
    };

    return {
      scipab: fallbackScipab,
      markdown_output: this.formatAsMarkdown(fallbackScipab),
      copy_ready: true
    };
  }

  // Test method for New Balance example
  async testNewBalanceExample(): Promise<ScipabGenerationResponse> {
    const testInput: ScipabEnhancedInput = {
      company_name: "New Balance",
      industry: "Athletic Footwear & Apparel", 
      role_title: "QA Manager",
      system_type: "Dynamics 365",
      intent_signal: "Migrating to cloud-based ERP",
      pain_points: "Manual testing processes, ERP integration validation, multi-channel commerce testing"
    };

    console.log("🧪 Testing SCIPAB Enhancement Engine with New Balance example...");
    return await this.generateEnhancedScipab(testInput);
  }
}

export const scipabEnhancementEngine = new ScipabEnhancementEngine();