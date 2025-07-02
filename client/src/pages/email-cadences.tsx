import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Play, Pause, RotateCcw, ArrowLeft, Users, Calendar, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function EmailCadences() {
  const { toast } = useToast();
  const [selectedProspects, setSelectedProspects] = useState<number[]>([]);
  const [cadenceType, setCadenceType] = useState("brand_awareness");

  const { data: prospects = [] } = useQuery({
    queryKey: ["/api/prospects"],
  });

  const { data: cadences = [], isLoading } = useQuery({
    queryKey: ["/api/email-cadences"],
  });

  const createCadenceMutation = useMutation({
    mutationFn: async (data: { prospectIds: number[], cadenceType: string }) => {
      const response = await apiRequest("POST", "/api/email-cadences/create", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-cadences"] });
      toast({
        title: "Cadences created!",
        description: `Created ${data.count} email cadences`,
      });
      setSelectedProspects([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create cadences",
        description: error.message || "Could not create email cadences",
        variant: "destructive",
      });
    }
  });

  const updateCadenceStatusMutation = useMutation({
    mutationFn: async (data: { cadenceId: number, status: string }) => {
      const response = await apiRequest("PATCH", `/api/email-cadences/${data.cadenceId}`, { status: data.status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-cadences"] });
      toast({
        title: "Cadence updated",
        description: "Email cadence status updated successfully",
      });
    }
  });

  const handleCreateCadences = () => {
    if (selectedProspects.length === 0) {
      toast({
        title: "No prospects selected",
        description: "Please select prospects to create cadences for",
        variant: "destructive",
      });
      return;
    }

    createCadenceMutation.mutate({
      prospectIds: selectedProspects,
      cadenceType,
    });
  };

  const handleCadenceAction = (cadenceId: number, action: string) => {
    updateCadenceStatusMutation.mutate({ cadenceId, status: action });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCadenceTypeColor = (type: string) => {
    switch (type) {
      case "brand_awareness": return "bg-purple-100 text-purple-800";
      case "product_demo": return "bg-blue-100 text-blue-800";
      case "follow_up": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressPercentage = (currentStep: number, totalSteps: number) => {
    return Math.round((currentStep / totalSteps) * 100);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleDateString();
  };

  const cadenceTemplates = {
    brand_awareness: {
      name: "Brand Awareness (6 emails)",
      description: "Educational content focusing on enterprise systems challenges and solutions",
      steps: [
        "Problem awareness - The hidden costs of manual testing",
        "Solution introduction - How companies reduce testing time by 80%",
        "Personalized insights - Your specific system challenges",
        "Social proof - Customer success stories",
        "Urgency - Limited time workshop opportunity",
        "Relationship building - Staying connected"
      ]
    },
    product_demo: {
      name: "Product Demo (6 emails)",
      description: "Progressive demonstration of Avo Automation capabilities",
      steps: [
        "Platform introduction",
        "Core features demonstration",
        "ROI and cost savings",
        "Implementation process",
        "Support and partnership",
        "Next steps and trial"
      ]
    },
    follow_up: {
      name: "Follow-up Sequence (6 emails)",
      description: "Nurturing sequence for engaged prospects",
      steps: [
        "Initial follow-up",
        "Additional resources",
        "Case study sharing",
        "FAQ addressing",
        "Final opportunity",
        "Relationship maintenance"
      ]
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading email cadences...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Email Cadences</h1>
            <p className="text-gray-600">
              Manage 6-email sequences for brand awareness and lead nurturing
            </p>
          </div>
        </div>
      </div>

      {/* Cadence Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Create New Cadence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Cadence Type</label>
              <Select value={cadenceType} onValueChange={setCadenceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                  <SelectItem value="product_demo">Product Demo</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Selected Prospects ({selectedProspects.length})
              </label>
              <Button 
                variant="outline" 
                onClick={() => setSelectedProspects(prospects.slice(0, 10).map((p: any) => p.id))}
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Quick Select (First 10)
              </Button>
            </div>
          </div>

          {/* Cadence Template Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              {cadenceTemplates[cadenceType as keyof typeof cadenceTemplates].name}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {cadenceTemplates[cadenceType as keyof typeof cadenceTemplates].description}
            </p>
            <div className="space-y-2">
              {cadenceTemplates[cadenceType as keyof typeof cadenceTemplates].steps.map((step, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs mr-3">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleCreateCadences}
            disabled={selectedProspects.length === 0 || createCadenceMutation.isPending}
            className="w-full"
          >
            {createCadenceMutation.isPending ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Cadences...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Create Cadences for {selectedProspects.length} Prospects
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Cadences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Cadences</span>
            <Badge variant="outline">{cadences.length} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cadences.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No cadences created yet</h3>
              <p className="text-gray-600">Create your first email cadence to start nurturing prospects.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cadences.map((cadence: any) => (
                <div key={cadence.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{cadence.prospectName}</h4>
                      <Badge className={getCadenceTypeColor(cadence.cadenceType)}>
                        {cadence.cadenceType.replace('_', ' ')}
                      </Badge>
                      <Badge className={getStatusColor(cadence.status)}>
                        {cadence.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {cadence.status === "active" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCadenceAction(cadence.id, "paused")}
                        >
                          <Pause className="w-3 h-3" />
                        </Button>
                      )}
                      {cadence.status === "paused" && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCadenceAction(cadence.id, "active")}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCadenceAction(cadence.id, "active")}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Step {cadence.currentStep} of {cadence.totalSteps}
                      </span>
                      <span className="text-gray-600">
                        Next: {formatDate(cadence.nextSendDate)}
                      </span>
                    </div>
                    
                    <Progress 
                      value={getProgressPercentage(cadence.currentStep, cadence.totalSteps)} 
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{cadence.cadenceName}</span>
                      <span>{cadence.prospectCompany}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cadence Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Cadences</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cadences.filter((c: any) => c.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cadences.reduce((sum: number, c: any) => sum + (c.currentStep - 1), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cadences.length > 0 
                    ? Math.round((cadences.filter((c: any) => c.status === "completed").length / cadences.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}