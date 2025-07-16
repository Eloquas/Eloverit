import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ProspectData {
  id: number;
  name: string;
  company: string;
  role: string;
  industry: string;
  email?: string;
  linkedinProfile?: string;
}

interface TrustSignals {
  sharedConnections: string[];
  mutualCompanies: string[];
  commonEducation: string[];
  sharedInterests: string[];
  trustAnchor: string;
}

interface StoryElements {
  heroJourney: string;
  challenge: string;
  guide: string;
  plan: string;
  success: string;
  transformation: string;
}

interface CadenceStep {
  step: number;
  subject: string;
  body: string;
  timing: string; // e.g., "Day 1", "Day 3", "Day 7"
  cta: string;
  trustElements: string[];
  storyElements: string[];
  wordCount: number;
}

interface EmailCadence {
  id: string;
  prospectId: number;
  cadenceType: 'trust_build' | 'story_build' | 'trust_story_combined' | 'qa_automation' | 'platform_migration';
  steps: CadenceStep[];
  trustSignals: TrustSignals;
  storyElements: StoryElements;
  industryFocus: string;
  platformFocus?: string;
  totalDuration: string;
  createdAt: Date;
}

export class EmailCadenceEngine {

  async generateTrustStoryEmail(prospect: ProspectData, useTrust: boolean = false, useStory: boolean = false): Promise<EmailCadence> {
    try {
      console.log(`Generating ${useTrust ? 'Trust' : ''}${useStory ? 'Story' : ''} cadence for ${prospect.name} at ${prospect.company}`);
      
      if (!useTrust && !useStory) {
        throw new Error("Must specify either trust, story, or both modes");
      }

      // Generate trust signals if trust mode is enabled
      let trustSignals: TrustSignals = {
        sharedConnections: [],
        mutualCompanies: [],
        commonEducation: [],
        sharedInterests: [],
        trustAnchor: ""
      };

      if (useTrust) {
        trustSignals = await this.generateTrustSignals(prospect);
      }

      // Generate story elements if story mode is enabled
      let storyElements: StoryElements = {
        heroJourney: "",
        challenge: "",
        guide: "",
        plan: "",
        success: "",
        transformation: ""
      };

      if (useStory) {
        storyElements = await this.generateStoryElements(prospect);
      }

      // Determine cadence type
      const cadenceType = useTrust && useStory ? 'trust_story_combined' : 
                         useTrust ? 'trust_build' : 'story_build';

      // Generate the 6-step email cadence
      const steps = await this.generateCadenceSteps(prospect, trustSignals, storyElements, cadenceType);

      return {
        id: `cadence_${Date.now()}_${prospect.id}`,
        prospectId: prospect.id,
        cadenceType,
        steps,
        trustSignals,
        storyElements,
        industryFocus: prospect.industry,
        platformFocus: this.detectPlatformFocus(prospect.role, prospect.company),
        totalDuration: "21 days",
        createdAt: new Date()
      };

    } catch (error) {
      console.error("Email cadence generation error:", error);
      throw new Error("Failed to generate email cadence");
    }
  }

  private async generateTrustSignals(prospect: ProspectData): Promise<TrustSignals> {
    // Mock LinkedIn profile analysis for trust signals
    const mockTrustSignals: TrustSignals = {
      sharedConnections: [
        "Sarah Johnson (VP of Engineering at Oracle)",
        "Mike Chen (Former QA Director at Microsoft)",
        "Lisa Rodriguez (Test Automation Lead at Salesforce)"
      ],
      mutualCompanies: [
        "Microsoft (2018-2020)",
        "Salesforce (2015-2018)"
      ],
      commonEducation: [
        "University of California, Berkeley",
        "Stanford Business School"
      ],
      sharedInterests: [
        "Test Automation Frameworks",
        "Agile Development",
        "DevOps Practices"
      ],
      trustAnchor: "Shared connection through Sarah Johnson and mutual experience with enterprise QA transformations"
    };

    return mockTrustSignals;
  }

