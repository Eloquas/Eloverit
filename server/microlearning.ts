import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { microlearningModules, microlearningProgress, callAssessments } from "@shared/schema";
import type { 
  MicrolearningModule, 
  InsertMicrolearningModule, 
  MicrolearningProgress, 
  InsertMicrolearningProgress,
  CallAssessment 
} from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface MicrolearningContent {
  title: string;
  description: string;
  sections: Array<{
    title: string;
    type: 'text' | 'video' | 'exercise' | 'quiz';
    content: string;
    duration: number; // minutes
    resources?: Array<{
      title: string;
      url: string;
      type: string;
    }>;
  }>;
  actionItems: string[];
  keyTakeaways: string[];
}

export interface QuizContent extends MicrolearningContent {
  questions: Array<{
    question: string;
    type: 'multiple_choice' | 'true_false' | 'scenario';
    options?: string[];
    correct_answer: string | number;
    explanation: string;
  }>;
}

export class MicrolearningService {
  
  // Generate personalized learning modules based on call assessment
  async generateModulesFromAssessment(userId: number, assessment: CallAssessment): Promise<MicrolearningModule[]> {
    const weakAreas = this.identifyWeakAreas(assessment);
    const modules: MicrolearningModule[] = [];
    
    for (const area of weakAreas) {
      const module = await this.createModule(userId, area, assessment);
      if (module) {
        modules.push(module);
      }
    }
    
    return modules;
  }

