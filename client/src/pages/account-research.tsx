import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, TrendingUp, Users, Briefcase, ArrowLeft, RefreshCw, Eye } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function AccountResearch() {
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState("");
  const [researchFilter, setResearchFilter] = useState("all");

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
    if (researchFilter === "recent") {
      const researchDate = new Date(research.researchDate);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return researchDate > weekAgo;
    }
    return true;
  });

  const researchCompanyMutation = useMutation({
    mutationFn: async (companyName: string) => {
      const response = await apiRequest("POST", "/api/account-research/generate", { companyName });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/account-research"] });
      toast({
        title: "Research completed!",
        description: `Generated comprehensive research for ${data.companyName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Research failed",
        description: error.message || "Failed to generate account research",
        variant: "destructive",
      });
    }
  });

  const handleResearchCompany = (companyName: string) => {
    researchCompanyMutation.mutate(companyName);
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Research</h1>
            <p className="text-gray-600">
              AI-powered research for enterprise systems prospects and initiatives
            </p>
          </div>
        </div>
      </div>

      {/* Research Generation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Generate Account Research
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            
            <Button 
              onClick={() => selectedCompany && handleResearchCompany(selectedCompany)}
              disabled={!selectedCompany || researchCompanyMutation.isPending}
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
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Research includes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Recent job postings for QA, D365, SAP, and enterprise systems roles</li>
              <li>Current technology initiatives and system migrations</li>
              <li>Key decision makers and organizational structure</li>
              <li>Pain points and challenges in enterprise systems</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            <Select value={researchFilter} onValueChange={setResearchFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Research</SelectItem>
                <SelectItem value="recent">Recent (7 days)</SelectItem>
                <SelectItem value="excellent">High Quality</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredResearch.map((research: any) => (
            <Card key={research.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{research.companyName}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={getQualityColor(research.researchQuality)}>
                      {research.researchQuality}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {formatDate(research.researchDate)}
                    </span>
                  </div>
                </div>
                
                {research.industry && (
                  <p className="text-sm text-gray-600">{research.industry}</p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Current Systems */}
                {research.currentSystems && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Current Systems
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {parseJsonArray(research.currentSystems).map((system: string, index: number) => (
                        <Badge key={index} variant="outline">{system}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Job Postings */}
                {research.recentJobPostings && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Recent Job Postings
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {parseJsonArray(research.recentJobPostings).slice(0, 3).map((posting: string, index: number) => (
                        <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                          {posting}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Initiatives */}
                {research.initiatives && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Current Initiatives
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {parseJsonArray(research.initiatives).slice(0, 2).map((initiative: string, index: number) => (
                        <div key={index} className="p-2 bg-blue-50 rounded text-xs">
                          {initiative}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pain Points */}
                {research.painPoints && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Pain Points</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {parseJsonArray(research.painPoints).slice(0, 2).map((painPoint: string, index: number) => (
                        <div key={index} className="p-2 bg-orange-50 rounded text-xs">
                          {painPoint}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Research Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}