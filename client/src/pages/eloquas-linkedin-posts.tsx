import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Sparkles, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Plus,
  Copy,
  RefreshCw,
  Target,
  Heart,
  Share2,
  Calendar,
  Clock,
  Globe,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Zap,
  Award,
  Edit3,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

// Eloquas AI LinkedIn Post Generation System
// Following exact specification for sales enablement assistant

interface PostInputs {
  companyName: string;
  companyWebsite: string;
  scoreType: 'StoryScore' | 'TrustScore';
  toneStyle: 'Consultative' | 'Conversational' | 'Authoritative' | 'Inspirational' | 'Empathetic';
  triggerEvent: string;
  industry: string;
  targetAudience: string;
  keyInsight: string;
  metric: string;
  desiredAction: string;
  wordCountTarget: number;
}

interface BrandVoice {
  tone: string;
  keyMessages: string[];
  targetSectors: string[];
  valueProps: string[];
  language: string;
}

interface LinkedInPost {
  id: string;
  userId: number;
  repName: string;
  postContent: string;
  status: 'draft' | 'approved' | 'published';
  createdAt: string;
  publishedAt?: string;
  includeBranding: boolean;
  inputs: PostInputs;
  wordCount: number;
  validationNotes: string[];
  brandVoice?: BrandVoice;
}

