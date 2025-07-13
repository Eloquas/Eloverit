import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, TrendingUp, Award, Target, Clock, Users, ChevronRight, Crown, Fire, Medal, Gift, Sparkles, ArrowUp, TrendingDown } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

// Achievement unlock notification component
const AchievementNotification = ({ achievement, onClose }: { achievement: UserAchievement, onClose: () => void }) => (
  <motion.div
    initial={{ x: 400, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: 400, opacity: 0 }}
    className="fixed top-20 right-4 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-2xl border-2 border-yellow-300 max-w-sm"
  >
    <div className="flex items-center space-x-3">
      <div className="text-3xl">{achievement.icon}</div>
      <div className="flex-1">
        <div className="font-bold text-lg">Achievement Unlocked!</div>
        <div className="font-medium">{achievement.name}</div>
        <div className="text-sm opacity-90">{achievement.description}</div>
        <div className="text-sm font-bold">+{achievement.points} points</div>
      </div>
      <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
        ×
      </Button>
    </div>
  </motion.div>
);

// Animated progress ring component
const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = "#3B82F6" }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span 
          className="text-2xl font-bold text-gray-700"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
};

// Level progression component
const LevelProgressCard = ({ stats }: { stats: any }) => (
  <Card className="bg-gradient-to-br from-purple-500 to-blue-600 text-white border-0">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-xl">Level {stats.level}</CardTitle>
          <CardDescription className="text-purple-100">{stats.levelTitle}</CardDescription>
        </div>
        <Crown className="h-8 w-8 text-yellow-300" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>{stats.totalPoints} XP</span>
          <span>{stats.pointsForNextLevel} XP</span>
        </div>
        <div className="relative">
          <Progress value={stats.levelProgressPercentage} className="h-3 bg-white/20" />
          <motion.div
            className="absolute top-0 left-0 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${stats.levelProgressPercentage}%` }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </div>
        <div className="text-center text-sm">
          {stats.xpToNextLevel} XP to next level
        </div>
      </div>
    </CardContent>
  </Card>
);

// Streak tracker component
const StreakCard = ({ streakData }: { streakData: any }) => (
  <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Fire className="h-6 w-6" />
            {streakData.currentStreak} Day Streak
          </CardTitle>
          <CardDescription className="text-orange-100">{streakData.streakLevel}</CardDescription>
        </div>
        <Badge className="bg-white/20 text-white">{streakData.streakIcon}</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="text-sm">
          Longest streak: {streakData.longestStreak} days
        </div>
        <div className="text-sm">
          Next milestone: {streakData.nextStreakMilestone} days
        </div>
        {streakData.isOnFire && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center gap-2 text-yellow-300 font-bold"
          >
            <Sparkles className="h-4 w-4" />
            You're on fire!
          </motion.div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [notifications, setNotifications] = useState<UserAchievement[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAchievement, setSelectedAchievement] = useState<UserAchievement | null>(null);

  // Fetch achievements data
  const { data: achievementsData, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/achievements'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/achievements/stats'],
    refetchInterval: 30000,
  });

  // Fetch leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/achievements/leaderboard'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Activity recording mutation
  const recordActivityMutation = useMutation({
    mutationFn: async ({ activityType, metadata }: { activityType: string; metadata?: any }) => {
      const response = await apiRequest('POST', '/api/achievements/activity', { activityType, metadata });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.newAchievements && data.newAchievements.length > 0) {
        setNotifications(prev => [...prev, ...data.newAchievements]);
        data.newAchievements.forEach((achievement: UserAchievement) => {
          toast({
            title: "Achievement Unlocked!",
            description: `${achievement.name} - ${achievement.description}`,
          });
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/achievements/stats'] });
    },
  });

  // Simulate activity for demo purposes
  const triggerDemoActivity = () => {
    recordActivityMutation.mutate({ 
      activityType: 'email_sent',
      metadata: { score: 85 }
    });
  };

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  // Process achievement data
  const achievements: UserAchievement[] = achievementsData?.unlocked || [];
  const inProgress: { achievement: Achievement; progress: number }[] = achievementsData?.inProgress || [];
  
  // Default stats if not loaded
  const stats = userStats || {
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

  if (achievementsLoading || statsLoading) {
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

      {/* Achievement Notifications */}
      <AnimatePresence>
        {notifications.map((achievement, index) => (
          <AchievementNotification
            key={achievement.id}
            achievement={achievement}
            onClose={() => removeNotification(index)}
          />
        ))}
      </AnimatePresence>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <LevelProgressCard stats={stats} />
        <StreakCard streakData={stats.streakData} />
        
        {/* Quick Stats */}
        <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Trust Score</span>
                <span className="font-bold">{stats.highestTrustScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Story Score</span>
                <span className="font-bold">{stats.bestStoryScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Weekly Activity</span>
                <span className="font-bold">{stats.weeklyActivity}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo Activity Button */}
      <div className="flex justify-center">
        <Button 
          onClick={triggerDemoActivity}
          disabled={recordActivityMutation.isPending}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          {recordActivityMutation.isPending ? "Recording..." : "🎯 Trigger Demo Achievement"}
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            In Progress
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-4">
          {/* Achievement Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {['engagement', 'content', 'performance', 'milestone', 'special'].map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex items-center gap-1"
              >
                {getCategoryIcon(category)}
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            ))}
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => setSelectedAchievement(achievement)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`text-3xl ${achievement.unlocked ? 'opacity-100' : 'opacity-40'}`}>
                          {achievement.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{achievement.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getTierColor(achievement.tier)}>
                              {achievement.tier}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getCategoryIcon(achievement.category)}
                              {achievement.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {achievement.unlocked && (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Unlocked
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600">
                        +{achievement.points} XP
                      </span>
                      {!achievement.unlocked && achievement.progressPercentage !== undefined && (
                        <div className="flex items-center gap-2">
                          <ProgressRing 
                            progress={achievement.progressPercentage} 
                            size={40} 
                            strokeWidth={4}
                            color={achievement.progressPercentage > 75 ? "#10B981" : "#3B82F6"}
                          />
                          <span className="text-xs text-gray-500">
                            {achievement.progressText}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgress.map((item, index) => (
              <motion.div
                key={item.achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl opacity-60">{item.achievement.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{item.achievement.name}</CardTitle>
                        <CardDescription>{item.achievement.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(item.progress)}%</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>+{item.achievement.points} XP when completed</span>
                        <span>{item.achievement.tier} tier</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Weekly Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard?.map((entry, index) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        entry.rank === 1 ? 'bg-yellow-500 text-white' :
                        entry.rank === 2 ? 'bg-gray-400 text-white' :
                        entry.rank === 3 ? 'bg-orange-500 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {entry.rank}
                      </div>
                      <div>
                        <div className="font-medium">{entry.name}</div>
                        <div className="text-sm text-gray-600">Level {entry.level}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{entry.points} XP</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Achievement Detail Modal */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="max-w-md">
          {selectedAchievement && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-3xl">{selectedAchievement.icon}</span>
                  {selectedAchievement.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedAchievement.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge className={getTierColor(selectedAchievement.tier)}>
                    {selectedAchievement.tier} tier
                  </Badge>
                  <span className="font-bold text-blue-600">+{selectedAchievement.points} XP</span>
                </div>
                {selectedAchievement.unlocked ? (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="font-bold text-green-800">Achievement Unlocked!</div>
                    {selectedAchievement.unlockedAt && (
                      <div className="text-sm text-green-600 mt-1">
                        Unlocked {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-bold text-blue-800">
                      {selectedAchievement.progressPercentage}% Complete
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      {selectedAchievement.progressText}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
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