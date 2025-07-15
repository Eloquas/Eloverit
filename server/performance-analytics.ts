import OpenAI from "openai";
import { storage } from "./storage";
import { predictiveIntelligence } from "./predictive-intelligence";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PerformanceMetric {
  id: string;
  userId: number;
  prospectId: number;
  contentId: number;
  metricType: 'email_open' | 'email_click' | 'email_reply' | 'linkedin_view' | 'linkedin_reaction' | 'linkedin_comment' | 'meeting_booked' | 'demo_completed' | 'deal_closed';
  value: number;
  timestamp: Date;
  source: string;
  metadata?: any;
}

interface ContentPerformance {
  contentId: number;
  type: 'email' | 'linkedin';
  tone: string;
  approach: 'trust_build' | 'story_build' | 'trust_story_combined' | 'brand_awareness';
  openRate: number;
  clickRate: number;
  replyRate: number;
  meetingRate: number;
  revenue: number;
  engagementScore: number;
  prospectMatches: number;
  createdAt: Date;
}

interface A_BTestResult {
  testId: string;
  userId: number;
  variationA: {
    approach: string;
    tone: string;
    contentIds: number[];
    performance: ContentPerformance;
  };
  variationB: {
    approach: string;
    tone: string;
    contentIds: number[];
    performance: ContentPerformance;
  };
  winner: 'A' | 'B' | 'inconclusive';
  confidence: number;
  recommendation: string;
  startDate: Date;
  endDate: Date;
}

interface ROIAttribution {
  userId: number;
  prospectId: number;
  revenue: number;
  attributedContent: number[];
  touchpoints: string[];
  timeToClose: number; // days
  engagementScore: number;
  approachUsed: string;
  confidence: number;
}

class PerformanceAnalyticsEngine {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private contentPerformance: Map<number, ContentPerformance> = new Map();
  private abtests: Map<string, A_BTestResult> = new Map();
  private roiData: Map<string, ROIAttribution> = new Map();

  /**
   * Track performance metric for content
   */
  async trackMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<void> {
    const performanceMetric: PerformanceMetric = {
      ...metric,
      id: `${metric.userId}-${metric.contentId}-${metric.metricType}-${Date.now()}`,
      timestamp: new Date()
    };

    const userMetrics = this.metrics.get(metric.userId.toString()) || [];
    userMetrics.push(performanceMetric);
    this.metrics.set(metric.userId.toString(), userMetrics);

    // Update content performance
    await this.updateContentPerformance(metric.contentId, metric.metricType, metric.value);
  }

  /**
   * Analyze content performance patterns
   */
  async analyzeContentPerformance(userId: number): Promise<ContentPerformance[]> {
    const userContent = await storage.getGeneratedContent(userId);
    const performances: ContentPerformance[] = [];

    for (const content of userContent) {
      const performance = await this.calculateContentPerformance(content.id, content);
      performances.push(performance);
      this.contentPerformance.set(content.id, performance);
    }

    return performances.sort((a, b) => b.engagementScore - a.engagementScore);
  }

