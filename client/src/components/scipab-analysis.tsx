import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Target, TrendingUp, Building2, AlertCircle, CheckCircle2, Users, Calendar } from "lucide-react";

interface ScipabAnalysis {
  situation: string;
  complication: string;
  implication: string;
  position: string;
  ask: string;
  benefit: string;
}

interface CompanyData {
  name?: string;
  industry?: string;
  employee_count?: number;
  revenue?: string;
  description?: string;
  technologies?: string[];
  location?: {
    country?: string;
    region?: string;
  };
  founded?: number;
  website?: string;
}

interface ScipabAnalysisProps {
  companyName?: string;
  onAnalysisComplete?: (analysis: ScipabAnalysis) => void;
}

export default function ScipabAnalysisComponent({ companyName: initialCompanyName, onAnalysisComplete }: ScipabAnalysisProps) {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState(initialCompanyName || "");
  const [extraContext, setExtraContext] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [analysis, setAnalysis] = useState<ScipabAnalysis | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const scipabMutation = useMutation({
    mutationFn: async ({ companyName, extraContext }: { companyName: string; extraContext?: string }) => {
      const response = await apiRequest("POST", "/api/scipab", { companyName, extraContext });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.scipab);
      setCompanyData(data.companyData);
      setGeneratedAt(data.generatedAt);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(data.scipab);
      }
      
      toast({
        title: "SCIPAB Analysis Complete",
        description: `Generated comprehensive analysis for ${data.companyData?.name || companyName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate SCIPAB analysis",
        variant: "destructive",
      });
    },
  });

  const handleGenerateScipab = () => {
    if (!companyName.trim()) {
      toast({
        title: "Company name required",
        description: "Please enter a company name to analyze",
        variant: "destructive",
      });
      return;
    }

    scipabMutation.mutate({ companyName: companyName.trim(), extraContext: extraContext.trim() });
  };

  const ScipabSection = ({ title, content, icon: Icon }: { title: string; content: string; icon: any }) => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Icon className="h-5 w-5 text-blue-600" />
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      <p className="text-gray-700 leading-relaxed">{content}</p>
    </div>
  );

  const formatEmployeeCount = (count?: number) => {
    if (!count) return "Unknown";
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={scipabMutation.isPending}
        >
          <Target className="h-4 w-4" />
          Generate SCIPAB with AI
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            AI-Powered SCIPAB Analysis
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive SCIPAB (Situation, Complication, Implication, Position, Ask, Benefit) analysis using AI and real company data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name (e.g., Microsoft, Apple, Tesla)"
                disabled={scipabMutation.isPending}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Context (Optional)
              </label>
              <Textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                placeholder="Any additional context about the company, recent news, or specific challenges you're aware of..."
                rows={3}
                disabled={scipabMutation.isPending}
              />
            </div>

            <Button 
              onClick={handleGenerateScipab}
              disabled={scipabMutation.isPending || !companyName.trim()}
              className="w-full"
            >
              {scipabMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating SCIPAB Analysis...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Generate SCIPAB Analysis
                </>
              )}
            </Button>
          </div>

          {/* Company Data Display */}
          {companyData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Company</h4>
                    <p className="text-gray-700">{companyData.name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Industry</h4>
                    <p className="text-gray-700">{companyData.industry || "Unknown"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Employees</h4>
                    <p className="text-gray-700">{formatEmployeeCount(companyData.employee_count)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Founded</h4>
                    <p className="text-gray-700">{companyData.founded || "Unknown"}</p>
                  </div>
                </div>
                
                {companyData.description && (
                  <div>
                    <h4 className="font-medium text-gray-900">Description</h4>
                    <p className="text-gray-700 text-sm">{companyData.description}</p>
                  </div>
                )}
                
                {companyData.technologies && companyData.technologies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Technologies</h4>
                    <div className="flex flex-wrap gap-1">
                      {companyData.technologies.slice(0, 10).map((tech, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SCIPAB Analysis Display */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  SCIPAB Analysis
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Generated on {new Date(generatedAt || "").toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ScipabSection 
                  title="Situation" 
                  content={analysis.situation}
                  icon={Users}
                />
                <Separator />
                
                <ScipabSection 
                  title="Complication" 
                  content={analysis.complication}
                  icon={AlertCircle}
                />
                <Separator />
                
                <ScipabSection 
                  title="Implication" 
                  content={analysis.implication}
                  icon={TrendingUp}
                />
                <Separator />
                
                <ScipabSection 
                  title="Position" 
                  content={analysis.position}
                  icon={Target}
                />
                <Separator />
                
                <ScipabSection 
                  title="Ask" 
                  content={analysis.ask}
                  icon={CheckCircle2}
                />
                <Separator />
                
                <ScipabSection 
                  title="Benefit" 
                  content={analysis.benefit}
                  icon={TrendingUp}
                />
              </CardContent>
            </Card>
          )}

          {/* API Key Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Data Sources</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This analysis uses People Data Labs for company enrichment and OpenAI for SCIPAB generation. 
                    Ensure your API keys are configured in Replit Secrets for optimal results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}