import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Trophy,
  Award,
  Target,
  TrendingUp,
  Users,
  Star,
  Zap,
  Medal,
  Crown,
  Flame,
  Lock,
  CheckCircle,
  Mail,
  FileText
} from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: 'engagement' | 'content' | 'performance' | 'milestone' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface UserStats {
  userId: number;
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalEmails: number;
  totalLinkedInPosts: number;
  highestTrustScore: number;
  bestStoryScore: number;
  weeklyActivity: number;
}

interface LeaderboardEntry {
  userId: number;
  name: string;
  points: number;
  level: number;
  rank: number;
}

const tierColors = {
  bronze: "bg-orange-100 text-orange-800 border-orange-300",
  silver: "bg-gray-100 text-gray-800 border-gray-300",
  gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
  platinum: "bg-purple-100 text-purple-800 border-purple-300"
};

const categoryIcons = {
  engagement: Mail,
  content: FileText,
  performance: TrendingUp,
  milestone: Target,
  special: Star
};

export default function Achievements() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showNewAchievement, setShowNewAchievement] = useState<Achievement | null>(null);

  // Fetch user achievements
  const { data: achievementsData, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/achievements'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch leaderboard
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/achievements/leaderboard'],
  });

  const { unlocked = [], inProgress = [], stats } = achievementsData || {};

  useEffect(() => {
    // Check for new achievements
    if (unlocked.length > 0) {
      const newAchievement = unlocked.find((a: any) => a.isNew);
      if (newAchievement) {
        setShowNewAchievement(newAchievement);
        setTimeout(() => setShowNewAchievement(null), 5000);
      }
    }
  }, [unlocked]);

  const filteredUnlocked = selectedCategory === "all" 
    ? unlocked 
    : unlocked.filter((a: Achievement) => a.category === selectedCategory);

  const filteredInProgress = selectedCategory === "all"
    ? inProgress
    : inProgress.filter((p: any) => p.achievement.category === selectedCategory);

  const calculateNextLevelProgress = () => {
    if (!stats) return 0;
    const pointsInCurrentLevel = stats.totalPoints % 100;
    return pointsInCurrentLevel;
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold avo-text-gradient mb-2">Achievements</h1>
          <p className="text-gray-600">Track your progress and unlock rewards</p>
        </div>

        {/* User Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Level {stats.level}</p>
                    <p className="text-2xl font-bold">{stats.totalPoints} Points</p>
                  </div>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                      {stats.level}
                    </div>
                    <Crown className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Next Level</span>
                    <span>{calculateNextLevelProgress()}/100 XP</span>
                  </div>
                  <Progress value={calculateNextLevelProgress()} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Current Streak</p>
                    <p className="text-2xl font-bold flex items-center">
                      {stats.currentStreak}
                      <Flame className="ml-2 h-5 w-5 text-orange-500" />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Best: {stats.longestStreak}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Emails</p>
                    <p className="text-2xl font-bold">{stats.totalEmails}</p>
                  </div>
                  <Mail className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Weekly Activity</p>
                    <p className="text-2xl font-bold">{stats.weeklyActivity}</p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Achievement Notification */}
        {showNewAchievement && (
          <div className="fixed top-24 right-8 z-50 animate-slide-in">
            <Card className="w-96 border-2 border-yellow-400 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{showNewAchievement.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
                    <p className="text-sm text-gray-600">{showNewAchievement.name}</p>
                    <p className="text-sm font-semibold text-primary">+{showNewAchievement.points} points</p>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="mt-6">
            {/* Category Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              {['engagement', 'content', 'performance', 'milestone', 'special'].map((category) => {
                const Icon = categoryIcons[category as keyof typeof categoryIcons];
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                );
              })}
            </div>

            {/* Achievements Grid */}
            <div className="space-y-6">
              {/* Unlocked Achievements */}
              {filteredUnlocked.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Unlocked ({filteredUnlocked.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUnlocked.map((achievement: Achievement) => (
                      <Card key={achievement.id} className="relative overflow-hidden">
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="text-3xl">{achievement.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{achievement.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                              <div className="flex items-center gap-2 mt-3">
                                <Badge className={tierColors[achievement.tier]}>
                                  {achievement.tier}
                                </Badge>
                                <span className="text-sm font-medium">+{achievement.points} pts</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Achievements */}
              {filteredInProgress.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">In Progress ({filteredInProgress.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInProgress.map(({ achievement, progress }: any) => (
                      <Card key={achievement.id} className="relative overflow-hidden opacity-90">
                        <div className="absolute top-2 right-2">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="text-3xl grayscale">{achievement.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{achievement.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                              <div className="mt-3 space-y-2">
                                <Progress value={progress} className="h-2" />
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">{progress.toFixed(0)}% complete</span>
                                  <span className="text-sm font-medium">+{achievement.points} pts</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Leaderboard</CardTitle>
                <CardDescription>Top performers this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`text-2xl font-bold ${
                          entry.rank === 1 ? 'text-yellow-600' :
                          entry.rank === 2 ? 'text-gray-500' :
                          entry.rank === 3 ? 'text-orange-600' :
                          'text-gray-400'
                        }`}>
                          {entry.rank === 1 && <Crown className="h-6 w-6" />}
                          {entry.rank === 2 && <Medal className="h-6 w-6" />}
                          {entry.rank === 3 && <Award className="h-6 w-6" />}
                          {entry.rank > 3 && `#${entry.rank}`}
                        </div>
                        <div>
                          <p className="font-semibold">{entry.name}</p>
                          <p className="text-sm text-gray-600">Level {entry.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{entry.points}</p>
                        <p className="text-sm text-gray-600">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}