import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Users, Building, Lightbulb, Target, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SCIPABGeneratorProps {
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

export default function SCIPABCadenceGenerator({ selectedProspects }: SCIPABGeneratorProps) {
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
    onSuccess: (data) => {
      setResults(data.results || []);
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-cadences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/account-research"] });
      
      toast({
        title: "SCIPAB Cadences Generated",
        description: `Successfully created ${data.cadencesGenerated} consultative email sequences across ${data.companiesResearched} companies.`,
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            SCIPAB Cadence Generator
          </CardTitle>
          <CardDescription>
            5-step research flow that creates consultative, warm email sequences using the SCIPAB framework
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Select prospects from the table above to generate SCIPAB cadences
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 border rounded-lg">
              <Building className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h4 className="font-medium mb-1">Account Research</h4>
              <p className="text-sm text-muted-foreground">SDLC, testing, QA initiatives per company</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h4 className="font-medium mb-1">Role Analysis</h4>
              <p className="text-sm text-muted-foreground">Manager+ targeting in QA, ERP, CRM systems</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h4 className="font-medium mb-1">SCIPAB Emails</h4>
              <p className="text-sm text-muted-foreground">6-email consultative sequence</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            SCIPAB Cadence Generator
          </CardTitle>
          <CardDescription>
            Generate research-driven, consultative email sequences for {selectedProspects.length} selected prospects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ready to generate:</p>
                <p className="text-sm text-muted-foreground">
                  {selectedProspects.length} prospects → Account research → SCIPAB framework → 6-email cadences
                </p>
              </div>
              <Button
                onClick={() => generateCadence.mutate(selectedProspects)}
                disabled={generateCadence.isPending}
                size="lg"
                className="min-w-[200px]"
              >
                {generateCadence.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Researching & Generating...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Generate SCIPAB Cadences
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 text-sm font-medium">1</div>
                <p className="text-xs font-medium">Account Research</p>
                <p className="text-xs text-muted-foreground">SDLC, QA initiatives</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-2 text-sm font-medium">2</div>
                <p className="text-xs font-medium">Role Analysis</p>
                <p className="text-xs text-muted-foreground">Manager+ targeting</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-2 text-sm font-medium">3</div>
                <p className="text-xs font-medium">SCIPAB POV</p>
                <p className="text-xs text-muted-foreground">Consultative framework</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2 text-sm font-medium">4</div>
                <p className="text-xs font-medium">6-Email Cadence</p>
                <p className="text-xs text-muted-foreground">Soft → Strong CTAs</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2 text-sm font-medium">5</div>
                <p className="text-xs font-medium">Scale Across</p>
                <p className="text-xs text-muted-foreground">Company contacts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showResults && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Generated SCIPAB Cadences
            </CardTitle>
            <CardDescription>
              {results.length} consultative email sequences created across {new Set(results.map(r => r.prospect.company)).size} companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{result.prospect.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.prospect.position} at {result.prospect.company}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{result.prospect.roleCategory}</Badge>
                      <Badge variant="outline">{result.prospect.seniorityLevel}</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Account Research</h5>
                      <div className="space-y-1 text-xs">
                        <p><strong>Systems:</strong> {result.accountResearch.systems.join(", ") || "Enterprise systems"}</p>
                        <p><strong>Initiatives:</strong> {result.accountResearch.initiatives.slice(0, 2).join(", ") || "System modernization"}</p>
                        <p><strong>Pain Points:</strong> {result.accountResearch.painPoints.slice(0, 2).join(", ") || "Testing challenges"}</p>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm mb-2">SCIPAB Framework</h5>
                      <div className="text-xs space-y-1">
                        <p><strong>Opening Question:</strong></p>
                        <p className="italic pl-2">{result.scipabFramework.thoughtProvokingQuestion}</p>
                        <p><strong>Situation:</strong> {result.scipabFramework.situation.substring(0, 60)}...</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm font-medium">
                      ✓ {result.cadence.emailsGenerated} emails generated in cadence
                    </p>
                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                      Ready to Send
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}