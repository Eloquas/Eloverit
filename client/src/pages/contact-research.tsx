import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Building2, Target, TrendingUp, Brain, Star, ExternalLink, Lightbulb, MessageSquare, Eye, RefreshCw, Users, CheckCircle, AlertCircle, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface ContactResearchInsight {
  prospect: {
    id: number;
    name: string;
    email: string;
    company: string;
    position: string;
    roleCategory: string;
    seniorityLevel: string;
    systemsExperience: string[];
    carePriorities: string[];
    painPoints: string[];
    decisionInfluence: number;
  };
  accountContext: {
    companyName: string;
    industry: string;
    companySize: string;
    currentSystems: string[];
    initiatives: string[];
    painPoints: string[];
    hiringSignals: string[];
    technologies: string[];
  };
  personalizedInsights: {
    roleSpecificChallenges: string[];
    accountRelevantOpportunities: string[];
    systemsAlignment: string[];
    businessImpactMetrics: string[];
    outreachApproach: string;
    messagingHooks: string[];
  };
  confidenceScore: number;
  researchSources: string[];
}

export default function ContactResearch() {
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [selectedResearch, setSelectedResearch] = useState<ContactResearchInsight | null>(null);
  const [batchResearch, setBatchResearch] = useState<ContactResearchInsight[]>([]);
  const [activeTab, setActiveTab] = useState("individual");

  const { data: prospects = [] } = useQuery({
    queryKey: ["/api/prospects"],
  });

  const { data: accountResearch = [] } = useQuery({
    queryKey: ["/api/account-research"],
  });

  // Get unique companies from prospects
  const companies = Array.from(new Set((prospects as any[]).map((p: any) => p.company))).sort();

  // Get prospects for selected company
  const companyProspects = selectedCompany 
    ? (prospects as any[]).filter(p => p.company === selectedCompany)
    : [];

  // Individual contact research mutation
  const contactResearchMutation = useMutation({
    mutationFn: async (prospectId: number) => {
      const response = await apiRequest("POST", `/api/contact-research/${prospectId}`);
      return response.json();
    },
    onSuccess: (data: ContactResearchInsight) => {
      setSelectedResearch(data);
      toast({
        title: "Contact Research Complete!",
        description: `Generated comprehensive analysis for ${data.prospect.name} with ${data.confidenceScore}% confidence`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Research Failed",
        description: error.message || "Failed to generate contact research",
        variant: "destructive",
      });
    }
  });

  // Batch contact research mutation
  const batchResearchMutation = useMutation({
    mutationFn: async (companyName: string) => {
      const response = await apiRequest("POST", `/api/contact-research/batch/${encodeURIComponent(companyName)}`);
      return response.json();
    },
    onSuccess: (data) => {
      setBatchResearch(data.research);
      setActiveTab("batch");
      toast({
        title: "Batch Research Complete!",
        description: `Analyzed ${data.contactsAnalyzed} contacts for ${data.companyName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Batch Research Failed",
        description: error.message || "Failed to generate batch contact research",
        variant: "destructive",
      });
    }
  });

  // Role category display mapping
  const getRoleCategoryDisplay = (category: string) => {
    const mapping: { [key: string]: string } = {
      qa: "Quality Assurance",
      crm: "CRM Systems",
      erp: "ERP Systems",
      d365: "Dynamics 365",
      sap: "SAP Systems",
      oracle: "Oracle Systems",
      enterprise_systems: "Enterprise Systems",
      general: "General"
    };
    return mapping[category] || category;
  };

  // Seniority level display mapping
  const getSeniorityDisplay = (level: string) => {
    const mapping: { [key: string]: string } = {
      cxo: "C-Level Executive",
      vp: "Vice President",
      director: "Director",
      manager: "Manager",
      individual: "Individual Contributor"
    };
    return mapping[level] || level;
  };

  // Get confidence color
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/enhanced-account-research">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Account Research
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contact Research Engine</h1>
            <p className="text-gray-600">
              AI-powered prospect analysis combining role expertise with account insights
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-300">
          O3-Level Analysis
        </Badge>
      </div>

      {/* Research Mode Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-sm">
          <TabsTrigger value="individual" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Individual Contact</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Batch Analysis</span>
          </TabsTrigger>
        </TabsList>

        {/* Individual Contact Research */}
        <TabsContent value="individual" className="space-y-6">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-900">
                <Brain className="w-5 h-5 mr-2" />
                Individual Contact Analysis
              </CardTitle>
              <p className="text-sm text-blue-700">
                Select a prospect for comprehensive role-based research combining PDL data, AI analysis, and account context
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company: string) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedProspect?.id.toString() || ""} 
                  onValueChange={(value) => {
                    const prospect = companyProspects.find(p => p.id.toString() === value);
                    setSelectedProspect(prospect);
                  }}
                  disabled={!selectedCompany}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companyProspects.map((prospect: any) => (
                      <SelectItem key={prospect.id} value={prospect.id.toString()}>
                        {prospect.name} - {prospect.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => selectedProspect && contactResearchMutation.mutate(selectedProspect.id)}
                disabled={!selectedProspect || contactResearchMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {contactResearchMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Contact...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Generate Contact Research
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Individual Research Results */}
          {selectedResearch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-green-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-green-800">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Contact Research: {selectedResearch.prospect.name}
                    </CardTitle>
                    <Badge className={`${getConfidenceColor(selectedResearch.confidenceScore)} border`}>
                      {selectedResearch.confidenceScore}% Confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Prospect Profile */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Prospect Profile
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Role Analysis</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-blue-600">
                              {getRoleCategoryDisplay(selectedResearch.prospect.roleCategory)}
                            </Badge>
                            <Badge variant="outline" className="text-purple-600">
                              {getSeniorityDisplay(selectedResearch.prospect.seniorityLevel)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Decision Influence</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Progress value={selectedResearch.prospect.decisionInfluence * 10} className="flex-1" />
                            <span className="text-sm font-medium">{selectedResearch.prospect.decisionInfluence}/10</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Systems Experience</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedResearch.prospect.systemsExperience.map((system, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {system}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Care Priorities</label>
                          <ul className="text-sm text-gray-700 mt-1 space-y-1">
                            {selectedResearch.prospect.carePriorities.map((priority, idx) => (
                              <li key={idx} className="flex items-center">
                                <Target className="w-3 h-3 mr-2 text-blue-500" />
                                {priority}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Personalized Insights */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Personalized Insights
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Role-Specific Challenges</label>
                          <ul className="text-sm text-gray-700 mt-1 space-y-1">
                            {selectedResearch.personalizedInsights.roleSpecificChallenges.map((challenge, idx) => (
                              <li key={idx} className="flex items-start">
                                <AlertCircle className="w-3 h-3 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Account Opportunities</label>
                          <ul className="text-sm text-gray-700 mt-1 space-y-1">
                            {selectedResearch.personalizedInsights.accountRelevantOpportunities.map((opp, idx) => (
                              <li key={idx} className="flex items-start">
                                <TrendingUp className="w-3 h-3 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                                {opp}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Business Impact Metrics</label>
                          <ul className="text-sm text-gray-700 mt-1 space-y-1">
                            {selectedResearch.personalizedInsights.businessImpactMetrics.map((metric, idx) => (
                              <li key={idx} className="flex items-center">
                                <BarChart3 className="w-3 h-3 mr-2 text-blue-500" />
                                {metric}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">Messaging Hooks</label>
                          <ul className="text-sm text-gray-700 mt-1 space-y-1">
                            {selectedResearch.personalizedInsights.messagingHooks.map((hook, idx) => (
                              <li key={idx} className="flex items-start">
                                <MessageSquare className="w-3 h-3 mr-2 mt-0.5 text-purple-500 flex-shrink-0" />
                                {hook}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Account Context */}
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      Account Context: {selectedResearch.accountContext.companyName}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Current Initiatives</label>
                        <ul className="text-sm text-gray-700 mt-1 space-y-1">
                          {selectedResearch.accountContext.initiatives.slice(0, 3).map((initiative, idx) => (
                            <li key={idx}>• {initiative}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Technology Stack</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedResearch.accountContext.technologies.slice(0, 4).map((tech, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Research Sources</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedResearch.researchSources.map((source, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Batch Analysis */}
        <TabsContent value="batch" className="space-y-6">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-900">
                <Users className="w-5 h-5 mr-2" />
                Batch Contact Analysis
              </CardTitle>
              <p className="text-sm text-green-700">
                Analyze all contacts within a company account for comprehensive insights
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select company for batch analysis..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company: string) => (
                      <SelectItem key={company} value={company}>
                        {company} ({(prospects as any[]).filter(p => p.company === company).length} contacts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={() => selectedCompany && batchResearchMutation.mutate(selectedCompany)}
                  disabled={!selectedCompany || batchResearchMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {batchResearchMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Analyze All Contacts
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Batch Results */}
          {batchResearch.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Batch Analysis Results ({batchResearch.length} contacts)
                </h3>
                <Badge className="bg-green-100 text-green-800">
                  Avg Confidence: {Math.round(batchResearch.reduce((sum, r) => sum + r.confidenceScore, 0) / batchResearch.length)}%
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batchResearch.map((research, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {research.prospect.name}
                        </CardTitle>
                        <Badge className={`text-xs ${getConfidenceColor(research.confidenceScore)} border`}>
                          {research.confidenceScore}%
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{research.prospect.position}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {getRoleCategoryDisplay(research.prospect.roleCategory)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getSeniorityDisplay(research.prospect.seniorityLevel)}
                          </Badge>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-gray-600">Top Messaging Hook:</label>
                          <p className="text-xs text-gray-700 mt-1">
                            {research.personalizedInsights.messagingHooks[0]}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-600">
                            Decision Influence: {research.prospect.decisionInfluence}/10
                          </span>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => setSelectedResearch(research)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}