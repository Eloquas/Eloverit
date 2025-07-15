import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Send, Users, Clock, Target, MessageSquare, ArrowRight, Play, Pause, Edit, Eye, Copy, Download, Filter, Plus, Zap, Heart, Brain, Mail } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface CadenceStep {
  step: number;
  subject: string;
  body: string;
  timing: string;
  cta: string;
  trustElements: string[];
  storyElements: string[];
  wordCount: number;
}

interface EmailCadence {
  id: number;
  cadenceName: string;
  cadenceType: string;
  status: string;
  steps: CadenceStep[];
  trustSignals: any;
  storyElements: any;
  totalDuration: string;
  prospectName: string;
  prospectCompany: string;
  createdAt: string;
}

export default function EmailCadences() {
  const { toast } = useToast();
  const [selectedProspect, setSelectedProspect] = useState("");
  const [useTrust, setUseTrust] = useState(false);
  const [useStory, setUseStory] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCadence, setSelectedCadence] = useState<EmailCadence | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: prospects = [] } = useQuery({
    queryKey: ["/api/prospects"],
  });

  const { data: cadences = [], isLoading } = useQuery({
    queryKey: ["/api/email-cadences"],
  });

  const filteredCadences = cadences.filter((cadence: EmailCadence) => {
    if (filterStatus === "all") return true;
    return cadence.status === filterStatus;
  });

  const generateCadenceMutation = useMutation({
    mutationFn: async ({ prospectId, useTrust, useStory }: { prospectId: number, useTrust: boolean, useStory: boolean }) => {
      const response = await apiRequest("POST", "/api/email-cadences/generate", { prospectId, useTrust, useStory });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-cadences"] });
      
      toast({
        title: "Email Cadence Generated!",
        description: `${data.cadencePreview.totalSteps}-step ${data.cadence.cadenceType} cadence created for ${data.prospectName}`,
      });
      
      setSelectedProspect("");
      setUseTrust(false);
      setUseStory(false);
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate email cadence",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const handleGenerateCadence = async () => {
    if (!selectedProspect) {
      toast({
        title: "Select Prospect",
        description: "Please select a prospect to generate a cadence for",
        variant: "destructive",
      });
      return;
    }

    if (!useTrust && !useStory) {
      toast({
        title: "Select Mode",
        description: "Please enable Trust Build, Story Build, or both modes",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generateCadenceMutation.mutate({ 
      prospectId: parseInt(selectedProspect),
      useTrust,
      useStory
    });
  };

  const getCadenceTypeColor = (type: string) => {
    switch (type) {
      case 'trust_build': return 'bg-blue-100 text-blue-800';
      case 'story_build': return 'bg-green-100 text-green-800';
      case 'trust_story_combined': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCadenceIcon = (type: string) => {
    switch (type) {
      case 'trust_build': return <Heart className="w-4 h-4" />;
      case 'story_build': return <Brain className="w-4 h-4" />;
      case 'trust_story_combined': return <Zap className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Cadences</h1>
          <p className="text-gray-600">
            AI-powered email sequences that combine trust building and storytelling for maximum impact
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Generate Cadence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Email Cadence</DialogTitle>
              <DialogDescription>
                Create a personalized email sequence using AI-powered trust building and storytelling techniques
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Prospect Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Prospect</label>
                <Select value={selectedProspect} onValueChange={setSelectedProspect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a prospect for this cadence" />
                  </SelectTrigger>
                  <SelectContent>
                    {prospects.map((prospect: any) => (
                      <SelectItem key={prospect.id} value={prospect.id.toString()}>
                        {prospect.name} - {prospect.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cadence Mode Selection */}
              <div className="space-y-4">
                <label className="text-sm font-medium block">Cadence Modes</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Trust Build Mode */}
                  <Card className={`border-2 transition-all ${useTrust ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">Trust Build™</span>
                        </div>
                        <Switch checked={useTrust} onCheckedChange={setUseTrust} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600">
                        Leverage shared connections, mutual experiences, and credibility signals to build authentic relationships
                      </p>
                    </CardContent>
                  </Card>

                  {/* Story Build Mode */}
                  <Card className={`border-2 transition-all ${useStory ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Story Build™</span>
                        </div>
                        <Switch checked={useStory} onCheckedChange={setUseStory} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600">
                        Use Hero's Journey narrative framework to create compelling transformation stories
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Combined Mode Indicator */}
                {useTrust && useStory && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-50 border border-purple-200 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-800">Trust + Story Combined Mode</span>
                    </div>
                    <p className="text-sm text-purple-700 mt-1">
                      Maximum impact cadence combining relationship building with compelling narrative structure
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerateCadence}
                disabled={isGenerating || !selectedProspect || (!useTrust && !useStory)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating Cadence...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Generate Email Cadence
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cadences</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cadences Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCadences.map((cadence: EmailCadence) => (
          <motion.div
            key={cadence.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => setSelectedCadence(cadence)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getCadenceIcon(cadence.cadenceType)}
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">{cadence.prospectName}</h3>
                      <p className="text-sm text-gray-600">{cadence.prospectCompany}</p>
                    </div>
                  </div>
                  <Badge className={getCadenceTypeColor(cadence.cadenceType)}>
                    {cadence.cadenceType.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Steps:</span>
                    <p className="font-medium">{cadence.steps?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <p className="font-medium">{cadence.totalDuration}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {cadence.status}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCadences.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Cadences Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first AI-powered email sequence to start building stronger prospect relationships
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Cadence
              </Button>
            </DialogTrigger>
          </Dialog>
        </motion.div>
      )}

      {/* Cadence Detail Modal */}
      {selectedCadence && (
        <Dialog open={!!selectedCadence} onOpenChange={() => setSelectedCadence(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                {getCadenceIcon(selectedCadence.cadenceType)}
                <span>{selectedCadence.cadenceName}</span>
              </DialogTitle>
              <DialogDescription>
                {selectedCadence.steps?.length || 0}-step cadence for {selectedCadence.prospectName} at {selectedCadence.prospectCompany}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                {selectedCadence.steps?.map((step: CadenceStep, index: number) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                            {step.step}
                          </div>
                          <div>
                            <h4 className="font-medium">{step.timing}</h4>
                            <p className="text-sm text-gray-600">{step.wordCount} words</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {step.trustElements?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Heart className="w-3 h-3 mr-1" />
                              Trust
                            </Badge>
                          )}
                          {step.storyElements?.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Brain className="w-3 h-3 mr-1" />
                              Story
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Subject Line</label>
                        <p className="text-sm bg-gray-50 p-2 rounded border">{step.subject}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email Body</label>
                        <div className="text-sm bg-gray-50 p-3 rounded border whitespace-pre-wrap">
                          {step.body}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Call to Action</label>
                        <p className="text-sm text-blue-600 font-medium">{step.cta}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}