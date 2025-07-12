import { db } from "./db";
import { prospects, generatedContent } from "@shared/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: 'engagement' | 'content' | 'performance' | 'milestone' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  criteria: AchievementCriteria;
}

interface AchievementCriteria {
  type: string;
  threshold: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
}

interface UserAchievement {
  userId: number;
  achievementId: string;
  unlockedAt: Date;
  progress: number;
  isNew: boolean;
}

interface UserStats {
  userId: number;
  totalPoints: number;
  level: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalEmails: number;
  totalLinkedInPosts: number;
  totalCallsAnalyzed: number;
  totalCampaigns: number;
  highestTrustScore: number;
  bestStoryScore: number;
  weeklyActivity: number;
  monthlyActivity: number;
  streakBonus: number;
  lastActivityDate?: string;
  totalLoginDays: number;
  averageSessionTime: number;
}

export class AchievementSystem {
  private achievements: Map<string, Achievement> = new Map();
  private userAchievements: Map<string, UserAchievement> = new Map();
  private userStats: Map<number, UserStats> = new Map();

  constructor() {
    this.initializeAchievements();
  }

  private initializeAchievements() {
    // Engagement Achievements
    this.registerAchievement({
      id: 'first_email',
      name: 'First Contact',
      description: 'Send your first personalized email',
      icon: '✉️',
      points: 10,
      category: 'engagement',
      tier: 'bronze',
      criteria: { type: 'emails_sent', threshold: 1 }
    });

    this.registerAchievement({
      id: 'email_veteran',
      name: 'Email Veteran',
      description: 'Send 100 personalized emails',
      icon: '📧',
      points: 50,
      category: 'engagement',
      tier: 'silver',
      criteria: { type: 'emails_sent', threshold: 100 }
    });

    this.registerAchievement({
      id: 'email_master',
      name: 'Email Master',
      description: 'Send 500 personalized emails',
      icon: '🎯',
      points: 200,
      category: 'engagement',
      tier: 'gold',
      criteria: { type: 'emails_sent', threshold: 500 }
    });

    this.registerAchievement({
      id: 'linkedin_starter',
      name: 'LinkedIn Starter',
      description: 'Generate your first LinkedIn post',
      icon: '📱',
      points: 15,
      category: 'content',
      tier: 'bronze',
      criteria: { type: 'linkedin_posts', threshold: 1 }
    });

    this.registerAchievement({
      id: 'linkedin_influencer',
      name: 'LinkedIn Influencer',
      description: 'Generate 50 LinkedIn posts',
      icon: '🌟',
      points: 100,
      category: 'content',
      tier: 'gold',
      criteria: { type: 'linkedin_posts', threshold: 50 }
    });

    this.registerAchievement({
      id: 'call_analyzer',
      name: 'Call Analyzer',
      description: 'Analyze your first sales call',
      icon: '🎙️',
      points: 20,
      category: 'performance',
      tier: 'bronze',
      criteria: { type: 'calls_analyzed', threshold: 1 }
    });

    this.registerAchievement({
      id: 'trust_builder',
      name: 'Trust Builder',
      description: 'Achieve trust score of 85+',
      icon: '🤝',
      points: 75,
      category: 'performance',
      tier: 'silver',
      criteria: { type: 'trust_score', threshold: 85 }
    });

    this.registerAchievement({
      id: 'story_master',
      name: 'Story Master',
      description: 'Achieve story score of 18+',
      icon: '📖',
      points: 100,
      category: 'performance',
      tier: 'gold',
      criteria: { type: 'story_score', threshold: 18 }
    });

    this.registerAchievement({
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Active for 7 consecutive days',
      icon: '⚡',
      points: 50,
      category: 'milestone',
      tier: 'silver',
      criteria: { type: 'streak_days', threshold: 7 }
    });

    this.registerAchievement({
      id: 'month_master',
      name: 'Month Master',
      description: 'Active for 30 consecutive days',
      icon: '👑',
      points: 200,
      category: 'milestone',
      tier: 'platinum',
      criteria: { type: 'streak_days', threshold: 30 }
    });

    this.registerAchievement({
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Log in before 8 AM',
      icon: '🌅',
      points: 10,
      category: 'special',
      tier: 'bronze',
      criteria: { type: 'early_login', threshold: 1 }
    });

    this.registerAchievement({
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Work past 10 PM',
      icon: '🦉',
      points: 10,
      category: 'special',
      tier: 'bronze',
      criteria: { type: 'late_activity', threshold: 1 }
    });

    this.registerAchievement({
      id: 'campaign_creator',
      name: 'Campaign Creator',
      description: 'Create 10 outreach campaigns',
      icon: '🚀',
      points: 60,
      category: 'content',
      tier: 'silver',
      criteria: { type: 'campaigns_created', threshold: 10 }
    });

    this.registerAchievement({
      id: 'data_driven',
      name: 'Data Driven',
      description: 'Research 100 accounts',
      icon: '📊',
      points: 80,
      category: 'engagement',
      tier: 'silver',
      criteria: { type: 'accounts_researched', threshold: 100 }
    });

    this.registerAchievement({
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Get perfect scores in all categories',
      icon: '💎',
      points: 500,
      category: 'special',
      tier: 'platinum',
      criteria: { type: 'perfect_scores', threshold: 1 }
    });

    this.registerAchievement({
      id: 'email_master',
      name: 'Email Master',
      description: 'Send 1000 personalized emails',
      icon: '📨',
      points: 200,
      category: 'engagement',
      tier: 'gold',
      criteria: { type: 'emails_sent', threshold: 1000 }
    });

    // Content Achievements
    this.registerAchievement({
      id: 'story_teller',
      name: 'Story Teller',
      description: 'Use StoryBuild™ mode 10 times',
      icon: '📖',
      points: 30,
      category: 'content',
      tier: 'bronze',
      criteria: { type: 'storybuild_used', threshold: 10 }
    });

    this.registerAchievement({
      id: 'trust_builder',
      name: 'Trust Builder',
      description: 'Use TrustBuild™ mode 10 times',
      icon: '🤝',
      points: 30,
      category: 'content',
      tier: 'bronze',
      criteria: { type: 'trustbuild_used', threshold: 10 }
    });

    this.registerAchievement({
      id: 'linkedin_influencer',
      name: 'LinkedIn Influencer',
      description: 'Publish 10 LinkedIn posts',
      icon: '💼',
      points: 40,
      category: 'content',
      tier: 'silver',
      criteria: { type: 'linkedin_posts', threshold: 10 }
    });

    // Performance Achievements
    this.registerAchievement({
      id: 'high_trust',
      name: 'Trusted Advisor',
      description: 'Achieve a TrustScore of 90+',
      icon: '⭐',
      points: 60,
      category: 'performance',
      tier: 'gold',
      criteria: { type: 'trust_score', threshold: 90 }
    });

    this.registerAchievement({
      id: 'perfect_story',
      name: 'Perfect Storyteller',
      description: 'Achieve a StoryScore of 18+',
      icon: '🌟',
      points: 80,
      category: 'performance',
      tier: 'gold',
      criteria: { type: 'story_score', threshold: 18 }
    });

    this.registerAchievement({
      id: 'reply_magnet',
      name: 'Reply Magnet',
      description: 'Get 5+ replies from a single sequence',
      icon: '🧲',
      points: 100,
      category: 'performance',
      tier: 'platinum',
      criteria: { type: 'high_replies', threshold: 5 }
    });

    // Milestone Achievements
    this.registerAchievement({
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day activity streak',
      icon: '🔥',
      points: 25,
      category: 'milestone',
      tier: 'bronze',
      criteria: { type: 'streak', threshold: 7 }
    });

    this.registerAchievement({
      id: 'month_master',
      name: 'Month Master',
      description: 'Maintain a 30-day activity streak',
      icon: '🏆',
      points: 100,
      category: 'milestone',
      tier: 'gold',
      criteria: { type: 'streak', threshold: 30 }
    });

    this.registerAchievement({
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Send 10 emails before 9 AM',
      icon: '🌅',
      points: 20,
      category: 'milestone',
      tier: 'bronze',
      criteria: { type: 'early_emails', threshold: 10 }
    });

    // Special Achievements
    this.registerAchievement({
      id: 'ai_pioneer',
      name: 'AI Pioneer',
      description: 'Use all AI features in a single week',
      icon: '🤖',
      points: 50,
      category: 'special',
      tier: 'silver',
      criteria: { type: 'ai_features', threshold: 5 }
    });

    this.registerAchievement({
      id: 'team_player',
      name: 'Team Player',
      description: 'Help team reach 1000 collective emails',
      icon: '👥',
      points: 75,
      category: 'special',
      tier: 'gold',
      criteria: { type: 'team_emails', threshold: 1000 }
    });
  }

