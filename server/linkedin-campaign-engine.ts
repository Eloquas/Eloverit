import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface LinkedInCampaignPost {
  sequence: number;
  theme: string;
  hook: string;
  content: string;
  cta: string;
  hashtags: string[];
  timing: string;
  wordCount: number;
  engagementType: 'educational' | 'thought_leadership' | 'case_study' | 'call_to_action';
}

interface LinkedInCampaign {
  id: string;
  campaignName: string;
  industryFocus: string;
  targetAudience: string;
  campaignTheme: string;
  posts: LinkedInCampaignPost[];
  totalDuration: string;
  createdAt: Date;
}

interface CampaignBrief {
  companyName: string;
  website: string;
  industryFocus: string;
  targetAudience: string;
  campaignObjective: string;
  keyMessages: string[];
  competitiveDifferentiators: string[];
  desiredActions: string[];
}

export class LinkedInCampaignEngine {

  async generateLinkedInCampaign(brief: CampaignBrief): Promise<LinkedInCampaign> {
    try {
      console.log(`Generating LinkedIn campaign for ${brief.companyName} targeting ${brief.targetAudience}`);

      // Generate campaign theme and narrative arc
      const campaignTheme = await this.generateCampaignTheme(brief);
      
      // Generate 4-post sequence that tells a cohesive story
      const posts = await this.generateCampaignPosts(brief, campaignTheme);

      return {
        id: `linkedin_campaign_${Date.now()}`,
        campaignName: `${brief.companyName} - ${campaignTheme.title}`,
        industryFocus: brief.industryFocus,
        targetAudience: brief.targetAudience,
        campaignTheme: campaignTheme.narrative,
        posts,
        totalDuration: "2 weeks",
        createdAt: new Date()
      };

    } catch (error) {
      console.error("LinkedIn campaign generation error:", error);
      throw new Error("Failed to generate LinkedIn campaign");
    }
  }

