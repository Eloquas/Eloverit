import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Share2,
  ThumbsUp,
  ThumbsDown,
  Star,
  Clock,
  Target,
  Lightbulb,
  Award,
  Filter,
  Search,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";

// Team Collaboration Component - PLACEHOLDER
// Ready for implementation - crowdsourced organizational intelligence

export function TeamCollaboration() {
  const [selectedTab, setSelectedTab] = useState("insights");

  // Mock data - would come from RAG intelligence system
  const teamMembers = [
    { id: 1, name: "Sarah Johnson", role: "Senior AE", avatar: "/api/placeholder/32/32", specialties: ["Enterprise", "Technology"] },
    { id: 2, name: "Mike Chen", role: "BDR", avatar: "/api/placeholder/32/32", specialties: ["SMB", "SaaS"] },
    { id: 3, name: "Lisa Rodriguez", role: "Sales Manager", avatar: "/api/placeholder/32/32", specialties: ["Team Management", "Strategy"] },
    { id: 4, name: "David Kim", role: "AE", avatar: "/api/placeholder/32/32", specialties: ["Healthcare", "Finance"] }
  ];

  const sharedInsights = [
    {
      id: 1,
      author: "Sarah Johnson",
      type: "market_intelligence",
      title: "QA Automation Budget Cycles",
      content: "Most enterprise prospects have Q1 budget approval for QA tools. Focus on December-February outreach.",
      relevantAccounts: ["TechCorp", "DataFlow", "InnovateCorp"],
      upvotes: 12,
      verified: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: 2,
      author: "Mike Chen",
      type: "competitive_intel",
      title: "QualityPro Pricing Weakness",
      content: "QualityPro's enterprise pricing is 40% higher than ours. Use this in competitive situations.",
      relevantAccounts: ["TechCorp", "DataFlow"],
      upvotes: 8,
      verified: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 3,
      author: "Lisa Rodriguez",
      type: "best_practice",
      title: "Trust-based Approach Performance",
      content: "Team members using trust-based email approaches see 65% higher response rates.",
      relevantAccounts: [],
      upvotes: 15,
      verified: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  const collaborationMetrics = {
    totalInsights: 47,
    verifiedInsights: 23,
    weeklyContributions: 12,
    teamEngagement: 85
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Collaboration</h1>
          <p className="text-gray-600">Crowdsourced organizational intelligence and best practices</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Users className="w-4 h-4 mr-2" />
            {teamMembers.length} Team Members
          </Badge>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Share Insight
          </Button>
        </div>
      </div>

      {/* Collaboration Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Insights</p>
                <p className="text-2xl font-bold">{collaborationMetrics.totalInsights}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-600">{collaborationMetrics.verifiedInsights}</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Weekly Contributions</p>
                <p className="text-2xl font-bold text-blue-600">{collaborationMetrics.weeklyContributions}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Engagement</p>
                <p className="text-2xl font-bold text-purple-600">{collaborationMetrics.teamEngagement}%</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Shared Insights</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">Market Intelligence</Button>
              <Button variant="outline" size="sm">Competitive Intel</Button>
              <Button variant="outline" size="sm">Best Practices</Button>
            </div>
          </div>

          <div className="space-y-4">
            {sharedInsights.map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            {insight.author.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{insight.title}</h3>
                            {insight.verified && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                <Award className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            by {insight.author} • {insight.type.replace('_', ' ')} • {insight.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {insight.upvotes}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3">{insight.content}</p>
                    {insight.relevantAccounts.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600">
                          Relevant for: {insight.relevantAccounts.join(', ')}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Specialties</p>
                      <div className="flex flex-wrap gap-1">
                        {member.specialties.map((specialty, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{Math.floor(Math.random() * 10) + 5}</div>
                        <div className="text-xs text-gray-500">Insights Shared</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{Math.floor(Math.random() * 20) + 10}</div>
                        <div className="text-xs text-gray-500">Upvotes Received</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Graph</CardTitle>
              <CardDescription>
                Organizational intelligence connections and relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Knowledge Graph Coming Soon</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Visual representation of organizational knowledge connections, account relationships, and team expertise mapping.
                </p>
                <Button className="mt-4" variant="outline">
                  Request Early Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}