  // Identify areas for improvement from assessment
  private identifyWeakAreas(assessment: CallAssessment): Array<{skillArea: string, score: number, priority: 'high' | 'medium' | 'low'}> {
    const grading = assessment.grading as any;
    const weakAreas = [];
    
    // Check each skill area (assuming 1-10 scale)
    if (grading.rapport_trust < 7) {
      weakAreas.push({
        skillArea: 'rapport_trust',
        score: grading.rapport_trust,
        priority: grading.rapport_trust < 5 ? 'high' : 'medium'
      });
    }
    
    if (grading.discovery_depth < 7) {
      weakAreas.push({
        skillArea: 'discovery_depth', 
        score: grading.discovery_depth,
        priority: grading.discovery_depth < 5 ? 'high' : 'medium'
      });
    }
    
    if (grading.tone_match_succinctness < 7) {
      weakAreas.push({
        skillArea: 'tone_match_succinctness',
        score: grading.tone_match_succinctness, 
        priority: grading.tone_match_succinctness < 5 ? 'high' : 'medium'
      });
    }
    
    if (grading.storytelling < 7) {
      weakAreas.push({
        skillArea: 'storytelling',
        score: grading.storytelling,
        priority: grading.storytelling < 5 ? 'high' : 'medium'
      });
    }
    
    // Sort by priority and score (lowest first)
    return weakAreas.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return a.score - b.score;
    });
  }

  // Create a specific learning module
  private async createModule(
    userId: number, 
    weakArea: {skillArea: string, score: number, priority: 'high' | 'medium' | 'low'}, 
    assessment: CallAssessment
  ): Promise<MicrolearningModule | null> {
    try {
      const content = await this.generateModuleContent(weakArea.skillArea, weakArea.score, assessment);
      
      const [module] = await db.insert(microlearningModules).values({
        userId,
        skillArea: weakArea.skillArea,
        moduleType: this.getModuleType(weakArea.skillArea),
        title: content.title,
        description: content.description,
        content: content as any,
        duration: this.calculateDuration(content),
        difficulty: this.getDifficulty(weakArea.score),
        triggeredBy: `call_assessment_${assessment.id}`,
      }).returning();
      
      return module;
    } catch (error) {
      console.error('Error creating module:', error);
      return null;
    }
  }

  // Generate AI-powered module content
  private async generateModuleContent(skillArea: string, score: number, assessment: CallAssessment): Promise<MicrolearningContent> {
    const prompt = this.createContentPrompt(skillArea, score, assessment);
    
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a sales training expert. Create engaging, actionable microlearning content that addresses specific skill gaps. Focus on practical techniques and real-world application."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = JSON.parse(response.choices[0].message.content || '{}');
      return this.validateAndFormatContent(content, skillArea);
    } catch (error) {
      console.error('Error generating content:', error);
      return this.getFallbackContent(skillArea);
    }
  }

  private createContentPrompt(skillArea: string, score: number, assessment: CallAssessment): string {
    const skillAreaMap = {
      rapport_trust: "Rapport and Trust Building",
      discovery_depth: "Discovery Question Depth", 
      tone_match_succinctness: "Tone Matching and Succinctness",
      storytelling: "Storytelling Effectiveness"
    };
    
    const skillName = skillAreaMap[skillArea as keyof typeof skillAreaMap] || skillArea;
    
    return `Create a comprehensive microlearning module for improving "${skillName}" in sales calls.

Current Performance: ${score}/10 (needs improvement)

Context from recent call:
- Call summary: ${(assessment as any).summary}
- Coaching notes: ${JSON.stringify((assessment as any).coaching_notes)}

Generate a JSON response with this structure:
{
  "title": "Module title (max 60 chars)",
  "description": "Brief description (max 150 chars)", 
  "sections": [
    {
      "title": "Section title",
      "type": "text|video|exercise|quiz",
      "content": "Detailed content with actionable techniques",
      "duration": number (minutes),
      "resources": [{"title": "Resource name", "url": "https://example.com", "type": "article|video|template"}]
    }
  ],
  "actionItems": ["Specific action to practice", "Another concrete step"],
  "keyTakeaways": ["Key insight 1", "Key insight 2", "Key insight 3"]
}

Requirements:
- Include 3-5 sections covering: theory, techniques, practice, assessment
- Focus on practical, immediately applicable skills
- Include role-play exercises and real scenarios
- Provide specific scripts and frameworks
- Duration should be 10-25 minutes total
- Make it engaging and interactive`;
  }

  private validateAndFormatContent(content: any, skillArea: string): MicrolearningContent {
    // Ensure required fields exist with defaults
    return {
      title: content.title || `Improve ${skillArea.replace('_', ' ')}`,
      description: content.description || `Learn techniques to enhance your ${skillArea.replace('_', ' ')} skills`,
      sections: content.sections || this.getDefaultSections(skillArea),
      actionItems: content.actionItems || [`Practice ${skillArea} techniques`, 'Apply learnings in next call'],
      keyTakeaways: content.keyTakeaways || [`${skillArea} is crucial for sales success`, 'Practice makes perfect', 'Apply immediately']
    };
  }

  private getFallbackContent(skillArea: string): MicrolearningContent {
    return {
      title: `Mastering ${skillArea.replace('_', ' ')}`,
      description: `Essential techniques for improving your ${skillArea.replace('_', ' ')} in sales conversations`,
      sections: this.getDefaultSections(skillArea),
      actionItems: [
        `Practice ${skillArea.replace('_', ' ')} techniques daily`,
        'Record yourself and review performance',
        'Ask for feedback from colleagues'
      ],
      keyTakeaways: [
        `${skillArea.replace('_', ' ')} directly impacts sales success`,
        'Consistent practice leads to improvement',
        'Apply techniques immediately in real calls'
      ]
    };
  }

  private getDefaultSections(skillArea: string): Array<any> {
    const sectionMap = {
      rapport_trust: [
        { title: "Building Instant Rapport", type: "text", content: "Learn techniques for establishing connection quickly", duration: 5 },
        { title: "Trust-Building Frameworks", type: "text", content: "Proven methods for building credibility", duration: 7 },
        { title: "Practice Scenarios", type: "exercise", content: "Role-play exercises for rapport building", duration: 8 }
      ],
      discovery_depth: [
        { title: "Advanced Questioning Techniques", type: "text", content: "SPIN, BANT, and modern discovery methods", duration: 6 },
        { title: "Uncovering Pain Points", type: "text", content: "Strategies for deeper discovery", duration: 5 },
        { title: "Discovery Practice", type: "exercise", content: "Question framework exercises", duration: 9 }
      ],
      tone_match_succinctness: [
        { title: "Tone Awareness", type: "text", content: "Reading and matching prospect communication style", duration: 4 },
        { title: "Concise Communication", type: "text", content: "Delivering value in fewer words", duration: 6 },
        { title: "Tone Matching Exercise", type: "exercise", content: "Practice adapting your communication style", duration: 8 }
      ],
      storytelling: [
        { title: "Story Structure for Sales", type: "text", content: "Hero's journey and problem-solution frameworks", duration: 7 },
        { title: "Customer Success Stories", type: "text", content: "Crafting compelling case studies", duration: 5 },
        { title: "Story Practice", type: "exercise", content: "Develop and practice your stories", duration: 10 }
      ]
    };
    
    return sectionMap[skillArea as keyof typeof sectionMap] || [
      { title: "Foundation", type: "text", content: "Core concepts and principles", duration: 6 },
      { title: "Application", type: "exercise", content: "Practical exercises", duration: 10 }
    ];
  }

  private getModuleType(skillArea: string): string {
    const typeMap = {
      rapport_trust: "interactive",
      discovery_depth: "exercise", 
      tone_match_succinctness: "video",
      storytelling: "exercise"
    };
    return typeMap[skillArea as keyof typeof typeMap] || "article";
  }

  private getDifficulty(score: number): string {
    if (score <= 3) return "beginner";
    if (score <= 6) return "intermediate"; 
    return "advanced";
  }

  private calculateDuration(content: MicrolearningContent): number {
    return content.sections.reduce((total, section) => total + (section.duration || 5), 0);
  }

  // Get personalized modules for user
  async getPersonalizedModules(userId: number, limit: number = 10): Promise<MicrolearningModule[]> {
    return await db
      .select()
      .from(microlearningModules)
      .where(eq(microlearningModules.userId, userId))
      .orderBy(desc(microlearningModules.createdAt))
      .limit(limit);
  }

  // Start module progress tracking
  async startModule(userId: number, moduleId: number): Promise<MicrolearningProgress> {
    const [progress] = await db.insert(microlearningProgress).values({
      userId,
      moduleId,
      progressPercentage: 0,
      currentSection: 0,
    }).returning();
    
    return progress;
  }

  // Update progress
  async updateProgress(
    userId: number, 
    moduleId: number, 
    progressPercentage: number, 
    currentSection: number,
    timeSpent: number
  ): Promise<void> {
    await db
      .update(microlearningProgress)
      .set({
        progressPercentage,
        currentSection,
        timeSpent,
        lastAccessedAt: new Date(),
      })
      .where(
        and(
          eq(microlearningProgress.userId, userId),
          eq(microlearningProgress.moduleId, moduleId)
        )
      );
  }

  // Complete module
  async completeModule(userId: number, moduleId: number, score?: number): Promise<void> {
    await Promise.all([
      // Update module as completed
      db
        .update(microlearningModules)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          score,
        })
        .where(
          and(
            eq(microlearningModules.userId, userId),
            eq(microlearningModules.id, moduleId)
          )
        ),
      
      // Update progress to 100%
      db
        .update(microlearningProgress)
        .set({
          progressPercentage: 100,
          lastAccessedAt: new Date(),
        })
        .where(
          and(
            eq(microlearningProgress.userId, userId),
            eq(microlearningProgress.moduleId, moduleId)
          )
        )
    ]);
  }

  // Get user's learning analytics
  async getLearningAnalytics(userId: number): Promise<{
    totalModules: number;
    completedModules: number;
    totalTimeSpent: number; // in minutes
    averageScore: number;
    topSkillAreas: Array<{skill: string, count: number}>;
    weeklyProgress: Array<{week: string, modules: number}>;
  }> {
    const modules = await db
      .select()
      .from(microlearningModules)
      .where(eq(microlearningModules.userId, userId));
    
    const progress = await db
      .select()
      .from(microlearningProgress)
      .where(eq(microlearningProgress.userId, userId));
    
    const completedModules = modules.filter(m => m.isCompleted);
    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / 60; // convert to minutes
    const averageScore = completedModules.length > 0 
      ? completedModules.reduce((sum, m) => sum + (m.score || 0), 0) / completedModules.length 
      : 0;
    
    // Count skill areas
    const skillCounts = modules.reduce((acc, module) => {
      acc[module.skillArea] = (acc[module.skillArea] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topSkillAreas = Object.entries(skillCounts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalModules: modules.length,
      completedModules: completedModules.length,
      totalTimeSpent: Math.round(totalTimeSpent),
      averageScore,
      topSkillAreas,
      weeklyProgress: [], // TODO: Implement weekly progress tracking
    };
  }

  // Get recommended modules based on recent performance
  async getRecommendedModules(userId: number): Promise<MicrolearningModule[]> {
    // Get recent call assessments to identify patterns
    const recentAssessments = await db
      .select()
      .from(callAssessments)
      .where(eq(callAssessments.userId, userId))
      .orderBy(desc(callAssessments.createdAt))
      .limit(5);
    
    if (recentAssessments.length === 0) {
      return this.getDefaultRecommendedModules(userId);
    }
    
    // Analyze patterns and generate recommendations
    const skillAnalysis = this.analyzeSkillPatterns(recentAssessments);
    const recommendations = [];
    
    for (const skill of skillAnalysis.weakAreas) {
      const existingModule = await db
        .select()
        .from(microlearningModules)
        .where(
          and(
            eq(microlearningModules.userId, userId),
            eq(microlearningModules.skillArea, skill.area)
          )
        )
        .limit(1);
      
      if (existingModule.length === 0) {
        // Create new module for this skill area
        const module = await this.createModule(
          userId, 
          { skillArea: skill.area, score: skill.averageScore, priority: skill.priority },
          recentAssessments[0]
        );
        if (module) {
          recommendations.push(module);
        }
      }
    }
    
    return recommendations;
  }

  private analyzeSkillPatterns(assessments: CallAssessment[]): {
    weakAreas: Array<{area: string, averageScore: number, priority: 'high' | 'medium' | 'low'}>;
  } {
    const skillScores: Record<string, number[]> = {};
    
    // Collect scores for each skill area
    assessments.forEach(assessment => {
      const grading = assessment.grading as any;
      Object.entries(grading).forEach(([skill, score]) => {
        if (typeof score === 'number' && skill !== 'overall_score') {
          if (!skillScores[skill]) skillScores[skill] = [];
          skillScores[skill].push(score);
        }
      });
    });
    
    // Calculate averages and identify weak areas
    const weakAreas = Object.entries(skillScores)
      .map(([skill, scores]) => {
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return {
          area: skill,
          averageScore: average,
          priority: average < 5 ? 'high' : average < 7 ? 'medium' : 'low' as 'high' | 'medium' | 'low'
        };
      })
      .filter(skill => skill.averageScore < 7)
      .sort((a, b) => a.averageScore - b.averageScore);
    
    return { weakAreas };
  }

  private async getDefaultRecommendedModules(userId: number): Promise<MicrolearningModule[]> {
    // Return general skill-building modules
    const defaultSkills = ['rapport_trust', 'discovery_depth', 'storytelling'];
    const modules = [];
    
    for (const skill of defaultSkills) {
      const content = this.getFallbackContent(skill);
      const [module] = await db.insert(microlearningModules).values({
        userId,
        skillArea: skill,
        moduleType: this.getModuleType(skill),
        title: content.title,
        description: content.description,
        content: content as any,
        duration: this.calculateDuration(content),
        difficulty: "intermediate",
        triggeredBy: "recommendations",
      }).returning();
      
      modules.push(module);
    }
    
    return modules;
  }
}

export const microlearningService = new MicrolearningService();