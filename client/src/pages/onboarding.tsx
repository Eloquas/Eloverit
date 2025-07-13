import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Users, Target, Zap, ArrowRight, Building2, Mail, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface OnboardingData {
  role: string;
  experienceLevel: string;
  primaryGoals: string[];
  company: string;
  teamSize: string;
  currentTools: string[];
  painPoints: string[];
  preferences: {
    emailFrequency: string;
    communicationStyle: string;
    automationLevel: string;
  };
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    role: "",
    experienceLevel: "",
    primaryGoals: [],
    company: "",
    teamSize: "",
    currentTools: [],
    painPoints: [],
    preferences: {
      emailFrequency: "",
      communicationStyle: "",
      automationLevel: ""
    }
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const response = await apiRequest("POST", "/api/onboarding/complete", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome to Eloquas AI!",
        description: `Your personalized experience is ready. ${data.recommendations?.length || 0} features recommended for you.`,
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Setup Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboardingMutation.mutate(onboardingData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleArrayValue = (array: string[], value: string, setter: (newArray: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.role && onboardingData.experienceLevel;
      case 2:
        return onboardingData.primaryGoals.length > 0;
      case 3:
        return onboardingData.company && onboardingData.teamSize;
      case 4:
        return onboardingData.painPoints.length > 0;
      case 5:
        return onboardingData.preferences.emailFrequency && 
               onboardingData.preferences.communicationStyle && 
               onboardingData.preferences.automationLevel;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Eloquas AI</h1>
          <p className="text-gray-600">Let's personalize your sales intelligence experience</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Tell us about yourself</h2>
                    <p className="text-gray-600">This helps us customize your experience</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">What's your primary role?</Label>
                      <RadioGroup 
                        value={onboardingData.role} 
                        onValueChange={(value) => setOnboardingData({...onboardingData, role: value})}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sales-rep" id="sales-rep" />
                          <Label htmlFor="sales-rep">Sales Representative / BDR</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sales-manager" id="sales-manager" />
                          <Label htmlFor="sales-manager">Sales Manager</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="marketing" id="marketing" />
                          <Label htmlFor="marketing">Marketing Professional</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="founder" id="founder" />
                          <Label htmlFor="founder">Founder / Executive</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other">Other</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Experience with sales tools</Label>
                      <RadioGroup 
                        value={onboardingData.experienceLevel} 
                        onValueChange={(value) => setOnboardingData({...onboardingData, experienceLevel: value})}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="beginner" id="beginner" />
                          <Label htmlFor="beginner">Beginner - New to sales automation</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="intermediate" id="intermediate" />
                          <Label htmlFor="intermediate">Intermediate - Some experience with CRM/tools</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="advanced" id="advanced" />
                          <Label htmlFor="advanced">Advanced - Experienced with sales tech stack</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2">What are your primary goals?</h2>
                    <p className="text-gray-600">Select all that apply - we'll prioritize these features</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: "generate-leads", label: "Generate more qualified leads", icon: Target },
                      { id: "improve-emails", label: "Improve email open and response rates", icon: Mail },
                      { id: "research-accounts", label: "Research accounts and prospects faster", icon: Building2 },
                      { id: "automate-outreach", label: "Automate repetitive outreach tasks", icon: Zap },
                      { id: "linkedin-presence", label: "Build stronger LinkedIn presence", icon: Users },
                      { id: "track-performance", label: "Track and improve sales performance", icon: CheckCircle }
                    ].map((goal) => (
                      <div
                        key={goal.id}
                        onClick={() => toggleArrayValue(
                          onboardingData.primaryGoals, 
                          goal.id, 
                          (newGoals) => setOnboardingData({...onboardingData, primaryGoals: newGoals})
                        )}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          onboardingData.primaryGoals.includes(goal.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <goal.icon className={`w-5 h-5 ${
                            onboardingData.primaryGoals.includes(goal.id) ? "text-blue-600" : "text-gray-500"
                          }`} />
                          <span className="font-medium">{goal.label}</span>
                          {onboardingData.primaryGoals.includes(goal.id) && (
                            <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2">About your organization</h2>
                    <p className="text-gray-600">Help us understand your context</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="company">Company name</Label>
                      <Input
                        id="company"
                        value={onboardingData.company}
                        onChange={(e) => setOnboardingData({...onboardingData, company: e.target.value})}
                        placeholder="Your company name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Team size</Label>
                      <Select 
                        value={onboardingData.teamSize} 
                        onValueChange={(value) => setOnboardingData({...onboardingData, teamSize: value})}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select team size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Just me</SelectItem>
                          <SelectItem value="small">2-10 people</SelectItem>
                          <SelectItem value="medium">11-50 people</SelectItem>
                          <SelectItem value="large">51-200 people</SelectItem>
                          <SelectItem value="enterprise">200+ people</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Current tools you use (optional)</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {["Salesforce", "HubSpot", "Pipedrive", "LinkedIn Sales Nav", "Outreach", "SalesLoft", "ZoomInfo", "Apollo"].map((tool) => (
                          <div
                            key={tool}
                            onClick={() => toggleArrayValue(
                              onboardingData.currentTools, 
                              tool, 
                              (newTools) => setOnboardingData({...onboardingData, currentTools: newTools})
                            )}
                            className={`p-2 text-sm border rounded cursor-pointer transition-all ${
                              onboardingData.currentTools.includes(tool)
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {tool}
                            {onboardingData.currentTools.includes(tool) && (
                              <CheckCircle className="w-3 h-3 inline ml-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2">What challenges do you face?</h2>
                    <p className="text-gray-600">We'll recommend solutions for your biggest pain points</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      "Low email response rates",
                      "Difficulty finding prospect contact info",
                      "Time-consuming manual research",
                      "Inconsistent follow-up processes",
                      "Lack of personalization at scale",
                      "Poor data quality in CRM",
                      "Difficulty tracking performance",
                      "Team collaboration challenges"
                    ].map((painPoint) => (
                      <div
                        key={painPoint}
                        onClick={() => toggleArrayValue(
                          onboardingData.painPoints, 
                          painPoint, 
                          (newPainPoints) => setOnboardingData({...onboardingData, painPoints: newPainPoints})
                        )}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          onboardingData.painPoints.includes(painPoint)
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{painPoint}</span>
                          {onboardingData.painPoints.includes(painPoint) && (
                            <CheckCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Final preferences</h2>
                    <p className="text-gray-600">Let's fine-tune your experience</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>How often would you like insights and tips?</Label>
                      <RadioGroup 
                        value={onboardingData.preferences.emailFrequency} 
                        onValueChange={(value) => setOnboardingData({
                          ...onboardingData, 
                          preferences: {...onboardingData.preferences, emailFrequency: value}
                        })}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="daily" id="daily" />
                          <Label htmlFor="daily">Daily updates</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="weekly" id="weekly" />
                          <Label htmlFor="weekly">Weekly digest</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="monthly" id="monthly" />
                          <Label htmlFor="monthly">Monthly summary</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>Communication style preference</Label>
                      <RadioGroup 
                        value={onboardingData.preferences.communicationStyle} 
                        onValueChange={(value) => setOnboardingData({
                          ...onboardingData, 
                          preferences: {...onboardingData.preferences, communicationStyle: value}
                        })}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="direct" id="direct" />
                          <Label htmlFor="direct">Direct and concise</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="detailed" id="detailed" />
                          <Label htmlFor="detailed">Detailed explanations</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="casual" id="casual" />
                          <Label htmlFor="casual">Casual and friendly</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>Automation preference</Label>
                      <RadioGroup 
                        value={onboardingData.preferences.automationLevel} 
                        onValueChange={(value) => setOnboardingData({
                          ...onboardingData, 
                          preferences: {...onboardingData.preferences, automationLevel: value}
                        })}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="minimal" id="minimal" />
                          <Label htmlFor="minimal">Minimal - I want control over everything</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="balanced" id="balanced" />
                          <Label htmlFor="balanced">Balanced - Automate routine tasks</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="maximum" id="maximum" />
                          <Label htmlFor="maximum">Maximum - Automate as much as possible</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepValid() || completeOnboardingMutation.isPending}
            className="px-6"
          >
            {completeOnboardingMutation.isPending ? (
              "Setting up your experience..."
            ) : currentStep === totalSteps ? (
              <>
                Complete Setup
                <CheckCircle className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}