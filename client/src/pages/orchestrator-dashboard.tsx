import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Zap, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target, 
  BarChart3,
  Settings,
  Upload,
  Play,
  Pause,
  RefreshCw,
  Bell,
  Shield,
  Lightbulb,
  Activity,
  Database,
  Network,
  Workflow
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface WorkflowStatus {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  progress: number;
  accountsProcessed: number;
  totalAccounts: number;
  startedAt: Date;
  estimatedCompletion?: Date;
  results?: {
    readyToSend: number;
    needsNurturing: number;
    highPriority: number;
  };
}

interface MonitoringAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  accountsAffected: string[];
  suggestedActions: string[];
  createdAt: Date;
  acknowledged: boolean;
}

interface IntentSignal {
  accountId: string;
  accountName: string;
  intentScore: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  signals: string[];
  lastUpdated: Date;
}

interface OrganizationMetrics {
  totalAccounts: number;
  highIntentAccounts: number;
  activeWorkflows: number;
  teamSize: number;
  totalRevenue: number;
  avgResponseRate: number;
  alertsCount: number;
}

export default function OrchestratorDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Mock data - would come from API
  const organizationMetrics: OrganizationMetrics = {
    totalAccounts: 247,
    highIntentAccounts: 32,
    activeWorkflows: 3,
    teamSize: 8,
    totalRevenue: 1247000,
    avgResponseRate: 23.5,
    alertsCount: 5
  };

  const activeWorkflows: WorkflowStatus[] = [
    {
      id: "wf-1",
      name: "Enterprise Accounts Q1",
      status: "active",
      progress: 67,
      accountsProcessed: 67,
      totalAccounts: 100,
      startedAt: new Date(Date.now() - 3600000),
      estimatedCompletion: new Date(Date.now() + 1800000),
      results: {
        readyToSend: 23,
        needsNurturing: 31,
        highPriority: 13
      }
    },
    {
      id: "wf-2",
      name: "Technology Prospects",
      status: "active",
      progress: 34,
      accountsProcessed: 34,
      totalAccounts: 100,
      startedAt: new Date(Date.now() - 1800000),
      estimatedCompletion: new Date(Date.now() + 3600000)
    }
  ];

  const monitoringAlerts: MonitoringAlert[] = [
    {
      id: "alert-1",
      severity: "critical",
      title: "Intent Surge Detected",
      description: "5 accounts showing 80%+ intent increase in last 24 hours",
      accountsAffected: ["TechCorp", "DataFlow", "InnovateCorp", "CloudSys", "DevTools"],
      suggestedActions: ["Generate priority outreach", "Notify senior AE", "Create demo slots"],
      createdAt: new Date(Date.now() - 900000),
      acknowledged: false
    },
    {
      id: "alert-2",
      severity: "high",
      title: "Competitor Activity",
      description: "QualityPro mentioned by 3 prospects in last 48 hours",
      accountsAffected: ["TechCorp", "DataFlow", "InnovateCorp"],
      suggestedActions: ["Create competitive response", "Share battle cards", "Schedule team briefing"],
      createdAt: new Date(Date.now() - 1800000),
      acknowledged: false
    }
  ];

  const intentSignals: IntentSignal[] = [
    {
      accountId: "1",
      accountName: "TechCorp",
      intentScore: 94,
      trend: "increasing",
      signals: ["QA job posting", "Pricing page visits", "Demo request"],
      lastUpdated: new Date(Date.now() - 300000)
    },
    {
      accountId: "2",
      accountName: "DataFlow",
      intentScore: 87,
      trend: "increasing",
      signals: ["Technology research", "Competitor analysis", "Budget approval"],
      lastUpdated: new Date(Date.now() - 600000)
    },
    {
      accountId: "3",
      accountName: "InnovateCorp",
      intentScore: 83,
      trend: "stable",
      signals: ["Team expansion", "System evaluation", "Vendor meetings"],
      lastUpdated: new Date(Date.now() - 900000)
    }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} is ready for processing`,
      });
    }
  };

  const processAccountList = async () => {
    if (!uploadedFile) return;

    toast({
      title: "Processing started",
      description: "Account list processing initiated. You'll receive updates as it progresses.",
    });

    // Simulate processing
    setTimeout(() => {
      toast({
        title: "Processing complete",
        description: "32 accounts ready to send, 18 need nurturing, 12 high priority",
      });
    }, 3000);
  };

  const acknowledgeAlert = (alertId: string) => {
    toast({
      title: "Alert acknowledged",
      description: "Alert marked as acknowledged",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4 text-green-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decreasing': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      case 'stable': return <Activity className="w-4 h-4 text-gray-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Orchestrator</h1>
          <p className="text-gray-600">Intelligent workflow automation and proactive monitoring</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            System Active
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Accounts</p>
                <p className="text-2xl font-bold">{organizationMetrics.totalAccounts}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Intent</p>
                <p className="text-2xl font-bold text-green-600">{organizationMetrics.highIntentAccounts}</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold text-purple-600">{organizationMetrics.activeWorkflows}</p>
              </div>
              <Workflow className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Size</p>
                <p className="text-2xl font-bold">{organizationMetrics.teamSize}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-blue-600">{organizationMetrics.avgResponseRate}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{organizationMetrics.alertsCount}</p>
              </div>
              <Bell className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Active Workflows</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeWorkflows.map((workflow) => (
                  <div key={workflow.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(workflow.status)}
                        <span className="font-medium">{workflow.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {workflow.accountsProcessed}/{workflow.totalAccounts}
                      </span>
                    </div>
                    <Progress value={workflow.progress} className="mb-2" />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Started {formatTimeAgo(workflow.startedAt)}</span>
                      {workflow.estimatedCompletion && (
                        <span>ETA: {formatTimeAgo(workflow.estimatedCompletion)}</span>
                      )}
                    </div>
                    {workflow.results && (
                      <div className="mt-2 flex space-x-4 text-sm">
                        <span className="text-green-600">Ready: {workflow.results.readyToSend}</span>
                        <span className="text-yellow-600">Nurture: {workflow.results.needsNurturing}</span>
                        <span className="text-red-600">Priority: {workflow.results.highPriority}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Active Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {monitoringAlerts.filter(a => !a.acknowledged).map((alert) => (
                  <div key={alert.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{alert.accountsAffected.length} accounts affected</span>
                          <span>•</span>
                          <span>{formatTimeAgo(alert.createdAt)}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Management</CardTitle>
              <CardDescription>Monitor and control automated workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeWorkflows.map((workflow) => (
                  <div key={workflow.id} className="p-6 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(workflow.status)}
                        <div>
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <p className="text-sm text-gray-600">
                            Processing {workflow.totalAccounts} accounts
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{workflow.progress}%</span>
                      </div>
                      <Progress value={workflow.progress} />
                    </div>

                    {workflow.results && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{workflow.results.readyToSend}</div>
                          <div className="text-sm text-green-700">Ready to Send</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{workflow.results.needsNurturing}</div>
                          <div className="text-sm text-yellow-700">Need Nurturing</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{workflow.results.highPriority}</div>
                          <div className="text-sm text-red-700">High Priority</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Monitoring Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monitoringAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <span className="text-sm text-gray-500">{formatTimeAgo(alert.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                        <span>Accounts: {alert.accountsAffected.join(', ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {alert.suggestedActions.map((action, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {action}
                            </Badge>
                          ))}
                        </div>
                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Intent Signals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {intentSignals.map((signal) => (
                    <div key={signal.accountId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{signal.accountName}</span>
                          {getTrendIcon(signal.trend)}
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">{signal.intentScore}</div>
                          <div className="text-xs text-gray-500">Intent Score</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {signal.signals.map((sig, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {sig}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500">
                        Last updated: {formatTimeAgo(signal.lastUpdated)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5" />
                <span>AI Intelligence</span>
              </CardTitle>
              <CardDescription>
                Insights and recommendations from your organization's collective intelligence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Key Insights</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-900">Trust-based approaches performing 65% better</div>
                      <div className="text-sm text-blue-700">Current prospects respond better to credibility signals</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-900">Tuesday 2-4 PM optimal outreach window</div>
                      <div className="text-sm text-green-700">40% higher response rates during this time</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="font-medium text-orange-900">QA automation market trending up 15%</div>
                      <div className="text-sm text-orange-700">Perfect timing for increased outreach</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Recommended Actions</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">Focus on high-intent accounts</div>
                      <div className="text-sm text-gray-600">32 accounts showing 80%+ intent increase</div>
                      <Button size="sm" className="mt-2">
                        <Target className="w-4 h-4 mr-2" />
                        Prioritize
                      </Button>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">Update competitive positioning</div>
                      <div className="text-sm text-gray-600">QualityPro mentioned by 3 prospects</div>
                      <Button size="sm" className="mt-2">
                        <Shield className="w-4 h-4 mr-2" />
                        Create Response
                      </Button>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">Scale successful approaches</div>
                      <div className="text-sm text-gray-600">Consultative tone showing 30% better results</div>
                      <Button size="sm" className="mt-2">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Apply to Team
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload & Process Accounts</span>
              </CardTitle>
              <CardDescription>
                Upload your account list for one-click processing and prioritization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="account-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Drop your account list here or click to browse
                      </span>
                      <input
                        id="account-upload"
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                      />
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      Supports CSV, Excel files up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {uploadedFile && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">{uploadedFile.name}</span>
                    </div>
                    <Button onClick={processAccountList} className="bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      Process Now
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• AI research and intent analysis for each account</li>
                  <li>• Automatic prioritization based on 50+ signals</li>
                  <li>• Ready-to-send vs nurture categorization</li>
                  <li>• Personalized sequence recommendations</li>
                  <li>• ABM alerts for marketing team coordination</li>
                  <li>• Continuous monitoring and alerts</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}