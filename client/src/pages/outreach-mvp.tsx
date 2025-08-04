import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Mail, Target, TrendingUp, Users, Plus, Calendar, CheckCircle, Clock, Play, Pause, Zap, Heart, Database, Download } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PersonalizationData {
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  industry: string;
  painPoints: string[];
  recentAchievement?: string;
  sharedConnection?: string;
  mutualInterest?: string;
  eventName?: string;
  eventDate?: string;
  keyInsights?: string[];
}

interface OutreachCampaign {
  id: string;
  userId: number;
  prospectId: number;
  sequenceId: string;
  personalizationData: PersonalizationData;
  messages: GeneratedMessage[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  performance: CampaignPerformance;
}

interface GeneratedMessage {
  id: string;
  templateType: string;
  subject: string;
  body: string;
  scheduledFor: string;
  sentAt?: string;
  status: 'scheduled' | 'sent' | 'opened' | 'replied' | 'bounced';
  trustStoryScore: number;
  wordCount: number;
}

interface CampaignPerformance {
  sentCount: number;
  openRate: number;
  replyRate: number;
  meetingBookings: number;
  trustScoreAvg: number;
  storyScoreAvg: number;
}

interface OutreachSequence {
  id: string;
  name: string;
  type: 'general' | 'event' | 'nurture';
  templates: any[];
  cadence: string[];
  totalDuration: string;
}

interface MessageTemplate {
  id: string;
  type: string;
  subject: string;
  body: string;
  trustStoryScore: number;
  trustStoryNote: string;
  suggestedTiming: string;
  wordCount: number;
}

export default function OutreachMVP() {
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<OutreachCampaign | null>(null);
  const [newCampaignData, setNewCampaignData] = useState({
    prospectId: 1,
    sequenceType: 'general' as 'general' | 'event' | 'nurture',
    personalizationData: {
      firstName: '',
      lastName: '',
      company: '',
      role: '',
      industry: 'SaaS',
      painPoints: [''],
      recentAchievement: '',
      sharedConnection: '',
      mutualInterest: '',
      eventName: '',
      eventDate: '',
      keyInsights: ['']
    } as PersonalizationData
  });

  const [templateData, setTemplateData] = useState({
    templateType: 'general_outreach_1' as any,
    personalizationData: {
      firstName: '',
      lastName: '',
      company: '',
      role: '',
      industry: 'SaaS',
      painPoints: ['Testing bottlenecks'],
      recentAchievement: '',
      sharedConnection: '',
      mutualInterest: '',
      eventName: '',
      eventDate: '',
      keyInsights: ['']
    } as PersonalizationData
  });

  // New Eloquas Engine v2 States
  const [trustBuilderEnabled, setTrustBuilderEnabled] = useState(true);
  const [storyBuilderEnabled, setStoryBuilderEnabled] = useState(true);
  const [pdlEnrichmentData, setPdlEnrichmentData] = useState<any>(null);
  const [prospectEmail, setProspectEmail] = useState('');

  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/outreach/campaigns'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/outreach/campaigns');
      return response.json();
    }
  });

  // Fetch sequences
  const { data: sequences = [], isLoading: sequencesLoading } = useQuery({
    queryKey: ['/api/outreach/sequences'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/outreach/sequences');
      return response.json();
    }
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/outreach/analytics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/outreach/analytics');
      return response.json();
    }
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const response = await apiRequest('POST', '/api/outreach/campaigns', campaignData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/analytics'] });
      setShowNewCampaignModal(false);
    }
  });

  // Generate template mutation (Updated for Engine v2)
  const generateTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest('POST', '/api/outreach/generate-message', {
        ...templateData,
        options: {
          trustBuilder: trustBuilderEnabled,
          storyBuilder: storyBuilderEnabled
        }
      });
      return response.json();
    }
  });

  // PDL Enrichment mutation
  const enrichProspectMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/outreach/enrich', { email });
      return response.json();
    },
    onSuccess: (data) => {
      setPdlEnrichmentData(data);
      // Auto-populate form with enriched data
      if (data.person) {
        setTemplateData(prev => ({
          ...prev,
          personalizationData: {
            ...prev.personalizationData,
            firstName: data.person.first_name || prev.personalizationData.firstName,
            lastName: data.person.last_name || prev.personalizationData.lastName,
            company: data.person.organization?.name || prev.personalizationData.company,
            role: data.person.job_title || prev.personalizationData.role,
            industry: data.person.organization?.industry || prev.personalizationData.industry
          }
        }));
      }
    }
  });

  // Update campaign status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ campaignId, status }: { campaignId: string; status: string }) => 
      apiRequest(`/api/outreach/campaigns/${campaignId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/outreach/analytics'] });
    }
  });

  const handleCreateCampaign = () => {
    createCampaignMutation.mutate(newCampaignData);
  };

  const handleGenerateTemplate = () => {
    generateTemplateMutation.mutate(templateData);
  };

  const handleEnrichProspect = () => {
    if (prospectEmail) {
      enrichProspectMutation.mutate(prospectEmail);
    }
  };

  const handleUpdateCampaignStatus = (campaignId: string, status: string) => {
    updateStatusMutation.mutate({ campaignId, status });
  };

  const addPainPoint = () => {
    setNewCampaignData(prev => ({
      ...prev,
      personalizationData: {
        ...prev.personalizationData,
        painPoints: [...prev.personalizationData.painPoints, '']
      }
    }));
  };

  const updatePainPoint = (index: number, value: string) => {
    setNewCampaignData(prev => ({
      ...prev,
      personalizationData: {
        ...prev.personalizationData,
        painPoints: prev.personalizationData.painPoints.map((p, i) => i === index ? value : p)
      }
    }));
  };

  const addTemplateKeyInsight = () => {
    setTemplateData(prev => ({
      ...prev,
      personalizationData: {
        ...prev.personalizationData,
        keyInsights: [...(prev.personalizationData.keyInsights || []), '']
      }
    }));
  };

  const updateTemplateKeyInsight = (index: number, value: string) => {
    setTemplateData(prev => ({
      ...prev,
      personalizationData: {
        ...prev.personalizationData,
        keyInsights: (prev.personalizationData.keyInsights || []).map((insight, i) => i === index ? value : insight)
      }
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="w-4 h-4" />;
      case 'active': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (campaignsLoading || sequencesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading outreach campaigns...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Eloquas Outreach Engine v2</h1>
          <p className="text-gray-600 mt-2">
            TrustBuilder + StoryBuilder unified engine with PDL integration
          </p>
          <div className="flex space-x-2 mt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <Zap className="w-3 h-3 mr-1" />
              TrustBuilder™
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              <Heart className="w-3 h-3 mr-1" />
              StoryBuilder™
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Database className="w-3 h-3 mr-1" />
              PDL Enhanced
            </Badge>
          </div>
        </div>
        <div className="space-x-2">
          <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                Engine v2 Template
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={showNewCampaignModal} onOpenChange={setShowNewCampaignModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold">{analytics.totalCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Active Campaigns</p>
                  <p className="text-2xl font-bold">{analytics.activeCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Avg Trust Score</p>
                  <p className="text-2xl font-bold">{Math.round(analytics.averageTrustScore)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Reply Rate</p>
                  <p className="text-2xl font-bold">{Math.round(analytics.averageReplyRate)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <div>
                  <p className="text-sm text-gray-600">Messages Sent</p>
                  <p className="text-2xl font-bold">{analytics.totalMessagesSent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-600 mb-4">Create your first outreach campaign to get started</p>
                <Button onClick={() => setShowNewCampaignModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {campaigns.map((campaign: OutreachCampaign) => (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {campaign.personalizationData.firstName} {campaign.personalizationData.lastName}
                        </CardTitle>
                        <CardDescription>
                          {campaign.personalizationData.role} at {campaign.personalizationData.company}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(campaign.status)} flex items-center gap-1`}>
                        {getStatusIcon(campaign.status)}
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Trust Score</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={campaign.performance.trustScoreAvg} className="flex-1" />
                          <span className="text-sm font-medium">{Math.round(campaign.performance.trustScoreAvg)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Reply Rate</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={campaign.performance.replyRate} className="flex-1" />
                          <span className="text-sm font-medium">{Math.round(campaign.performance.replyRate)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Messages ({campaign.messages.length})</p>
                      <div className="space-y-2">
                        {campaign.messages.slice(0, 2).map((message: GeneratedMessage) => (
                          <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-medium text-sm">{message.subject}</p>
                              <Badge variant="outline" className="text-xs">
                                {message.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{message.body}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-gray-500">{message.wordCount} words</span>
                              <span className="text-xs text-gray-500">Trust: {message.trustStoryScore}</span>
                            </div>
                          </div>
                        ))}
                        {campaign.messages.length > 2 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{campaign.messages.length - 2} more messages
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {campaign.status === 'draft' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateCampaignStatus(campaign.id, 'active')}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {campaign.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateCampaignStatus(campaign.id, 'paused')}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Pause
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedCampaign(campaign)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sequences" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sequences.map((sequence: OutreachSequence) => (
              <Card key={sequence.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{sequence.name}</CardTitle>
                  <CardDescription>
                    {sequence.type} • {sequence.totalDuration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Cadence:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {sequence.cadence.map((step, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Campaign Modal */}
      <Dialog open={showNewCampaignModal} onOpenChange={setShowNewCampaignModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Outreach Campaign</DialogTitle>
            <DialogDescription>
              Set up a personalized outreach campaign for QA and enterprise systems professionals
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newCampaignData.personalizationData.firstName}
                  onChange={(e) => setNewCampaignData(prev => ({
                    ...prev,
                    personalizationData: { ...prev.personalizationData, firstName: e.target.value }
                  }))}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newCampaignData.personalizationData.lastName}
                  onChange={(e) => setNewCampaignData(prev => ({
                    ...prev,
                    personalizationData: { ...prev.personalizationData, lastName: e.target.value }
                  }))}
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newCampaignData.personalizationData.company}
                  onChange={(e) => setNewCampaignData(prev => ({
                    ...prev,
                    personalizationData: { ...prev.personalizationData, company: e.target.value }
                  }))}
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={newCampaignData.personalizationData.role}
                  onChange={(e) => setNewCampaignData(prev => ({
                    ...prev,
                    personalizationData: { ...prev.personalizationData, role: e.target.value }
                  }))}
                  placeholder="QA Manager"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={newCampaignData.personalizationData.industry}
                  onValueChange={(value) => setNewCampaignData(prev => ({
                    ...prev,
                    personalizationData: { ...prev.personalizationData, industry: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SaaS">SaaS</SelectItem>
                    <SelectItem value="Tech">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sequenceType">Sequence Type</Label>
                <Select
                  value={newCampaignData.sequenceType}
                  onValueChange={(value: 'general' | 'event' | 'nurture') => setNewCampaignData(prev => ({
                    ...prev,
                    sequenceType: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Outreach</SelectItem>
                    <SelectItem value="event">Event-Driven</SelectItem>
                    <SelectItem value="nurture">Nurture Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pain Points */}
            <div>
              <Label>Pain Points</Label>
              <div className="space-y-2">
                {newCampaignData.personalizationData.painPoints.map((painPoint, index) => (
                  <Input
                    key={index}
                    value={painPoint}
                    onChange={(e) => updatePainPoint(index, e.target.value)}
                    placeholder="e.g., Manual testing bottlenecks"
                  />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addPainPoint}>
                  Add Pain Point
                </Button>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="recentAchievement">Recent Achievement (Optional)</Label>
                <Input
                  id="recentAchievement"
                  value={newCampaignData.personalizationData.recentAchievement}
                  onChange={(e) => setNewCampaignData(prev => ({
                    ...prev,
                    personalizationData: { ...prev.personalizationData, recentAchievement: e.target.value }
                  }))}
                  placeholder="Promoted to QA Manager"
                />
              </div>
              <div>
                <Label htmlFor="sharedConnection">Shared Connection (Optional)</Label>
                <Input
                  id="sharedConnection"
                  value={newCampaignData.personalizationData.sharedConnection}
                  onChange={(e) => setNewCampaignData(prev => ({
                    ...prev,
                    personalizationData: { ...prev.personalizationData, sharedConnection: e.target.value }
                  }))}
                  placeholder="Jane Doe from XYZ Corp"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewCampaignModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCampaign}
                disabled={createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Generation Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Eloquas Engine v2 - Message Generator</DialogTitle>
            <DialogDescription>
              Create personalized messages with TrustBuilder™ + StoryBuilder™ toggles and PDL enrichment
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="space-y-4">
              {/* Engine v2 Controls */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <h3 className="font-semibold mb-3 text-gray-800">Engine v2 Controls</h3>
                
                {/* PDL Enrichment */}
                <div className="space-y-3 mb-4">
                  <Label htmlFor="prospectEmail">Prospect Email (PDL Enrichment)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="prospectEmail"
                      value={prospectEmail}
                      onChange={(e) => setProspectEmail(e.target.value)}
                      placeholder="john.smith@company.com"
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleEnrichProspect}
                      disabled={!prospectEmail || enrichProspectMutation.isPending}
                    >
                      {enrichProspectMutation.isPending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                      ) : (
                        <Database className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {pdlEnrichmentData && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      ✓ Enriched: {pdlEnrichmentData.person?.full_name} at {pdlEnrichmentData.person?.organization?.name}
                    </div>
                  )}
                </div>

                {/* TrustBuilder/StoryBuilder Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="trustBuilder"
                      checked={trustBuilderEnabled}
                      onCheckedChange={setTrustBuilderEnabled}
                    />
                    <Label htmlFor="trustBuilder" className="flex items-center space-x-1">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span>TrustBuilder™</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="storyBuilder"
                      checked={storyBuilderEnabled}
                      onCheckedChange={setStoryBuilderEnabled}
                    />
                    <Label htmlFor="storyBuilder" className="flex items-center space-x-1">
                      <Heart className="w-4 h-4 text-purple-600" />
                      <span>StoryBuilder™</span>
                    </Label>
                  </div>
                </div>

                {/* Mode Indicator */}
                <div className="mt-3 p-2 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-700">
                    Active Mode: {trustBuilderEnabled && storyBuilderEnabled ? (
                      <span className="text-green-600">Trust + Story Combined</span>
                    ) : trustBuilderEnabled ? (
                      <span className="text-blue-600">TrustBuilder Only</span>
                    ) : storyBuilderEnabled ? (
                      <span className="text-purple-600">StoryBuilder Only</span>
                    ) : (
                      <span className="text-gray-500">Standard Mode</span>
                    )}
                  </p>
                </div>
              </Card>

              <div>
                <Label htmlFor="templateType">Template Type</Label>
                <Select
                  value={templateData.templateType}
                  onValueChange={(value) => setTemplateData(prev => ({ ...prev, templateType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_outreach_1">General Outreach #1</SelectItem>
                    <SelectItem value="general_outreach_2">General Outreach #2</SelectItem>
                    <SelectItem value="pre_event">Pre-Event Invitation</SelectItem>
                    <SelectItem value="did_not_register">Did Not Register Recap</SelectItem>
                    <SelectItem value="registered_no_attend">Registered No-Show</SelectItem>
                    <SelectItem value="post_event">Post-Event Thank You</SelectItem>
                    <SelectItem value="nurture">Nurture Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateFirstName">First Name</Label>
                  <Input
                    id="templateFirstName"
                    value={templateData.personalizationData.firstName}
                    onChange={(e) => setTemplateData(prev => ({
                      ...prev,
                      personalizationData: { ...prev.personalizationData, firstName: e.target.value }
                    }))}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="templateLastName">Last Name</Label>
                  <Input
                    id="templateLastName"
                    value={templateData.personalizationData.lastName}
                    onChange={(e) => setTemplateData(prev => ({
                      ...prev,
                      personalizationData: { ...prev.personalizationData, lastName: e.target.value }
                    }))}
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="templateCompany">Company</Label>
                  <Input
                    id="templateCompany"
                    value={templateData.personalizationData.company}
                    onChange={(e) => setTemplateData(prev => ({
                      ...prev,
                      personalizationData: { ...prev.personalizationData, company: e.target.value }
                    }))}
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <Label htmlFor="templateRole">Role</Label>
                  <Input
                    id="templateRole"
                    value={templateData.personalizationData.role}
                    onChange={(e) => setTemplateData(prev => ({
                      ...prev,
                      personalizationData: { ...prev.personalizationData, role: e.target.value }
                    }))}
                    placeholder="QA Manager"
                  />
                </div>
              </div>

              <Button 
                onClick={handleGenerateTemplate}
                disabled={generateTemplateMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {generateTemplateMutation.isPending ? 'Generating with Engine v2...' : 'Generate with Engine v2'}
              </Button>
            </div>

            {/* Generated Template */}
            <div className="space-y-4">
              {generateTemplateMutation.data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Engine v2 Generated Message</CardTitle>
                    <div className="flex space-x-2 flex-wrap">
                      <Badge variant="outline" className="bg-blue-50">
                        Trust Score: {generateTemplateMutation.data.trustStoryScore}
                      </Badge>
                      <Badge variant="outline">
                        {generateTemplateMutation.data.wordCount} words
                      </Badge>
                      {trustBuilderEnabled && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Zap className="w-3 h-3 mr-1" />
                          TrustBuilder
                        </Badge>
                      )}
                      {storyBuilderEnabled && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Heart className="w-3 h-3 mr-1" />
                          StoryBuilder
                        </Badge>
                      )}
                      {pdlEnrichmentData && (
                        <Badge className="bg-green-100 text-green-800">
                          <Database className="w-3 h-3 mr-1" />
                          PDL Enhanced
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Subject:</Label>
                      <p className="text-sm font-semibold">{generateTemplateMutation.data.subject}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Body:</Label>
                      <div className="text-sm whitespace-pre-wrap p-3 bg-gray-50 rounded-lg">
                        {generateTemplateMutation.data.body}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Trust & Story Analysis:</Label>
                      <p className="text-sm text-gray-600">{generateTemplateMutation.data.trustStoryNote}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Suggested Timing:</Label>
                      <p className="text-sm text-gray-600">{generateTemplateMutation.data.suggestedTiming}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {generateTemplateMutation.isPending && (
                <div className="text-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-gradient-to-r from-blue-500 to-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    Generating with Engine v2...
                    <br />
                    <span className="text-sm">
                      {trustBuilderEnabled && storyBuilderEnabled ? 'Trust + Story Combined Mode' : 
                       trustBuilderEnabled ? 'TrustBuilder Mode' :
                       storyBuilderEnabled ? 'StoryBuilder Mode' : 'Standard Mode'}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}