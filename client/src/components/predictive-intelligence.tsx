import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Clock, 
  Target, 
  Users, 
  MessageSquare,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Lightbulb
} from "lucide-react";
import { motion } from "framer-motion";

interface PredictiveInsight {
  id: string;
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
  name: string;
  company: string;
  score: number;
  reasons: string[];
  nextAction: string;
  timing: string;
  probability: number;
}

export function PredictiveIntelligence() {
  const [selectedInsight, setSelectedInsight] = useState<PredictiveInsight | null>(null);
  const [activeTab, setActiveTab] = useState("prospects");

  // Simulate predictive insights
  const insights: PredictiveInsight[] = [
    {
      id: "1",
      type: "prospect_priority",
      title: "High-Intent Prospect Alert",
      description: "3 prospects showing strong buying signals based on recent activity patterns",
      confidence: 87,
      impact: "high",
      actionable: true,
      timeframe: "Next 48 hours",
      data: {
        prospects: [
          { name: "Sarah Chen", company: "TechCorp", score: 94, signals: ["Job posting for QA Manager", "Downloaded 3 resources", "Visited pricing page 5x"] },
          { name: "Mike Johnson", company: "DataFlow", score: 89, signals: ["LinkedIn engagement", "Email opens trending up", "Competitor research"] }
        ]
      }
    },
    {
      id: "2",
      type: "timing_optimization",
      title: "Optimal Outreach Windows",
      description: "AI predicts Tuesday 2-4 PM generates 40% higher response rates for enterprise prospects",
      confidence: 92,
      impact: "medium",
      actionable: true,
      timeframe: "This week",
      data: {
        bestTimes: ["Tuesday 2-4 PM", "Thursday 10-12 PM"],
        avoidTimes: ["Monday mornings", "Friday afternoons"],
        responseRateIncrease: 40
      }
    },
    {
      id: "3",
      type: "content_prediction",
      title: "Message Optimization Alert",
      description: "Trust-based messages are performing 65% better than story-based for your current prospects",
      confidence: 78,
      impact: "high",
      actionable: true,
      timeframe: "Next 7 days",
      data: {
        recommendedApproach: "trust_build",
        performanceIncrease: 65,
        reason: "Current prospects are in evaluation stage, need credibility signals"
      }
    },
    {
      id: "4",
      type: "market_intelligence",
      title: "Competitive Intelligence",
      description: "Competitor launched new QA solution - 3 of your prospects mentioned it in recent conversations",
      confidence: 95,
      impact: "high",
      actionable: true,
      timeframe: "Immediate",
      data: {
        competitor: "QualityPro",
        affectedProspects: 3,
        talking_points: ["Highlight our integration advantages", "Emphasize proven ROI", "Share customer success stories"]
      }
    }
  ];

  const prospectScores: ProspectScore[] = [
    {
      prospectId: 1,
      name: "Sarah Chen",
      company: "TechCorp",
      score: 94,
      reasons: ["Recent job posting for QA Manager", "Downloaded 3 resources this week", "Visited pricing page 5 times"],
      nextAction: "Send personalized demo invitation",
      timing: "Within 24 hours",
      probability: 87
    },
    {
      prospectId: 2,
      name: "Mike Johnson", 
      company: "DataFlow",
      score: 89,
      reasons: ["High LinkedIn engagement", "Email open rate trending up", "Researching competitors"],
      nextAction: "Send competitive comparison",
      timing: "This week",
      probability: 74
    },
    {
      prospectId: 3,
      name: "Lisa Park",
      company: "InnovateCorp",
      score: 82,
      reasons: ["Budget approved for Q1", "Team expansion signals", "Active on industry forums"],
      nextAction: "Schedule discovery call",
      timing: "Next week",
      probability: 68
    }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prospect_priority': return <Target className="w-5 h-5" />;
      case 'timing_optimization': return <Clock className="w-5 h-5" />;
      case 'content_prediction': return <MessageSquare className="w-5 h-5" />;
      case 'market_intelligence': return <TrendingUp className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Predictive Intelligence</h2>
          <p className="text-gray-600">AI-powered insights to optimize your outreach strategy</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Real-time analysis</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prospects">Priority Prospects</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="market">Market Intel</TabsTrigger>
        </TabsList>

        <TabsContent value="prospects" className="space-y-4">
          <div className="grid gap-4">
            {prospectScores.map((prospect) => (
              <Card key={prospect.prospectId} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{prospect.name}</CardTitle>
                      <CardDescription>{prospect.company}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{prospect.score}</div>
                      <div className="text-sm text-gray-500">{prospect.probability}% likely</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Buying Signals</div>
                    <div className="space-y-1">
                      {prospect.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Next Action</div>
                      <div className="text-sm text-blue-600">{prospect.nextAction}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">Timing</div>
                      <div className="text-sm text-orange-600">{prospect.timing}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="cursor-pointer"
                onClick={() => setSelectedInsight(insight)}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <CardDescription>{insight.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="text-sm text-gray-600">Confidence</div>
                          <div className="flex items-center space-x-2">
                            <Progress value={insight.confidence} className="w-20 h-2" />
                            <span className="text-sm font-medium">{insight.confidence}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Timeframe</div>
                          <div className="text-sm font-medium">{insight.timeframe}</div>
                        </div>
                      </div>
                      {insight.actionable && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Take Action
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Response Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">+23%</div>
                <div className="text-sm text-gray-600">vs last month</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">AI Prediction Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">89%</div>
                <div className="text-sm text-gray-600">correct predictions</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Revenue Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">$127K</div>
                <div className="text-sm text-gray-600">attributed to AI insights</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Intelligence Dashboard</CardTitle>
              <CardDescription>Real-time competitive and industry insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">Competitive Threat</span>
                  </div>
                  <p className="text-sm text-red-700">QualityPro launched new features mentioned by 3 prospects</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Market Opportunity</span>
                  </div>
                  <p className="text-sm text-green-700">QA automation market growing 15% - perfect timing for outreach</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}