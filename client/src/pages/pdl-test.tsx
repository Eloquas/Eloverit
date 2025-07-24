import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Database, FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function PDLTestPage() {
  const [testCompany, setTestCompany] = useState("General Electric");
  const [isLoading, setIsLoading] = useState(false);
  const [pdlResults, setPdlResults] = useState<any>(null);
  const [scipabResults, setScipabResults] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);
  const { toast } = useToast();

  const testPDLConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/test-pdl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: testCompany }),
      });

      const data = await response.json();
      setPdlResults(data);
      
      if (data.success) {
        toast({
          title: "PDL Test Successful",
          description: `Successfully retrieved data for ${testCompany}`,
        });
      } else {
        toast({
          title: "PDL Test Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "PDL Test Error",
        description: "Failed to connect to PDL service",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSCIPABGeneration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/test-scipab`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName: testCompany }),
      });

      const data = await response.json();
      setScipabResults(data);
      
      if (data.success) {
        toast({
          title: "SCIPAB Test Successful",
          description: `Generated SCIPAB framework for ${testCompany}`,
        });
      } else {
        toast({
          title: "SCIPAB Test Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "SCIPAB Test Error",
        description: "Failed to generate SCIPAB framework",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runConnectionTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/pdl-connection-test`);
      const data = await response.json();
      setConnectionTest(data);
      
      toast({
        title: "Connection Test Complete",
        description: `Tested ${data.summary?.totalTests || 0} companies`,
      });
    } catch (error) {
      toast({
        title: "Connection Test Error",
        description: "Failed to run comprehensive connection test",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PDL & SCIPAB Testing Dashboard</h1>
          <p className="text-gray-600">Test People Data Labs integration and SCIPAB framework generation</p>
        </div>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <Input
                value={testCompany}
                onChange={(e) => setTestCompany(e.target.value)}
                placeholder="Enter company name to test..."
                className="w-full"
              />
            </div>
            <div className="flex flex-col space-y-2 pt-6">
              <Button
                onClick={testPDLConnection}
                disabled={isLoading || !testCompany.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Test PDL Data
              </Button>
              <Button
                onClick={testSCIPABGeneration}
                disabled={isLoading || !testCompany.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Test SCIPAB
              </Button>
              <Button
                onClick={runConnectionTest}
                disabled={isLoading}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Full Connection Test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDL Test Results */}
      {pdlResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                PDL Data Test Results
              </div>
              <Badge className={pdlResults.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {pdlResults.success ? 'Success' : 'Failed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Company: {pdlResults.company}</h4>
                <p className="text-sm text-gray-600">Timestamp: {new Date(pdlResults.timestamp).toLocaleString()}</p>
              </div>
              
              {pdlResults.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Initiatives ({pdlResults.data.initiatives?.length || 0})</h5>
                    <div className="space-y-1">
                      {pdlResults.data.initiatives?.map((initiative: string, i: number) => (
                        <p key={i} className="text-xs text-blue-700">• {initiative}</p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">Systems ({pdlResults.data.systems?.length || 0})</h5>
                    <div className="space-y-1">
                      {pdlResults.data.systems?.map((system: string, i: number) => (
                        <p key={i} className="text-xs text-green-700">• {system}</p>
                      ))}
                      {(!pdlResults.data.systems || pdlResults.data.systems.length === 0) && (
                        <p className="text-xs text-gray-500">No systems detected from PDL data</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <h5 className="font-medium text-orange-900 mb-2">Pain Points ({pdlResults.data.painPoints?.length || 0})</h5>
                    <div className="space-y-1">
                      {pdlResults.data.painPoints?.map((pain: string, i: number) => (
                        <p key={i} className="text-xs text-orange-700">• {pain}</p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h5 className="font-medium text-purple-900 mb-2">Company Details</h5>
                    <div className="space-y-1">
                      <p className="text-xs text-purple-700">Industry: {pdlResults.data.industry}</p>
                      <p className="text-xs text-purple-700">Size: {pdlResults.data.companySize}</p>
                      <p className="text-xs text-purple-700">Hiring Patterns: {pdlResults.data.hiringPatterns?.length || 0} detected</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SCIPAB Test Results */}
      {scipabResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                SCIPAB Framework Test Results
              </div>
              <Badge className={scipabResults.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {scipabResults.success ? 'Success' : 'Failed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Company: {scipabResults.company}</h4>
                <p className="text-sm text-gray-600">Generated: {new Date(scipabResults.timestamp).toLocaleString()}</p>
              </div>
              
              {scipabResults.scipabFramework && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border">
                    <h5 className="font-medium text-blue-900 mb-2">Situation</h5>
                    <p className="text-sm text-blue-800">{scipabResults.scipabFramework.situation?.currentState}</p>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-lg border">
                    <h5 className="font-medium text-red-900 mb-2">Complication</h5>
                    <p className="text-sm text-red-800">{scipabResults.scipabFramework.complication?.primaryChallenge}</p>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg border">
                    <h5 className="font-medium text-orange-900 mb-2">Implication</h5>
                    <p className="text-sm text-orange-800">{scipabResults.scipabFramework.implication?.businessImpact}</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border">
                    <h5 className="font-medium text-green-900 mb-2">Position</h5>
                    <p className="text-sm text-green-800">{scipabResults.scipabFramework.position?.solutionOverview}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Test Results */}
      {connectionTest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Comprehensive Connection Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connectionTest.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{connectionTest.summary.totalTests}</div>
                    <div className="text-sm text-blue-700">Total Tests</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{connectionTest.summary.successfulCompanyEnrichments}</div>
                    <div className="text-sm text-green-700">Company Enrichments</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{connectionTest.summary.failedJobSearches}</div>
                    <div className="text-sm text-red-700">Failed Job Searches</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{connectionTest.summary.scipabAnalysisSuccess}</div>
                    <div className="text-sm text-purple-700">SCIPAB Analyses</div>
                  </div>
                </div>
              )}

              {connectionTest.reports && (
                <div className="space-y-3">
                  <Separator />
                  <h4 className="font-medium text-gray-900">Individual Company Tests</h4>
                  {connectionTest.reports.map((report: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">{report.company}</h5>
                        <Badge variant="outline" className="text-xs">
                          {new Date(report.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className={`p-2 rounded text-center ${getStatusColor(report.tests.companyEnrichment.status)}`}>
                          <div className="flex items-center justify-center mb-1">
                            {getStatusIcon(report.tests.companyEnrichment.status)}
                            <span className="ml-1 text-xs font-medium">Company Data</span>
                          </div>
                        </div>
                        <div className={`p-2 rounded text-center ${getStatusColor(report.tests.jobSearch.status)}`}>
                          <div className="flex items-center justify-center mb-1">
                            {getStatusIcon(report.tests.jobSearch.status)}
                            <span className="ml-1 text-xs font-medium">Job Search</span>
                          </div>
                        </div>
                        <div className={`p-2 rounded text-center ${getStatusColor(report.tests.scipabAnalysis.status)}`}>
                          <div className="flex items-center justify-center mb-1">
                            {getStatusIcon(report.tests.scipabAnalysis.status)}
                            <span className="ml-1 text-xs font-medium">SCIPAB Analysis</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}