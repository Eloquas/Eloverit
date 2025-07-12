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
  industry: string;
  postFocus: string;
  targetAudience: string[];
  businessContext: string;
  keyMessage: string;
  desiredWordCount: number;
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
      'SaaS': 'product-usage stories and innovation hooks',
      'Tech': 'product-usage stories and innovation hooks',
      'Finance': 'compliance wins and risk-mitigation insights',
      'Consulting': 'compliance wins and strategic insights',
      'Manufacturing': 'efficiency gains and supply-chain stories',
      'Logistics': 'efficiency gains and supply-chain stories',
      'Healthcare': 'patient outcomes and regulatory learnings',
      'Pharma': 'patient outcomes and regulatory learnings'
    };
    return templates[industry] || 'operational improvements and strategic insights';
  }

  private validateWordCount(content: string, targetCount: number): { wordCount: number; validationNotes: string[] } {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const validationNotes: string[] = [];

    if (wordCount > 150) {
      validationNotes.push(`Post exceeds 150-word hard limit (${wordCount} words)`);
    } else if (wordCount > targetCount + 20) {
      validationNotes.push(`Post is ${wordCount - targetCount} words over target`);
    } else if (wordCount < targetCount - 20) {
      validationNotes.push(`Post is ${targetCount - wordCount} words under target`);
    }

    if (wordCount >= 80 && wordCount <= 120) {
      validationNotes.push('✓ Within optimal range (80-120 words)');
    }

    return { wordCount, validationNotes };
  }

  async generatePostWithInputs(userId: number, trigger: PostTrigger, inputs: PostInputs): Promise<LinkedInPost | null> {
    try {
      const industryFocus = this.getIndustryTemplate(inputs.industry);
      
      const prompt = `Generate a LinkedIn post for a sales rep with these exact specifications:

INPUTS:
- Industry: ${inputs.industry}
- Post Focus: ${inputs.postFocus}
- Target Audience: ${Array.isArray(inputs.targetAudience) ? inputs.targetAudience.join(', ') : inputs.targetAudience}
- Business Context: ${inputs.businessContext}
- Key Message: ${inputs.keyMessage}
- Target Word Count: ${inputs.desiredWordCount} words

TRIGGER DATA:
- Type: ${trigger.type}
- Metric: ${trigger.metric}
- Context: ${trigger.context}

STRUCTURE REQUIREMENTS (follow exactly):
1. Hook (1-2 sentences): Grab attention with a quick learning or surprise
2. Insight + Metric (1-2 sentences): Share key takeaway with supporting data
3. Context/Story (1-2 sentences): Brief situation or challenge outline
4. Question/Reflection (1 sentence): Invite peers to share experience
5. Hashtags: Up to 3 relevant hashtags

INDUSTRY FOCUS (${inputs.industry}): Emphasize ${industryFocus}

CONSTRAINTS:
- Target exactly ${inputs.desiredWordCount} words (±10 words acceptable)
- First person perspective
- Professional but conversational tone
- Humble-brag style that builds credibility
- No direct product pitching
- Include the trigger metric naturally

Write the post now:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are Eloquas AI, an expert LinkedIn content strategist. Generate posts that exactly match the word count target and follow the 5-part structure precisely."
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
      const validation = this.validateWordCount(postContent, inputs.desiredWordCount);

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
    // Use default inputs for auto-generated posts
    const defaultInputs: PostInputs = {
      industry: 'SaaS',
      postFocus: 'milestone',
      targetAudience: ['Sales Manager', 'VP of Sales', 'Account Executive'],
      businessContext: 'Quarter performance',
      keyMessage: 'Sharing insights from recent success',
      desiredWordCount: 100
    };

    return this.generatePostWithInputs(userId, trigger, defaultInputs);
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