  private registerAchievement(achievement: Achievement) {
    this.achievements.set(achievement.id, achievement);
  }

  async checkAchievements(userId: number): Promise<UserAchievement[]> {
    const stats = await this.getUserStats(userId);
    const newAchievements: UserAchievement[] = [];

    for (const [id, achievement] of this.achievements) {
      const userAchievementKey = `${userId}_${id}`;
      
      if (!this.userAchievements.has(userAchievementKey)) {
        const progress = await this.calculateProgress(userId, achievement, stats);
        
        if (progress >= achievement.criteria.threshold) {
          const userAchievement: UserAchievement = {
            userId,
            achievementId: id,
            unlockedAt: new Date(),
            progress: 100,
            isNew: true
          };
          
          this.userAchievements.set(userAchievementKey, userAchievement);
          newAchievements.push(userAchievement);
          
          // Update user points
          if (stats) {
            stats.totalPoints += achievement.points;
            stats.level = Math.floor(stats.totalPoints / 100) + 1;
          }
        }
      }
    }

    return newAchievements;
  }

  private async getUserStats(userId: number): Promise<UserStats> {
    let stats = this.userStats.get(userId);
    
    if (!stats) {
      // Calculate stats from database
      const emailCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(generatedContent)
        .where(eq(generatedContent.type, 'email'));

      stats = {
        userId,
        totalPoints: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalEmails: emailCount[0]?.count || 0,
        totalLinkedInPosts: 0,
        highestTrustScore: 0,
        bestStoryScore: 0,
        weeklyActivity: 0
      };
      
      this.userStats.set(userId, stats);
    }
    
    return stats;
  }

