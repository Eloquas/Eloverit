import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Award, 
  Brain,
  Target,
  Users,
  Zap,
  Star,
  BarChart3
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MicrolearningModule {
  id: number;
  skillArea: string;
  moduleType: string;
  title: string;
  description: string;
  content: {
    title: string;
    description: string;
    sections: Array<{
      title: string;
      type: string;
      content: string;
      duration: number;
      resources?: Array<{
        title: string;
        url: string;
        type: string;
      }>;
    }>;
    actionItems: string[];
    keyTakeaways: string[];
  };
  duration: number;
  difficulty: string;
  isCompleted: boolean;
  completedAt?: string;
  score?: number;
  triggeredBy: string;
  createdAt: string;
}

interface LearningProgress {
  id: number;
  moduleId: number;
  progressPercentage: number;
  timeSpent: number;
  currentSection: number;
  startedAt: string;
  lastAccessedAt: string;
}

interface LearningAnalytics {
  totalModules: number;
  completedModules: number;
  totalTimeSpent: number;
  averageScore: number;
  topSkillAreas: Array<{skill: string, count: number}>;
  weeklyProgress: Array<{week: string, modules: number}>;
}

export default function MicrolearningPage() {
  const [selectedModule, setSelectedModule] = useState<MicrolearningModule | null>(null);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [sectionProgress, setSectionProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const queryClient = useQueryClient();

  // Fetch user's modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/microlearning/modules"],
  });

  // Fetch recommended modules
  const { data: recommendedModules = [] } = useQuery({
    queryKey: ["/api/microlearning/recommended"],
  });

  // Fetch learning analytics
  const { data: analytics } = useQuery<LearningAnalytics>({
    queryKey: ["/api/microlearning/analytics"],
  });

  // Start module mutation
  const startModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      return await apiRequest(`/api/microlearning/modules/${moduleId}/start`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/microlearning/modules"] });
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ moduleId, progressPercentage, currentSection, timeSpent }: {
      moduleId: number;
      progressPercentage: number;
      currentSection: number;
      timeSpent: number;
    }) => {
      return await apiRequest(`/api/microlearning/modules/${moduleId}/progress`, {
        method: "PUT",
        body: JSON.stringify({ progressPercentage, currentSection, timeSpent }),
      });
    },
  });

  // Complete module mutation
  const completeModuleMutation = useMutation({
    mutationFn: async ({ moduleId, score }: { moduleId: number; score?: number }) => {
      return await apiRequest(`/api/microlearning/modules/${moduleId}/complete`, {
        method: "POST",
        body: JSON.stringify({ score }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/microlearning/modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/microlearning/analytics"] });
      setShowModuleDialog(false);
      setSelectedModule(null);
    },
  });

  const getSkillAreaIcon = (skillArea: string) => {
    switch (skillArea) {
      case 'rapport_trust': return <Users className="w-4 h-4" />;
      case 'discovery_depth': return <Target className="w-4 h-4" />;
      case 'tone_match_succinctness': return <Zap className="w-4 h-4" />;
      case 'storytelling': return <BookOpen className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getSkillAreaName = (skillArea: string) => {
    const skillMap = {
      'rapport_trust': 'Rapport & Trust Building',
      'discovery_depth': 'Discovery Question Depth',
      'tone_match_succinctness': 'Tone Matching & Succinctness',
      'storytelling': 'Storytelling Effectiveness',
    };
    return skillMap[skillArea as keyof typeof skillMap] || skillArea.replace('_', ' ');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModuleTypeIcon = (moduleType: string) => {
    switch (moduleType) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'exercise': return <Target className="w-4 h-4" />;
      case 'quiz': return <Brain className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const startModule = async (module: MicrolearningModule) => {
    setSelectedModule(module);
    setCurrentSection(0);
    setSectionProgress(0);
    setTimeSpent(0);
    setShowModuleDialog(true);
    await startModuleMutation.mutateAsync(module.id);
  };

  const nextSection = async () => {
    if (!selectedModule) return;
    
    const newSection = currentSection + 1;
    const progressPercentage = Math.round((newSection / selectedModule.content.sections.length) * 100);
    
    setCurrentSection(newSection);
    setSectionProgress(progressPercentage);
    
    await updateProgressMutation.mutateAsync({
      moduleId: selectedModule.id,
      progressPercentage,
      currentSection: newSection,
      timeSpent: timeSpent + 5, // Approximate 5 minutes per section
    });
    
    setTimeSpent(prev => prev + 5);
  };

  const completeModule = async (score?: number) => {
    if (!selectedModule) return;
    await completeModuleMutation.mutateAsync({ moduleId: selectedModule.id, score });
  };

  const renderAnalyticsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Learning Analytics
        </CardTitle>
        <CardDescription>Your learning progress and achievements</CardDescription>
      </CardHeader>
      <CardContent>
        {analytics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalModules}</div>
              <div className="text-sm text-gray-600">Total Modules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.completedModules}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.totalTimeSpent}m</div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{analytics.averageScore.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">No analytics data available</div>
        )}
      </CardContent>
    </Card>
  );

  const renderModuleCard = (module: MicrolearningModule, isRecommended = false) => (
    <Card key={module.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getSkillAreaIcon(module.skillArea)}
            <CardTitle className="text-lg">{module.title}</CardTitle>
          </div>
          <div className="flex gap-2">
            {isRecommended && <Badge className="bg-blue-100 text-blue-800">Recommended</Badge>}
            <Badge className={getDifficultyColor(module.difficulty)}>
              {module.difficulty}
            </Badge>
          </div>
        </div>
        <CardDescription>{module.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {getModuleTypeIcon(module.moduleType)}
              <span className="capitalize">{module.moduleType}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{module.duration}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>{getSkillAreaName(module.skillArea)}</span>
            </div>
          </div>
        </div>
        
        {module.isCompleted ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Completed</span>
              {module.score && (
                <Badge className="bg-green-100 text-green-800">
                  Score: {module.score}/100
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => startModule(module)}>
              Review
            </Button>
          </div>
        ) : (
          <Button onClick={() => startModule(module)} className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Start Learning
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const renderModuleDialog = () => {
    if (!selectedModule) return null;

    const currentSectionData = selectedModule.content.sections[currentSection];
    const isLastSection = currentSection >= selectedModule.content.sections.length - 1;

    return (
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getSkillAreaIcon(selectedModule.skillArea)}
              {selectedModule.title}
            </DialogTitle>
            <DialogDescription>
              Section {currentSection + 1} of {selectedModule.content.sections.length}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{sectionProgress}%</span>
              </div>
              <Progress value={sectionProgress} className="h-2" />
            </div>

            {/* Current Section Content */}
            {currentSectionData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getModuleTypeIcon(currentSectionData.type)}
                    {currentSectionData.title}
                  </CardTitle>
                  <CardDescription>
                    Duration: {currentSectionData.duration} minutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: currentSectionData.content.replace(/\n/g, '<br>') }} />
                  </div>
                  
                  {currentSectionData.resources && currentSectionData.resources.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Resources:</h4>
                      <div className="space-y-1">
                        {currentSectionData.resources.map((resource, index) => (
                          <a
                            key={index}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <BookOpen className="w-4 h-4" />
                            {resource.title} ({resource.type})
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Items (shown on last section) */}
            {isLastSection && (
              <Card>
                <CardHeader>
                  <CardTitle>Action Items</CardTitle>
                  <CardDescription>Apply these learnings immediately</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedModule.content.actionItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Key Takeaways (shown on last section) */}
            {isLastSection && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Takeaways</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selectedModule.content.keyTakeaways.map((takeaway, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Star className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowModuleDialog(false)}
              >
                Close
              </Button>
              
              <div className="space-x-2">
                {!isLastSection ? (
                  <Button onClick={nextSection}>
                    Next Section
                  </Button>
                ) : (
                  <Button onClick={() => completeModule(85)}>
                    <Award className="w-4 h-4 mr-2" />
                    Complete Module
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (modulesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading microlearning modules...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Microlearning Hub</h1>
          <p className="text-gray-600 mt-2">Personalized skill development based on your call performance</p>
        </div>
      </div>

      {/* Analytics */}
      {renderAnalyticsCard()}

      <Tabs defaultValue="my-modules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-modules">My Modules</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
        </TabsList>

        <TabsContent value="my-modules" className="space-y-6">
          {modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module: MicrolearningModule) => renderModuleCard(module))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Learning Modules Yet</h3>
                <p className="text-gray-600 mb-4">
                  Complete a call assessment to receive personalized learning recommendations
                </p>
                <Button>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Process Your First Call
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="space-y-6">
          {recommendedModules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedModules.map((module: MicrolearningModule) => renderModuleCard(module, true))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Available</h3>
                <p className="text-gray-600">
                  Process more call assessments to receive personalized learning recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Module Dialog */}
      {renderModuleDialog()}
    </div>
  );
}