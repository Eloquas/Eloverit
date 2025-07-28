import { db } from "./db";
import { prospects, generatedContent } from "@shared/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PostTrigger {
  type: 'high_replies' | 'high_trust' | 'score_improvement' | 'personal_best';
  metric: string;
  context: string;
}

interface PostInputs {
  companyName: string;
  companyWebsite: string;
  scoreType: 'StoryScore' | 'TrustScore';
  toneStyle: 'Consultative' | 'Conversational' | 'Authoritative' | 'Inspirational' | 'Empathetic';
  triggerEvent: string;
  industry: string;
  targetAudience: string;
  keyInsight: string;
  metric: string;
  desiredAction: string;
  wordCountTarget: number;
}

interface LinkedInPost {
  id: string;
  userId: number;
  repName: string;
  postContent: string;
  trigger: PostTrigger;
  status: 'draft' | 'approved' | 'published';
  createdAt: Date;
  publishedAt?: Date;
  includeBranding: boolean;
  inputs?: PostInputs;
  wordCount?: number;
  validationNotes?: string[];
}

export class LinkedInPostGenerator {
  private posts: Map<string, LinkedInPost> = new Map();

  async checkTriggersAndGeneratePosts(userId: number): Promise<LinkedInPost[]> {
    const triggers = await this.detectTriggers(userId);
    const generatedPosts: LinkedInPost[] = [];

    for (const trigger of triggers) {
      const post = await this.generatePost(userId, trigger);
      if (post) {
        this.posts.set(post.id, post);
        generatedPosts.push(post);
      }
    }

    return generatedPosts;
  }

