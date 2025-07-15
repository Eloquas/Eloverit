import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  BarChart3,
  CheckCircle,
  Eye,
  ArrowLeft,
  Zap,
  Users,
  Building2
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

interface ResearchInsight {
  id: string;
  type: 'opportunity' | 'trend' | 'optimization' | 'alert';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: string;
  dataPoints: string[];
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  relatedCompanies?: string[];
  suggestedActions?: string[];
}

export default function ResearchInsights() {
  const [selectedInsight, setSelectedInsight] = useState<ResearchInsight | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const { data: insights = [], isLoading } = useQuery<ResearchInsight[]>({
    queryKey: ["/api/research-insights"],
  });

  const { data: highPriorityInsights = [] } = useQuery<ResearchInsight[]>({
    queryKey: ["/api/research-insights/high-priority"],
  });

  const filteredInsights = insights.filter(insight => {
    if (filter === "all") return true;
    if (filter === "high-priority") return insight.priority === "high";
    return insight.type === filter;
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="w-5 h-5" />;
      case 'trend': return <TrendingUp className="w-5 h-5" />;
      case 'optimization': return <Zap className="w-5 h-5" />;
      case 'alert': return <AlertTriangle className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'bg-green-50 border-green-200';
      case 'trend': return 'bg-blue-50 border-blue-200';
      case 'optimization': return 'bg-purple-50 border-purple-200';
      case 'alert': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing research patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/account-research">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Research
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Research Insights</h1>
            <p className="text-gray-600">
              AI-powered recommendations based on your research patterns and market trends
            </p>
          </div>
        </div>
      </div>

      {/* High Priority Alert */}
      {highPriorityInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">
                  {highPriorityInsights.length} High Priority Insight{highPriorityInsights.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-red-700">
                  Immediate action recommended for maximum impact
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
              View Details
            </Button>
          </div>
        </motion.div>
      )}

      {/* Insights Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Insights</p>
                <p className="text-2xl font-bold text-blue-600">{insights.length}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Opportunities</p>
                <p className="text-2xl font-bold text-green-600">
                  {insights.filter(i => i.type === 'opportunity').length}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Market Trends</p>
                <p className="text-2xl font-bold text-purple-600">
                  {insights.filter(i => i.type === 'trend').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-orange-600">
                  {insights.length > 0 ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length) : 0}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Research Insights & Recommendations
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All Insights</TabsTrigger>
              <TabsTrigger value="high-priority">High Priority</TabsTrigger>
              <TabsTrigger value="opportunity">Opportunities</TabsTrigger>
              <TabsTrigger value="trend">Trends</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
              <TabsTrigger value="alert">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-6">
              {filteredInsights.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No insights available</h3>
                  <p className="text-gray-500">
                    {filter === "all" 
                      ? "Generate account research to unlock AI-powered insights"
                      : `No ${filter} insights found. Try a different filter.`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInsights.map((insight) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer ${getTypeColor(insight.type)}`}
                      onClick={() => setSelectedInsight(insight)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            {getInsightIcon(insight.type)}
                            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                            <Badge className={getPriorityColor(insight.priority)}>
                              {insight.priority} priority
                            </Badge>
                            <Badge variant="outline" className={getImpactColor(insight.impact)}>
                              {insight.impact} impact
                            </Badge>
                          </div>

                          <p className="text-gray-700 mb-4">{insight.description}</p>

                          <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Actionable Recommendation:</h4>
                            <p className="text-sm text-gray-700">{insight.actionable}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {insight.timeframe}
                              </div>
                              <div className="flex items-center">
                                <BarChart3 className="w-4 h-4 mr-1" />
                                {insight.confidence}% confidence
                              </div>
                              {insight.relatedCompanies && (
                                <div className="flex items-center">
                                  <Building2 className="w-4 h-4 mr-1" />
                                  {insight.relatedCompanies.length} companies
                                </div>
                              )}
                            </div>

                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detailed Insight Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getInsightIcon(selectedInsight.type)}
                  <h2 className="text-xl font-bold">{selectedInsight.title}</h2>
                </div>
                <Button variant="ghost" onClick={() => setSelectedInsight(null)}>
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Badge className={getPriorityColor(selectedInsight.priority)}>
                    {selectedInsight.priority} priority
                  </Badge>
                  <Badge variant="outline" className={getImpactColor(selectedInsight.impact)}>
                    {selectedInsight.impact} impact
                  </Badge>
                  <Badge variant="outline">
                    {selectedInsight.confidence}% confidence
                  </Badge>
                </div>

                <p className="text-gray-700">{selectedInsight.description}</p>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Actionable Recommendation</h4>
                  <p className="text-blue-800">{selectedInsight.actionable}</p>
                </div>

                {selectedInsight.dataPoints.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Supporting Data Points</h4>
                    <ul className="space-y-1">
                      {selectedInsight.dataPoints.map((point, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedInsight.suggestedActions && selectedInsight.suggestedActions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Suggested Actions</h4>
                    <div className="space-y-2">
                      {selectedInsight.suggestedActions.map((action, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm">{action}</span>
                          <Button variant="outline" size="sm">
                            Take Action
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInsight.relatedCompanies && selectedInsight.relatedCompanies.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Related Companies</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedInsight.relatedCompanies.map((company, index) => (
                        <Badge key={index} variant="secondary">
                          {company}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Timeline: {selectedInsight.timeframe}
                  </div>
                  <Button onClick={() => setSelectedInsight(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}