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
import { Upload, FileText, Brain, Users, TrendingUp, ExternalLink, MessageSquare, Target, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CallParticipant {
  name: string;
  role: 'Sales' | 'Prospect';
  sentiment: 'positive' | 'neutral' | 'negative';
  energy_level: 'low' | 'medium' | 'high';
  influence: number;
}

interface ActionItem {
  task: string;
  category: string;
  platform: string;
  link: string;
}

interface SalesGrading {
  rapport: number;
  tone_match: number;
  clarity: number;
  discovery: number;
  storytelling: number;
  closing: number;
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

export default function CallAssessment() {
  const [activeTab, setActiveTab] = useState('upload');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'text'>('file');
  const [transcriptText, setTranscriptText] = useState('');
  const [callTitle, setCallTitle] = useState('');
  const [callDate, setCallDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // Fetch demo assessment for preview
  const { data: demoAssessment, isLoading: demoLoading } = useQuery({
    queryKey: ['/api/call-assessment/demo'],
    queryFn: () => apiRequest('/api/call-assessment/demo')
  });

  // Fetch call history and stats
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/call-assessment/history'],
    queryFn: () => apiRequest('/api/call-assessment/history')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/call-assessment/history'] });
      setShowProcessModal(false);
      setSelectedFile(null);
      setTranscriptText('');
      setCallTitle('');
      setActiveTab('results');
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
      processTranscriptMutation.mutate({
        file: selectedFile,
        title: callTitle,
        date: callDate
      });
    } else if (uploadMethod === 'text' && transcriptText.trim()) {
      processTranscriptMutation.mutate({
        transcript: transcriptText,
        title: callTitle || 'Sales Call',
        date: callDate
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
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderGradingCard = (assessment: CallAssessment) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Sales Behavior Grading
        </CardTitle>
        <CardDescription>Performance evaluation across key sales skills (1-5 scale)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(assessment.grading).map(([skill, score]) => (
          <div key={skill} className="flex items-center justify-between">
            <span className="capitalize font-medium">
              {skill.replace('_', ' ')}
            </span>
            <div className="flex items-center gap-3">
              <Progress value={score * 20} className="w-24" />
              <span className={`font-bold ${getGradingColor(score)}`}>
                {score}/5
              </span>
            </div>
          </div>
        ))}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between font-semibold">
            <span>Overall Average</span>
            <span className={getGradingColor(
              Object.values(assessment.grading).reduce((sum, score) => sum + score, 0) / 6
            )}>
              {(Object.values(assessment.grading).reduce((sum, score) => sum + score, 0) / 6).toFixed(1)}/5
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
        <CardDescription>Next steps organized by platform and category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {assessment.action_items.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900">{item.task}</h4>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{item.category}</Badge>
              <Badge className="bg-blue-100 text-blue-800">{item.platform}</Badge>
            </div>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Open in {item.platform} →
            </a>
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
                      (Object.values(historyData.stats.avgGrading).reduce((a: number, b: number) => a + b, 0) / 6).toFixed(1) 
                      : 'N/A'
                    }/5
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
                      <input
                        id="transcript-file"
                        type="file"
                        accept=".md,.rtf,.txt"
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {selectedFile && (
                        <p className="mt-2 text-sm text-green-600">
                          Selected: {selectedFile.name}
                        </p>
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

        <TabsContent value="results" className="space-y-6">
          {demoAssessment ? (
            <>
              {/* Call Summary */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{demoAssessment.call_id}</CardTitle>
                      <CardDescription>
                        {demoAssessment.date} • Processed in {demoAssessment.processing_time_ms}ms
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{demoAssessment.summary}</p>
                </CardContent>
              </Card>

              {/* Results Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderParticipantsCard(demoAssessment)}
                {renderGradingCard(demoAssessment)}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderActionItemsCard(demoAssessment)}
                {renderCoachingCard(demoAssessment)}
              </div>
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