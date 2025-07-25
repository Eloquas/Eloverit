import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Target, TrendingUp, Building2, User, Settings, Copy, Download, RotateCcw, Zap } from "lucide-react";

interface ScipabEnhancedOutput {
  situation: string;
  complication: string;
  implication: string;
  position: string;
  action: string;
  benefit: string;
  tone_profile: 'executive' | 'practitioner';
  confidence_score: number;
  data_sources: string[];
  version: string;
  generated_at: string;
}

interface ScipabGenerationResponse {
  scipab: ScipabEnhancedOutput;
  intent_data?: any;
  markdown_output: string;
  copy_ready: boolean;
}

interface ScipabEnhancementProps {
  companyName?: string;
  onAnalysisComplete?: (analysis: ScipabEnhancedOutput) => void;
}

export default function ScipabEnhancementComponent({ companyName: initialCompanyName, onAnalysisComplete }: ScipabEnhancementProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [result, setResult] = useState<ScipabGenerationResponse | null>(null);
  
  // Form inputs matching Module 2 specifications
  const [companyName, setCompanyName] = useState(initialCompanyName || "");
  const [industry, setIndustry] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [systemType, setSystemType] = useState("");
  const [intentSignal, setIntentSignal] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');

  // Tone options for regeneration
  const [regenerationTone, setRegenerationTone] = useState<'formal' | 'consultative' | 'bold'>('consultative');

  const scipabMutation = useMutation({
    mutationFn: async (input: any) => {
      const response = await apiRequest("POST", "/api/scipab/enhanced", input);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      
      if (onAnalysisComplete && data.scipab) {
        onAnalysisComplete(data.scipab);
      }
      
      toast({
        title: "Enhanced SCIPAB Analysis Complete",
        description: `Generated ${data.scipab?.version} for ${companyName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate enhanced SCIPAB analysis",
        variant: "destructive",
      });
    }
  });

  const testNewBalanceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/scipab/test-new-balance", {});
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "New Balance Test Complete",
        description: "SCIPAB Enhanced Engine tested successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to run New Balance test",
        variant: "destructive",
      });
    }
  });

  const handleGenerateScipab = () => {
    scipabMutation.mutate({
      company_name: companyName,
      industry,
      role_title: roleTitle,
      system_type: systemType,
      intent_signal: intentSignal,
      pain_points: painPoints,
      urgency_level: urgencyLevel
    });
  };

  const handleTestNewBalance = () => {
    testNewBalanceMutation.mutate();
  };

  const copyToClipboard = () => {
    if (result?.markdown_output) {
      navigator.clipboard.writeText(result.markdown_output);
      toast({
        title: "Copied to Clipboard",
        description: "SCIPAB markdown copied successfully",
      });
    }
  };

  const exportToCsv = () => {
    if (result?.scipab) {
      const csvData = `Field,Content\nSituation,"${result.scipab.situation}"\nComplication,"${result.scipab.complication}"\nImplication,"${result.scipab.implication}"\nPosition,"${result.scipab.position}"\nAction,"${result.scipab.action}"\nBenefit,"${result.scipab.benefit}"`;
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scipab-${companyName}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exported to CSV",
        description: "SCIPAB analysis downloaded successfully",
      });
    }
  };

  const handleRegenerate = () => {
    // Regenerate with slight tone shift
    const modifiedInput = {
      company_name: companyName,
      industry,
      role_title: roleTitle,
      system_type: systemType,
      intent_signal: intentSignal + ` (tone: ${regenerationTone})`,
      pain_points: painPoints,
      urgency_level: urgencyLevel
    };
    scipabMutation.mutate(modifiedInput);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Zap className="h-4 w-4" />
          SCIPAB Enhancement Engine v1.5
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Enhanced SCIPAB Framework Generator
            <Badge variant="outline" className="text-purple-600 border-purple-300">
              Module 2 - v1.5
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Generate personalized SCIPAB analysis with Intent Discovery integration, 
            role-based messaging, and real-time data enhancement.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Input Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Company Name *</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., New Balance"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <Input
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., Athletic Footwear & Apparel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Role Title *</label>
                  <Input
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g., QA Manager, Director of IT"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">System Type *</label>
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
              </div>

              <div>
                <label className="text-sm font-medium">Intent Signal</label>
                <Input
                  value={intentSignal}
                  onChange={(e) => setIntentSignal(e.target.value)}
                  placeholder="e.g., Migrating to cloud-based ERP"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Pain Points</label>
                <Textarea
                  value={painPoints}
                  onChange={(e) => setPainPoints(e.target.value)}
                  placeholder="e.g., Manual testing processes, ERP integration validation"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Urgency Level</label>
                <Select value={urgencyLevel} onValueChange={(value: any) => setUrgencyLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleGenerateScipab}
                  disabled={scipabMutation.isPending || !companyName || !roleTitle || !systemType}
                  className="flex-1"
                >
                  {scipabMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Generate SCIPAB
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleTestNewBalance}
                  disabled={testNewBalanceMutation.isPending}
                >
                  Test Example
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                SCIPAB Analysis Results
              </CardTitle>
              {result && (
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {result.scipab.confidence_score}% Confidence
                  </Badge>
                  <Badge variant={result.scipab.tone_profile === 'executive' ? 'default' : 'secondary'}>
                    {result.scipab.tone_profile} Focus
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <div className="font-medium text-sm text-gray-600 mb-1">SITUATION</div>
                      <p className="text-sm bg-blue-50 p-3 rounded border">{result.scipab.situation}</p>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-600 mb-1">COMPLICATION</div>
                      <p className="text-sm bg-orange-50 p-3 rounded border">{result.scipab.complication}</p>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-600 mb-1">IMPLICATION</div>
                      <p className="text-sm bg-red-50 p-3 rounded border">{result.scipab.implication}</p>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-600 mb-1">POSITION</div>
                      <p className="text-sm bg-green-50 p-3 rounded border">{result.scipab.position}</p>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-600 mb-1">ACTION</div>
                      <p className="text-sm bg-purple-50 p-3 rounded border">{result.scipab.action}</p>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-600 mb-1">BENEFIT</div>
                      <p className="text-sm bg-yellow-50 p-3 rounded border">{result.scipab.benefit}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button onClick={copyToClipboard} variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button onClick={exportToCsv} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                    <div className="flex-1" />
                    <Select value={regenerationTone} onValueChange={(value: any) => setRegenerationTone(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="consultative">Consultative</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleRegenerate} variant="outline" size="sm" disabled={scipabMutation.isPending}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500">
                    Generated: {new Date(result.scipab.generated_at).toLocaleString()} | 
                    Sources: {result.scipab.data_sources.join(', ')} | 
                    Version: {result.scipab.version}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Configure inputs and generate SCIPAB analysis</p>
                  <p className="text-xs mt-1">Enhanced with Intent Discovery integration</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}