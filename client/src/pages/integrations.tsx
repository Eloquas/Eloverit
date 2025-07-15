import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Zap,
  Database,
  Mail,
  MessageSquare,
  BarChart3,
  Users,
  Globe,
  Shield,
  Clock,
  ArrowRight,
  Plug
} from "lucide-react";
import { motion } from "framer-motion";

interface Integration {
  id: string;
  name: string;
  type: 'crm' | 'email' | 'linkedin' | 'marketing' | 'analytics' | 'communication' | 'data';
  status: 'active' | 'inactive' | 'configured' | 'error';
  priority: 'high' | 'medium' | 'low';
  impact: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  lastSync?: Date;
  recordsProcessed?: number;
}

export default function Integrations() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const integrations: Integration[] = [
    // CRM Integrations
    {
      id: 'salesforce',
      name: 'Salesforce',
      type: 'crm',
      status: 'inactive',
      priority: 'high',
      impact: 'Direct CRM sync - critical for sales teams',
      description: 'Bidirectional sync with Salesforce leads, opportunities, and activities',
      features: ['Lead/Opportunity Sync', 'Activity Tracking', 'Custom Field Mapping', 'Workflow Automation'],
      icon: <Database className="w-6 h-6" />
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      type: 'crm',
      status: 'inactive',
      priority: 'high',
      impact: 'All-in-one sales/marketing platform',
      description: 'Complete integration with HubSpot CRM, Marketing, and Sales Hub',
      features: ['Contact/Company Sync', 'Deal Pipeline', 'Email Tracking', 'Marketing Automation'],
      icon: <Database className="w-6 h-6" />
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      type: 'crm',
      status: 'inactive',
      priority: 'medium',
      impact: 'Pipeline management',
      description: 'Sync deals and contacts with Pipedrive CRM',
      features: ['Deal Sync', 'Contact Management', 'Activity Tracking', 'Pipeline Reports'],
      icon: <Database className="w-6 h-6" />
    },

    // Email Platform Integrations
    {
      id: 'outreach',
      name: 'Outreach',
      type: 'email',
      status: 'inactive',
      priority: 'high',
      impact: 'Email sequence automation',
      description: 'Automated email sequences and performance tracking',
      features: ['Sequence Automation', 'Email Tracking', 'Performance Analytics', 'A/B Testing'],
      icon: <Mail className="w-6 h-6" />
    },
    {
      id: 'salesloft',
      name: 'SalesLoft',
      type: 'email',
      status: 'inactive',
      priority: 'high',
      impact: 'Cadence management',
      description: 'Complete sales engagement platform integration',
      features: ['Cadence Automation', 'Call Tracking', 'Performance Metrics', 'Team Collaboration'],
      icon: <Mail className="w-6 h-6" />
    },
    {
      id: 'apollo',
      name: 'Apollo',
      type: 'email',
      status: 'inactive',
      priority: 'high',
      impact: 'Prospecting database',
      description: 'Contact database and email sequence automation',
      features: ['Contact Database', 'Email Sequences', 'Lead Scoring', 'Prospecting Automation'],
      icon: <Mail className="w-6 h-6" />
    },

    // LinkedIn Automation
    {
      id: 'sales_navigator',
      name: 'LinkedIn Sales Navigator',
      type: 'linkedin',
      status: 'inactive',
      priority: 'medium',
      impact: 'LinkedIn prospecting',
      description: 'Advanced LinkedIn prospecting and relationship building',
      features: ['Lead Recommendations', 'InMail Automation', 'Account Insights', 'Team Collaboration'],
      icon: <MessageSquare className="w-6 h-6" />
    },

    // Marketing Automation
    {
      id: 'marketo',
      name: 'Marketo',
      type: 'marketing',
      status: 'inactive',
      priority: 'medium',
      impact: 'Marketing automation',
      description: 'Lead scoring and campaign automation',
      features: ['Lead Scoring', 'Campaign Automation', 'ABM Coordination', 'ROI Tracking'],
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: 'pardot',
      name: 'Pardot',
      type: 'marketing',
      status: 'inactive',
      priority: 'medium',
      impact: 'B2B marketing',
      description: 'Salesforce B2B marketing automation',
      features: ['Lead Nurturing', 'Email Marketing', 'Landing Pages', 'ROI Reporting'],
      icon: <Zap className="w-6 h-6" />
    },

    // Data Sources
    {
      id: 'zoominfo',
      name: 'ZoomInfo',
      type: 'data',
      status: 'inactive',
      priority: 'high',
      impact: 'Contact enrichment',
      description: 'Contact and company intelligence platform',
      features: ['Contact Enrichment', 'Company Intelligence', 'Intent Data', 'Technology Tracking'],
      icon: <Database className="w-6 h-6" />
    },
    {
      id: 'clearbit',
      name: 'Clearbit',
      type: 'data',
      status: 'inactive',
      priority: 'medium',
      impact: 'Company intelligence',
      description: 'Company and person data enrichment',
      features: ['Company Enrichment', 'Person Lookup', 'Technology Stack', 'Funding Data'],
      icon: <Database className="w-6 h-6" />
    },

    // Communication Platforms
    {
      id: 'slack',
      name: 'Slack',
      type: 'communication',
      status: 'inactive',
      priority: 'low',
      impact: 'Team notifications',
      description: 'Real-time team notifications and collaboration',
      features: ['Alert Notifications', 'Team Coordination', 'Workflow Updates', 'Performance Sharing'],
      icon: <MessageSquare className="w-6 h-6" />
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      type: 'communication',
      status: 'inactive',
      priority: 'low',
      impact: 'Team collaboration',
      description: 'Microsoft Teams integration for notifications',
      features: ['Team Notifications', 'File Sharing', 'Meeting Integration', 'Workflow Updates'],
      icon: <MessageSquare className="w-6 h-6" />
    },

    // Analytics Platforms
    {
      id: 'google_analytics',
      name: 'Google Analytics',
      type: 'analytics',
      status: 'inactive',
      priority: 'low',
      impact: 'Website tracking',
      description: 'Website behavior and conversion tracking',
      features: ['Website Behavior', 'Conversion Attribution', 'Audience Insights', 'Campaign Performance'],
      icon: <BarChart3 className="w-6 h-6" />
    },
    {
      id: 'mixpanel',
      name: 'Mixpanel',
      type: 'analytics',
      status: 'inactive',
      priority: 'low',
      impact: 'Product analytics',
      description: 'Product usage and engagement analytics',
      features: ['Event Tracking', 'User Behavior', 'Funnel Analysis', 'Cohort Analysis'],
      icon: <BarChart3 className="w-6 h-6" />
    }
  ];

  const filteredIntegrations = selectedCategory === "all" 
    ? integrations 
    : integrations.filter(i => i.type === selectedCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'configured': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'configured': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'inactive': return <Clock className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const categories = [
    { id: 'all', name: 'All Integrations', icon: <Globe className="w-4 h-4" /> },
    { id: 'crm', name: 'CRM', icon: <Database className="w-4 h-4" /> },
    { id: 'email', name: 'Email', icon: <Mail className="w-4 h-4" /> },
    { id: 'linkedin', name: 'LinkedIn', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'marketing', name: 'Marketing', icon: <Zap className="w-4 h-4" /> },
    { id: 'data', name: 'Data', icon: <Database className="w-4 h-4" /> },
    { id: 'communication', name: 'Communication', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  const priorityStats = {
    high: integrations.filter(i => i.priority === 'high').length,
    medium: integrations.filter(i => i.priority === 'medium').length,
    low: integrations.filter(i => i.priority === 'low').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integration Systems</h1>
          <p className="text-gray-600">Connect your sales stack for seamless workflow automation</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <Plug className="w-4 h-4 mr-2" />
            {integrations.filter(i => i.status === 'active').length} Active
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      {/* Priority Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{priorityStats.high}</p>
              </div>
              <div className="text-red-500">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Critical for sales operations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Medium Priority</p>
                <p className="text-2xl font-bold text-yellow-600">{priorityStats.medium}</p>
              </div>
              <div className="text-yellow-500">
                <Zap className="w-8 h-8" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Important for optimization</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Priority</p>
                <p className="text-2xl font-bold text-green-600">{priorityStats.low}</p>
              </div>
              <div className="text-green-500">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Nice to have features</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex items-center space-x-2"
          >
            {category.icon}
            <span>{category.name}</span>
          </Button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {integration.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {integration.type.charAt(0).toUpperCase() + integration.type.slice(1)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge className={getStatusColor(integration.status)}>
                      {getStatusIcon(integration.status)}
                      <span className="ml-1">{integration.status}</span>
                    </Badge>
                    <Badge className={getPriorityColor(integration.priority)}>
                      {integration.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{integration.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Key Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {integration.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Implementation Impact:</p>
                  <p className="text-sm text-gray-600">{integration.impact}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {integration.lastSync ? (
                      <span>Last sync: {integration.lastSync.toLocaleDateString()}</span>
                    ) : (
                      <span>Not configured</span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant={integration.status === 'active' ? "outline" : "default"}
                    className="flex items-center space-x-1"
                  >
                    <span>{integration.status === 'active' ? 'Manage' : 'Configure'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Implementation Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Roadmap</CardTitle>
          <CardDescription>
            Recommended implementation order based on impact and priority
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Phase 1: Critical CRM & Email (High Priority)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {integrations.filter(i => i.priority === 'high' && (i.type === 'crm' || i.type === 'email')).map((integration) => (
                  <div key={integration.id} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">{integration.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Phase 2: Marketing & LinkedIn (Medium Priority)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {integrations.filter(i => i.priority === 'medium').map((integration) => (
                  <div key={integration.id} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">{integration.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Phase 3: Analytics & Communication (Low Priority)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {integrations.filter(i => i.priority === 'low').map((integration) => (
                  <div key={integration.id} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{integration.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}