import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Search, TrendingUp, Users, Briefcase, ArrowLeft, RefreshCw, Eye, BarChart3, Target, Clock, CheckCircle, AlertTriangle, ExternalLink, Star, Lightbulb } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

export default function AccountResearch() {
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState("");
  const [researchFilter, setResearchFilter] = useState("all");
  const [selectedResearch, setSelectedResearch] = useState<any>(null);
  const [manualCompany, setManualCompany] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [discoveryMode, setDiscoveryMode] = useState<"company" | "platform">("company");
  const [discoveryFilters, setDiscoveryFilters] = useState({
    platform: "",
    fortuneRanking: "",
    employeeSize: "",
    industry: "",
    state: ""
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ["/api/prospects"],
  });

  const { data: accountResearch = [], isLoading } = useQuery({
    queryKey: ["/api/account-research"],
  });

  // Get unique companies from prospects
  const companies = [...new Set(prospects.map((p: any) => p.company))].sort();

  const filteredResearch = accountResearch.filter((research: any) => {
    if (researchFilter === "pending") return research.researchQuality === "pending";
    if (researchFilter === "excellent") return research.researchQuality === "excellent";
    if (researchFilter === "high-intent") return calculateIntentScore(research) >= 75;
    if (researchFilter === "recent") {
      const researchDate = new Date(research.researchDate);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return researchDate > weekAgo;
    }
    return true;
  });

  const researchCompanyMutation = useMutation({
    mutationFn: async ({ companyName, platform, forceRefresh }: { companyName: string, platform?: string, forceRefresh?: boolean }) => {
      const response = await apiRequest("POST", "/api/account-research/generate", { companyName, platform, forceRefresh });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-research"] });
      
      if (data.existingResearch) {
        toast({
          title: "Research Already Exists",
          description: `Found existing research for ${data.companyName} (${data.ageInDays} days old). Click "Refresh" to update.`,
          variant: "default",
        });
      } else {
        toast({
          title: data.cacheStatus === "refreshed" ? "Research Refreshed!" : "Research Completed!",
          description: `${data.cacheStatus === "refreshed" ? "Updated" : "Generated"} comprehensive research for ${data.companyName}`,
        });
      }
    },
    onError: (error: any) => {
      const isDataIntegrityError = error.message?.includes("authentic") || error.message?.includes("unavailable");
      
      toast({
        title: isDataIntegrityError ? "Research Unavailable" : "Research Failed",
        description: isDataIntegrityError 
          ? "Only authentic data sources are used. Research data temporarily unavailable for this company."
          : error.message || "Failed to generate account research",
        variant: "destructive",
      });
    }
  });

  const platformDiscoveryMutation = useMutation({
    mutationFn: async (filters: any) => {
      const response = await apiRequest("POST", "/api/account-research/platform-discovery", filters);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-research"] });
      toast({
        title: "Platform discovery completed!",
        description: `Found ${data.length} high-intent accounts matching your criteria`,
      });
    },
    onError: (error: any) => {
      const isDataIntegrityError = error.message?.includes("authentic") || error.message?.includes("unavailable");
      
      toast({
        title: isDataIntegrityError ? "Discovery Unavailable" : "Discovery Failed", 
        description: isDataIntegrityError
          ? "Platform discovery uses only authentic Fortune company data. Service temporarily unavailable."
          : error.message || "Failed to discover platform accounts",
        variant: "destructive",
      });
    }
  });

  const handleResearchCompany = (companyName: string, platform?: string, forceRefresh?: boolean) => {
    researchCompanyMutation.mutate({ companyName, platform, forceRefresh });
  };

  const handlePlatformDiscovery = () => {
    if (!discoveryFilters.platform) {
      toast({
        title: "Platform required",
        description: "Please select a platform for discovery",
        variant: "destructive",
      });
      return;
    }
    platformDiscoveryMutation.mutate(discoveryFilters);
  };

  const resetDiscoveryFilters = () => {
    setDiscoveryFilters({
      platform: "",
      fortuneRanking: "",
      employeeSize: "",
      industry: "",
      state: ""
    });
  };

  const calculateIntentScore = (research: any) => {
    let score = 0;
    const systems = parseJsonArray(research.currentSystems);
    const postings = parseJsonArray(research.recentJobPostings);
    const initiatives = parseJsonArray(research.initiatives);
    
    // QA hiring activity (40%)
    const qaKeywords = ['qa', 'quality', 'test', 'automation', 'testing'];
    const qaPostings = postings.filter((posting: string) => 
      qaKeywords.some(keyword => posting.toLowerCase().includes(keyword))
    );
    score += Math.min((qaPostings.length / 3) * 40, 40);
    
    // Testing initiatives (30%)
    const testingInitiatives = initiatives.filter((init: string) =>
      qaKeywords.some(keyword => init.toLowerCase().includes(keyword))
    );
    score += Math.min((testingInitiatives.length / 2) * 30, 30);
    
    // Enterprise systems (20%)
    const enterpriseSystems = ['salesforce', 'sap', 'oracle', 'dynamics', 'workday'];
    const hasEnterpriseSystems = systems.some((system: string) =>
      enterpriseSystems.some(es => system.toLowerCase().includes(es))
    );
    if (hasEnterpriseSystems) score += 20;
    
    // Quality challenges (10%)
    const painPoints = parseJsonArray(research.painPoints);
    const qualityChallenges = painPoints.filter((pain: string) =>
      ['quality', 'bugs', 'testing', 'reliability'].some(keyword => 
        pain.toLowerCase().includes(keyword)
      )
    );
    score += Math.min((qualityChallenges.length / 2) * 10, 10);
    
    return Math.round(score);
  };

  const getIntentColor = (score: number) => {
    if (score >= 75) return "text-green-600 bg-green-50";
    if (score >= 50) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  const getIntentLabel = (score: number) => {
    if (score >= 75) return "High Intent";
    if (score >= 50) return "Medium Intent";
    return "Low Intent";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent": return "bg-green-100 text-green-800";
      case "good": return "bg-blue-100 text-blue-800";
      case "fair": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const parseJsonArray = (jsonString: string | null) => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading account research...</p>
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
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/research-insights">
            <Button variant="outline" size="sm">
              <Lightbulb className="w-4 h-4 mr-2" />
              View Insights
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Research</h1>
            <p className="text-gray-600">
              AI-powered research for enterprise systems prospects and initiatives
            </p>
          </div>
        </div>
      </div>

      {/* Research Generation Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-blue-900">
            <div className="flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Generate Account Research
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              Authentic Data Only
            </Badge>
          </CardTitle>
          <p className="text-sm text-blue-700 mt-1">
            Research powered by PDL API + AI analysis. Weekly caching prevents duplicate research.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="existing">From Prospects</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="platform">Platform Focus</TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing" className="space-y-4">
              <div className="flex items-center space-x-4">
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a company to research..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => selectedCompany && handleResearchCompany(selectedCompany)}
                    disabled={!selectedCompany || researchCompanyMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {researchCompanyMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Generate Research
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => selectedCompany && handleResearchCompany(selectedCompany, undefined, true)}
                    disabled={!selectedCompany || researchCompanyMutation.isPending}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Enter company name..."
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => manualCompany && handleResearchCompany(manualCompany)}
                  disabled={!manualCompany || researchCompanyMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {researchCompanyMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Research Company
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="platform" className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Platform Discovery Mode</h3>
                <p className="text-green-700 text-sm mb-4">
                  Discover high-intent accounts based on platform initiatives, hiring signals, and enterprise requirements
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Platform Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform *</label>
                    <Select 
                      value={discoveryFilters.platform} 
                      onValueChange={(value) => setDiscoveryFilters(prev => ({ ...prev, platform: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salesforce">Salesforce CRM</SelectItem>
                        <SelectItem value="sap">SAP ERP</SelectItem>
                        <SelectItem value="oracle">Oracle Database/ERP</SelectItem>
                        <SelectItem value="dynamics">Microsoft Dynamics 365</SelectItem>
                        <SelectItem value="workday">Workday HCM</SelectItem>
                        <SelectItem value="servicenow">ServiceNow ITSM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fortune Ranking */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fortune Ranking</label>
                    <Select 
                      value={discoveryFilters.fortuneRanking} 
                      onValueChange={(value) => setDiscoveryFilters(prev => ({ ...prev, fortuneRanking: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ranking..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fortune-100">Fortune 100</SelectItem>
                        <SelectItem value="fortune-250">Fortune 250</SelectItem>
                        <SelectItem value="fortune-500">Fortune 500</SelectItem>
                        <SelectItem value="fortune-1000">Fortune 1000</SelectItem>
                        <SelectItem value="any">Any Size</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Employee Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee Size</label>
                    <Select 
                      value={discoveryFilters.employeeSize} 
                      onValueChange={(value) => setDiscoveryFilters(prev => ({ ...prev, employeeSize: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-500">0 - 500 employees</SelectItem>
                        <SelectItem value="500-1000">500 - 1,000 employees</SelectItem>
                        <SelectItem value="1000-5000">1,000 - 5,000 employees</SelectItem>
                        <SelectItem value="5000-10000">5,000 - 10,000 employees</SelectItem>
                        <SelectItem value="10000+">10,000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <Select 
                      value={discoveryFilters.industry} 
                      onValueChange={(value) => setDiscoveryFilters(prev => ({ ...prev, industry: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="automotive">Automotive</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="energy">Energy</SelectItem>
                        <SelectItem value="telecommunications">Telecommunications</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="non-profit">Non-Profit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State/Region</label>
                    <Select 
                      value={discoveryFilters.state} 
                      onValueChange={(value) => setDiscoveryFilters(prev => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="other">Other States</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <Button 
                    variant="outline" 
                    onClick={resetDiscoveryFilters}
                    className="text-gray-600"
                  >
                    Reset Filters
                  </Button>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      onClick={handlePlatformDiscovery}
                      disabled={!discoveryFilters.platform || platformDiscoveryMutation.isPending}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                    >
                      {platformDiscoveryMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Discovering Accounts...
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4 mr-2" />
                          Discover High-Intent Accounts
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Research Includes:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                QA & Testing Job Postings
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Enterprise Systems Analysis
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Digital Transformation Initiatives
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                QA Automation Intent Scoring
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Research Overview & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Total Companies</p>
                <p className="text-2xl font-bold text-green-900">{accountResearch.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">High Intent</p>
                <p className="text-2xl font-bold text-blue-900">
                  {accountResearch.filter((r: any) => calculateIntentScore(r) >= 75).length}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Recent Research</p>
                <p className="text-2xl font-bold text-purple-900">
                  {accountResearch.filter((r: any) => {
                    const researchDate = new Date(r.researchDate);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return researchDate > weekAgo;
                  }).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-yellow-800">Filter:</label>
                <Select value={researchFilter} onValueChange={setResearchFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Research</SelectItem>
                    <SelectItem value="recent">Recent (7 days)</SelectItem>
                    <SelectItem value="excellent">High Quality</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="high-intent">High Intent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Research Results */}
      {filteredResearch.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {accountResearch.length === 0 ? "No research generated yet" : "No research matches your filters"}
            </h3>
            <p className="text-gray-600 mb-4">
              {accountResearch.length === 0 
                ? "Select a company above to generate comprehensive account research."
                : "Try adjusting your filter criteria."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredResearch.map((research: any, index: number) => {
            const intentScore = calculateIntentScore(research);
            return (
              <motion.div
                key={research.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                      onClick={() => setSelectedResearch(research)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {research.companyName}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getIntentColor(intentScore)} font-medium`}>
                          {getIntentLabel(intentScore)} ({intentScore})
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {research.industry && (
                        <p className="text-sm text-gray-600">{research.industry}</p>
                      )}
                      <div className="flex items-center space-x-2">
                        <Badge className={getQualityColor(research.researchQuality)} variant="outline">
                          {research.researchQuality}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(research.researchDate)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Intent Score Visualization */}
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">QA Automation Intent</span>
                        <span className="text-sm font-bold text-blue-600">{intentScore}/100</span>
                      </div>
                      <Progress value={intentScore} className="h-2" />
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold text-blue-600">
                          {parseJsonArray(research.currentSystems).length}
                        </div>
                        <div className="text-xs text-gray-600">Systems</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold text-green-600">
                          {parseJsonArray(research.recentJobPostings).length}
                        </div>
                        <div className="text-xs text-gray-600">Job Postings</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold text-purple-600">
                          {parseJsonArray(research.initiatives).length}
                        </div>
                        <div className="text-xs text-gray-600">Initiatives</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold text-orange-600">
                          {parseJsonArray(research.painPoints).length}
                        </div>
                        <div className="text-xs text-gray-600">Pain Points</div>
                      </div>
                    </div>

                    {/* Top Systems Preview */}
                    {research.currentSystems && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Briefcase className="w-4 h-4 mr-2" />
                          Key Systems
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {parseJsonArray(research.currentSystems).slice(0, 3).map((system: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">{system}</Badge>
                          ))}
                          {parseJsonArray(research.currentSystems).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{parseJsonArray(research.currentSystems).length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <Button variant="outline" size="sm" className="w-full group-hover:bg-blue-50 group-hover:border-blue-300">
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Platform Discovery Results */}
      {platformDiscoveryMutation.isSuccess && platformDiscoveryMutation.data?.accounts && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center text-green-900">
              <Target className="w-5 h-5 mr-2" />
              Platform Discovery Results
            </CardTitle>
            <p className="text-sm text-green-700">
              Found {platformDiscoveryMutation.data.totalAccounts} accounts matching your criteria, 
              {platformDiscoveryMutation.data.highIntentAccounts} with high intent scores (75+)
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {platformDiscoveryMutation.data.accounts.map((account: any, index: number) => (
                <motion.div
                  key={`${account.companyName}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{account.companyName}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant={account.intentScore >= 75 ? "default" : account.intentScore >= 50 ? "secondary" : "outline"}>
                        {account.intentScore}% Intent
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {account.researchQuality}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Building2 className="w-4 h-4 mr-2" />
                      {account.industry} • {account.employeeSize} • {account.headquarters}
                    </div>
                    
                    <div className="flex items-start">
                      <TrendingUp className="w-4 h-4 mr-2 mt-0.5 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-800">Platform Initiatives ({account.platformInitiatives?.length || 0})</p>
                        {account.platformInitiatives?.slice(0, 2).map((initiative: any, i: number) => (
                          <p key={i} className="text-xs text-gray-600">
                            • {initiative.title} ({initiative.stage})
                          </p>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Users className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-800">Hiring Signals ({account.hiringSignals?.length || 0})</p>
                        {account.hiringSignals?.slice(0, 2).map((signal: any, i: number) => (
                          <p key={i} className="text-xs text-gray-600">
                            • {signal.jobTitle} - {signal.department}
                          </p>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">
                        Updated: {new Date(account.lastUpdated).toLocaleDateString()}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => handleResearchCompany(account.companyName)}
                      >
                        Generate Research
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Detail Modal */}
      <Dialog open={!!selectedResearch} onOpenChange={() => setSelectedResearch(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedResearch && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    <span>{selectedResearch.companyName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getIntentColor(calculateIntentScore(selectedResearch))} font-medium`}>
                      QA Intent: {calculateIntentScore(selectedResearch)}/100
                    </Badge>
                    <Badge className={getQualityColor(selectedResearch.researchQuality)}>
                      {selectedResearch.researchQuality}
                    </Badge>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {selectedResearch.industry} • Researched {formatDate(selectedResearch.researchDate)}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="systems">Systems</TabsTrigger>
                  <TabsTrigger value="hiring">Hiring Activity</TabsTrigger>
                  <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Intent Score Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        QA Automation Intent Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Overall Intent Score</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {calculateIntentScore(selectedResearch)}/100
                          </span>
                        </div>
                        <Progress value={calculateIntentScore(selectedResearch)} className="h-3" />
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium text-blue-800">QA Hiring Activity</div>
                            <div className="text-xs text-blue-600 mt-1">Weight: 40%</div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-sm font-medium text-green-800">Testing Initiatives</div>
                            <div className="text-xs text-green-600 mt-1">Weight: 30%</div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="text-sm font-medium text-purple-800">Enterprise Systems</div>
                            <div className="text-xs text-purple-600 mt-1">Weight: 20%</div>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <div className="text-sm font-medium text-orange-800">Quality Challenges</div>
                            <div className="text-xs text-orange-600 mt-1">Weight: 10%</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Company Changes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Recent Changes & Signals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-blue-900">Active QA Hiring</div>
                            <div className="text-sm text-blue-700">
                              {parseJsonArray(selectedResearch.recentJobPostings).filter((posting: string) =>
                                ['qa', 'quality', 'test'].some(keyword => posting.toLowerCase().includes(keyword))
                              ).length} QA-related positions posted recently
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-green-900">Enterprise Systems Integration</div>
                            <div className="text-sm text-green-700">
                              Multiple enterprise systems requiring QA automation support
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                          <Target className="w-5 h-5 text-orange-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-orange-900">Digital Transformation Focus</div>
                            <div className="text-sm text-orange-700">
                              {parseJsonArray(selectedResearch.initiatives).length} active technology initiatives
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="systems" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Technology Stack</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {parseJsonArray(selectedResearch.currentSystems).map((system: string, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                            <div className="font-medium text-gray-900">{system}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="hiring" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Job Postings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {parseJsonArray(selectedResearch.recentJobPostings).map((posting: string, index: number) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                            <div className="text-sm text-gray-700">{posting}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="initiatives" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Initiatives & Pain Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Active Initiatives</h4>
                          <div className="space-y-2">
                            {parseJsonArray(selectedResearch.initiatives).map((initiative: string, index: number) => (
                              <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                <div className="text-sm text-blue-900">{initiative}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Key Pain Points</h4>
                          <div className="space-y-2">
                            {parseJsonArray(selectedResearch.painPoints).map((painPoint: string, index: number) => (
                              <div key={index} className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                                <div className="text-sm text-orange-900">{painPoint}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Star className="w-4 h-4" />
                  <span>Data verified by PDL • Last updated {formatDate(selectedResearch.researchDate)}</span>
                </div>
                <Button onClick={() => setSelectedResearch(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}