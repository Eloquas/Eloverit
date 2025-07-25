import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Search, 
  Building2, 
  MapPin, 
  Users, 
  DollarSign, 
  Server, 
  Target, 
  ExternalLink,
  Download,
  Filter,
  CheckCircle2
} from "lucide-react";

interface CompanyResult {
  company_name: string;
  industry: string;
  system: string;
  hq_location: string;
  employee_count: string;
  revenue_est: string;
  intent_summary?: string;
  source_links: string[];
  intent_score?: number;
  confidence_score: number;
  research_quality: 'excellent' | 'good' | 'fair' | 'basic';
}

interface LookupResponse {
  companies: CompanyResult[];
  total_found: number;
  filters_applied: any;
  search_metadata: {
    intent_discovery_used: boolean;
    fallback_applied: boolean;
    search_duration: number;
    data_sources: string[];
  };
}

export default function AccountResearchLookup() {
  const { toast } = useToast();
  const [results, setResults] = useState<LookupResponse | null>(null);
  const [generatingResearch, setGeneratingResearch] = useState<string | null>(null);
  
  // Filter inputs
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [revenueRange, setRevenueRange] = useState("");
  const [location, setLocation] = useState("");
  const [systemType, setSystemType] = useState("");
  const [intentFilter, setIntentFilter] = useState(false);

  const lookupMutation = useMutation({
    mutationFn: async (filters: any) => {
      const response = await apiRequest("POST", "/api/account-research/lookup", filters);
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Company Lookup Complete",
        description: `Found ${data.companies.length} companies matching your criteria`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lookup Failed",
        description: error.message || "Failed to discover companies",
        variant: "destructive",
      });
    }
  });

  const testLookupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/account-research/test-lookup", {});
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      // Populate form with test data
      setIndustry("Technology");
      setCompanySize("enterprise");
      setSystemType("Dynamics 365");
      setIntentFilter(true);
      
      toast({
        title: "Test Lookup Complete",
        description: "Module 3 Account Research Lookup tested successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to run test lookup",
        variant: "destructive",
      });
    }
  });

  const generateResearchMutation = useMutation({
    mutationFn: async ({ companyName, platform }: { companyName: string, platform?: string }) => {
      const response = await apiRequest("POST", "/api/account-research/generate", { 
        companyName, 
        platform: platform || "enterprise_systems",
        forceRegenerate: false 
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      setGeneratingResearch(null);
      // Invalidate account research cache to show new data
      queryClient.invalidateQueries({ queryKey: ["/api/account-research"] });
      
      toast({
        title: "Research Generated!",
        description: `Detailed research completed for ${variables.companyName}. View it in Account Research.`,
        action: (
          <button 
            onClick={() => window.location.href = '/account-research'}
            className="text-sm underline"
          >
            View Research
          </button>
        ),
      });
    },
    onError: (error: any, variables) => {
      setGeneratingResearch(null);
      toast({
        title: "Research Failed",
        description: error.message || `Failed to generate research for ${variables.companyName}`,
        variant: "destructive",
      });
    }
  });

  const handleLookup = () => {
    lookupMutation.mutate({
      industry,
      company_size: companySize,
      revenue_range: revenueRange,
      location,
      system_type: systemType,
      intent_filter: intentFilter
    });
  };

  const handleTestLookup = () => {
    testLookupMutation.mutate();
  };

  const handleGenerateResearch = (company: CompanyResult) => {
    setGeneratingResearch(company.company_name);
    generateResearchMutation.mutate({
      companyName: company.company_name,
      platform: company.system
    });
  };

  const exportToCsv = () => {
    if (!results?.companies) return;
    
    const csvData = [
      ['Company Name', 'Industry', 'System', 'HQ Location', 'Employee Count', 'Revenue Est', 'Intent Summary', 'Confidence Score', 'Research Quality'],
      ...results.companies.map(company => [
        company.company_name,
        company.industry,
        company.system,
        company.hq_location,
        company.employee_count,
        company.revenue_est,
        company.intent_summary || '',
        company.confidence_score.toString(),
        company.research_quality
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(','));
    
    const blob = new Blob([csvData.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `account-lookup-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported to CSV",
      description: "Company lookup results downloaded successfully",
    });
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'basic': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Account Research Filters
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              Module 3
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure search criteria to discover 5-10 relevant companies with QA automation opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Industry</label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Financial Services">Financial Services</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Automotive">Automotive</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                  <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Company Size</label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup (&lt; 100)</SelectItem>
                  <SelectItem value="mid-market">Mid-Market (100-1,000)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (1,000+)</SelectItem>
                  <SelectItem value="fortune-500">Fortune 500</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Revenue Range</label>
              <Select value={revenueRange} onValueChange={setRevenueRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select revenue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<$100M">&lt; $100M</SelectItem>
                  <SelectItem value="$100M-$1B">$100M - $1B</SelectItem>
                  <SelectItem value="$1B+">$1B+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Location</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="California">California</SelectItem>
                  <SelectItem value="New York">New York</SelectItem>
                  <SelectItem value="Texas">Texas</SelectItem>
                  <SelectItem value="Europe">Europe</SelectItem>
                  <SelectItem value="Asia Pacific">Asia Pacific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">System Type</label>
              <Select value={systemType} onValueChange={setSystemType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dynamics 365">Dynamics 365</SelectItem>
                  <SelectItem value="SAP">SAP</SelectItem>
                  <SelectItem value="Oracle">Oracle</SelectItem>
                  <SelectItem value="Salesforce">Salesforce</SelectItem>
                  <SelectItem value="Workday">Workday</SelectItem>
                  <SelectItem value="ServiceNow">ServiceNow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="intent-filter"
                checked={intentFilter}
                onCheckedChange={setIntentFilter}
              />
              <label htmlFor="intent-filter" className="text-sm font-medium">
                Prioritize Intent Signals
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleLookup}
              disabled={lookupMutation.isPending}
              className="flex-1"
            >
              {lookupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Discovering Companies...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Discover Companies
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleTestLookup}
              disabled={testLookupMutation.isPending}
            >
              {testLookupMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Test Lookup"
              )}
            </Button>

            {results && (
              <Button variant="outline" onClick={exportToCsv}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Module 3 Features */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-4">
            <h4 className="font-medium text-purple-800 mb-2">Module 3 Enhancements</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-purple-700">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Returns 5-10 Companies
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Intent Discovery Integration
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Advanced Filter Options
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Generate Detailed Research
              </div>
            </div>
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <strong>Research Flow:</strong> Discover companies → Generate research → View detailed analysis in <a href="/account-research" className="underline">Account Research</a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && (
        <div className="space-y-4">
          {/* Search Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Search Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-600">Companies Found</div>
                  <div className="text-2xl font-bold text-blue-600">{results.total_found}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Search Duration</div>
                  <div className="text-lg">{results.search_metadata.search_duration}ms</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Intent Discovery</div>
                  <div className={`text-lg ${results.search_metadata.intent_discovery_used ? 'text-green-600' : 'text-gray-400'}`}>
                    {results.search_metadata.intent_discovery_used ? 'Used' : 'Not Used'}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Data Sources</div>
                  <div className="text-sm">{results.search_metadata.data_sources.join(', ')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Results */}
          <div className="grid grid-cols-1 gap-4">
            {results.companies.map((company, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">{company.company_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Building2 className="h-4 w-4" />
                        {company.industry}
                        <Separator orientation="vertical" className="h-4" />
                        <Server className="h-4 w-4" />
                        {company.system}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getQualityColor(company.research_quality)}>
                        {company.research_quality}
                      </Badge>
                      <Badge variant="outline">
                        <span className={getConfidenceColor(company.confidence_score)}>
                          {company.confidence_score}% confidence
                        </span>
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{company.hq_location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{company.employee_count} employees</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>{company.revenue_est}</span>
                    </div>
                  </div>

                  {company.intent_summary && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                      <div className="font-medium text-blue-800 text-sm mb-1">Intent Summary</div>
                      <p className="text-blue-700 text-sm">{company.intent_summary}</p>
                      {company.intent_score && (
                        <Badge className="mt-2 bg-blue-100 text-blue-800">
                          Intent Score: {company.intent_score}%
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {company.source_links.map((link, linkIndex) => (
                        <a
                          key={linkIndex}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Source
                        </a>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGenerateResearch(company)}
                      disabled={generatingResearch === company.company_name}
                    >
                      {generatingResearch === company.company_name ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Research"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}