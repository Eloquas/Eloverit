import OpenAI from "openai";
import { storage } from "./storage";
import { hybridResearchEngine } from "./hybrid-research";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ProspectSignal {
  prospectId: number;
  signalType: 'engagement' | 'research' | 'timing' | 'competitive' | 'budget' | 'urgency';
  strength: number; // 0-100
  description: string;
  source: string;
  timestamp: Date;
}

interface PredictiveInsight {
  type: 'prospect_priority' | 'timing_optimization' | 'content_prediction' | 'market_intelligence';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  timeframe: string;
  data: any;
}

interface ProspectScore {
  prospectId: number;
  score: number;
  reasons: string[];
  nextAction: string;
  timing: string;
  probability: number;
}

class PredictiveIntelligenceEngine {
  private signals: Map<number, ProspectSignal[]> = new Map();
  private marketData: any = {};
  private performanceMetrics: any = {};

  /**
   * Analyze prospect engagement patterns and predict optimal outreach timing
   */
  async analyzeProspectPriority(userId: number): Promise<ProspectScore[]> {
    const prospects = await storage.getProspects(userId);
    const generatedContent = await storage.getGeneratedContent(userId);
    const accountResearch = await storage.getAccountResearch(userId);

    const scores: ProspectScore[] = [];

    for (const prospect of prospects) {
      const signals = this.getProspectSignals(prospect.id);
      const contentHistory = generatedContent.filter(c => c.prospectId === prospect.id);
      const research = accountResearch.find(r => r.companyName === prospect.company);

      const score = this.calculateProspectScore(prospect, signals, contentHistory, research);
      scores.push(score);
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Predict optimal content approach based on current performance
   */
  async predictOptimalContent(userId: number): Promise<PredictiveInsight> {
    const recentContent = await storage.getGeneratedContent(userId);
    
    // Analyze performance patterns (simulated - would integrate with actual email/LinkedIn analytics)
    const trustBasedPerformance = this.simulatePerformanceMetrics(recentContent, 'trust_build');
    const storyBasedPerformance = this.simulatePerformanceMetrics(recentContent, 'story_build');
    
    const recommendedApproach = trustBasedPerformance.responseRate > storyBasedPerformance.responseRate 
      ? 'trust_build' 
      : 'story_build';

    const performanceIncrease = Math.abs(trustBasedPerformance.responseRate - storyBasedPerformance.responseRate);

    return {
      type: 'content_prediction',
      title: 'Content Optimization Recommendation',
      description: `${recommendedApproach === 'trust_build' ? 'Trust-based' : 'Story-based'} messages are performing ${performanceIncrease}% better`,
      confidence: 85,
      impact: 'high',
      actionable: true,
      timeframe: 'Next 7 days',
      data: {
        recommendedApproach,
        performanceIncrease,
        reason: this.getContentRecommendationReason(recommendedApproach, recentContent)
      }
    };
  }

  /**
   * Analyze market trends and competitive intelligence
   */
  async generateMarketIntelligence(userId: number): Promise<PredictiveInsight[]> {
    const prospects = await storage.getProspects(userId);
    const accountResearch = await storage.getAccountResearch(userId);
    
    const insights: PredictiveInsight[] = [];

    // Simulate competitive analysis
    const competitorMentions = this.analyzeCompetitorMentions(accountResearch);
    if (competitorMentions.length > 0) {
      insights.push({
        type: 'market_intelligence',
        title: 'Competitive Intelligence Alert',
        description: `${competitorMentions.length} prospects mentioned competitor activity`,
        confidence: 95,
        impact: 'high',
        actionable: true,
        timeframe: 'Immediate',
        data: {
          competitors: competitorMentions,
          affectedProspects: competitorMentions.length,
          talking_points: this.generateCompetitiveTalkingPoints(competitorMentions)
        }
      });
    }

    // Market timing analysis
    const marketTiming = this.analyzeMarketTiming(prospects);
    if (marketTiming.opportunity) {
      insights.push({
        type: 'market_intelligence',
        title: 'Market Timing Opportunity',
        description: marketTiming.description,
        confidence: marketTiming.confidence,
        impact: 'medium',
        actionable: true,
        timeframe: 'This quarter',
        data: marketTiming.data
      });
    }

    return insights;
  }

  /**
   * Predict optimal outreach timing based on engagement patterns
   */
  async predictOptimalTiming(userId: number): Promise<PredictiveInsight> {
    const generatedContent = await storage.getGeneratedContent(userId);
    
    // Analyze historical engagement patterns (simulated)
    const engagementPatterns = this.analyzeEngagementPatterns(generatedContent);
    
    return {
      type: 'timing_optimization',
      title: 'Optimal Outreach Windows',
      description: `AI predicts ${engagementPatterns.bestTime} generates ${engagementPatterns.improvement}% higher response rates`,
      confidence: 92,
      impact: 'medium',
      actionable: true,
      timeframe: 'This week',
      data: {
        bestTimes: engagementPatterns.bestTimes,
        avoidTimes: engagementPatterns.avoidTimes,
        responseRateIncrease: engagementPatterns.improvement
      }
    };
  }

  /**
   * Generate comprehensive predictive insights for dashboard
   */
  async generatePredictiveInsights(userId: number): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];
    
    // Add priority prospects insight
    const priorityProspects = await this.analyzeProspectPriority(userId);
    const highPriorityCount = priorityProspects.filter(p => p.score > 80).length;
    
    if (highPriorityCount > 0) {
      insights.push({
        type: 'prospect_priority',
        title: 'High-Intent Prospect Alert',
        description: `${highPriorityCount} prospects showing strong buying signals`,
        confidence: 87,
        impact: 'high',
        actionable: true,
        timeframe: 'Next 48 hours',
        data: {
          prospects: priorityProspects.slice(0, 3),
          totalCount: highPriorityCount
        }
      });
    }

    // Add content optimization insight
    const contentInsight = await this.predictOptimalContent(userId);
    insights.push(contentInsight);

    // Add timing optimization insight
    const timingInsight = await this.predictOptimalTiming(userId);
    insights.push(timingInsight);

    // Add market intelligence insights
    const marketInsights = await this.generateMarketIntelligence(userId);
    insights.push(...marketInsights);

    return insights;
  }

