import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, Brain, Users, TrendingUp, ExternalLink, MessageSquare, Target, Calendar, CheckCircle2, AlertCircle, Cloud, FolderOpen } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CallParticipant {
  name: string;
  role: 'Sales' | 'Prospect';
  sentiment: 'positive' | 'neutral' | 'negative';
  energy_level: 'low' | 'medium' | 'high';
  influence: number;
}

interface ActionItem {
  task: string;
  category: 'Follow-up' | 'CRM Entry' | 'Documentation' | 'Demo Scheduling';
  urgency: 'High' | 'Medium' | 'Low';
}

interface SalesGrading {
  rapport_trust: number;
  discovery_depth: number;
  tone_match_succinctness: number;
  storytelling: number;
  overall_score: number;
}

interface SentimentAnalysis {
  overall_sentiment: 'Positive' | 'Neutral' | 'Negative';
  urgency_detected: 'High' | 'Medium' | 'Low';
}

interface TalkTimeEstimation {
  rep_percentage: number;
  prospect_percentage: number;
}

interface CoachingNote {
  quote: string;
  reasoning: string;
}

interface CallAssessment {
  call_id: string;
  date: string;
  participants: CallParticipant[];
  summary: string;
  action_items: ActionItem[];
  grading: SalesGrading;
  coaching_notes: CoachingNote[];
  sentiment_analysis: SentimentAnalysis;
  talk_time_estimation: TalkTimeEstimation;
  transcript?: string;
  processed_at: string;
  processing_time_ms: number;
}

interface AssessmentStats {
  totalCalls: number;
  avgGrading: SalesGrading | null;
  topCoachingAreas: Array<{ skill: string; score: number }>;
  avgProcessingTime: number;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
  webViewLink: string;
}