  private async generateStoryElements(prospect: ProspectData): Promise<StoryElements> {
    const prompt = `Create a Hero's Journey story framework for QA automation outreach to ${prospect.name}, ${prospect.role} at ${prospect.company}.

Focus on transformation narrative for ${prospect.industry} industry challenges.

Generate story elements:
1. Hero Introduction (who they are now)
2. Challenge (current QA/testing pain points)
3. Guide (how Avo/our solution helps)
4. Plan (clear steps to success)
5. Success (specific outcomes)
6. Transformation (before vs after state)

Keep each element to 2-3 sentences. Focus on enterprise QA automation, testing efficiency, and quality outcomes.

Respond in JSON format with: heroJourney, challenge, guide, plan, success, transformation fields.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a sales storytelling expert specializing in QA automation and enterprise testing solutions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error("No response from OpenAI");

      return JSON.parse(content);
    } catch (error) {
      console.error("Story elements generation failed:", error);
      return {
        heroJourney: `${prospect.name} leads QA initiatives at ${prospect.company}, striving for testing excellence`,
        challenge: "Manual testing processes slow down releases and miss critical bugs that impact customer experience",
        guide: "Avo's AI-powered automation provides the framework and intelligence needed for testing transformation",
        plan: "Implement automated testing workflows, integrate with existing tools, train team on best practices",
        success: "80% faster testing cycles, 60% fewer production bugs, and happier development teams",
        transformation: "From reactive bug hunting to proactive quality assurance with predictable, reliable releases"
      };
    }
  }

  private async generateCadenceSteps(
    prospect: ProspectData, 
    trustSignals: TrustSignals, 
    storyElements: StoryElements, 
    cadenceType: string
  ): Promise<CadenceStep[]> {
    
    const cadenceTemplates = {
      trust_build: this.getTrustBuildTemplate(),
      story_build: this.getStoryBuildTemplate(),
      trust_story_combined: this.getTrustStoryCombinedTemplate()
    };

    const template = cadenceTemplates[cadenceType as keyof typeof cadenceTemplates] || cadenceTemplates.trust_story_combined;

    const steps: CadenceStep[] = [];

    for (let i = 0; i < template.length; i++) {
      const step = template[i];
      
      const prompt = `Generate ${step.type} email for ${prospect.name}, ${prospect.role} at ${prospect.company}.

${cadenceType.includes('trust') ? `
Trust Context:
- Trust Anchor: ${trustSignals.trustAnchor}
- Shared Connections: ${trustSignals.sharedConnections.join(', ')}
- Mutual Companies: ${trustSignals.mutualCompanies.join(', ')}
` : ''}

${cadenceType.includes('story') ? `
Story Context:
- Hero Journey: ${storyElements.heroJourney}
- Challenge: ${storyElements.challenge}
- Guide Role: ${storyElements.guide}
- Success Vision: ${storyElements.success}
` : ''}

Email Guidelines:
- ${step.guidelines}
- Keep to ${step.wordCount} words
- Use ${step.tone} tone
- Include ${step.cta} call-to-action
- Focus on ${prospect.industry} industry specifics
- CRITICAL: Focus entirely on QA automation value propositions, testing challenges, and business outcomes
- NEVER mention trust scores, story scores, scoring systems, or Avo's metrics in the email content
- Talk about specific benefits: faster testing, fewer bugs, improved quality, reduced manual effort
- Reference industry-specific testing challenges like compliance, scalability, or release velocity

Subject line and body should be professional, consultative, and human. The email should read like a helpful sales professional reaching out about QA automation solutions.

Respond in JSON format with: subject, body, trustElements (array), storyElements (array), wordCount`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are an expert sales copywriter specializing in QA automation and enterprise software outreach. Generate professional emails focused on QA automation value propositions, testing challenges, and business outcomes. NEVER mention trust scores, story scores, or scoring systems in the email content. Focus on specific QA automation benefits like faster testing cycles, reduced bugs, improved release quality, and operational efficiency. The trust and story elements should inform your writing style and personalization approach, but should not be mentioned explicitly in the email."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No response from OpenAI");

        const emailData = JSON.parse(content);

        steps.push({
          step: i + 1,
          subject: emailData.subject,
          body: emailData.body,
          timing: step.timing,
          cta: step.cta,
          trustElements: emailData.trustElements || [],
          storyElements: emailData.storyElements || [],
          wordCount: emailData.wordCount || step.wordCount
        });

      } catch (error) {
        console.error(`Failed to generate step ${i + 1}:`, error);
        
        // Fallback step
        steps.push({
          step: i + 1,
          subject: `${step.type} - ${prospect.company} QA Automation`,
          body: `Hi ${prospect.name},\n\n${step.fallback}\n\nBest regards,\nYour Name`,
          timing: step.timing,
          cta: step.cta,
          trustElements: [],
          storyElements: [],
          wordCount: 100
        });
      }
    }

    return steps;
  }

  private getTrustBuildTemplate() {
    return [
      {
        type: "Trust Introduction",
        timing: "Day 1",
        tone: "warm and personal",
        guidelines: "Lead with shared connection, mention mutual background",
        cta: "soft ask for brief conversation",
        wordCount: 120,
        fallback: "I noticed we have mutual connections in the QA automation space. Would love to connect and share insights."
      },
      {
        type: "Value Sharing",
        timing: "Day 4",
        tone: "consultative and helpful",
        guidelines: "Share relevant insight or resource, reference shared experience",
        cta: "offer valuable resource or insight",
        wordCount: 130,
        fallback: "Based on our mutual experience in enterprise QA, I thought you'd find this testing insight valuable."
      },
      {
        type: "Credibility Building",
        timing: "Day 8",
        tone: "professional and experienced",
        guidelines: "Reference similar success with mutual connections or companies",
        cta: "mention specific results achieved",
        wordCount: 140,
        fallback: "Our mutual connection Sarah mentioned you're facing similar QA challenges we recently solved at Microsoft."
      },
      {
        type: "Direct Value Proposition",
        timing: "Day 12",
        tone: "confident and solution-focused",
        guidelines: "Clear value prop based on trust foundation built",
        cta: "request specific meeting or demo",
        wordCount: 125,
        fallback: "Given our shared background and your current initiatives, I'd like to show you our QA automation approach."
      },
      {
        type: "Social Proof",
        timing: "Day 16",
        tone: "evidence-based and compelling",
        guidelines: "Share results from similar trusted contacts or companies",
        cta: "offer case study or reference call",
        wordCount: 135,
        fallback: "Companies similar to yours have seen 80% testing time reduction. Happy to share specific case studies."
      },
      {
        type: "Final Trust Appeal",
        timing: "Day 21",
        tone: "respectful but direct",
        guidelines: "Final appeal based on relationship and trust built",
        cta: "clear next step or graceful exit",
        wordCount: 110,
        fallback: "Based on our connection and conversations, should I assume QA automation isn't a priority right now?"
      }
    ];
  }

  private getStoryBuildTemplate() {
    return [
      {
        type: "Hero Introduction",
        timing: "Day 1",
        tone: "narrative and engaging",
        guidelines: "Introduce them as the hero of their QA story",
        cta: "acknowledge their challenges",
        wordCount: 125,
        fallback: "Every QA leader faces the challenge of balancing speed and quality in today's fast-paced development cycles."
      },
      {
        type: "Challenge Identification",
        timing: "Day 4",
        tone: "empathetic and understanding",
        guidelines: "Describe the specific testing challenges they likely face",
        cta: "validate their pain points",
        wordCount: 135,
        fallback: "Manual testing bottlenecks are frustrating when releases get delayed and bugs still slip through."
      },
      {
        type: "Guide Introduction",
        timing: "Day 8",
        tone: "helpful and knowledgeable",
        guidelines: "Position yourself/solution as the wise guide",
        cta: "offer guidance and expertise",
        wordCount: 140,
        fallback: "We've helped 200+ QA teams transform their testing approach and achieve predictable quality outcomes."
      },
      {
        type: "The Plan",
        timing: "Day 12",
        tone: "clear and actionable",
        guidelines: "Present clear steps to overcome challenges",
        cta: "outline specific pathway to success",
        wordCount: 130,
        fallback: "The path forward involves three key steps: automation framework, team training, and continuous optimization."
      },
      {
        type: "Success Vision",
        timing: "Day 16",
        tone: "inspiring and specific",
        guidelines: "Paint picture of successful transformation",
        cta: "share specific success metrics",
        wordCount: 135,
        fallback: "Imagine releasing twice as fast with 60% fewer bugs, and having your team focus on innovation instead of repetitive testing."
      },
      {
        type: "Call to Transformation",
        timing: "Day 21",
        tone: "motivating and decisive",
        guidelines: "Final call to begin their transformation journey",
        cta: "invite them to start their story",
        wordCount: 120,
        fallback: "Ready to transform your QA story from reactive bug hunting to proactive quality leadership?"
      }
    ];
  }

  private getTrustStoryCombinedTemplate() {
    return [
      {
        type: "Trust + Hero Introduction",
        timing: "Day 1",
        tone: "warm, personal, and narrative",
        guidelines: "Combine shared connection with hero positioning",
        cta: "acknowledge shared background and challenges",
        wordCount: 150,
        fallback: "Our mutual connection Sarah mentioned you're transforming QA processes at Oracle - a journey we've supported at similar companies."
      },
      {
        type: "Shared Challenge Story",
        timing: "Day 4",
        tone: "empathetic with credible experience",
        guidelines: "Reference similar challenges faced by mutual contacts",
        cta: "validate pain points through shared experience",
        wordCount: 140,
        fallback: "Like you, Sarah at Microsoft faced the challenge of accelerating releases while maintaining quality. Here's how we helped..."
      },
      {
        type: "Guide with Trust Proof",
        timing: "Day 8",
        tone: "authoritative but relationship-based",
        guidelines: "Position as guide using trust foundation and expertise",
        cta: "offer guidance backed by mutual connections",
        wordCount: 145,
        fallback: "Our approach helped Sarah's team achieve 80% faster testing cycles. I'd love to share specific insights that could help Oracle too."
      },
      {
        type: "Trusted Plan",
        timing: "Day 12",
        tone: "consultative and specific",
        guidelines: "Present plan with references to trusted success stories",
        cta: "outline approach with credible proof points",
        wordCount: 135,
        fallback: "The same three-step approach that worked for Sarah's team can be adapted for Oracle's specific testing challenges."
      },
      {
        type: "Success with Social Proof",
        timing: "Day 16",
        tone: "confident with evidence",
        guidelines: "Share success vision backed by trusted results",
        cta: "offer specific case studies or references",
        wordCount: 140,
        fallback: "Oracle could see similar results to Microsoft: 60% fewer production bugs and faster release cycles. Happy to share case studies."
      },
      {
        type: "Trusted Transformation Call",
        timing: "Day 21",
        tone: "direct but relationship-based",
        guidelines: "Final appeal combining relationship and transformation",
        cta: "leverage relationship for clear next step",
        wordCount: 125,
        fallback: "Based on our mutual connections and Oracle's QA goals, should we schedule 15 minutes to discuss your transformation roadmap?"
      }
    ];
  }

  private detectPlatformFocus(role: string, company: string): string {
    const roleLower = role.toLowerCase();
    const companyLower = company.toLowerCase();

    if (roleLower.includes('oracle') || companyLower.includes('oracle')) return 'oracle';
    if (roleLower.includes('salesforce') || companyLower.includes('salesforce')) return 'salesforce';
    if (roleLower.includes('sap') || companyLower.includes('sap')) return 'sap';
    if (roleLower.includes('dynamics') || companyLower.includes('dynamics')) return 'dynamics365';
    if (roleLower.includes('workday') || companyLower.includes('workday')) return 'workday';
    
    return 'qa-automation';
  }
}

export const emailCadenceEngine = new EmailCadenceEngine();