export default function EloquasLinkedInPosts() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("generate");
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeEloquasBranding, setIncludeEloquasBranding] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brandVoiceData, setBrandVoiceData] = useState<BrandVoice | null>(null);
  const [isInferringBrandVoice, setIsInferringBrandVoice] = useState(false);
  const [realTimeWordCount, setRealTimeWordCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Complete form state with all 11 required fields
  const [formData, setFormData] = useState<PostInputs>({
    companyName: '',
    companyWebsite: '',
    scoreType: 'TrustScore',
    toneStyle: 'Consultative',
    triggerEvent: '',
    industry: '',
    targetAudience: '',
    keyInsight: '',
    metric: '',
    desiredAction: '',
    wordCountTarget: 100
  });

  // Mock posts following specification
  const [posts, setPosts] = useState<LinkedInPost[]>([
    {
      id: "1",
      userId: 1,
      repName: "Sarah Johnson",
      postContent: "This week our TrustScore hit 82 at AvoAutomation—here's what surprised me.\n\nAt AvoAutomation.com, we work with heads of business systems to automate QA testing pipelines.\n\nWhen I personalized outreach around their regression bottlenecks, response rates climbed by 47%.\n\nWhat testing pain points have you seen lately? Let's compare notes!\n\n#QATestAutomation #TrustScore #ConsultativeSelling\n\nPowered by Eloquas AI",
      status: 'published',
      createdAt: '2024-01-10T08:00:00Z',
      publishedAt: '2024-01-10T10:30:00Z',
      includeBranding: true,
      wordCount: 98,
      validationNotes: [],
      inputs: {
        companyName: 'AvoAutomation',
        companyWebsite: 'https://avoautomation.com',
        scoreType: 'TrustScore',
        toneStyle: 'Consultative',
        triggerEvent: 'TrustScore > 80 reply',
        industry: 'QA Test Automation',
        targetAudience: 'Head of Business Systems',
        keyInsight: 'Personalizing around regression bottlenecks',
        metric: '+47% response rate',
        desiredAction: "Let's compare notes!",
        wordCountTarget: 100
      },
      brandVoice: {
        tone: 'Professional, technical, solution-focused',
        keyMessages: ['Automation excellence', 'Testing efficiency', 'Quality assurance'],
        targetSectors: ['Enterprise software', 'Financial services', 'Healthcare'],
        valueProps: ['Reduce testing time by 80%', 'Faster releases', 'Higher quality'],
        language: 'Direct, consultative, metrics-driven'
      }
    }
  ]);

  // Step 1 & 2: Score & Tone Selection + Company Context
  const handleScoreAndToneSelection = () => {
    setCurrentStep(2);
  };

  // Step 3: Brand Voice Inference
  const inferBrandVoice = async (website: string) => {
    if (!website) return null;
    
    setIsInferringBrandVoice(true);
    
    try {
      // Simulate API call to scrape and analyze website
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock brand voice data based on website analysis
      const brandVoice: BrandVoice = {
        tone: 'Professional, technical, solution-focused',
        keyMessages: ['Automation excellence', 'Testing efficiency', 'Quality assurance'],
        targetSectors: ['Enterprise software', 'Financial services', 'Healthcare'],
        valueProps: ['Reduce testing time by 80%', 'Faster releases', 'Higher quality'],
        language: 'Direct, consultative, metrics-driven'
      };
      
      setBrandVoiceData(brandVoice);
      return brandVoice;
    } finally {
      setIsInferringBrandVoice(false);
    }
  };

  // Step 4: 5-Part Structure Generation with Tone-Based Templates
  const generatePostContent = (inputs: PostInputs, brandVoice?: BrandVoice): string => {
    const { companyName, companyWebsite, scoreType, toneStyle, keyInsight, metric, targetAudience, desiredAction } = inputs;
    
    // 1. Hook (1-2 sentences) - Tie to chosen score & tone style
    let hook = "";
    if (scoreType === 'TrustScore') {
      switch (toneStyle) {
        case 'Consultative':
          hook = `This week our TrustScore hit new levels at ${companyName}—here's what surprised me.`;
          break;
        case 'Conversational':
          hook = `Quick TrustScore update from ${companyName} that's worth sharing.`;
          break;
        case 'Authoritative':
          hook = `Our TrustScore analysis at ${companyName} confirms what I've long suspected.`;
          break;
        case 'Inspirational':
          hook = `The TrustScore breakthrough at ${companyName} reminded me why I love this work.`;
          break;
        case 'Empathetic':
          hook = `Our TrustScore journey at ${companyName} taught me something important about connection.`;
          break;
      }
    } else {
      switch (toneStyle) {
        case 'Consultative':
          hook = `This week's StoryScore results at ${companyName} revealed something unexpected.`;
          break;
        case 'Conversational':
          hook = `StoryScore update from ${companyName} that got me thinking.`;
          break;
        case 'Authoritative':
          hook = `Our StoryScore data at ${companyName} validates a key principle.`;
          break;
        case 'Inspirational':
          hook = `The StoryScore milestone at ${companyName} sparked something powerful.`;
          break;
        case 'Empathetic':
          hook = `Our StoryScore journey at ${companyName} reminded me about authentic connection.`;
          break;
      }
    }
    
    // 2. Company & Context (1 sentence)
    const websiteDomain = companyWebsite.replace('https://', '').replace('http://', '').replace('www.', '');
    const context = `At ${websiteDomain}, we help ${targetAudience} overcome their biggest challenges.`;
    
    // 3. Insight + Metric (1-2 sentences)
    const insight = `Our ${scoreType} showed that ${keyInsight}, driving ${metric}.`;
    
    // 4. Question + Desired Action (1 sentence)
    const question = `What similar challenges have you experienced? ${desiredAction}`;
    
    // 5. Hashtags & Branding
    const industryTag = inputs.industry?.replace(/\s+/g, '') || 'Sales';
    const hashtags = `#${industryTag} #${scoreType} #${toneStyle}Selling`;
    const branding = includeEloquasBranding ? "\n\nPowered by Eloquas AI" : "";
    
    return `${hook}\n\n${context}\n\n${insight}\n\n${question}\n\n${hashtags}${branding}`;
  };

  // Word count calculation and validation
  const calculateWordCount = (content: string): number => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Form validation
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.companyName) errors.push("Company name is required");
    if (!formData.companyWebsite) errors.push("Company website is required");
    if (!formData.industry) errors.push("Industry is required");
    if (!formData.targetAudience) errors.push("Target audience is required");
    if (!formData.keyInsight) errors.push("Key insight is required");
    if (!formData.metric) errors.push("Metric is required");
    if (!formData.desiredAction) errors.push("Desired action is required");
    
    return errors;
  };

  // Main generation workflow
  const generatePost = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Missing Required Fields",
        description: `Please complete: ${errors.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Step 1: Infer brand voice if not already done
      let brandVoice = brandVoiceData;
      if (!brandVoice && formData.companyWebsite) {
        brandVoice = await inferBrandVoice(formData.companyWebsite);
      }
      
      // Step 2: Generate content following 5-part structure
      const content = generatePostContent(formData, brandVoice || undefined);
      const contentWordCount = calculateWordCount(content);
      
      // Step 3: Validate word count (80-120 optimal, 150 hard limit)
      const validationNotes: string[] = [];
      if (contentWordCount > 150) {
        toast({
          title: "Word Count Exceeded",
          description: `Post is ${contentWordCount} words. Maximum is 150 words.`,
          variant: "destructive"
        });
        setIsGenerating(false);
        return;
      } else if (contentWordCount > 120) {
        validationNotes.push(`Post is ${contentWordCount} words - consider shortening for optimal engagement`);
      } else if (contentWordCount < 80) {
        validationNotes.push(`Post is ${contentWordCount} words - consider expanding for better impact`);
      }
      
      // Step 4: Create post
      const newPost: LinkedInPost = {
        id: Date.now().toString(),
        userId: 1,
        repName: "Current User",
        postContent: content,
        status: 'draft',
        createdAt: new Date().toISOString(),
        includeBranding: includeEloquasBranding,
        inputs: formData,
        wordCount: contentWordCount,
        validationNotes: validationNotes,
        brandVoice: brandVoice || undefined
      };

      setPosts(prev => [newPost, ...prev]);
      setIsModalOpen(false);
      
      toast({
        title: "Post Generated Successfully",
        description: `Created ${contentWordCount}-word LinkedIn post following 5-part structure.`
      });

      // Reset form
      setFormData({
        companyName: '',
        companyWebsite: '',
        scoreType: 'TrustScore',
        toneStyle: 'Consultative',
        triggerEvent: '',
        industry: '',
        targetAudience: '',
        keyInsight: '',
        metric: '',
        desiredAction: '',
        wordCountTarget: 100
      });
      setCurrentStep(1);
      setValidationErrors([]);
      setBrandVoiceData(null);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate LinkedIn post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Real-time word count calculation
  useEffect(() => {
    if (formData.keyInsight && formData.metric) {
      const content = generatePostContent(formData, brandVoiceData || undefined);
      setRealTimeWordCount(calculateWordCount(content));
    } else {
      setRealTimeWordCount(0);
    }
  }, [formData, includeEloquasBranding, brandVoiceData]);

  // Auto-infer brand voice when website changes
  useEffect(() => {
    if (formData.companyWebsite && formData.companyWebsite.length > 10) {
      const timer = setTimeout(() => {
        inferBrandVoice(formData.companyWebsite);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.companyWebsite]);

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to Clipboard",
      description: "Post content copied successfully."
    });
  };

  const publishPost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, status: 'published' as const, publishedAt: new Date().toISOString() }
        : post
    ));
    
    toast({
      title: "Post Published",
      description: "LinkedIn post has been published successfully."
    });
  };

  const getWordCountColor = (count: number) => {
    if (count <= 120) return "text-green-600";
    if (count <= 150) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Eloquas AI LinkedIn Posts</h1>
          <p className="text-gray-600">Weekly LinkedIn post generation powered by StoryScore and TrustScore data</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered
          </Badge>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Generate Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate LinkedIn Post - Eloquas AI</DialogTitle>
                <DialogDescription>
                  Complete all 11 required fields to generate a brand-aligned, high-impact LinkedIn post
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* Progress indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Completion Progress</span>
                    <span>{Math.round((Object.values(formData).filter(v => v !== '').length / 11) * 100)}%</span>
                  </div>
                  <Progress value={(Object.values(formData).filter(v => v !== '').length / 11) * 100} className="h-2" />
                </div>

                {/* Step 1 & 2: Score & Tone Selection + Company Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5" />
                        <span>Score & Tone Selection</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Score Type</Label>
                        <RadioGroup
                          value={formData.scoreType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, scoreType: value as 'StoryScore' | 'TrustScore' }))}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="StoryScore" id="story" />
                            <Label htmlFor="story">StoryScore Activity</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="TrustScore" id="trust" />
                            <Label htmlFor="trust">TrustScore Activity</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div>
                        <Label>Tone Style</Label>
                        <Select value={formData.toneStyle} onValueChange={(value) => setFormData(prev => ({ ...prev, toneStyle: value as any }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Consultative">Consultative</SelectItem>
                            <SelectItem value="Conversational">Conversational</SelectItem>
                            <SelectItem value="Authoritative">Authoritative</SelectItem>
                            <SelectItem value="Inspirational">Inspirational</SelectItem>
                            <SelectItem value="Empathetic">Empathetic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="w-5 h-5" />
                        <span>Company Context</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Company Name *</Label>
                        <Input
                          placeholder="e.g. AvoAutomation"
                          value={formData.companyName}
                          onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label>Company Website *</Label>
                        <Input
                          placeholder="e.g. https://www.avoautomation.com"
                          value={formData.companyWebsite}
                          onChange={(e) => setFormData(prev => ({ ...prev, companyWebsite: e.target.value }))}
                        />
                        {isInferringBrandVoice && (
                          <div className="flex items-center space-x-2 mt-2 text-sm text-blue-600">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Analyzing brand voice...</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Brand Voice Analysis Results */}
                {brandVoiceData && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-blue-800">
                        <CheckCircle className="w-5 h-5" />
                        <span>Brand Voice Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Tone:</span> {brandVoiceData.tone}
                        </div>
                        <div>
                          <span className="font-medium">Language:</span> {brandVoiceData.language}
                        </div>
                        <div>
                          <span className="font-medium">Key Messages:</span> {brandVoiceData.keyMessages.join(', ')}
                        </div>
                        <div>
                          <span className="font-medium">Value Props:</span> {brandVoiceData.valueProps.join(', ')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Remaining Required Fields */}
                <Card>
                  <CardHeader>
                    <CardTitle>Required Input Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Trigger Event</Label>
                        <Input
                          placeholder="e.g. TrustScore > 80 reply"
                          value={formData.triggerEvent}
                          onChange={(e) => setFormData(prev => ({ ...prev, triggerEvent: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label>Industry *</Label>
                        <Input
                          placeholder="e.g. QA Test Automation"
                          value={formData.industry}
                          onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label>Target Audience *</Label>
                        <Input
                          placeholder="e.g. Head of Business Systems"
                          value={formData.targetAudience}
                          onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label>Metric *</Label>
                        <Input
                          placeholder="e.g. +47% response rate"
                          value={formData.metric}
                          onChange={(e) => setFormData(prev => ({ ...prev, metric: e.target.value }))}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Key Insight *</Label>
                        <Textarea
                          placeholder="e.g. Personalizing around regression bottlenecks"
                          value={formData.keyInsight}
                          onChange={(e) => setFormData(prev => ({ ...prev, keyInsight: e.target.value }))}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Desired Action *</Label>
                        <Input
                          placeholder="e.g. Let's compare notes!"
                          value={formData.desiredAction}
                          onChange={(e) => setFormData(prev => ({ ...prev, desiredAction: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label>Word Count Target</Label>
                        <Select 
                          value={formData.wordCountTarget.toString()} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, wordCountTarget: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="80">80 words</SelectItem>
                            <SelectItem value="100">100 words (recommended)</SelectItem>
                            <SelectItem value="120">120 words</SelectItem>
                            <SelectItem value="150">150 words (maximum)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={includeEloquasBranding}
                          onCheckedChange={setIncludeEloquasBranding}
                        />
                        <Label>Include "Powered by Eloquas AI"</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Real-time word count */}
                {realTimeWordCount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Live Word Count:</span>
                    <span className={`font-medium ${getWordCountColor(realTimeWordCount)}`}>
                      {realTimeWordCount} words
                    </span>
                  </div>
                )}

                {/* Validation errors */}
                {validationErrors.length > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 text-red-800 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Missing Required Fields</span>
                      </div>
                      <ul className="text-sm text-red-700 list-disc list-inside">
                        {validationErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Generate button */}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={generatePost} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({posts.filter(p => p.status === 'draft').length})</TabsTrigger>
          <TabsTrigger value="published">Published ({posts.filter(p => p.status === 'published').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How Eloquas AI LinkedIn Posts Work</CardTitle>
              <CardDescription>
                Weekly post generation powered by your StoryScore and TrustScore data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium">1. Score & Tone</h4>
                  <p className="text-sm text-gray-600">Select StoryScore or TrustScore with tone style</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Globe className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-medium">2. Company Context</h4>
                  <p className="text-sm text-gray-600">AI analyzes your website for brand voice</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Edit3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium">3. Input Fields</h4>
                  <p className="text-sm text-gray-600">Complete 11 required fields for personalization</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h4 className="font-medium">4. AI Generation</h4>
                  <p className="text-sm text-gray-600">5-part structure with word count validation</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Send className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h4 className="font-medium">5. Review & Publish</h4>
                  <p className="text-sm text-gray-600">Edit, approve, and schedule via LinkedIn OAuth</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example post following specification */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Example: TrustScore, Consultative Tone, QA Test Automation (100 words)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg border">
                <p className="whitespace-pre-line text-gray-800">
                  This week our TrustScore hit 82 at AvoAutomation—here's what surprised me.
                  
                  At AvoAutomation.com, we work with heads of business systems to automate QA testing pipelines.
                  
                  When I personalized outreach around their regression bottlenecks, response rates climbed by 47%.
                  
                  What testing pain points have you seen lately? Let's compare notes!
                  
                  #QATestAutomation #TrustScore #ConsultativeSelling
                  
                  Powered by Eloquas AI
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {posts.filter(p => p.status === 'draft').map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Edit3 className="w-5 h-5" />
                      <span>Draft Post - {post.inputs?.scoreType} Focus</span>
                    </CardTitle>
                    <CardDescription>
                      {post.inputs?.toneStyle} tone • {post.wordCount} words • {post.inputs?.industry}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Draft</Badge>
                    <Button size="sm" onClick={() => copyToClipboard(post.postContent)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => publishPost(post.id)}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <pre className="whitespace-pre-wrap text-sm">{post.postContent}</pre>
                </div>
                
                {post.validationNotes && post.validationNotes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Validation Notes:</h4>
                    {post.validationNotes.map((note, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm text-yellow-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {posts.filter(p => p.status === 'draft').length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Edit3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Draft Posts</h3>
                <p className="text-gray-600">Generate your first LinkedIn post to see drafts here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {posts.filter(p => p.status === 'published').map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span>Published Post - {post.inputs?.scoreType} Focus</span>
                    </CardTitle>
                    <CardDescription>
                      Published {new Date(post.publishedAt!).toLocaleDateString()} • {post.wordCount} words
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">Published</Badge>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <pre className="whitespace-pre-wrap text-sm">{post.postContent}</pre>
                </div>
                
                {/* Mock engagement metrics */}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">247</div>
                    <div className="text-xs text-gray-500">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">23</div>
                    <div className="text-xs text-gray-500">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">8</div>
                    <div className="text-xs text-gray-500">Comments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">5</div>
                    <div className="text-xs text-gray-500">Shares</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}