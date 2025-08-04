import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, TrendingUp, Building2, Target, Calendar, 
  Filter, AlertTriangle, CheckCircle, ExternalLink,
  Zap, BarChart3, Globe, Users, Briefcase, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IntentSignal {
  companyName: string;
  intentSummary: string;
  matchedKeywords: string[];
  signalType: 'job_posting' | 'press_release' | 'linkedin_post' | 'company_announcement' | 'earnings_call' | 'news_article' | 'sec_filing';
  source: string;
  sourceLink?: string;
  content: string;
  confidenceScore: number; // 0-100% confidence
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  signalDate: string;
  fortuneRank?: number;
  industry?: string;
  department?: string;
  initiative?: string;
  technology?: string;
  geographyInfo?: {
    headquarters?: string;
    region?: string;
    country?: string;
  };
  companySize?: {
    employees?: number;
    revenue?: string;
  };
}

export default function IntentDiscovery() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("search");
  const [searchFilters, setSearchFilters] = useState({
    industry: '',
    geography: '',
    revenue: '',
    erpCrmSystem: 'Dynamics 365', // Default to D365 focus as per user feedback
    fortuneRanking: '1000',
    timeframe: '60',
    technologies: 'D365, Test Automation, QA Engineering',
    departments: 'IT, QA, Engineering',
    minConfidenceScore: '80', // Higher threshold for more reliable results
    minIntentScore: '75', // Minimum intent score threshold
    companySize: '',
    searchMode: 'semantic' // Focus on semantic analysis for D365
  });

  const { data: trendingData = {}, isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/intent-discovery/trending"],
  });

  const enhancedResearchMutation = useMutation({
    mutationFn: async (companyName: string) => {
      return apiRequest("POST", "/api/account-research/enhanced", { companyName });
    },
    onSuccess: (data: any, variables: string) => {
      toast({
        title: "Enhanced Research Complete",
        description: `Comprehensive analysis completed for ${data?.research?.company_name || variables} with quality score ${data?.research?.research_quality_score || 'high'}`,
      });
      // Navigate to account research page to view results
      window.location.href = `/account-research?company=${encodeURIComponent(data?.research?.company_name || variables)}`;
    },
    onError: (error: any) => {
      toast({
        title: "Enhanced Research Failed",
        description: error.message || "Failed to generate enhanced research. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEnhancedResearch = (companyName: string) => {
    enhancedResearchMutation.mutate(companyName);
  };

  const intentSearchMutation = useMutation({
    mutationFn: async (filters: any) => {
      const processedFilters = {
        ...filters,
        fortuneRanking: parseInt(filters.fortuneRanking),
        timeframe: parseInt(filters.timeframe),
        minConfidenceScore: parseInt(filters.minConfidenceScore),
        technologies: filters.technologies ? filters.technologies.split(',').map((t: string) => t.trim()) : [],
        departments: filters.departments ? filters.departments.split(',').map((d: string) => d.trim()) : []
      };
      const response = await apiRequest("POST", "/api/intent-discovery/search", processedFilters);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Intent Discovery Complete",
        description: `Found ${data.signals?.length || 0} high-intent signals from F${searchFilters.fortuneRanking} companies`,
      });
    },
    onError: (error) => {
      console.error("Intent Discovery Error:", error);
      toast({
        title: "Discovery Error",
        description: "Failed to discover intent signals. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    intentSearchMutation.mutate(searchFilters);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-700 bg-green-50';
    if (score >= 80) return 'text-blue-700 bg-blue-50';
    if (score >= 70) return 'text-orange-700 bg-orange-50';
    return 'text-gray-700 bg-gray-50';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">F1000 Intent Discovery</h1>
          <p className="text-gray-600 mt-1">
            Advanced AI-powered intelligence for Fortune 1000 companies with automation initiatives
          </p>
        </div>
        <Badge variant="outline" className="text-purple-600 border-purple-300">
          <Zap className="w-4 h-4 mr-1" />
          Powered by o3-Pro
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Advanced Search</TabsTrigger>
          <TabsTrigger value="results">Search Results</TabsTrigger>
          <TabsTrigger value="trending">Trending Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                AI-Powered Intent Discovery Engine
              </CardTitle>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Search across LinkedIn, job boards, company websites, press releases, and industry publications 
                  for F1000 companies with recent automation initiatives
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">
                    🎯 Intent Discovery Focus: Finding high-intent D365 customers with active initiatives
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    For confirmed system analysis, use Account Research. This tab focuses on discovery signals only.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fortuneRanking">Fortune Ranking</Label>
                  <Select value={searchFilters.fortuneRanking} onValueChange={(value) => 
                    setSearchFilters(prev => ({ ...prev, fortuneRanking: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ranking" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">Fortune 100</SelectItem>
                      <SelectItem value="250">Fortune 250</SelectItem>
                      <SelectItem value="500">Fortune 500</SelectItem>
                      <SelectItem value="1000">Fortune 1000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe (Days)</Label>
                  <Select value={searchFilters.timeframe} onValueChange={(value) => 
                    setSearchFilters(prev => ({ ...prev, timeframe: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="60">Last 60 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minIntentScore">Minimum Intent Score</Label>
                  <Select value={searchFilters.minIntentScore} onValueChange={(value) => 
                    setSearchFilters(prev => ({ ...prev, minIntentScore: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60+ (Medium Intent)</SelectItem>
                      <SelectItem value="70">70+ (High Intent)</SelectItem>
                      <SelectItem value="80">80+ (Very High Intent)</SelectItem>
                      <SelectItem value="90">90+ (Critical Intent)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="technologies">Target Technologies (comma-separated)</Label>
                  <Input
                    id="technologies"
                    placeholder="e.g., test automation, D365, Oracle Cloud, CI/CD"
                    value={searchFilters.technologies}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, technologies: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departments">Target Departments (comma-separated)</Label>
                  <Input
                    id="departments"
                    placeholder="e.g., IT, QA, Engineering, Operations"
                    value={searchFilters.departments}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, departments: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Search Coverage</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
                  <div className="flex items-center"><Globe className="w-3 h-3 mr-1" />LinkedIn Company Updates</div>
                  <div className="flex items-center"><Briefcase className="w-3 h-3 mr-1" />LinkedIn Job Postings</div>
                  <div className="flex items-center"><Building2 className="w-3 h-3 mr-1" />Company Career Pages</div>
                  <div className="flex items-center"><Users className="w-3 h-3 mr-1" />Press Releases</div>
                  <div className="flex items-center"><BarChart3 className="w-3 h-3 mr-1" />Industry Publications</div>
                  <div className="flex items-center"><Target className="w-3 h-3 mr-1" />SEC Filings</div>
                </div>
              </div>

              <Button 
                onClick={handleSearch} 
                disabled={intentSearchMutation.isPending}
                className="w-full"
                size="lg"
              >
                {intentSearchMutation.isPending ? (
                  <>
                    <Search className="w-4 h-4 mr-2 animate-spin" />
                    Discovering Intent Signals...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Start Advanced Intent Discovery
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {intentSearchMutation.data ? (
            <div className="space-y-6">
              {/* Search Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Search Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {intentSearchMutation.data.signals?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Intent Signals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {intentSearchMutation.data.summary?.avgConfidence || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Avg Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {intentSearchMutation.data.summary?.urgencyBreakdown?.critical + 
                         intentSearchMutation.data.summary?.urgencyBreakdown?.high || 0}
                      </div>
                      <div className="text-sm text-gray-600">High Priority</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {intentSearchMutation.data.searchCriteria?.fortuneRanking || 0}
                      </div>
                      <div className="text-sm text-gray-600">Fortune Ranking</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Intent Signals */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Discovered Intent Signals</h3>
                {intentSearchMutation.data.signals?.map((signal: IntentSignal, index: number) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Building2 className="w-4 h-4 mr-2" />
                            {signal.companyName}
                            {signal.fortuneRank && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                F{signal.fortuneRank}
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">{signal.source} • {signal.signalDate}</p>
                          <p className="text-sm text-blue-600 mt-1">{signal.intentSummary}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getUrgencyColor(signal.urgencyLevel)}>
                            {signal.urgencyLevel}
                          </Badge>
                          <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(signal.confidenceScore)}`}>
                            {signal.confidenceScore}/100
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4">{signal.content}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {signal.initiative && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Initiative</span>
                            <p className="text-sm text-gray-900">{signal.initiative}</p>
                          </div>
                        )}
                        {signal.technology && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Technology</span>
                            <p className="text-sm text-gray-900">{signal.technology}</p>
                          </div>
                        )}
                        {signal.department && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</span>
                            <p className="text-sm text-gray-900">{signal.department}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {signal.matchedKeywords.slice(0, 5).map((keyword, kIndex) => (
                          <Badge key={kIndex} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex space-x-2">
                        {signal.sourceLink && (
                          <Button variant="outline" size="sm" className="text-blue-600" asChild>
                            <a href={signal.sourceLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-2" />
                              View Source
                            </a>
                          </Button>
                        )}
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              // Integration with Account Research
                              window.location.href = `/account-research?company=${encodeURIComponent(signal.companyName)}`;
                            }}
                          >
                            <Target className="w-3 h-3 mr-2" />
                            Research Account
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEnhancedResearch(signal.companyName)}
                            disabled={enhancedResearchMutation.isPending}
                          >
                            <Zap className="w-3 h-3 mr-2" />
                            {enhancedResearchMutation.isPending ? "Analyzing..." : "Enhanced"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Search Results Yet</h3>
                <p className="text-gray-600 mb-4">
                  Run an advanced intent discovery search to find F1000 companies with automation initiatives
                </p>
                <Button onClick={() => setActiveTab("search")}>
                  Start Intent Discovery
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Trending Technologies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(trendingData as any)?.trending?.topTechnologies?.map((tech: string, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span className="text-gray-900">{tech}</span>
                    <Badge variant="outline">Hot</Badge>
                  </div>
                )) || (
                  <div className="text-gray-500 text-center py-4">
                    Loading trending technologies...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Emerging Initiatives
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(trendingData as any)?.trending?.emergingInitiatives?.map((initiative: string, index: number) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span className="text-gray-900">{initiative}</span>
                    <Badge variant="secondary">Trending</Badge>
                  </div>
                )) || (
                  <div className="text-gray-500 text-center py-4">
                    Loading trending initiatives...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Companies with High Intent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(trendingData as any)?.trending?.hotCompanies?.map((company: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-900">{company}</span>
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    </div>
                  )) || (
                    <div className="text-gray-500 text-center py-4 col-span-3">
                      Loading high intent companies...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}