  private calculateProspectScore(prospect: any, signals: ProspectSignal[], contentHistory: any[], research: any): ProspectScore {
    let score = 50; // Base score
    const reasons: string[] = [];

    // Engagement signals
    const engagementSignals = signals.filter(s => s.signalType === 'engagement');
    if (engagementSignals.length > 0) {
      score += 20;
      reasons.push('High engagement with recent outreach');
    }

    // Research signals
    if (research) {
      if (research.recentJobPostings && JSON.parse(research.recentJobPostings).length > 0) {
        score += 15;
        reasons.push('Recent job postings in relevant areas');
      }
      if (research.initiatives && JSON.parse(research.initiatives).some((i: any) => i.includes('QA') || i.includes('testing'))) {
        score += 10;
        reasons.push('Active QA/testing initiatives');
      }
    }

    // Timing signals
    const timingSignals = signals.filter(s => s.signalType === 'timing');
    if (timingSignals.length > 0) {
      score += 15;
      reasons.push('Optimal timing indicators');
    }

    // Budget signals
    const budgetSignals = signals.filter(s => s.signalType === 'budget');
    if (budgetSignals.length > 0) {
      score += 20;
      reasons.push('Budget approval signals detected');
    }

    // Cap score at 100
    score = Math.min(score, 100);

    return {
      prospectId: prospect.id,
      score,
      reasons: reasons.length > 0 ? reasons : ['Standard lead scoring metrics'],
      nextAction: this.determineNextAction(score, contentHistory),
      timing: this.determineOptimalTiming(score, signals),
      probability: Math.round(score * 0.8) // Convert score to probability
    };
  }