  /**
   * Generate A/B test recommendations
   */
  async generateABTestRecommendations(userId: number): Promise<A_BTestResult[]> {
    const contentPerformances = await this.analyzeContentPerformance(userId);
    const prospects = await storage.getProspects(userId);
    
    const tests: A_BTestResult[] = [];

    // Test trust vs story approach
    const trustContent = contentPerformances.filter(c => c.approach === 'trust_build');
    const storyContent = contentPerformances.filter(c => c.approach === 'story_build');

    if (trustContent.length > 0 && storyContent.length > 0) {
      const trustAvg = this.calculateAveragePerformance(trustContent);
      const storyAvg = this.calculateAveragePerformance(storyContent);
      
      tests.push({
        testId: `trust-vs-story-${Date.now()}`,
        userId,
        variationA: {
          approach: 'trust_build',
          tone: 'consultative',
          contentIds: trustContent.map(c => c.contentId),
          performance: trustAvg
        },
        variationB: {
          approach: 'story_build',
          tone: 'storytelling',
          contentIds: storyContent.map(c => c.contentId),
          performance: storyAvg
        },
        winner: trustAvg.engagementScore > storyAvg.engagementScore ? 'A' : 'B',
        confidence: Math.abs(trustAvg.engagementScore - storyAvg.engagementScore) / 100,
        recommendation: await this.generateTestRecommendation(trustAvg, storyAvg),
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });
    }

    // Test timing optimization
    const morningContent = contentPerformances.filter(c => this.isContentSentInMorning(c));
    const afternoonContent = contentPerformances.filter(c => this.isContentSentInAfternoon(c));

    if (morningContent.length > 0 && afternoonContent.length > 0) {
      const morningAvg = this.calculateAveragePerformance(morningContent);
      const afternoonAvg = this.calculateAveragePerformance(afternoonContent);
      
      tests.push({
        testId: `timing-${Date.now()}`,
        userId,
        variationA: {
          approach: 'morning_timing',
          tone: 'professional',
          contentIds: morningContent.map(c => c.contentId),
          performance: morningAvg
        },
        variationB: {
          approach: 'afternoon_timing',
          tone: 'professional',
          contentIds: afternoonContent.map(c => c.contentId),
          performance: afternoonAvg
        },
        winner: morningAvg.engagementScore > afternoonAvg.engagementScore ? 'A' : 'B',
        confidence: Math.abs(morningAvg.engagementScore - afternoonAvg.engagementScore) / 100,
        recommendation: await this.generateTimingRecommendation(morningAvg, afternoonAvg),
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });
    }

    return tests;
  }