  private async calculateProgress(
    userId: number, 
    achievement: Achievement, 
    stats: UserStats
  ): Promise<number> {
    switch (achievement.criteria.type) {
      case 'emails_sent':
        return stats.totalEmails;
      
      case 'linkedin_posts':
        return stats.totalLinkedInPosts;
      
      case 'trust_score':
        return stats.highestTrustScore;
      
      case 'story_score':
        return stats.bestStoryScore;
      
      case 'streak':
        return stats.currentStreak;
      
      default:
        return 0;
    }
  }

  async getUserAchievements(userId: number): Promise<{
    unlocked: Achievement[];
    inProgress: { achievement: Achievement; progress: number }[];
    stats: UserStats;
  }> {
    const stats = await this.getUserStats(userId);
    const unlocked: Achievement[] = [];
    const inProgress: { achievement: Achievement; progress: number }[] = [];

    for (const [id, achievement] of this.achievements) {
      const userAchievementKey = `${userId}_${id}`;
      
      if (this.userAchievements.has(userAchievementKey)) {
        unlocked.push(achievement);
      } else {
        const progress = await this.calculateProgress(userId, achievement, stats);
        const percentage = Math.min(100, (progress / achievement.criteria.threshold) * 100);
        
        if (percentage > 0) {
          inProgress.push({ achievement, progress: percentage });
        }
      }
    }

    return { unlocked, inProgress, stats };
  }

