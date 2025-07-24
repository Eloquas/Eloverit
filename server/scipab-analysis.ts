import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ScipabAnalysis {
  situation: string;
  complication: string;
  implication: string;
  position: string;
  ask: string;
  benefit: string;
}

export interface CompanyData {
  name?: string;
  industry?: string;
  employee_count?: number;
  revenue?: string;
  description?: string;
  technologies?: string[];
  location?: {
    country?: string;
    region?: string;
  };
  founded?: number;
  website?: string;
}

export class ScipabAnalysisEngine {
  async generateScipabAnalysis(
    companyData: CompanyData,
    extraContext?: string
  ): Promise<ScipabAnalysis> {
    try {
      const prompt = this.buildScipabPrompt(companyData, extraContext);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in QA test automation and B2B sales, specializing in enterprise software quality assurance solutions. You understand the SCIPAB methodology (Situation, Complication, Implication, Position, Ask, Benefit) and how to apply it to B2B sales scenarios."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      const scipabAnalysis = JSON.parse(content) as ScipabAnalysis;
      
      // Validate the response has all required fields
      this.validateScipabAnalysis(scipabAnalysis);
      
      return scipabAnalysis;
    } catch (error) {
      console.error("Error generating SCIPAB analysis:", error);
      throw new Error(`Failed to generate SCIPAB analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildScipabPrompt(companyData: CompanyData, extraContext?: string): string {
    return `
You are analyzing ${companyData.name || 'this company'} for Avo Automation's QA test automation solutions. Using the company background provided, generate a comprehensive SCIPAB analysis that demonstrates how Avo Automation can help this account achieve better software quality and testing efficiency.

Company Background:
${JSON.stringify(companyData, null, 2)}
${extraContext ? `\nAdditional Context: ${extraContext}` : ''}

Please generate a SCIPAB analysis with the following structure. Each section should be 2-3 sentences and focused on QA automation challenges and opportunities:

SCIPAB Framework:
- Situation: Current state of their software testing and quality assurance
- Complication: Specific testing challenges they likely face (manual testing bottlenecks, release delays, bug leakage)
- Implication: Business impact of these testing challenges (slower time-to-market, higher costs, customer satisfaction risks)
- Position: How Avo Automation's AI-powered test automation uniquely addresses these challenges
- Ask: Specific next step or meeting request to discuss their testing strategy
- Benefit: Quantifiable outcomes they can expect (80% faster testing, 60% fewer bugs, improved release velocity)

Output the analysis as a JSON object with keys: situation, complication, implication, position, ask, benefit.

Focus on:
- Enterprise software quality challenges
- Test automation ROI and efficiency gains
- Avo Automation's AI-powered approach to testing
- Specific metrics and outcomes (testing time reduction, bug prevention, release acceleration)
- Industry-specific testing challenges based on their sector
`;
  }

  private validateScipabAnalysis(analysis: ScipabAnalysis): void {
    const requiredFields = ['situation', 'complication', 'implication', 'position', 'ask', 'benefit'];
    
    for (const field of requiredFields) {
      if (!analysis[field as keyof ScipabAnalysis] || analysis[field as keyof ScipabAnalysis].trim() === '') {
        throw new Error(`Missing or empty required field: ${field}`);
      }
    }
  }

  async enrichCompanyWithPDL(companyName: string): Promise<CompanyData> {
    const PDL_API_KEY = process.env.PDL_API_KEY;
    
    if (!PDL_API_KEY) {
      throw new Error("PDL_API_KEY not configured. Please add your People Data Labs API key to environment variables.");
    }

    try {
      const response = await fetch(
        `https://api.peopledatalabs.com/v5/company/enrich?name=${encodeURIComponent(companyName)}&api_key=${PDL_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`PDL API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.status || data.status !== 200) {
        throw new Error(`PDL returned error: ${data.error || 'Unknown error'}`);
      }

      return {
        name: data.name,
        industry: data.industry,
        employee_count: data.employee_count,
        revenue: data.revenue,
        description: data.description,
        technologies: data.technologies || [],
        location: data.location,
        founded: data.founded,
        website: data.website
      };
    } catch (error) {
      console.error("Error enriching company with PDL:", error);
      throw new Error(`Failed to enrich company data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}