  private async detectTriggers(userId: number): Promise<PostTrigger[]> {
    const triggers: PostTrigger[] = [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Check for high-performing StoryBuild emails (3+ replies)
    // Note: In a real implementation, we'd join with a users table to filter by userId
    const highReplyContent = await db
      .select({
        content: generatedContent.content,
        prospectName: prospects.name,
        companyName: prospects.company
      })
      .from(generatedContent)
      .innerJoin(prospects, eq(generatedContent.prospectId, prospects.id))
      .where(
        and(
          eq(generatedContent.type, 'email'),
          gte(generatedContent.createdAt, oneWeekAgo)
        )
      )
      .limit(5);

    // Simulate reply tracking (in production, this would track actual email replies)
    const simulatedReplies = Math.floor(Math.random() * 5) + 1;
    if (simulatedReplies >= 3 && highReplyContent.length > 0) {
      triggers.push({
        type: 'high_replies',
        metric: `${simulatedReplies} replies from a StoryBuild™ sequence`,
        context: `Engaging ${highReplyContent[0].companyName} with narrative-driven outreach`
      });
    }

    // Check for high TrustScore prospects (>80)
    // Note: In production, we'd filter by userId through proper user association
    const highTrustProspects = await db
      .select({
        name: prospects.name,
        company: prospects.company,
        position: prospects.position
      })
      .from(prospects)
      .limit(10);

    // Simulate TrustScore calculation
    const highTrustCount = highTrustProspects.filter(() => Math.random() > 0.3).length;
    if (highTrustCount > 0) {
      triggers.push({
        type: 'high_trust',
        metric: `${highTrustCount} prospects with TrustScore > 80`,
        context: `Building authentic connections in enterprise tech`
      });
    }

    // Check for StoryScore improvements
    const recentContent = await db
      .select({
        content: generatedContent.content,
        createdAt: generatedContent.createdAt
      })
      .from(generatedContent)
      .where(
        gte(generatedContent.createdAt, oneWeekAgo)
      )
      .orderBy(desc(generatedContent.createdAt))
      .limit(10);

    if (recentContent.length >= 2) {
      const improvement = Math.floor(Math.random() * 60) + 20;
      if (improvement >= 40) {
        triggers.push({
          type: 'score_improvement',
          metric: `${improvement}% improvement in StoryScore`,
          context: `Refined messaging through AI-powered insights`
        });
      }
    }

    // Check for personal best in conversions
    const totalGenerated = await db
      .select({ count: sql<number>`count(*)` })
      .from(generatedContent)
      .where(
        gte(generatedContent.createdAt, oneWeekAgo)
      );

    if (totalGenerated[0].count > 20) {
      triggers.push({
        type: 'personal_best',
        metric: `${totalGenerated[0].count} personalized sequences this week`,
        context: `New personal record for outreach volume`
      });
    }

    return triggers;
  }

  private getIndustryTemplate(industry: string): string {
    const templates = {
      'SaaS': 'software testing automation and API quality challenges',
      'Tech': 'CI/CD testing integration and DevOps quality practices',
      'Finance': 'compliance testing and risk validation in enterprise systems',
      'Consulting': 'client system testing and QA process optimization',
      'Manufacturing': 'ERP testing automation and supply chain system quality',
      'Logistics': 'operational system testing and automation efficiency gains',
      'Healthcare': 'regulatory testing compliance and patient system quality',
      'Pharma': 'validation testing and regulatory system compliance'
    };
    return templates[industry] || 'enterprise system testing and QA automation challenges';
  }

  private getToneGuidance(toneStyle: string): string {
    const toneMap = {
      'Consultative': 'Use advisory, expert-focused language. Position yourself as a trusted advisor sharing insights. Use phrases like "In my experience," "What I have learned," "Here is what surprised me." Be thoughtful and analytical.',
      'Conversational': 'Write in a friendly, approachable tone. Use casual language and make it feel like a conversation with a colleague. Include rhetorical questions and relatable examples.',
      'Authoritative': 'Use confident, commanding language that establishes credibility. Share definitive insights and strong statements. Avoid hedging words like "maybe" or "I think."',
      'Inspirational': 'Focus on motivation and positive outcomes. Use uplifting language that encourages action. Share success stories and growth mindset perspectives.',
      'Empathetic': 'Show understanding of challenges your audience faces. Use supportive language and acknowledge pain points. Focus on helping others succeed.'
    };
    return toneMap[toneStyle] || toneMap['Consultative'];
  }

  private validateWordCount(content: string, targetCount: number): { wordCount: number; validationNotes: string[] } {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const validationNotes: string[] = [];

    // Hard limit check (150 words)
    if (wordCount > 150) {
      validationNotes.push(`❌ Post exceeds 150-word hard limit (${wordCount} words)`);
    }
    
    // Target range check (80-120 words optimal)
    if (wordCount >= 80 && wordCount <= 120) {
      validationNotes.push('✓ Within optimal range (80-120 words)');
    } else if (wordCount < 80) {
      validationNotes.push(`⚠️ Below optimal range (${wordCount} words, target 80-120)`);
    } else if (wordCount > 120 && wordCount <= 150) {
      validationNotes.push(`⚠️ Above optimal range (${wordCount} words, target 80-120)`);
    }

    // Target vs actual comparison
    const deviation = Math.abs(wordCount - targetCount);
    if (deviation <= 10) {
      validationNotes.push(`✓ Close to target (${wordCount}/${targetCount} words)`);
    } else {
      const direction = wordCount > targetCount ? 'over' : 'under';
      validationNotes.push(`⚠️ ${deviation} words ${direction} target (${wordCount}/${targetCount})`);
    }

    return { wordCount, validationNotes };
  }

  async generatePostWithInputs(userId: number, trigger: PostTrigger, inputs: PostInputs): Promise<LinkedInPost | null> {
    try {
      const industryFocus = this.getIndustryTemplate(inputs.industry);
      
      // Generate brand voice insights from website if provided
      let brandVoiceContext = '';
      if (inputs.companyWebsite) {
        brandVoiceContext = `\n- Company Website: ${inputs.companyWebsite} (Use this to infer brand voice, products/services, and target market)`;
      }

      const toneGuidance = this.getToneGuidance(inputs.toneStyle);
      
      const prompt = `You are Eloquas AI. Generate a LinkedIn post about QA automation, enterprise systems, or SDLC challenges. 

CRITICAL: DO NOT mention TrustScore, StoryScore, or any scoring systems in the content. These are internal quality metrics only.

CONTENT FOCUS:
Generate content about one of these QA/enterprise topics:
- QA automation challenges and solutions
- SDLC/SDTC process improvements  
- Enterprise systems testing (D365, SAP, Oracle, Salesforce)
- Testing bottlenecks and efficiency gains
- Quality engineering best practices
- DevOps and CI/CD testing integration
- Test automation ROI and business impact
- Manual vs automated testing transformation

REQUIRED INPUTS:
- Company Name: ${inputs.companyName}${brandVoiceContext}
- Tone Style: ${inputs.toneStyle} - ${toneGuidance}
- Trigger Event: ${inputs.triggerEvent}
- Industry: ${inputs.industry}
- Target Audience: ${inputs.targetAudience}
- Key Insight: ${inputs.keyInsight}
- Metric: ${inputs.metric}
- Desired Action: ${inputs.desiredAction}
- Word Count Target: ${inputs.wordCountTarget} words

EXACT 5-PART STRUCTURE (follow precisely):
1. **Hook (1-2 sentences)**: Start with a compelling QA/testing challenge or insight using ${inputs.toneStyle} tone
2. **Context & Company (1 sentence)**: "At ${inputs.companyName}, we faced [specific QA/testing challenge in ${inputs.industry}]"  
3. **Insight + Metric (1-2 sentences)**: Share the key insight about QA/testing improvements and quantifiable results: "${inputs.keyInsight}, which led to ${inputs.metric}"
4. **Question + Desired Action (1 sentence)**: Ask about their QA/testing experience and invite engagement: "${inputs.desiredAction}"
5. **Hashtags & Branding (optional)**: Up to 3 relevant hashtags for QA/testing/enterprise systems

CONTENT EXAMPLES:
- "Manual testing was consuming 60% of our release cycle..."
- "Our D365 migration testing revealed something surprising..."
- "After automating our regression tests, we discovered..."
- "The biggest QA bottleneck wasn't what we expected..."

TONE REQUIREMENTS:
${toneGuidance}
- First-person, authentic experience sharing
- Focus on real QA/testing challenges and solutions
- Position as peer expert in quality engineering
- Include quantifiable business impact

CONSTRAINTS:
- Target exactly ${inputs.wordCountTarget} words (hard limit 150 words)
- Professional but conversational tone
- Reference the trigger event naturally: ${inputs.triggerEvent}
- NO mention of scoring systems - focus purely on QA/SDLC content
- NO direct product pitching

Generate a LinkedIn post about QA automation or enterprise testing now:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are Eloquas AI, an expert QA automation and enterprise systems content strategist. Generate posts about testing challenges, automation wins, and quality engineering insights. NEVER mention scoring systems in the content - focus purely on QA/SDLC topics. Follow the 5-part structure precisely and match the word count target."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      const postContent = response.choices[0].message.content || "";
      const validation = this.validateWordCount(postContent, inputs.wordCountTarget);

      return {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        repName: "Sales Rep", // In production, fetch from user profile
        postContent,
        trigger,
        status: 'draft',
        createdAt: new Date(),
        includeBranding: true,
        inputs,
        wordCount: validation.wordCount,
        validationNotes: validation.validationNotes
      };
    } catch (error) {
      console.error('Error generating LinkedIn post:', error);
      return null;
    }
  }

  private async generatePost(userId: number, trigger: PostTrigger): Promise<LinkedInPost | null> {
    // Use default inputs for auto-generated posts focused on QA/enterprise systems
    const defaultInputs: PostInputs = {
      companyName: 'TechCorp',
      companyWebsite: 'https://techcorp.com',
      scoreType: trigger.type.includes('trust') ? 'TrustScore' : 'StoryScore', // Internal use only
      toneStyle: 'Consultative',
      triggerEvent: trigger.metric,
      industry: 'SaaS',
      targetAudience: 'QA Managers, Test Engineers, DevOps Leaders, QA Directors',
      keyInsight: 'Automated testing reduced our regression time by 75%',
      metric: '4 hours vs 16 hours for full regression suite',
      desiredAction: "What's been your biggest QA automation win?",
      wordCountTarget: 100
    };

    return this.generatePostWithInputs(userId, trigger, defaultInputs);
  }

  async storePost(post: LinkedInPost): Promise<void> {
    this.posts.set(post.id, post);
  }

  async getPostsForUser(userId: number, status?: 'draft' | 'approved' | 'published'): Promise<LinkedInPost[]> {
    const userPosts = Array.from(this.posts.values()).filter(post => {
      const matchesUser = post.userId === userId;
      const matchesStatus = status ? post.status === status : true;
      return matchesUser && matchesStatus;
    });

    return userPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updatePost(postId: string, updates: Partial<LinkedInPost>): Promise<LinkedInPost | null> {
    const post = this.posts.get(postId);
    if (!post) return null;

    const updatedPost = { ...post, ...updates };
    this.posts.set(postId, updatedPost);
    return updatedPost;
  }

  async approvePost(postId: string): Promise<LinkedInPost | null> {
    return this.updatePost(postId, { status: 'approved' });
  }

  async publishPost(postId: string): Promise<LinkedInPost | null> {
    // In production, this would integrate with LinkedIn API
    return this.updatePost(postId, { 
      status: 'published',
      publishedAt: new Date()
    });
  }

  formatPostWithBranding(post: LinkedInPost): string {
    if (!post.includeBranding) {
      return post.postContent;
    }

    return `${post.postContent}\n\n---\n💡 Powered by Eloquas AI`;
  }
}

export const linkedInPostGenerator = new LinkedInPostGenerator();