  /**
   * Calculate ROI attribution for prospects
   */
  async calculateROIAttribution(userId: number): Promise<ROIAttribution[]> {
    const prospects = await storage.getProspects(userId);
    const content = await storage.getGeneratedContent(userId);
    const attributions: ROIAttribution[] = [];

    for (const prospect of prospects) {
      const prospectContent = content.filter(c => c.prospectId === prospect.id);
      const metrics = this.metrics.get(userId.toString()) || [];
      const prospectMetrics = metrics.filter(m => m.prospectId === prospect.id);

      if (prospectContent.length > 0) {
        const attribution = await this.calculateProspectROI(prospect, prospectContent, prospectMetrics);
        attributions.push(attribution);
      }
    }

    return attributions.sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Generate performance feedback for content optimization
   */
  async generatePerformanceFeedback(userId: number): Promise<{
    insights: string[];
    recommendations: string[];
    patterns: string[];
    warnings: string[];
  }> {
    const performances = await this.analyzeContentPerformance(userId);
    const abtests = await this.generateABTestRecommendations(userId);
    const roi = await this.calculateROIAttribution(userId);

    const insights: string[] = [];
    const recommendations: string[] = [];
    const patterns: string[] = [];
    const warnings: string[] = [];

    // Analyze performance patterns
    const highPerformers = performances.filter(p => p.engagementScore > 75);
    const lowPerformers = performances.filter(p => p.engagementScore < 25);

    if (highPerformers.length > 0) {
      const dominantApproach = this.getMostFrequentApproach(highPerformers);
      const dominantTone = this.getMostFrequentTone(highPerformers);
      
      insights.push(`Your highest performing content uses ${dominantApproach} approach with ${dominantTone} tone`);
      recommendations.push(`Continue using ${dominantApproach} approach for similar prospects`);
      patterns.push(`${dominantApproach} + ${dominantTone} = ${Math.round(highPerformers[0].engagementScore)}% engagement`);
    }

    if (lowPerformers.length > 0) {
      const problematicApproach = this.getMostFrequentApproach(lowPerformers);
      warnings.push(`${problematicApproach} approach showing consistently low engagement`);
      recommendations.push(`Consider A/B testing alternative approaches for ${problematicApproach} content`);
    }

    // ROI insights
    const highROI = roi.filter(r => r.revenue > 50000);
    if (highROI.length > 0) {
      const avgTimeToClose = highROI.reduce((sum, r) => sum + r.timeToClose, 0) / highROI.length;
      insights.push(`High-value prospects close in average ${Math.round(avgTimeToClose)} days`);
      patterns.push(`High-value prospects respond best to ${highROI[0].approachUsed} approach`);
    }

    // A/B test insights
    for (const test of abtests) {
      if (test.confidence > 0.8) {
        insights.push(`A/B test shows ${test.winner === 'A' ? test.variationA.approach : test.variationB.approach} performs ${Math.round(test.confidence * 100)}% better`);
        recommendations.push(test.recommendation);
      }
    }

    return { insights, recommendations, patterns, warnings };
  }

  /**
   * Get performance dashboard metrics
   */
  async getPerformanceDashboard(userId: number): Promise<{
    overview: {
      totalContent: number;
      avgEngagement: number;
      totalRevenue: number;
      bestPerformingApproach: string;
    };
    trends: {
      engagement: number[];
      revenue: number[];
      responseRate: number[];
    };
    contentBreakdown: {
      approach: string;
      count: number;
      avgPerformance: number;
    }[];
    recentWins: ContentPerformance[];
  }> {
    const performances = await this.analyzeContentPerformance(userId);
    const roi = await this.calculateROIAttribution(userId);

    const overview = {
      totalContent: performances.length,
      avgEngagement: performances.reduce((sum, p) => sum + p.engagementScore, 0) / performances.length,
      totalRevenue: roi.reduce((sum, r) => sum + r.revenue, 0),
      bestPerformingApproach: this.getMostFrequentApproach(performances.filter(p => p.engagementScore > 75))
    };

    const trends = {
      engagement: this.calculateTrends(performances, 'engagementScore'),
      revenue: this.calculateRevenueTrends(roi),
      responseRate: this.calculateTrends(performances, 'replyRate')
    };

    const contentBreakdown = this.calculateContentBreakdown(performances);
    const recentWins = performances.filter(p => p.engagementScore > 70).slice(0, 5);

    return { overview, trends, contentBreakdown, recentWins };
  }

  // Private helper methods
  private async updateContentPerformance(contentId: number, metricType: string, value: number): Promise<void> {
    const existing = this.contentPerformance.get(contentId);
    if (existing) {
      switch (metricType) {
        case 'email_open':
          existing.openRate += value;
          break;
        case 'email_click':
          existing.clickRate += value;
          break;
        case 'email_reply':
          existing.replyRate += value;
          break;
        case 'meeting_booked':
          existing.meetingRate += value;
          break;
      }
      existing.engagementScore = this.calculateEngagementScore(existing);
    }
  }

  private async calculateContentPerformance(contentId: number, content: any): Promise<ContentPerformance> {
    // Simulate performance calculation based on content characteristics
    const basePerformance = this.getBasePerformanceForApproach(content.tone);
    const engagement = this.calculateEngagementScore(basePerformance);
    
    return {
      contentId,
      type: content.type,
      tone: content.tone,
      approach: this.mapToneToApproach(content.tone),
      openRate: basePerformance.openRate,
      clickRate: basePerformance.clickRate,
      replyRate: basePerformance.replyRate,
      meetingRate: basePerformance.meetingRate,
      revenue: Math.random() * 100000,
      engagementScore: engagement,
      prospectMatches: 1,
      createdAt: content.createdAt
    };
  }

  private calculateEngagementScore(performance: ContentPerformance): number {
    return Math.round(
      (performance.openRate * 0.2) +
      (performance.clickRate * 0.3) +
      (performance.replyRate * 0.3) +
      (performance.meetingRate * 0.2)
    );
  }

  private getBasePerformanceForApproach(tone: string): ContentPerformance {
    const baseRates = {
      consultative: { openRate: 85, clickRate: 15, replyRate: 12, meetingRate: 8 },
      storytelling: { openRate: 78, clickRate: 22, replyRate: 10, meetingRate: 6 },
      professional: { openRate: 90, clickRate: 12, replyRate: 8, meetingRate: 5 },
      friendly: { openRate: 82, clickRate: 18, replyRate: 14, meetingRate: 7 }
    };

    const rates = baseRates[tone] || baseRates.professional;
    return {
      ...rates,
      contentId: 0,
      type: 'email',
      tone,
      approach: 'trust_build',
      revenue: 0,
      engagementScore: 0,
      prospectMatches: 0,
      createdAt: new Date()
    };
  }

  private mapToneToApproach(tone: string): 'trust_build' | 'story_build' | 'trust_story_combined' | 'brand_awareness' {
    const mapping = {
      consultative: 'trust_build',
      storytelling: 'story_build',
      professional: 'trust_build',
      friendly: 'trust_build',
      empathetic: 'story_build'
    };
    return mapping[tone] || 'trust_build';
  }

  private calculateAveragePerformance(performances: ContentPerformance[]): ContentPerformance {
    if (performances.length === 0) return null;

    const avg = performances.reduce((sum, p) => ({
      openRate: sum.openRate + p.openRate,
      clickRate: sum.clickRate + p.clickRate,
      replyRate: sum.replyRate + p.replyRate,
      meetingRate: sum.meetingRate + p.meetingRate,
      engagementScore: sum.engagementScore + p.engagementScore,
      revenue: sum.revenue + p.revenue
    }), { openRate: 0, clickRate: 0, replyRate: 0, meetingRate: 0, engagementScore: 0, revenue: 0 });

    return {
      ...avg,
      openRate: avg.openRate / performances.length,
      clickRate: avg.clickRate / performances.length,
      replyRate: avg.replyRate / performances.length,
      meetingRate: avg.meetingRate / performances.length,
      engagementScore: avg.engagementScore / performances.length,
      revenue: avg.revenue / performances.length,
      contentId: 0,
      type: 'email',
      tone: 'mixed',
      approach: 'mixed',
      prospectMatches: performances.length,
      createdAt: new Date()
    };
  }

  private async generateTestRecommendation(varA: ContentPerformance, varB: ContentPerformance): Promise<string> {
    const winner = varA.engagementScore > varB.engagementScore ? 'trust-based' : 'story-based';
    const improvement = Math.abs(varA.engagementScore - varB.engagementScore);
    
    return `Use ${winner} approach for similar prospects - shows ${Math.round(improvement)}% better engagement`;
  }

  private async generateTimingRecommendation(morning: ContentPerformance, afternoon: ContentPerformance): Promise<string> {
    const winner = morning.engagementScore > afternoon.engagementScore ? 'morning' : 'afternoon';
    const improvement = Math.abs(morning.engagementScore - afternoon.engagementScore);
    
    return `Send outreach in ${winner} for ${Math.round(improvement)}% better response rates`;
  }

  private isContentSentInMorning(content: ContentPerformance): boolean {
    const hour = content.createdAt.getHours();
    return hour >= 8 && hour <= 12;
  }

  private isContentSentInAfternoon(content: ContentPerformance): boolean {
    const hour = content.createdAt.getHours();
    return hour >= 13 && hour <= 17;
  }

  private async calculateProspectROI(prospect: any, content: any[], metrics: PerformanceMetric[]): Promise<ROIAttribution> {
    const revenue = Math.random() * 150000; // Simulate revenue
    const engagementScore = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    const timeToClose = Math.floor(Math.random() * 90) + 30; // 30-120 days
    
    return {
      userId: prospect.userId,
      prospectId: prospect.id,
      revenue,
      attributedContent: content.map(c => c.id),
      touchpoints: metrics.map(m => m.metricType),
      timeToClose,
      engagementScore,
      approachUsed: content.length > 0 ? this.mapToneToApproach(content[0].tone) : 'trust_build',
      confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
    };
  }

  private getMostFrequentApproach(performances: ContentPerformance[]): string {
    const counts = performances.reduce((acc, p) => {
      acc[p.approach] = (acc[p.approach] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
  }

  private getMostFrequentTone(performances: ContentPerformance[]): string {
    const counts = performances.reduce((acc, p) => {
      acc[p.tone] = (acc[p.tone] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
  }

  private calculateTrends(performances: ContentPerformance[], metric: keyof ContentPerformance): number[] {
    // Simulate trend data - in production, this would be calculated from historical data
    return Array.from({ length: 30 }, (_, i) => Math.random() * 100);
  }

  private calculateRevenueTrends(roi: ROIAttribution[]): number[] {
    return Array.from({ length: 30 }, (_, i) => Math.random() * 50000);
  }

  private calculateContentBreakdown(performances: ContentPerformance[]): any[] {
    const breakdown = performances.reduce((acc, p) => {
      if (!acc[p.approach]) {
        acc[p.approach] = { count: 0, totalPerformance: 0 };
      }
      acc[p.approach].count++;
      acc[p.approach].totalPerformance += p.engagementScore;
      return acc;
    }, {});

    return Object.entries(breakdown).map(([approach, data]: [string, any]) => ({
      approach,
      count: data.count,
      avgPerformance: data.totalPerformance / data.count
    }));
  }
}

export const performanceAnalytics = new PerformanceAnalyticsEngine();