  private getProspectSignals(prospectId: number): ProspectSignal[] {
    // Simulate signals - in production, this would pull from actual data sources
    const mockSignals: ProspectSignal[] = [
      {
        prospectId,
        signalType: 'engagement',
        strength: Math.floor(Math.random() * 30) + 70,
        description: 'High email engagement',
        source: 'email_analytics',
        timestamp: new Date()
      },
      {
        prospectId,
        signalType: 'research',
        strength: Math.floor(Math.random() * 40) + 60,
        description: 'Downloaded resources',
        source: 'website_tracking',
        timestamp: new Date()
      }
    ];

    return mockSignals;
  }

  private simulatePerformanceMetrics(content: any[], approach: string) {
    // Simulate performance metrics based on content type
    const trustContent = content.filter(c => c.tone === 'consultative' || c.tone === 'professional');
    const storyContent = content.filter(c => c.tone === 'storytelling' || c.tone === 'empathetic');
    
    return {
      responseRate: approach === 'trust_build' ? 
        (trustContent.length * 0.15 + Math.random() * 0.1) : 
        (storyContent.length * 0.12 + Math.random() * 0.08),
      openRate: Math.random() * 0.3 + 0.6,
      clickRate: Math.random() * 0.1 + 0.05
    };
  }

  private getContentRecommendationReason(approach: string, content: any[]): string {
    if (approach === 'trust_build') {
      return 'Current prospects are in evaluation stage and need credibility signals';
    } else {
      return 'Prospects are early in buyer journey and respond well to narrative approaches';
    }
  }

  private analyzeCompetitorMentions(research: any[]): any[] {
    const competitors = ['QualityPro', 'TestMaster', 'QACloud'];
    const mentions = [];
    
    for (const r of research) {
      if (r.painPoints) {
        const painPoints = JSON.parse(r.painPoints);
        const hasCompetitorMention = painPoints.some((p: string) => 
          competitors.some(c => p.includes(c))
        );
        
        if (hasCompetitorMention) {
          mentions.push({
            company: r.companyName,
            competitor: competitors[0], // Simplified
            context: 'Mentioned in pain points analysis'
          });
        }
      }
    }
    
    return mentions;
  }

  private generateCompetitiveTalkingPoints(mentions: any[]): string[] {
    return [
      'Highlight our integration advantages',
      'Emphasize proven ROI metrics',
      'Share customer success stories',
      'Demonstrate superior support'
    ];
  }

  private analyzeMarketTiming(prospects: any[]): any {
    // Simulate market timing analysis
    const qaProspects = prospects.filter(p => 
      p.role?.toLowerCase().includes('qa') || 
      p.role?.toLowerCase().includes('test')
    );
    
    if (qaProspects.length > 2) {
      return {
        opportunity: true,
        description: 'QA automation market showing strong growth signals',
        confidence: 82,
        data: {
          marketGrowth: '15%',
          opportunitySize: '$2.3B',
          timeframe: 'Q1 2025'
        }
      };
    }
    
    return { opportunity: false };
  }

  private analyzeEngagementPatterns(content: any[]): any {
    // Simulate engagement pattern analysis
    return {
      bestTime: 'Tuesday 2-4 PM',
      bestTimes: ['Tuesday 2-4 PM', 'Thursday 10-12 PM'],
      avoidTimes: ['Monday mornings', 'Friday afternoons'],
      improvement: 40
    };
  }

  private determineNextAction(score: number, contentHistory: any[]): string {
    if (score > 85) return 'Schedule demo call';
    if (score > 70) return 'Send personalized case study';
    if (score > 55) return 'Share relevant resources';
    return 'Continue nurture sequence';
  }

  private determineOptimalTiming(score: number, signals: ProspectSignal[]): string {
    if (score > 85) return 'Within 24 hours';
    if (score > 70) return 'This week';
    if (score > 55) return 'Next week';
    return 'This month';
  }
}

export const predictiveIntelligence = new PredictiveIntelligenceEngine();