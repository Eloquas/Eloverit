import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Target, Building, Users, Mail, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SCIPABGeneratorCardProps {
  selectedProspects: number[];
}

interface SCIPABResult {
  prospect: {
    id: number;
    name: string;
    company: string;
    position: string;
    roleCategory: string;
    seniorityLevel: string;
  };
  accountResearch: {
    company: string;
    initiatives: string[];
    systems: string[];
    painPoints: string[];
  };
  scipabFramework: {
    thoughtProvokingQuestion: string;
    situation: string;
    complication: string;
    position: string;
  };
  cadence: {
    id: number;
    name: string;
    emailsGenerated: number;
  };
}

export default function SCIPABGeneratorCard({ selectedProspects }: SCIPABGeneratorCardProps) {
  const [results, setResults] = useState<SCIPABResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateCadence = useMutation({
    mutationFn: async (prospectIds: number[]) => {
      const response = await apiRequest({
        endpoint: "/api/research-and-generate-cadence",
        method: "POST",
        body: { prospectIds }
      });
      return response;
    },
    onSuccess: (data: any) => {
      setResults(data.results || []);
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-cadences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/account-research"] });
      
      toast({
        title: "SCIPAB Cadences Generated",
        description: `${data.cadencesGenerated} sequences created across ${data.companiesResearched} companies`,
      });
    },
    onError: (error) => {
      console.error("SCIPAB generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate SCIPAB cadences. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (selectedProspects.length === 0) {
    return (
      <Card className="avo-card-modern border-2 border-dashed border-primary/20 avo-hover-scale">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto avo-gradient-blue rounded-2xl flex items-center justify-center mb-4 avo-shadow-soft">
            <Target className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="avo-text-gradient text-xl">SCIPAB Cadence Generator</CardTitle>
          <CardDescription className="text-gray-600">
            Select prospects to generate research-driven, consultative email sequences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 text-center">
            <div className="p-4 avo-badge-blue rounded-2xl transition-all duration-200 avo-hover-scale">
              <Building className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-sm font-medium">Account Research</div>
              <div className="text-xs text-gray-600">SDLC, QA, systems initiatives</div>
            </div>
            <div className="p-4 avo-badge-green rounded-2xl transition-all duration-200 avo-hover-scale">
              <Users className="h-6 w-6 mx-auto mb-2 text-accent" />
              <div className="text-sm font-medium">Manager+ Targeting</div>
              <div className="text-xs text-gray-600">QA, ERP, CRM, systems roles</div>
            </div>
            <div className="p-4 avo-badge-purple rounded-2xl transition-all duration-200 avo-hover-scale">
              <Mail className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium">6-Email Sequence</div>
              <div className="text-xs text-gray-600">Consultative SCIPAB framework</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 avo-badge-green rounded-2xl border border-green-200 avo-glass">
            <div className="flex items-center gap-2 text-green-700">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Data Validation: PDL Verified</span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              Using authentic company data from People Data Labs for accurate insights
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="avo-card-modern border-primary/30 avo-shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 avo-text-gradient">
                <Target className="h-5 w-5 text-primary" />
                SCIPAB Generator
              </CardTitle>
              <CardDescription className="text-gray-600">
                Generate consultative cadences for {selectedProspects.length} prospects
              </CardDescription>
            </div>
            <Button
              onClick={() => generateCadence.mutate(selectedProspects)}
              disabled={generateCadence.isPending}
              size="lg"
              className="bg-primary hover:bg-primary-dark avo-shadow-soft rounded-xl avo-hover-scale"
            >
              {generateCadence.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Target className="mr-2 h-4 w-4" />
                  Generate Cadences
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {generateCadence.isPending && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Researching accounts and generating content...</span>
                <span className="avo-badge-blue rounded-full px-3 py-1">Step 1-5 in progress</span>
              </div>
              <Progress value={45} className="h-3 rounded-full" />
              <div className="text-xs text-gray-600 avo-glass rounded-lg p-3">
                This may take 30-60 seconds to complete account research and generate all 6 emails per prospect
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {showResults && results.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Cadences Generated Successfully
            </CardTitle>
            <CardDescription className="text-green-700">
              {results.length} consultative sequences across {new Set(results.map(r => r.prospect.company)).size} companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {results.map((result, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{result.prospect.name}</span>
                        <Badge variant="outline">{result.prospect.roleCategory}</Badge>
                        <Badge variant="secondary">{result.prospect.seniorityLevel}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">{result.prospect.position} at {result.prospect.company}</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      {result.cadence.emailsGenerated} emails
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Account Research</div>
                      <div className="text-gray-600 space-y-1">
                        <div><span className="font-medium">Systems:</span> {result.accountResearch.systems.slice(0, 2).join(", ") || "Enterprise systems"}</div>
                        <div><span className="font-medium">Initiatives:</span> {result.accountResearch.initiatives.slice(0, 1).join(", ") || "System modernization"}</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Opening Question</div>
                      <div className="text-gray-600 italic">
                        "{result.scipabFramework.thoughtProvokingQuestion}"
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Next Steps:</span> Review generated content in the "Generated Content" tab. All emails follow the SCIPAB framework with soft CTAs (1-3) progressing to stronger CTAs (4-6).
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}