export default function CallAssessment() {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedDriveFile, setSelectedDriveFile] = useState<DriveFile | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text'>('file');
  const [transcriptText, setTranscriptText] = useState('');
  const [callTitle, setCallTitle] = useState('');
  const [callDate, setCallDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<CallAssessment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch Google Drive transcripts
  const { data: driveTranscripts = [], isLoading: driveLoading } = useQuery<DriveFile[]>({
    queryKey: ['/api/google-drive/transcripts'],
  });

  // Fetch file content from Google Drive
  const fetchDriveContent = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await apiRequest('GET', `/api/google-drive/file/${fileId}`);
      const data = await response.json();
      return data.content;
    },
    onSuccess: (content) => {
      setTranscriptText(content);
      setActiveTab('process');
    },
  });

  // Fetch demo assessment for preview
  const { data: demoAssessment, isLoading: demoLoading } = useQuery({
    queryKey: ['/api/call-assessment/demo'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/call-assessment/demo');
      return response.json();
    }
  });

  // Fetch call history and stats
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/call-assessment/history'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/call-assessment/history');
      return response.json();
    }
  });

  // Process transcript mutation
  const processTranscriptMutation = useMutation({
    mutationFn: async (data: { transcript?: string; file?: File; title?: string; date?: string }) => {
      const formData = new FormData();
      
      if (data.file) {
        formData.append('transcript', data.file);
      } else if (data.transcript) {
        formData.append('transcript', data.transcript);
      }
      
      if (data.title) formData.append('title', data.title);
      if (data.date) formData.append('date', data.date);

      const response = await fetch('/api/call-assessment/process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process transcript');
      }

      return response.json();
    },
    onSuccess: (result) => {
      setCurrentAssessment(result); // Store the assessment result
      queryClient.invalidateQueries({ queryKey: ['/api/call-assessment/history'] });
      setSelectedFile(null);
      setTranscriptText('');
      setCallTitle('');
      setCallDate('');
      setActiveTab('results'); // Switch to results tab to show assessment
      
      toast({
        title: "Assessment Complete",
        description: `Processed call in ${result.processing_time_ms || 0}ms with ${result.action_items?.length || 0} action items`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process transcript. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCallTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleProcessTranscript = () => {
    if (uploadMethod === 'file' && selectedFile) {
      // Validate file type and size
      const allowedTypes = ['.md', '.rtf', '.txt', '.doc', '.docx'];
      const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a .md, .rtf, .txt, .doc, or .docx file",
          variant: "destructive",
        });
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      processTranscriptMutation.mutate({
        file: selectedFile,
        title: callTitle || selectedFile.name.replace(/\.[^/.]+$/, ''),
        date: callDate || new Date().toISOString().split('T')[0]
      });
    } else if (uploadMethod === 'text' && transcriptText.trim()) {
      if (transcriptText.trim().length < 50) {
        toast({
          title: "Transcript too short",
          description: "Please provide at least 50 characters of transcript text",
          variant: "destructive",
        });
        return;
      }

      processTranscriptMutation.mutate({
        transcript: transcriptText,
        title: callTitle || `Call Assessment ${new Date().toLocaleDateString()}`,
        date: callDate || new Date().toISOString().split('T')[0]
      });
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getGradingColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return '😊';
      case 'Negative': return '😟';
      default: return '😐';
    }
  };



  const renderParticipantsCard = (assessment: CallAssessment) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Call Participants
        </CardTitle>
        <CardDescription>Speaker analysis and influence scoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assessment.participants.map((participant, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold">{participant.name}</h4>
                <Badge variant="outline" className="mt-1">
                  {participant.role}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Influence Score</div>
                <div className="text-lg font-bold text-blue-600">
                  {participant.influence}/10
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={getSentimentColor(participant.sentiment)}>
                {participant.sentiment}
              </Badge>
              <Badge className={getEnergyColor(participant.energy_level)}>
                {participant.energy_level} energy
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderActionItemsCard = (assessment: CallAssessment) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Action Items ({assessment.action_items.length})
        </CardTitle>
        <CardDescription>Categorized next steps with urgency levels</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {assessment.action_items.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">{item.task}</h4>
              <Badge className={getUrgencyColor(item.urgency)}>{item.urgency}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{item.category}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderCoachingCard = (assessment: CallAssessment) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Coaching Insights
        </CardTitle>
        <CardDescription>Coachable moments and improvement opportunities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assessment.coaching_notes.map((note, index) => (
          <div key={index} className="p-4 border rounded-lg bg-yellow-50">
            <div className="mb-2">
              <MessageSquare className="w-4 h-4 text-gray-500 mb-1" />
              <blockquote className="text-sm italic text-gray-700 border-l-2 border-yellow-300 pl-3">
                "{note.quote}"
              </blockquote>
            </div>
            <p className="text-sm text-gray-800 font-medium">
              <span className="text-yellow-700">💡 Coaching Note:</span> {note.reasoning}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const renderSentimentAnalysisCard = (assessment: CallAssessment) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Sentiment & Urgency Analysis
        </CardTitle>
        <CardDescription>Overall call sentiment and urgency detection</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">{getSentimentIcon(assessment.sentiment_analysis.overall_sentiment)}</div>
            <div className="font-medium">{assessment.sentiment_analysis.overall_sentiment} Sentiment</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(assessment.sentiment_analysis.urgency_detected)}`}>
              {assessment.sentiment_analysis.urgency_detected} Urgency
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTalkTimeCard = (assessment: CallAssessment) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Talk-Time Estimation (Beta)
        </CardTitle>
        <CardDescription>Estimated speaking time distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sales Rep</span>
              <span className="font-medium">{assessment.talk_time_estimation.rep_percentage}%</span>
            </div>
            <Progress value={assessment.talk_time_estimation.rep_percentage} className="h-3" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Prospect</span>
              <span className="font-medium">{assessment.talk_time_estimation.prospect_percentage}%</span>
            </div>
            <Progress value={assessment.talk_time_estimation.prospect_percentage} className="h-3" />
          </div>
          <div className="text-xs text-gray-500 italic">
            * Beta feature: Text-based inference may not be fully accurate
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCallGradingCard = (assessment: CallAssessment) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Call Performance Analysis
        </CardTitle>
        <CardDescription>Sales skills assessment (1-10 scale)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{assessment.grading.overall_score}/10</div>
            <div className="text-sm text-blue-700">Overall Score</div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rapport & Trust Building</span>
                <span className={`text-lg font-bold ${getGradingColor(assessment.grading.rapport_trust)}`}>
                  {assessment.grading.rapport_trust}/10
                </span>
              </div>
              <Progress value={(assessment.grading.rapport_trust / 10) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Discovery Question Depth</span>
                <span className={`text-lg font-bold ${getGradingColor(assessment.grading.discovery_depth)}`}>
                  {assessment.grading.discovery_depth}/10
                </span>
              </div>
              <Progress value={(assessment.grading.discovery_depth / 10) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tone Match & Succinctness</span>
                <span className={`text-lg font-bold ${getGradingColor(assessment.grading.tone_match_succinctness)}`}>
                  {assessment.grading.tone_match_succinctness}/10
                </span>
              </div>
              <Progress value={(assessment.grading.tone_match_succinctness / 10) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storytelling Effectiveness</span>
                <span className={`text-lg font-bold ${getGradingColor(assessment.grading.storytelling)}`}>
                  {assessment.grading.storytelling}/10
                </span>
              </div>
              <Progress value={(assessment.grading.storytelling / 10) * 100} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (demoLoading || historyLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading call assessment system...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Sales Call Assessment Agent</h1>
          <p className="text-gray-600 mt-2">AI-powered analysis of sales call transcripts with actionable insights</p>
        </div>
        <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Process Call
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {historyData?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Calls</p>
                  <p className="text-2xl font-bold">{historyData.stats.totalCalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Avg Performance</p>
                  <p className="text-2xl font-bold">
                    {historyData.stats.avgGrading ? 
                      historyData.stats.avgGrading.overall_score.toFixed(1)
                      : 'N/A'
                    }/10
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Processing Time</p>
                  <p className="text-2xl font-bold">{Math.round(historyData.stats.avgProcessingTime / 1000)}s</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Top Focus Area</p>
                  <p className="text-lg font-bold">
                    {historyData.stats.topCoachingAreas[0]?.skill?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="drive">Google Drive</TabsTrigger>
          <TabsTrigger value="results">Assessment Results</TabsTrigger>
          <TabsTrigger value="history">Call History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Process Sales Call Transcript</CardTitle>
              <CardDescription>
                Upload a transcript file (.md, .rtf) or paste transcript text for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Upload Method</Label>
                  <div className="flex space-x-4 mt-2">
                    <Button
                      variant={uploadMethod === 'file' ? 'default' : 'outline'}
                      onClick={() => setUploadMethod('file')}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                    <Button
                      variant={uploadMethod === 'text' ? 'default' : 'outline'}
                      onClick={() => setUploadMethod('text')}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Paste Text
                    </Button>
                  </div>
                </div>

                {uploadMethod === 'file' ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="transcript-file">Transcript File</Label>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Local File Upload */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                          <input
                            id="transcript-file"
                            type="file"
                            accept=".md,.rtf,.txt,.doc,.docx"
                            onChange={handleFileUpload}
                            ref={fileInputRef}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-gray-500 mt-1">Upload from computer (.md, .rtf, .txt, .docx)</p>
                        </div>
                        
                        {/* Google Drive Integration */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-500 transition-colors">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full text-sm"
                            onClick={() => {
                              // TODO: Implement Google Drive picker
                              alert('Google Drive integration coming soon');
                            }}
                          >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                              <path fill="#4285f4" d="M6 2L1 12l5 10h12l5-10L18 2H6z"/>
                              <path fill="#ea4335" d="M1 12l5-10v20z"/>
                              <path fill="#34a853" d="M23 12l-5 10V2z"/>
                            </svg>
                            Import from Google Drive
                          </Button>
                          <p className="text-xs text-gray-500 mt-1">Access Google Docs, Drive files</p>
                        </div>
                      </div>
                      
                      {selectedFile && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700 font-medium">
                            ✓ Selected: {selectedFile.name}
                          </p>
                          <p className="text-xs text-green-600">
                            Size: {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="transcript-text">Transcript Text</Label>
                    <Textarea
                      id="transcript-text"
                      placeholder="Paste your call transcript here..."
                      value={transcriptText}
                      onChange={(e) => setTranscriptText(e.target.value)}
                      rows={10}
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="call-title">Call Title</Label>
                    <Input
                      id="call-title"
                      value={callTitle}
                      onChange={(e) => setCallTitle(e.target.value)}
                      placeholder="Discovery Call - Acme Corp"
                    />
                  </div>
                  <div>
                    <Label htmlFor="call-date">Call Date</Label>
                    <Input
                      id="call-date"
                      type="date"
                      value={callDate}
                      onChange={(e) => setCallDate(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleProcessTranscript}
                  disabled={
                    processTranscriptMutation.isPending ||
                    (uploadMethod === 'file' && !selectedFile) ||
                    (uploadMethod === 'text' && !transcriptText.trim())
                  }
                  className="w-full"
                >
                  {processTranscriptMutation.isPending ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-spin" />
                      Processing Transcript...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Process & Analyze
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                Google Drive Transcripts
              </CardTitle>
              <CardDescription>
                Select a transcript from your Google Drive to analyze
              </CardDescription>
            </CardHeader>
            <CardContent>
              {driveLoading ? (
                <div className="text-center py-8">
                  <Cloud className="w-8 h-8 animate-pulse mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Loading transcripts from Google Drive...</p>
                </div>
              ) : driveTranscripts.length > 0 ? (
                <div className="space-y-3">
                  {driveTranscripts.map((file) => (
                    <div
                      key={file.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedDriveFile?.id === file.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedDriveFile(file)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <FolderOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900">{file.name}</h4>
                            <p className="text-sm text-gray-600">
                              Modified: {new Date(file.modifiedTime).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {file.mimeType} • {parseInt(file.size) > 0 ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : 'Unknown size'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(file.webViewLink, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedDriveFile && (
                    <div className="mt-6 pt-4 border-t">
                      <Button
                        onClick={() => fetchDriveContent.mutate(selectedDriveFile.id)}
                        disabled={fetchDriveContent.isPending}
                        className="w-full"
                      >
                        {fetchDriveContent.isPending ? (
                          <>
                            <Cloud className="w-4 h-4 mr-2 animate-spin" />
                            Loading transcript...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Load & Process Transcript
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transcripts found</h3>
                  <p className="text-gray-600 mb-4">
                    No transcript files found in your Google Drive. Make sure you have files containing 
                    "transcript", "call", or "meeting" in the filename.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('upload')}>
                    Upload manually instead
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {(currentAssessment || demoAssessment) ? (
            <>
              {/* Display current assessment if available, otherwise demo */}
              {(() => {
                const assessment = currentAssessment || demoAssessment;
                return (
                  <>
                    {/* Call Summary */}
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{assessment.call_id}</CardTitle>
                            <CardDescription>
                              {assessment.date} • {assessment.processing_time_ms ? `Processed in ${assessment.processing_time_ms}ms` : 'Recently processed'}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {currentAssessment && (
                              <Badge className="bg-blue-100 text-blue-800">Latest Result</Badge>
                            )}
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{assessment.summary}</p>
                      </CardContent>
                    </Card>

                    {/* Results Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {renderParticipantsCard(assessment)}
                      {renderCallGradingCard(assessment)}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {renderSentimentAnalysisCard(assessment)}
                      {renderTalkTimeCard(assessment)}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {renderActionItemsCard(assessment)}
                      {renderCoachingCard(assessment)}
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessment Results</h3>
                <p className="text-gray-600 mb-4">Process a call transcript to see detailed AI analysis</p>
                <Button onClick={() => setActiveTab('upload')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Process Your First Call
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {historyData?.assessments?.length > 0 ? (
            <div className="space-y-4">
              {historyData.assessments.map((assessment: CallAssessment) => (
                <Card key={assessment.call_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{assessment.call_id}</CardTitle>
                        <CardDescription>
                          {assessment.date} • {assessment.participants.length} participants
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Avg Score</div>
                        <div className="text-xl font-bold text-blue-600">
                          {(Object.values(assessment.grading).reduce((a, b) => a + b, 0) / 6).toFixed(1)}/5
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{assessment.summary}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Badge variant="outline">
                          {assessment.action_items.length} actions
                        </Badge>
                        <Badge variant="outline">
                          {assessment.coaching_notes.length} insights
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Call History</h3>
                <p className="text-gray-600 mb-4">Your processed calls will appear here</p>
                <Button onClick={() => setActiveTab('upload')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Process Your First Call
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Process Modal */}
      <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Sales Call Transcript</DialogTitle>
            <DialogDescription>
              Upload or paste a sales call transcript for AI-powered analysis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              The AI will extract action items, analyze participant behavior, grade sales performance, 
              and provide coaching insights from your call transcript.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowProcessModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowProcessModal(false);
                setActiveTab('upload');
              }}>
                <Upload className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}