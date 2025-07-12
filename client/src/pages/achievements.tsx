import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Zap, TrendingUp, Award, Target, Clock, Users, ChevronRight, Crown } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: 'engagement' | 'content' | 'performance' | 'milestone' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  criteria: {
    type: string;
    threshold: number;
  };
}

interface UserAchievement extends Achievement {
  unlocked: boolean;
  progress: number;
  progressPercentage?: number;
  progressText?: string;
  unlockedAt?: string;
  isNew?: boolean;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  estimatedTimeToComplete?: string;
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
  levelTitle: string;
  levelProgressPercentage: number;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    streakLevel: string;
    streakIcon: string;
    isOnFire: boolean;
    nextStreakMilestone: number;
    daysToNextMilestone: number;
  };
}

interface LeaderboardEntry {
  userId: number;
  name: string;
  points: number;
  level: number;
  rank: number;
}

export default function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<UserAchievement | null>(null);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  // Fetch user achievements
  const { data: achievementData, isLoading } = useQuery({
    queryKey: ['/api/achievements'],
    queryFn: () => apiRequest('/api/achievements')
  });

  // Fetch enhanced user data
  const { data: userData } = useQuery({
    queryKey: ['/api/achievements/user-data'],
    queryFn: () => apiRequest('/api/achievements/user-data')
  });

  // Fetch leaderboard
  const { data: leaderboardData } = useQuery({
    queryKey: ['/api/achievements/leaderboard'],
    queryFn: () => apiRequest('/api/achievements/leaderboard')
  });

  const achievements: UserAchievement[] = achievementData?.unlocked || [];
  const inProgress: { achievement: Achievement; progress: number }[] = achievementData?.inProgress || [];
  const stats: UserStats = userData || {
    userId: 1,
    totalPoints: 245,
    level: 3,
    xpToNextLevel: 155,
    currentStreak: 5,
    longestStreak: 12,
    totalEmails: 42,
    totalLinkedInPosts: 8,
    totalCallsAnalyzed: 3,
    totalCampaigns: 2,
    highestTrustScore: 78,
    bestStoryScore: 15,
    weeklyActivity: 25,
    monthlyActivity: 89,
    levelTitle: "Rising Sales Talent",
    levelProgressPercentage: 61,
    streakData: {
      currentStreak: 5,
      longestStreak: 12,
      streakLevel: "Building",
      streakIcon: "⚡",
      isOnFire: false,
      nextStreakMilestone: 7,
      daysToNextMilestone: 2
    }
  };

  const leaderboard: LeaderboardEntry[] = leaderboardData || [];

  // Combine achievements with progress for display
  const allAchievements = [
    ...achievements.map(a => ({ ...a, unlocked: true })),
    ...inProgress.map(p => ({ 
      ...p.achievement, 
      unlocked: false, 
      progressPercentage: Math.round(p.progress),
      progressText: `${Math.round((p.progress / 100) * p.achievement.criteria.threshold)}/${p.achievement.criteria.threshold}`
    }))
  ];

  const filteredAchievements = allAchievements.filter(achievement => {
    if (showUnlockedOnly && !achievement.unlocked) return false;
    if (selectedCategory === 'all') return true;
    return achievement.category === selectedCategory;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-purple-500 bg-purple-50 text-purple-900';
      case 'epic': return 'border-orange-500 bg-orange-50 text-orange-900';
      case 'rare': return 'border-blue-500 bg-blue-50 text-blue-900';
      default: return 'border-gray-300 bg-gray-50 text-gray-900';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'silver': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'engagement': return <Target className="w-4 h-4" />;
      case 'content': return <Award className="w-4 h-4" />;
      case 'performance': return <TrendingUp className="w-4 h-4" />;
      case 'milestone': return <Trophy className="w-4 h-4" />;
      case 'special': return <Star className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  // Simulate achievement unlock animation
  useEffect(() => {
    if (achievements.some(a => a.isNew)) {
      setShowUnlockAnimation(true);
      setTimeout(() => setShowUnlockAnimation(false), 3000);
    }
  }, [achievements]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with User Progress */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Achievements & Progress</h1>
          <p className="text-gray-600 mt-2">Track your sales performance and unlock rewards</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{stats.totalPoints} XP</div>
          <div className="text-sm text-gray-600">Level {stats.level} • {stats.levelTitle}</div>
        </div>
      </div>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Level Progress */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Crown className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl font-bold text-blue-600">{stats.level}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Level Progress</h3>
            <div className="space-y-2">
              <Progress value={stats.levelProgressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-600">
                <span>{stats.levelTitle}</span>
                <span>{stats.xpToNextLevel} XP to next</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Tracker */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{stats.streakData.streakIcon}</span>
              <span className="text-2xl font-bold text-orange-600">{stats.streakData.currentStreak}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Activity Streak</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>{stats.streakData.streakLevel}</span>
                <span>{stats.streakData.daysToNextMilestone} days to milestone</span>
              </div>
              <Progress 
                value={(stats.streakData.currentStreak / stats.streakData.nextStreakMilestone) * 100} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Achievements Summary */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-purple-600">{achievements.length}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Unlocked Achievements</h3>
            <div className="space-y-2">
              <Progress 
                value={(achievements.length / allAchievements.length) * 100} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>of {allAchievements.length} total</span>
                <span>{Math.round((achievements.length / allAchievements.length) * 100)}% complete</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{stats.highestTrustScore}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Best Trust Score</h3>
            <div className="space-y-2">
              <Progress value={stats.highestTrustScore} className="h-2" />
              <div className="flex justify-between text-xs text-gray-600">
                <span>Story Score: {stats.bestStoryScore}/20</span>
                <span>{stats.totalEmails} emails sent</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Achievements</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="milestone">Milestones</TabsTrigger>
            <TabsTrigger value="special">Special</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showUnlockedOnly}
                onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                className="rounded"
              />
              <span>Show unlocked only</span>
            </label>
          </div>
        </div>

        <TabsContent value={selectedCategory} className="space-y-6">
          {/* Achievement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                  achievement.unlocked ? 'border-green-300 bg-green-50' : 'border-gray-200'
                } ${achievement.isNew ? 'animate-pulse border-yellow-400' : ''}`}
                onClick={() => setSelectedAchievement(achievement)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{achievement.name}</h3>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getTierColor(achievement.tier)}>
                        {achievement.tier}
                      </Badge>
                      <div className="text-xs text-gray-600 mt-1">{achievement.points} XP</div>
                    </div>
                  </div>

                  {!achievement.unlocked && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Progress</span>
                        <span>{achievement.progressText || `${achievement.progressPercentage || 0}%`}</span>
                      </div>
                      <Progress value={achievement.progressPercentage || 0} className="h-2" />
                      {achievement.estimatedTimeToComplete && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {achievement.estimatedTimeToComplete}
                        </div>
                      )}
                    </div>
                  )}

                  {achievement.unlocked && achievement.unlockedAt && (
                    <div className="flex items-center text-xs text-green-600">
                      <Trophy className="w-3 h-3 mr-1" />
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4">
                    <Badge variant="outline" className="flex items-center space-x-1">
                      {getCategoryIcon(achievement.category)}
                      <span className="capitalize">{achievement.category}</span>
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements found</h3>
                <p className="text-gray-600">
                  {showUnlockedOnly 
                    ? "You haven't unlocked any achievements in this category yet." 
                    : "No achievements match your current filter."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Leaderboard
                </CardTitle>
                <CardDescription>See how you stack up against your teammates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((user) => (
                    <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          user.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          user.rank === 2 ? 'bg-gray-100 text-gray-800' :
                          user.rank === 3 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          #{user.rank}
                        </div>
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-sm text-gray-600">Level {user.level}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{user.points} XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <span className="text-3xl">{selectedAchievement.icon}</span>
                <div>
                  <div>{selectedAchievement.name}</div>
                  <div className="text-sm text-gray-600 font-normal">{selectedAchievement.description}</div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge className={getTierColor(selectedAchievement.tier)}>
                  {selectedAchievement.tier.toUpperCase()}
                </Badge>
                <div className="text-lg font-bold text-blue-600">
                  {selectedAchievement.points} XP
                </div>
              </div>

              {!selectedAchievement.unlocked && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progress to unlock</span>
                    <span>{selectedAchievement.progressText || `${selectedAchievement.progressPercentage || 0}%`}</span>
                  </div>
                  <Progress value={selectedAchievement.progressPercentage || 0} className="h-3" />
                  {selectedAchievement.estimatedTimeToComplete && (
                    <div className="text-sm text-gray-600">
                      Estimated time: {selectedAchievement.estimatedTimeToComplete}
                    </div>
                  )}
                </div>
              )}

              {selectedAchievement.unlocked && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center text-green-800">
                    <Trophy className="w-4 h-4 mr-2" />
                    <span className="font-semibold">Achievement Unlocked!</span>
                  </div>
                  {selectedAchievement.unlockedAt && (
                    <div className="text-sm text-green-600 mt-1">
                      Completed on {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <Badge variant="outline" className="flex items-center space-x-1">
                  {getCategoryIcon(selectedAchievement.category)}
                  <span className="capitalize">{selectedAchievement.category}</span>
                </Badge>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedAchievement(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Achievement Unlock Animation */}
      {showUnlockAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 text-center animate-bounce">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
            <p className="text-gray-600">Check your achievements to see what you've earned</p>
          </div>
        </div>
      )}
    </div>
  );
}