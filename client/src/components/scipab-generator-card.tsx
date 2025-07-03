import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Target, Building, Users, Mail } from "lucide-react";
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
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader className="text-center pb-4">
          <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <CardTitle className="text-gray-600">SCIPAB Cadence Generator</CardTitle>
          <CardDescription>
            Select prospects to generate research-driven, consultative email sequences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-sm font-medium">Account Research</div>
              <div className="text-xs text-gray-600">SDLC, QA, systems initiatives</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-sm font-medium">Manager+ Targeting</div>
              <div className="text-xs text-gray-600">QA, ERP, CRM, systems roles</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Mail className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-sm font-medium">6-Email Sequence</div>
              <div className="text-xs text-gray-600">Consultative SCIPAB framework</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                SCIPAB Generator
              </CardTitle>
              <CardDescription>
                Generate consultative cadences for {selectedProspects.length} prospects
              </CardDescription>
            </div>
            <Button
              onClick={() => generateCadence.mutate(selectedProspects)}
              disabled={generateCadence.isPending}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
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
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Researching accounts and generating content...</span>
                <span>Step 1-5 in progress</span>
              </div>
              <Progress value={45} className="h-2" />
              <div className="text-xs text-gray-600">
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