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
  Building2,
  ExternalLink,
  Calendar,
  Briefcase,
  Star,
  Filter
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
  const [filter, setFilter] = useState<string>("companies");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const { data: insights = [], isLoading } = useQuery<ResearchInsight[]>({
    queryKey: ["/api/research-insights"],
  });

  const { data: highPriorityInsights = [] } = useQuery<ResearchInsight[]>({
    queryKey: ["/api/research-insights/high-priority"],
  });

  // Fetch researched companies with QA intent priority
  const { data: accountResearch = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["/api/account-research"],
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ["/api/prospects"],
  });

  const filteredInsights = insights.filter(insight => {
    if (filter === "all") return true;
    if (filter === "high-priority") return insight.priority === "high";
    return insight.type === filter;
  });

  // Calculate QA intent score for companies
  const calculateQAIntentScore = (company: any) => {
    let score = 0;
    
    try {
      const jobPostings = JSON.parse(company.recentJobPostings || '[]');
      const initiatives = JSON.parse(company.initiatives || '[]');
      const painPoints = JSON.parse(company.painPoints || '[]');
      
      // Job posting signals (40%)
      const qaJobKeywords = ['qa', 'quality', 'test', 'testing', 'automation', 'selenium', 'cypress'];
      const qaJobs = jobPostings.filter((job: any) => 
        qaJobKeywords.some(keyword => 
          job.title?.toLowerCase().includes(keyword) || 
          job.description?.toLowerCase().includes(keyword)
        )
      );
      score += Math.min(qaJobs.length * 10, 40);
      
      // Initiative signals (30%)
      const qaInitiatives = initiatives.filter((init: string) => 
        qaJobKeywords.some(keyword => init.toLowerCase().includes(keyword))
      );
      score += Math.min(qaInitiatives.length * 10, 30);
      
      // Pain point signals (20%)
      const qaPainPoints = painPoints.filter((pain: string) => 
        ['quality', 'testing', 'bug', 'defect', 'regression'].some(keyword => 
          pain.toLowerCase().includes(keyword)
        )
      );
      score += Math.min(qaPainPoints.length * 5, 20);
      
      // Company size bonus (10%)
      const employeeCount = company.employeeCount || 0;
      if (employeeCount > 1000) score += 10;
      else if (employeeCount > 500) score += 5;
      
    } catch (e) {
      score = 0;
    }
    
    return Math.min(score, 100);
  };

  // Enhanced companies with QA intent scores
  const companiesWithQAIntent = accountResearch.map((company: any) => ({
    ...company,
    qaIntentScore: calculateQAIntentScore(company),
    priority: calculateQAIntentScore(company) >= 75 ? 'high' : 
              calculateQAIntentScore(company) >= 50 ? 'medium' : 'low'
  })).sort((a, b) => b.qaIntentScore - a.qaIntentScore);

  const getIntentColor = (score: number) => {
    if (score >= 75) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getIntentLabel = (score: number) => {
    if (score >= 75) return 'High Intent';
    if (score >= 50) return 'Medium Intent';
    return 'Low Intent';
  };

  // Filter companies by priority
  const highPriorityCompanies = companiesWithQAIntent.filter(c => c.qaIntentScore >= 75);
  const mediumPriorityCompanies = companiesWithQAIntent.filter(c => c.qaIntentScore >= 50 && c.qaIntentScore < 75);

  // Generate actionable next steps for high priority companies
  const getActionableSteps = (company: any) => {
    const steps = [];
    
    try {
      const jobPostings = JSON.parse(company.recentJobPostings || '[]');
      const qaJobs = jobPostings.filter((job: any) => 
        ['qa', 'quality', 'test', 'testing', 'automation'].some(keyword => 
          job.title?.toLowerCase().includes(keyword) || 
          job.description?.toLowerCase().includes(keyword)
        )
      );
      
      if (qaJobs.length > 0) {
        steps.push({
          action: 'Target QA Hiring Manager',
          description: `Reach out to QA hiring managers about their ${qaJobs.length} active QA position${qaJobs.length > 1 ? 's' : ''}`,
          priority: 'high',
          timeframe: 'This week'
        });
      }
      
      const initiatives = JSON.parse(company.initiatives || '[]');
      const qaInitiatives = initiatives.filter((init: string) => 
        ['qa', 'quality', 'test', 'testing', 'automation'].some(keyword => 
          init.toLowerCase().includes(keyword)
        )
      );
      
      if (qaInitiatives.length > 0) {
        steps.push({
          action: 'Lead QA Transformation Discussion',
          description: `Engage leadership about their ${qaInitiatives.length} QA initiative${qaInitiatives.length > 1 ? 's' : ''}`,
          priority: 'high',
          timeframe: 'This week'
        });
      }
      
      if (company.employeeCount > 1000) {
        steps.push({
          action: 'Enterprise QA Assessment',
          description: 'Propose comprehensive QA automation assessment for enterprise-scale operations',
          priority: 'medium',
          timeframe: 'Next 2 weeks'
        });
      }
      
      // Always include these standard steps
      steps.push({
        action: 'Account Research Deep Dive',
        description: 'Complete detailed research on key stakeholders and decision makers',
        priority: 'medium',
        timeframe: 'Next week'
      });
      
      steps.push({
        action: 'Personalized Outreach Campaign',
        description: 'Launch targeted email sequence focused on QA automation ROI',
        priority: 'high',
        timeframe: 'This week'
      });
      
    } catch (e) {
      // Fallback actions
      steps.push({
        action: 'Initial QA Discussion',
        description: 'Start conversation about QA automation challenges and opportunities',
        priority: 'high',
        timeframe: 'This week'
      });
    }
    
    return steps.slice(0, 4); // Return top 4 actions
  };

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
        <div>
          <h1 className="text-3xl font-bold">Research Insights</h1>
          <p className="text-gray-600 mt-2">AI-powered intelligence and company research with QA intent priority</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Building2 className="w-4 h-4 mr-2" />
            {companiesWithQAIntent.length} Companies
          </Badge>
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Target className="w-4 h-4 mr-2" />
            {companiesWithQAIntent.filter(c => c.qaIntentScore >= 75).length} High Intent
          </Badge>
          <Link href="/account-research">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Research
            </Button>
          </Link>
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
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="companies">All Companies</TabsTrigger>
              <TabsTrigger value="high-priority-companies">High Priority</TabsTrigger>
              <TabsTrigger value="all">All Insights</TabsTrigger>
              <TabsTrigger value="opportunity">Opportunities</TabsTrigger>
              <TabsTrigger value="trend">Trends</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
              <TabsTrigger value="alert">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="companies" className="mt-6">
              {isLoadingCompanies ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading company research...</p>
                </div>
              ) : companiesWithQAIntent.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No companies researched yet</h3>
                  <p className="text-gray-500">
                    Upload prospects and run account research to see companies with QA intent priority
                  </p>
                  <Link href="/account-research">
                    <Button className="mt-4">
                      <Target className="w-4 h-4 mr-2" />
                      Start Research
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {companiesWithQAIntent.map((company) => (
                    <motion.div
                      key={company.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer bg-white"
                      onClick={() => setSelectedCompany(company.companyName)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900 text-lg">{company.companyName}</h3>
                            <Badge className={getIntentColor(company.qaIntentScore)}>
                              {getIntentLabel(company.qaIntentScore)}
                            </Badge>
                            <Badge variant="outline" className="text-purple-600">
                              {company.qaIntentScore}% QA Intent
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600">Industry</p>
                              <p className="font-medium text-gray-900">{company.industry || 'Technology'}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600">Employees</p>
                              <p className="font-medium text-gray-900">{company.employeeCount || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600">QA Intent Score</p>
                              <div className="flex items-center space-x-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${company.qaIntentScore >= 75 ? 'bg-green-500' : company.qaIntentScore >= 50 ? 'bg-yellow-500' : 'bg-gray-500'}`}
                                    style={{ width: `${company.qaIntentScore}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{company.qaIntentScore}%</span>
                              </div>
                            </div>
                          </div>

                          {/* QA Signals */}
                          <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                              <Target className="w-4 h-4 mr-2" />
                              QA Automation Signals
                            </h4>
                            <div className="space-y-2 text-sm">
                              {(() => {
                                try {
                                  const jobPostings = JSON.parse(company.recentJobPostings || '[]');
                                  const qaJobs = jobPostings.filter((job: any) => 
                                    ['qa', 'quality', 'test', 'testing', 'automation'].some(keyword => 
                                      job.title?.toLowerCase().includes(keyword) || 
                                      job.description?.toLowerCase().includes(keyword)
                                    )
                                  );
                                  return qaJobs.length > 0 ? (
                                    <div className="flex items-center text-green-700">
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      <span>{qaJobs.length} QA-related job posting{qaJobs.length > 1 ? 's' : ''}</span>
                                    </div>
                                  ) : null;
                                } catch {
                                  return null;
                                }
                              })()}
                              {(() => {
                                try {
                                  const initiatives = JSON.parse(company.initiatives || '[]');
                                  const qaInitiatives = initiatives.filter((init: string) => 
                                    ['qa', 'quality', 'test', 'testing', 'automation'].some(keyword => 
                                      init.toLowerCase().includes(keyword)
                                    )
                                  );
                                  return qaInitiatives.length > 0 ? (
                                    <div className="flex items-center text-green-700">
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      <span>{qaInitiatives.length} QA initiative{qaInitiatives.length > 1 ? 's' : ''}</span>
                                    </div>
                                  ) : null;
                                } catch {
                                  return null;
                                }
                              })()}
                              {company.employeeCount > 1000 && (
                                <div className="flex items-center text-green-700">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  <span>Enterprise scale (1000+ employees)</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                Last updated: {new Date(company.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {prospects.filter((p: any) => p.company === company.companyName).length} prospects
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Start Outreach
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="high-priority-companies" className="mt-6">
              {highPriorityCompanies.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No high priority companies yet</h3>
                  <p className="text-gray-500">
                    Companies with 75+ QA intent scores will appear here with actionable next steps
                  </p>
                  <Link href="/account-research">
                    <Button className="mt-4">
                      <Target className="w-4 h-4 mr-2" />
                      Research More Companies
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quick Actions Summary */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Target className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-900">
                            {highPriorityCompanies.length} High Priority Companies Ready for Action
                          </h3>
                          <p className="text-sm text-green-700">
                            Companies with 75+ QA intent scores requiring immediate attention
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Start Bulk Outreach
                        </Button>
                        <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Follow-ups
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Companies</span>
                          <span className="font-bold text-green-600">{highPriorityCompanies.length}</span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Avg QA Intent</span>
                          <span className="font-bold text-green-600">
                            {Math.round(highPriorityCompanies.reduce((sum, c) => sum + c.qaIntentScore, 0) / highPriorityCompanies.length)}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total Prospects</span>
                          <span className="font-bold text-green-600">
                            {highPriorityCompanies.reduce((sum, c) => 
                              sum + prospects.filter((p: any) => p.company === c.companyName).length, 0
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Next Action</span>
                          <span className="font-bold text-green-600">This Week</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* High Priority Companies with Actions */}
                  <div className="space-y-4">
                    {highPriorityCompanies.map((company) => {
                      const actionSteps = getActionableSteps(company);
                      return (
                        <motion.div
                          key={company.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-green-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer bg-white"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">{company.companyName}</h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    {company.qaIntentScore}% QA Intent
                                  </Badge>
                                  <Badge className="bg-red-100 text-red-800 border-red-200">
                                    High Priority
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                              <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Start Outreach
                              </Button>
                            </div>
                          </div>

                          {/* Actionable Steps */}
                          <div className="bg-green-50 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-green-900 mb-3 flex items-center">
                              <Zap className="w-4 h-4 mr-2" />
                              Recommended Actions
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {actionSteps.map((step, index) => (
                                <div key={index} className="bg-white p-3 rounded-lg border border-green-200">
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="font-medium text-gray-900 text-sm">{step.action}</h5>
                                    <Badge 
                                      className={`text-xs ${step.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}
                                    >
                                      {step.priority}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {step.timeframe}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Company Stats */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">
                                {prospects.filter((p: any) => p.company === company.companyName).length} prospects
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Briefcase className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">{company.industry || 'Technology'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">{company.employeeCount || 'N/A'} employees</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">
                                Updated {new Date(company.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

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