  private async generateCampaignTheme(brief: CampaignBrief): Promise<{ title: string; narrative: string }> {
    const prompt = `Create a LinkedIn campaign theme for ${brief.companyName} targeting ${brief.targetAudience} in ${brief.industryFocus}.

Campaign Objective: ${brief.campaignObjective}
Key Messages: ${brief.keyMessages.join(', ')}
Competitive Differentiators: ${brief.competitiveDifferentiators.join(', ')}

Generate a cohesive campaign theme that will work across 4 LinkedIn posts, building a narrative arc that:
1. Educates the audience about industry challenges
2. Establishes thought leadership and credibility  
3. Demonstrates value through case studies or insights
4. Drives toward a clear call-to-action

The theme should be professional, authentic, and focused on QA automation/enterprise systems expertise.

Respond in JSON format with: title (campaign title), narrative (overall story arc description)`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a LinkedIn marketing strategist specializing in B2B campaigns for QA automation and enterprise software companies."
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
      console.error("Campaign theme generation failed:", error);
      return {
        title: "QA Transformation Leadership",
        narrative: "A 4-part series exploring modern QA challenges, proven solutions, success stories, and transformation opportunities for enterprise teams."
      };
    }
  }

  private async generateCampaignPosts(brief: CampaignBrief, campaignTheme: { title: string; narrative: string }): Promise<LinkedInCampaignPost[]> {
    const postTemplates = [
      {
        sequence: 1,
        theme: "Industry Challenge Education",
        engagementType: "educational" as const,
        timing: "Week 1, Monday",
        objective: "Establish credibility by identifying and discussing key industry pain points",
        guidelines: "Start with thought-provoking question, share industry statistics, position as thought leader",
        wordCount: 150
      },
      {
        sequence: 2,
        theme: "Solution Thought Leadership",
        engagementType: "thought_leadership" as const,
        timing: "Week 1, Thursday", 
        objective: "Share insights and approaches to solving the challenges identified in post 1",
        guidelines: "Reference post 1, share methodology or framework, demonstrate expertise",
        wordCount: 160
      },
      {
        sequence: 3,
        theme: "Success Story & Social Proof",
        engagementType: "case_study" as const,
        timing: "Week 2, Tuesday",
        objective: "Provide concrete evidence of solution effectiveness through case study or client success",
        guidelines: "Share specific results, metrics, and outcomes that validate the approach from post 2",
        wordCount: 140
      },
      {
        sequence: 4,
        theme: "Call to Action & Engagement",
        engagementType: "call_to_action" as const,
        timing: "Week 2, Friday",
        objective: "Drive toward desired action while continuing to provide value",
        guidelines: "Summarize the journey from posts 1-3, clear CTA, offer next step or resource",
        wordCount: 130
      }
    ];

    const posts: LinkedInCampaignPost[] = [];

    for (const template of postTemplates) {
      const prompt = `Generate LinkedIn post ${template.sequence} for ${brief.companyName} campaign.

Campaign Theme: ${campaignTheme.title}
Campaign Narrative: ${campaignTheme.narrative}

Post Specifications:
- Theme: ${template.theme}
- Objective: ${template.objective}
- Guidelines: ${template.guidelines}
- Engagement Type: ${template.engagementType}
- Target Word Count: ${template.wordCount}
- Target Audience: ${brief.targetAudience}
- Industry Focus: ${brief.industryFocus}

Company Context:
- Company: ${brief.companyName}
- Website: ${brief.website}
- Key Messages: ${brief.keyMessages.join(', ')}
- Differentiators: ${brief.competitiveDifferentiators.join(', ')}

Post Requirements:
- Professional tone, authentic voice
- Include compelling hook (first line)
- Focus on QA automation/enterprise systems
- Include relevant hashtags
- Clear call-to-action appropriate for sequence position
- Build on previous posts in the campaign

Respond in JSON format with: hook, content, cta, hashtags (array), wordCount`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are a LinkedIn content strategist specializing in B2B campaigns for QA automation and enterprise software. Create post ${template.sequence} that builds on the campaign narrative and connects with previous posts.`
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

        const postData = JSON.parse(content);

        posts.push({
          sequence: template.sequence,
          theme: template.theme,
          hook: postData.hook,
          content: postData.content,
          cta: postData.cta,
          hashtags: postData.hashtags || this.getDefaultHashtags(brief.industryFocus),
          timing: template.timing,
          wordCount: postData.wordCount || template.wordCount,
          engagementType: template.engagementType
        });

      } catch (error) {
        console.error(`Failed to generate post ${template.sequence}:`, error);
        
        // Fallback post
        posts.push({
          sequence: template.sequence,
          theme: template.theme,
          hook: `${template.theme} insight for ${brief.industryFocus} leaders...`,
          content: `${template.theme} content for ${brief.companyName} targeting ${brief.targetAudience}. ${template.objective}`,
          cta: template.sequence === 4 ? "Let's connect to discuss your QA transformation!" : "What's your experience with this challenge?",
          hashtags: this.getDefaultHashtags(brief.industryFocus),
          timing: template.timing,
          wordCount: template.wordCount,
          engagementType: template.engagementType
        });
      }
    }

    return posts;
  }

  private getDefaultHashtags(industry: string): string[] {
    const baseHashtags = ["#QAAutomation", "#TestingExcellence", "#DevOps", "#AgileTesting"];
    
    const industryHashtags: { [key: string]: string[] } = {
      "technology": ["#TechLeadership", "#SoftwareQuality", "#ContinuousIntegration"],
      "finance": ["#FinTech", "#RegulatoryCompliance", "#FinancialSystems"],
      "healthcare": ["#HealthTech", "#MedicalDevices", "#ComplianceTesting"],
      "manufacturing": ["#ManufacturingTech", "#SupplyChain", "#QualityAssurance"],
      "retail": ["#RetailTech", "#EcommerceTesting", "#CustomerExperience"],
      "default": ["#EnterpriseQuality", "#DigitalTransformation", "#TestStrategy"]
    };

    const specificHashtags = industryHashtags[industry.toLowerCase()] || industryHashtags.default;
    return [...baseHashtags, ...specificHashtags].slice(0, 8);
  }

  async generateLinkedInMessagingCampaign(prospect: { name: string; company: string; role: string }, campaignType: 'trust_story_combined'): Promise<{ messages: any[]; campaignDuration: string }> {
    try {
      console.log(`Generating LinkedIn messaging campaign for ${prospect.name} at ${prospect.company}`);

      // Generate 4-message sequence using trust + story approach
      const messages = await this.generateMessagingSequence(prospect, campaignType);

      return {
        messages,
        campaignDuration: "2 weeks"
      };

    } catch (error) {
      console.error("LinkedIn messaging campaign error:", error);
      throw new Error("Failed to generate LinkedIn messaging campaign");
    }
  }

  private async generateMessagingSequence(prospect: { name: string; company: string; role: string }, campaignType: string): Promise<any[]> {
    const messageTemplates = [
      {
        sequence: 1,
        type: "Trust Introduction",
        timing: "Day 1",
        objective: "Establish connection and credibility",
        maxLength: 300
      },
      {
        sequence: 2,
        type: "Value Story",
        timing: "Day 5",
        objective: "Share relevant success story",
        maxLength: 350
      },
      {
        sequence: 3,
        type: "Solution Insight",
        timing: "Day 10",
        objective: "Provide specific insight or resource",
        maxLength: 320
      },
      {
        sequence: 4,
        type: "Direct Ask",
        timing: "Day 14",
        objective: "Clear call-to-action for meeting",
        maxLength: 280
      }
    ];

    const messages: any[] = [];

    for (const template of messageTemplates) {
      const prompt = `Generate LinkedIn message ${template.sequence} for ${prospect.name}, ${prospect.role} at ${prospect.company}.

Message Type: ${template.type}
Objective: ${template.objective}
Max Length: ${template.maxLength} characters
Campaign Type: Trust + Story Combined

Guidelines:
- Professional but conversational tone
- Reference QA automation/testing challenges
- Build trust through shared experience or connections
- Include story elements when appropriate
- Keep under character limit
- No sales pitches, focus on value

Respond in JSON format with: message, characterCount, trustElements (array), storyElements (array)`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: "You are a LinkedIn outreach specialist focusing on QA automation and enterprise testing solutions."
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

        const messageData = JSON.parse(content);

        messages.push({
          sequence: template.sequence,
          type: template.type,
          timing: template.timing,
          message: messageData.message,
          characterCount: messageData.characterCount,
          trustElements: messageData.trustElements || [],
          storyElements: messageData.storyElements || [],
          objective: template.objective
        });

      } catch (error) {
        console.error(`Failed to generate message ${template.sequence}:`, error);
        
        // Fallback message
        messages.push({
          sequence: template.sequence,
          type: template.type,
          timing: template.timing,
          message: `Hi ${prospect.name}, I noticed your work in QA at ${prospect.company}. Would love to connect and share insights about testing automation.`,
          characterCount: 150,
          trustElements: [],
          storyElements: [],
          objective: template.objective
        });
      }
    }

    return messages;
  }
}

export const linkedInCampaignEngine = new LinkedInCampaignEngine();