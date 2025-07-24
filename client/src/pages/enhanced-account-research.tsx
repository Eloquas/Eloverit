import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Building2, Search, TrendingUp, Users, Briefcase, ArrowLeft, RefreshCw, 
  Eye, BarChart3, Target, Clock, CheckCircle, AlertTriangle, ExternalLink, 
  Star, Lightbulb, ChevronDown, ChevronRight, Mail, MessageSquare, 
  Database, Settings, Brain, Zap, Copy, Send
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

export default function EnhancedAccountResearch() {
  const { toast } = useToast();
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedResearch, setSelectedResearch] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [expandedContacts, setExpandedContacts] = useState<Set<number>>(new Set());
  const [selectedMessageType, setSelectedMessageType] = useState<"email" | "linkedin">("email");
  const [selectedFocusType, setSelectedFocusType] = useState<"trust" | "story" | "trust_story_combined">("trust");
  const [activeTab, setActiveTab] = useState("account-research");

  const { data: prospects = [] } = useQuery({
    queryKey: ["/api/prospects"],
  });

  const { data: accountResearch = [], isLoading } = useQuery({
    queryKey: ["/api/account-research"],
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
    enabled: !!selectedResearch,
  });

  // Helper functions
  const parseJsonArray = (jsonString: string | null) => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };

  const parseJsonObject = (jsonString: string | null) => {
    if (!jsonString) return {};
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  };

  // Core technology systems identification
  const identifyCoreTechnologies = (systems: any[]) => {
    const coreSystemTypes = {
      "ERP Systems": ["SAP S/4", "SAP ECC", "Oracle EBS", "Oracle ECC", "JD Edwards", "Microsoft Dynamics AX"],
      "CRM Systems": ["Salesforce", "Microsoft Dynamics CRM", "Microsoft Dynamics CE", "Microsoft D365"],
      "Business Intelligence": ["Microsoft BO", "Tableau", "Power BI", "QlikView"],
      "Cloud Platforms": ["AWS", "Azure", "Google Cloud", "Oracle Cloud"],
      "Database Systems": ["Oracle Database", "SQL Server", "PostgreSQL", "MongoDB"]
    };

    const categorized: { [key: string]: string[] } = {};
    const proprietary: string[] = [];

    systems.forEach(system => {
      let categorized_system = false;
      for (const [category, systemList] of Object.entries(coreSystemTypes)) {
        if (systemList.some(s => system.toLowerCase().includes(s.toLowerCase()))) {
          if (!categorized[category]) categorized[category] = [];
          categorized[category].push(system);
          categorized_system = true;
          break;
        }
      }
      if (!categorized_system) {
        proprietary.push(system);
      }
    });

    return { categorized, proprietary };
  };

  // Generate SCIPAB framework analysis
  const generateSCIPABAnalysis = (research: any) => {
    const scipab = parseJsonObject(research.scipabFramework);
    if (Object.keys(scipab).length > 0) return scipab;

    // Generate default SCIPAB based on available data
    const systems = parseJsonArray(research.currentSystems);
    const painPoints = parseJsonArray(research.painPoints);
    const initiatives = parseJsonArray(research.initiatives);

    return {
      situation: `${research.companyName} operates in the ${research.industry} industry with ${research.companySize} employees, utilizing ${systems.length} core technology systems.`,
      complication: painPoints.length > 0 ? `Key challenges include: ${painPoints.slice(0, 2).join(', ')}.` : "Multiple system integration and efficiency challenges identified.",
      implication: "These challenges impact operational efficiency, increase maintenance costs, and limit scalability potential.",
      position: "Avo Automation provides comprehensive QA testing solutions that integrate with existing enterprise systems.",
      action: "Schedule a discovery call to assess QA automation opportunities and system integration requirements.",
      benefit: "Achieve 80% reduction in testing time, 60% faster releases, and 40% fewer production bugs."
    };
  };

  // Generate key metrics hypothesis
  const generateKeyMetricsHypothesis = (research: any) => {
    const hypothesis = parseJsonObject(research.keyMetricsHypothesis);
    if (Object.keys(hypothesis).length > 0) return hypothesis;

    // Generate based on industry and systems
    const industry = research.industry?.toLowerCase() || "";
    const systems = parseJsonArray(research.currentSystems);
    
    let primaryMetrics = [];
    let secondaryMetrics = [];

    if (industry.includes("financial") || industry.includes("banking")) {
      primaryMetrics = ["System Uptime (%)", "Transaction Processing Speed", "Compliance Score", "Security Incident Rate"];
      secondaryMetrics = ["Customer Satisfaction Score", "Time to Market", "Cost per Transaction"];
    } else if (industry.includes("healthcare")) {
      primaryMetrics = ["Patient Safety Score", "System Reliability", "Compliance Adherence", "Data Accuracy"];
      secondaryMetrics = ["Patient Experience Score", "Operational Efficiency", "Cost per Patient"];
    } else if (industry.includes("manufacturing")) {
      primaryMetrics = ["Production Efficiency", "Quality Score", "System Downtime", "Defect Rate"];
      secondaryMetrics = ["Time to Market", "Supply Chain Efficiency", "Cost per Unit"];
    } else {
      primaryMetrics = ["System Performance", "User Satisfaction", "Operational Efficiency", "Time to Market"];
      secondaryMetrics = ["Cost Reduction", "Quality Score", "Customer Retention"];
    }

    return {
      primary: primaryMetrics,
      secondary: secondaryMetrics,
      rationale: `Based on ${research.industry} industry standards and current technology stack analysis.`
    };
  };

  // Toggle contact expansion
  const toggleContactExpansion = (contactId: number) => {
    setExpandedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  // Generate personalized outreach
  const generatePersonalizedOutreach = useMutation({
    mutationFn: async ({ contactId, messageType, focusType }: { contactId: number, messageType: string, focusType: string }) => {
      const response = await apiRequest("POST", "/api/personalized-outreach/generate", { 
        contactId, 
        messageType, 
        focusType 
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/personalized-outreach"] });
      toast({
        title: "Outreach Generated!",
        description: `Generated personalized ${data.messageType} with ${data.focusType} focus.`,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading account research...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Account Research</h1>
            <p className="text-gray-600">
              Comprehensive account intelligence with SCIPAB framework and personalized outreach
            </p>
          </div>
        </div>
      </div>

      {/* Account Selection */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Search className="w-5 h-5 mr-2" />
            Select Account for Research
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a company to analyze..." />
              </SelectTrigger>
              <SelectContent>
                {[...new Set(prospects.map((p: any) => p.company))].sort().map((company: string) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => {
                const research = accountResearch.find((r: any) => r.companyName === selectedCompany);
                if (research) {
                  setSelectedResearch(research);
                  setActiveTab("account-research");
                }
              }}
              disabled={!selectedCompany}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              Analyze Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs Interface */}
      {selectedResearch && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="account-research" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>Account Research</span>
            </TabsTrigger>
            <TabsTrigger value="leads-contacts" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Leads & Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="contact-research" className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Contact Research</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Research Tab */}
          <TabsContent value="account-research" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Core Technology Systems */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2 text-blue-600" />
                    Core Technology Systems
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const systems = parseJsonArray(selectedResearch.currentSystems);
                    const { categorized, proprietary } = identifyCoreTechnologies(systems);
                    
                    return (
                      <div className="space-y-4">
                        {/* Categorized Systems */}
                        {Object.entries(categorized).map(([category, systemList]) => (
                          <div key={category} className="border-l-4 border-blue-500 pl-4">
                            <h4 className="font-semibold text-gray-800 mb-2">{category}</h4>
                            <div className="flex flex-wrap gap-2">
                              {systemList.map((system, index) => (
                                <Badge key={index} className="bg-blue-100 text-blue-800">
                                  {system}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                        
                        {/* Proprietary Technologies */}
                        {proprietary.length > 0 && (
                          <div className="border-l-4 border-purple-500 pl-4 bg-purple-50 p-3 rounded-r-lg">
                            <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              Proprietary Technologies
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {proprietary.map((system, index) => (
                                <Badge key={index} className="bg-purple-100 text-purple-800">
                                  {system}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-sm text-purple-600 mt-2">
                              Custom or unique systems that may require specialized integration approaches.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* SCIPAB/SPIN Framework Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-green-600" />
                    SCIPAB Framework Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const scipab = generateSCIPABAnalysis(selectedResearch);
                    const frameworkItems = [
                      { key: 'situation', label: 'Situation', icon: '📊', color: 'blue' },
                      { key: 'complication', label: 'Complication', icon: '⚠️', color: 'orange' },
                      { key: 'implication', label: 'Implication', icon: '💥', color: 'red' },
                      { key: 'position', label: 'Position', icon: '🎯', color: 'green' },
                      { key: 'action', label: 'Action', icon: '🚀', color: 'purple' },
                      { key: 'benefit', label: 'Benefit', icon: '✨', color: 'yellow' }
                    ];

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {frameworkItems.map((item) => (
                          <div key={item.key} className={`border-l-4 border-${item.color}-500 pl-4 py-3`}>
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                              <span className="mr-2">{item.icon}</span>
                              {item.label}
                            </h4>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {scipab[item.key] || `${item.label} analysis pending...`}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Key Metrics Hypothesis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                    Key Metrics Hypothesis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const metrics = generateKeyMetricsHypothesis(selectedResearch);
                    
                    return (
                      <div className="space-y-4">
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-3">Primary KPIs (High Priority)</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {metrics.primary?.map((metric: string, index: number) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Target className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium">{metric}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-3">Secondary Metrics (Supporting)</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {metrics.secondary?.map((metric: string, index: number) => (
                              <div key={index} className="flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">{metric}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {metrics.rationale && (
                          <div className="border-l-4 border-gray-300 pl-4 py-2">
                            <p className="text-sm text-gray-600 italic">
                              <strong>Rationale:</strong> {metrics.rationale}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Leads & Contacts Tab */}
          <TabsContent value="leads-contacts" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Contact Tree View */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-600" />
                    Contact Tree View - {selectedResearch.companyName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Get contacts for this company from prospects
                    const companyContacts = prospects.filter((p: any) => p.company === selectedResearch.companyName);
                    
                    if (companyContacts.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No contacts found for this account.</p>
                          <p className="text-sm">Upload contact data to see personalized outreach options.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {companyContacts.map((contact: any) => (
                          <Collapsible key={contact.id}>
                            <CollapsibleTrigger
                              className="w-full"
                              onClick={() => toggleContactExpansion(contact.id)}
                            >
                              <div className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                <div className="flex items-center space-x-3">
                                  {expandedContacts.has(contact.id) ? 
                                    <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                  }
                                  <div className="text-left">
                                    <p className="font-semibold text-gray-800">{contact.name}</p>
                                    <p className="text-sm text-gray-600">{contact.position}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge className={
                                    contact.seniorityLevel === 'C-Level' ? 'bg-red-100 text-red-800' :
                                    contact.seniorityLevel === 'VP' ? 'bg-orange-100 text-orange-800' :
                                    contact.seniorityLevel === 'Director' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                  }>
                                    {contact.seniorityLevel || 'Manager'}
                                  </Badge>
                                  <Badge variant="outline">{contact.jobTitleCategory || 'General'}</Badge>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="p-4 ml-6 border-l-2 border-gray-200 bg-white">
                                {/* Contact Details */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">Email</p>
                                    <p className="text-sm text-gray-600">{contact.email}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">Department</p>
                                    <p className="text-sm text-gray-600">{contact.department || 'Not specified'}</p>
                                  </div>
                                </div>

                                {/* Personalized Communications */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-gray-800 flex items-center">
                                    <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                                    Generate Personalized Communications
                                  </h4>
                                  
                                  {/* Message Type & Focus Selection */}
                                  <div className="flex items-center space-x-4 mb-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1 block">Message Type</label>
                                      <Select value={selectedMessageType} onValueChange={(value: "email" | "linkedin") => setSelectedMessageType(value)}>
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="email">
                                            <div className="flex items-center">
                                              <Mail className="w-4 h-4 mr-2" />
                                              Email
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="linkedin">
                                            <div className="flex items-center">
                                              <MessageSquare className="w-4 h-4 mr-2" />
                                              LinkedIn
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1 block">Focus Type</label>
                                      <Select value={selectedFocusType} onValueChange={(value: "trust" | "story" | "trust_story_combined") => setSelectedFocusType(value)}>
                                        <SelectTrigger className="w-48">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="trust">Trust Focused</SelectItem>
                                          <SelectItem value="story">Story Focused</SelectItem>
                                          <SelectItem value="trust_story_combined">Trust + Story Combined</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <Button
                                      onClick={() => {
                                        setSelectedContact(contact);
                                        generatePersonalizedOutreach.mutate({
                                          contactId: contact.id,
                                          messageType: selectedMessageType,
                                          focusType: selectedFocusType
                                        });
                                      }}
                                      disabled={generatePersonalizedOutreach.isPending}
                                      className="mt-6"
                                    >
                                      {generatePersonalizedOutreach.isPending ? (
                                        <>
                                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Send className="w-4 h-4 mr-2" />
                                          Generate Message
                                        </>
                                      )}
                                    </Button>
                                  </div>

                                  {/* Sample Messages Display */}
                                  <div className="space-y-3">
                                    <div className="border rounded-lg p-4 bg-blue-50">
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-medium text-blue-800 flex items-center">
                                          <Mail className="w-4 h-4 mr-2" />
                                          Sample Email - Trust Focused
                                        </h5>
                                        <Button size="sm" variant="outline">
                                          <Copy className="w-4 h-4 mr-2" />
                                          Copy
                                        </Button>
                                      </div>
                                      <div className="text-sm space-y-2">
                                        <p><strong>Subject:</strong> Quick question about {selectedResearch.companyName}'s testing initiatives</p>
                                        <div className="bg-white p-3 rounded border">
                                          <p>Hi {contact.name},</p>
                                          <p className="mt-2">I noticed {selectedResearch.companyName} has been actively hiring for {contact.jobTitleCategory} roles. Given your expertise in {contact.position}, I wanted to reach out about something that might be relevant.</p>
                                          <p className="mt-2">Many {selectedResearch.industry} companies are finding that their current testing approaches can't keep up with release cycles. I'm curious - how is your team handling QA automation as you scale?</p>
                                          <p className="mt-2">Would you be open to a brief conversation about what's working (and what's not) in your testing processes?</p>
                                          <p className="mt-2">Best,<br/>Your Name</p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="border rounded-lg p-4 bg-green-50">
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="font-medium text-green-800 flex items-center">
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          Sample LinkedIn Message - Story Focused
                                        </h5>
                                        <Button size="sm" variant="outline">
                                          <Copy className="w-4 h-4 mr-2" />
                                          Copy
                                        </Button>
                                      </div>
                                      <div className="text-sm">
                                        <div className="bg-white p-3 rounded border">
                                          <p>Hi {contact.name},</p>
                                          <p className="mt-2">I recently worked with a {selectedResearch.industry} company similar to {selectedResearch.companyName} who was struggling with release delays due to manual testing bottlenecks.</p>
                                          <p className="mt-2">After implementing automated QA processes, they reduced testing time by 80% and increased release frequency by 60%.</p>
                                          <p className="mt-2">Given your role in {contact.position}, I thought you might find their approach interesting. Would you like to hear how they achieved these results?</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Contact Research Tab */}
          <TabsContent value="contact-research" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-900">
                    <Brain className="w-5 h-5 mr-2" />
                    Advanced Contact Research
                  </CardTitle>
                  <p className="text-sm text-purple-700">
                    Deep prospect analysis combining role expertise with account insights using O3-level AI intelligence
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Brain className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Enhanced Contact Research Engine
                    </h3>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                      Analyze individual prospects by combining their title/role with comprehensive account research. 
                      Get personalized insights, messaging hooks, and outreach strategies.
                    </p>
                    <Link href="/contact-research">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Brain className="w-4 h-4 mr-2" />
                        Open Contact Research
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-purple-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Contact Research Features:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3">
                        <Target className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Role-Specific Analysis</p>
                          <p className="text-sm text-gray-600">Analyzes prospects based on job title, seniority, and systems experience</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Building2 className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Account Context Integration</p>
                          <p className="text-sm text-gray-600">Combines individual insights with company-level research data</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Personalized Messaging</p>
                          <p className="text-sm text-gray-600">Generates role-specific messaging hooks and outreach approaches</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <BarChart3 className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">Business Impact Metrics</p>
                          <p className="text-sm text-gray-600">Identifies metrics each prospect likely cares about based on their role</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}