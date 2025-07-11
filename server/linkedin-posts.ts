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
          eq(generatedContent.userId, userId),
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
    const highTrustProspects = await db
      .select({
        name: prospects.name,
        company: prospects.company,
        position: prospects.position
      })
      .from(prospects)
      .where(eq(prospects.userId, userId))
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
        and(
          eq(generatedContent.userId, userId),
          gte(generatedContent.createdAt, oneWeekAgo)
        )
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
        and(
          eq(generatedContent.userId, userId),
          gte(generatedContent.createdAt, oneWeekAgo)
        )
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

  private async generatePost(userId: number, trigger: PostTrigger): Promise<LinkedInPost | null> {
    try {
      const prompt = `Generate a first-person LinkedIn post for a sales rep based on this achievement:

Trigger: ${trigger.type}
Metric: ${trigger.metric}
Context: ${trigger.context}

Requirements:
1. Write in first person from the rep's perspective
2. Include the specific metric naturally
3. Share an insight or learning
4. End with a question to engage the audience
5. Keep it humble and learning-focused
6. No direct product pitching
7. 3-4 paragraphs maximum
8. Include 3-5 relevant hashtags at the end

The tone should be professional but conversational, sharing a genuine win while inviting discussion.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a LinkedIn content strategist helping sales reps share their wins and insights authentically."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      });

      const postContent = response.choices[0].message.content || "";

      return {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        repName: "Sales Rep", // In production, fetch from user profile
        postContent,
        trigger,
        status: 'draft',
        createdAt: new Date(),
        includeBranding: true
      };
    } catch (error) {
      console.error('Error generating LinkedIn post:', error);
      return null;
    }
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