  async getLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'weekly'): Promise<{
    userId: number;
    name: string;
    points: number;
    level: number;
    rank: number;
  }[]> {
    // Mock leaderboard data
    const mockUsers = [
      { userId: 1, name: 'Sarah Chen', points: 1250, level: 13 },
      { userId: 2, name: 'Mike Johnson', points: 980, level: 10 },
      { userId: 3, name: 'Emma Wilson', points: 875, level: 9 },
      { userId: 4, name: 'Alex Kumar', points: 650, level: 7 },
      { userId: 5, name: 'Lisa Park', points: 420, level: 5 }
    ];

    return mockUsers
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({ ...user, rank: index + 1 }));
  }

  async recordActivity(userId: number, activityType: string, metadata?: any) {
    const stats = await this.getUserStats(userId);
    
    switch (activityType) {
      case 'email_sent':
        stats.totalEmails++;
        stats.weeklyActivity++;
        break;
      
      case 'linkedin_post':
        stats.totalLinkedInPosts++;
        stats.weeklyActivity++;
        break;
      
      case 'trust_score':
        if (metadata?.score > stats.highestTrustScore) {
          stats.highestTrustScore = metadata.score;
        }
        break;
      
      case 'story_score':
        if (metadata?.score > stats.bestStoryScore) {
          stats.bestStoryScore = metadata.score;
        }
        break;
    }

    // Check for new achievements
    return await this.checkAchievements(userId);
  }

  // Enhanced visual tracking methods
  calculateLevelProgression(totalPoints: number) {
    const level = Math.floor(Math.sqrt(totalPoints / 100)) + 1;
    const pointsForCurrentLevel = Math.pow(level - 1, 2) * 100;
    const pointsForNextLevel = Math.pow(level, 2) * 100;
    const xpToNextLevel = pointsForNextLevel - totalPoints;
    const currentLevelProgress = totalPoints - pointsForCurrentLevel;
    const levelProgressPercentage = Math.round((currentLevelProgress / (pointsForNextLevel - pointsForCurrentLevel)) * 100);

    return {
      level,
      totalPoints,
      pointsForCurrentLevel,
      pointsForNextLevel,
      xpToNextLevel,
      currentLevelProgress,
      levelProgressPercentage,
      levelTitle: this.getLevelTitle(level)
    };
  }

  getLevelTitle(level: number): string {
    if (level >= 50) return "Legendary Sales Master";
    if (level >= 40) return "Elite Sales Expert";
    if (level >= 30) return "Senior Sales Professional";
    if (level >= 20) return "Advanced Sales Specialist";
    if (level >= 15) return "Experienced Outreach Pro";
    if (level >= 10) return "Skilled Sales Representative";
    if (level >= 5) return "Rising Sales Talent";
    return "Sales Apprentice";
  }

  calculateStreakData(userId: number) {
    const stats = this.userStats.get(userId);
    if (!stats) return this.getDefaultStreakData();
    
    const streakMultiplier = Math.min(Math.floor(stats.currentStreak / 7) * 0.1 + 1, 2.0);
    const nextStreakMilestone = Math.ceil(stats.currentStreak / 7) * 7 || 7;
    const daysToNextMilestone = nextStreakMilestone - stats.currentStreak;
    
    return {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      streakMultiplier,
      nextStreakMilestone,
      daysToNextMilestone,
      streakLevel: this.getStreakLevel(stats.currentStreak),
      streakIcon: this.getStreakIcon(stats.currentStreak),
      isOnFire: stats.currentStreak >= 7
    };
  }

  getDefaultStreakData() {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakMultiplier: 1.0,
      nextStreakMilestone: 7,
      daysToNextMilestone: 7,
      streakLevel: "Starting",
      streakIcon: "📈",
      isOnFire: false
    };
  }

  getStreakLevel(streak: number): string {
    if (streak >= 30) return "Legendary";
    if (streak >= 21) return "Epic";
    if (streak >= 14) return "Amazing";
    if (streak >= 7) return "On Fire";
    if (streak >= 3) return "Building";
    return "Starting";
  }

  getStreakIcon(streak: number): string {
    if (streak >= 30) return "🔥💎";
    if (streak >= 21) return "🔥⭐";
    if (streak >= 14) return "🔥🚀";
    if (streak >= 7) return "🔥";
    if (streak >= 3) return "⚡";
    return "📈";
  }

  calculateAchievementRarity(achievement: Achievement): 'common' | 'rare' | 'epic' | 'legendary' {
    if (achievement.tier === 'platinum' || achievement.points >= 200) return 'legendary';
    if (achievement.tier === 'gold' || achievement.points >= 100) return 'epic';
    if (achievement.tier === 'silver' || achievement.points >= 50) return 'rare';
    return 'common';
  }

  getEnhancedUserData(userId: number) {
    const stats = this.userStats.get(userId) || {
      userId,
      totalPoints: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      totalEmails: 0,
      totalLinkedInPosts: 0,
      highestTrustScore: 0,
      bestStoryScore: 0,
      weeklyActivity: 0,
      xpToNextLevel: 100,
      totalCallsAnalyzed: 0,
      totalCampaigns: 0,
      monthlyActivity: 0,
      streakBonus: 0,
      lastActivityDate: new Date().toISOString(),
      totalLoginDays: 1,
      averageSessionTime: 0
    };

    const levelProgression = this.calculateLevelProgression(stats.totalPoints);
    const streakData = this.calculateStreakData(userId);

    return {
      ...stats,
      ...levelProgression,
      streakData
    };
  }

  getAchievementById(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }
}

export const achievementSystem = new AchievementSystem();