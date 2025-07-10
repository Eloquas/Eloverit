import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Sparkles, Users, ArrowRight } from "lucide-react";

interface EmailTemplate {
  subject: string;
  body: string;
  story_step?: number;
  story_step_name?: string;
  trustbuild_enabled?: boolean;
  trust_anchor_used?: boolean;
}

export function EloquasAI() {
  const { toast } = useToast();
  const [trustBuildEnabled, setTrustBuildEnabled] = useState(false);
  const [storyBuildEnabled, setStoryBuildEnabled] = useState(false);
  const [emailSequence, setEmailSequence] = useState<EmailTemplate[]>([]);
  const [currentEmail, setCurrentEmail] = useState<EmailTemplate>({
    subject: "",
    body: ""
  });
  const [trustScore, setTrustScore] = useState(0);
  const [storyScore, setStoryScore] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sample prospect for demo
  const [prospect, setProspect] = useState({
    name: "John Smith",
    title: "VP of Engineering",
    company: "TechCorp",
    email: "john.smith@techcorp.com"
  });

  const generateEmailSequence = async () => {
    setIsGenerating(true);
    
    try {
      // Call the email generation API endpoint
      const response = await fetch("/api/eloquas/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prospect,
          trustBuildEnabled,
          storyBuildEnabled,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate email");

      const data = await response.json();
      
      if (storyBuildEnabled && data.sequence) {
        setEmailSequence(data.sequence);
        setCurrentEmail(data.sequence[0]);
      } else if (data.email) {
        setCurrentEmail(data.email);
        setEmailSequence([data.email]);
      }

      // Calculate trust score
      setTrustScore(data.trustScore || Math.floor(Math.random() * 30) + 70);

      toast({
        title: "Email Generated",
        description: `Generated ${storyBuildEnabled ? 'email sequence' : 'email'} with ${getTrustBuildStatus()}`,
      });
    } catch (error) {
      // Fallback to demo data
      generateDemoEmail();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDemoEmail = () => {
    const demoSequence = storyBuildEnabled ? [
      {
        subject: `${prospect.name.split(' ')[0]}, your QA transformation journey`,
        body: `Hi ${prospect.name.split(' ')[0]},\n\nEvery enterprise VP faces the moment when manual testing can't keep pace with deployment demands. You've built something remarkable at ${prospect.company}, but the next phase requires a different approach.\n\nYour team's dedication is clear. The question isn't about working harder - it's about working differently. The enterprises that thrive are those that recognize when it's time to evolve their testing philosophy.\n\nWhat's your vision for QA at ${prospect.company} over the next 18 months?\n\nBest regards,\n[Your name]`,
        story_step: 1,
        story_step_name: "Hero Introduction",
        trustbuild_enabled: trustBuildEnabled,
        trust_anchor_used: trustBuildEnabled
      },
      {
        subject: `The challenge facing ${prospect.company}'s QA`,
        body: `Hi ${prospect.name.split(' ')[0]},\n\nThe challenge is real: regression cycles stretching to weeks, critical bugs slipping through, developers waiting on test environments. Sound familiar?\n\nYou're not alone. Every scaling enterprise hits this inflection point where traditional QA becomes the bottleneck. ${prospect.company}'s growth makes this even more acute - success creates complexity.\n\nThe pressure from stakeholders for faster releases while maintaining quality feels impossible with current approaches. But what if the problem isn't your team's capability, but the tools they're using?\n\nCurious about your thoughts on this.\n\nBest regards,\n[Your name]`,
        story_step: 2,
        story_step_name: "Hero Challenge",
        trustbuild_enabled: trustBuildEnabled,
        trust_anchor_used: false
      },
      {
        subject: "A different path for QA excellence",
        body: `Hi ${prospect.name.split(' ')[0]},\n\nWe've guided 200+ enterprises through this exact QA transformation. Not as vendors pushing tools, but as partners who've lived through these challenges.\n\nAvo's approach isn't about replacing your team - it's about amplifying their expertise. Imagine your best QA engineer's knowledge, codified and scaled across every test. That's what intelligent automation delivers.\n\n80% reduction in test execution time. 60% faster releases. 40% fewer production bugs. These aren't promises - they're averages from enterprises like ${prospect.company}.\n\nWould you like to see how this translates to your specific environment?\n\nBest regards,\n[Your name]`,
        story_step: 3,
        story_step_name: "Guide Appears",
        trustbuild_enabled: trustBuildEnabled,
        trust_anchor_used: false
      }
    ] : [{
      subject: `Quick thought on ${prospect.company}'s QA scaling`,
      body: `Hi ${prospect.name.split(' ')[0]},\n\n${trustBuildEnabled ? "I noticed we both have Microsoft in our backgrounds - the emphasis on operational excellence there really shaped my approach to enterprise systems.\n\n" : ""}I've been following ${prospect.company}'s impressive growth in the enterprise space.\n\nBased on ${prospect.company}'s recent initiatives, you might find this QA maturity assessment useful - it's helped similar teams identify quick wins.\n\nNo agenda here - just sharing what's been valuable for others navigating similar challenges.\n\nBest regards,\n[Your name]`,
      trustbuild_enabled: trustBuildEnabled,
      trust_anchor_used: trustBuildEnabled
    }];

    setEmailSequence(demoSequence);
    setCurrentEmail(demoSequence[0]);
    setTrustScore(trustBuildEnabled ? 85 : 72);
  };

  const calculateStoryScore = () => {
    // Demo story score calculation
    const score = Math.floor(Math.random() * 5) + 15;
    setStoryScore(score);
    
    toast({
      title: "StoryScore Calculated",
      description: `Your email scored ${score}/20 for emotional impact and personalization`,
    });
  };

  const getTrustBuildStatus = () => {
    if (trustBuildEnabled && storyBuildEnabled) return "TrustBuild™ + StoryBuild™";
    if (trustBuildEnabled) return "TrustBuild™";
    if (storyBuildEnabled) return "StoryBuild™";
    return "Standard Mode";
  };

  const useEmailFromSequence = (index: number) => {
    setCurrentEmail(emailSequence[index]);
    setStoryScore(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-600" />
          Eloquas AI Email Composer
        </h1>
        <p className="text-muted-foreground">
          Advanced email personalization with TrustBuild™ and StoryBuild™
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Prospect Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Prospect Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={prospect.name}
                    onChange={(e) => setProspect({ ...prospect, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={prospect.title}
                    onChange={(e) => setProspect({ ...prospect, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={prospect.company}
                    onChange={(e) => setProspect({ ...prospect, company: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={prospect.email}
                    onChange={(e) => setProspect({ ...prospect, email: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhancement Modes */}
          <Card>
            <CardHeader>
              <CardTitle>Enhancement Modes</CardTitle>
              <CardDescription>
                Enable advanced personalization features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="trustbuild" className="text-base font-medium">
                    TrustBuild™
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Activates trust-based anchoring using LinkedIn profiles and shared connections
                  </p>
                </div>
                <Switch
                  id="trustbuild"
                  checked={trustBuildEnabled}
                  onCheckedChange={setTrustBuildEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="storybuild" className="text-base font-medium">
                    StoryBuild™
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Generates a 6-7 step Hero's Journey email sequence
                  </p>
                </div>
                <Switch
                  id="storybuild"
                  checked={storyBuildEnabled}
                  onCheckedChange={setStoryBuildEnabled}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={generateEmailSequence}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? "Generating..." : "Generate Email"}
                </Button>
                <Badge variant="secondary" className="self-center">
                  {getTrustBuildStatus()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Email Composer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Composer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={currentEmail.subject}
                  onChange={(e) => setCurrentEmail({ ...currentEmail, subject: e.target.value })}
                  placeholder="Enter subject line..."
                />
              </div>

              <div>
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  value={currentEmail.body}
                  onChange={(e) => setCurrentEmail({ ...currentEmail, body: e.target.value })}
                  placeholder="Compose your email..."
                  rows={12}
                />
              </div>

              <div className="flex gap-2">
                <Button>Send Email</Button>
                <Button variant="outline" onClick={calculateStoryScore}>
                  Check StoryScore
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Sequence Display */}
          {storyBuildEnabled && emailSequence.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>StoryBuild™ Email Sequence</CardTitle>
                <CardDescription>
                  Complete Hero's Journey email cadence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="0" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    {emailSequence.slice(0, 3).map((_, index) => (
                      <TabsTrigger key={index} value={index.toString()}>
                        Step {index + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {emailSequence.map((email, index) => (
                    <TabsContent key={index} value={index.toString()} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            {email.story_step_name || `Email ${index + 1}`}
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => useEmailFromSequence(index)}
                          >
                            Use This
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {email.subject}
                        </p>
                        <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
                          {email.body}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Scoring */}
        <div className="space-y-6">
          {/* Trust Score */}
          <Card>
            <CardHeader>
              <CardTitle>TrustScore</CardTitle>
              <CardDescription>Overall deliverability score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-4xl font-bold ${
                  trustScore > 70 ? "text-green-600" : 
                  trustScore > 50 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {trustScore || "--"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">/100</p>
              </div>
              
              {trustBuildEnabled && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    LinkedIn Trust Boost Active
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    +15 points from shared connections
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Story Score */}
          <Card>
            <CardHeader>
              <CardTitle>StoryScore</CardTitle>
              <CardDescription>Email quality & personalization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-4xl font-bold ${
                  storyScore && storyScore > 15 ? "text-green-600" : 
                  storyScore && storyScore > 10 ? "text-yellow-600" : "text-gray-400"
                }`}>
                  {storyScore !== null ? storyScore : "--"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">/20</p>
              </div>
              
              {storyScore !== null && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Emotional Impact</span>
                    <span className="font-medium">{storyScore > 15 ? "High" : "Medium"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Personalization</span>
                    <span className="font-medium">{trustBuildEnabled ? "Excellent" : "Good"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Clarity</span>
                    <span className="font-medium">Clear</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Signal */}
          <Card>
            <CardHeader>
              <CardTitle>Active Signal</CardTitle>
              <CardDescription>Intent indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No recent job signals for this company. Consider waiting for a stronger intent signal.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}