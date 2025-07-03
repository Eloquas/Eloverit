import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Building2, Target, Zap, Users, Mail, Briefcase } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface CompanyDetailModalProps {
  company: string;
  prospects: Array<{
    id: number;
    name: string;
    email: string;
    position: string;
    status: string;
  }>;
  isOpen: boolean;
  onClose: () => void;
}

export default function CompanyDetailModal({ company, prospects, isOpen, onClose }: CompanyDetailModalProps) {
  const [expandedContacts, setExpandedContacts] = useState<Set<number>>(new Set());
  const [expandedEmailTrees, setExpandedEmailTrees] = useState<Set<number>>(new Set());

  // Fetch company research data
  const { data: companyResearch } = useQuery({
    queryKey: ['/api/account-research', company],
    queryFn: async () => {
      const response = await fetch(`/api/account-research/${encodeURIComponent(company)}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No research found for this company
        }
        throw new Error('Failed to fetch company research');
      }
      return response.json();
    },
    enabled: isOpen && !!company,
  });

  // Fetch generated content for all prospects
  const { data: generatedContent } = useQuery({
    queryKey: ['/api/generated-content'],
    enabled: isOpen,
  });

  const toggleContact = (contactId: number) => {
    const newExpanded = new Set(expandedContacts);
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
      // Also collapse email tree when collapsing contact
      const newEmailTrees = new Set(expandedEmailTrees);
      newEmailTrees.delete(contactId);
      setExpandedEmailTrees(newEmailTrees);
    } else {
      newExpanded.add(contactId);
    }
    setExpandedContacts(newExpanded);
  };

  const toggleEmailTree = (contactId: number) => {
    const newExpanded = new Set(expandedEmailTrees);
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
    } else {
      newExpanded.add(contactId);
    }
    setExpandedEmailTrees(newExpanded);
  };

  const getContactEmails = (contactId: number) => {
    if (!generatedContent || !Array.isArray(generatedContent)) return [];
    return generatedContent.filter((content: any) => content.prospectId === contactId);
  };

  const getPersonaInsights = (prospect: any) => {
    const position = prospect.position.toLowerCase();
    const seniority = getSeniorityLevel(prospect.position);
    const roleCategory = getRoleCategory(prospect.position);
    
    const insights = {
      carePriorities: [] as string[],
      painPoints: [] as string[],
      metrics: [] as string[],
    };

    // Role-based insights
    if (position.includes('qa') || position.includes('quality') || position.includes('test')) {
      insights.carePriorities = [
        'Test automation coverage and efficiency',
        'Release cycle speed and reliability',
        'Bug detection and prevention',
        'Team productivity and tool optimization'
      ];
      insights.painPoints = [
        'Manual testing bottlenecks',
        'Inconsistent test environments',
        'Late-stage bug discoveries',
        'Tool integration complexity'
      ];
      insights.metrics = ['80% faster testing', '60% fewer bugs', '40% faster releases'];
    } else if (position.includes('crm') || position.includes('salesforce')) {
      insights.carePriorities = [
        'Data accuracy and completeness',
        'User adoption and training',
        'Integration with other systems',
        'Workflow automation'
      ];
      insights.painPoints = [
        'Data silos and inconsistencies',
        'Complex user interfaces',
        'Manual data entry processes',
        'Reporting limitations'
      ];
      insights.metrics = ['50% better data quality', '35% higher adoption', '70% less manual work'];
    } else if (position.includes('erp') || position.includes('sap') || position.includes('oracle')) {
      insights.carePriorities = [
        'System integration and data flow',
        'Process standardization',
        'Performance optimization',
        'Compliance and reporting'
      ];
      insights.painPoints = [
        'Legacy system limitations',
        'Complex customizations',
        'Slow processing times',
        'Training and change management'
      ];
      insights.metrics = ['45% faster processing', '60% fewer errors', '30% cost reduction'];
    }

    // Seniority adjustments
    if (seniority === 'Executive') {
      insights.carePriorities.unshift('Strategic ROI and competitive advantage', 'Risk mitigation and compliance');
    } else if (seniority === 'Manager') {
      insights.carePriorities.unshift('Team efficiency and productivity', 'Budget optimization');
    }

    return insights;
  };

  const getSeniorityLevel = (position: string): string => {
    const pos = position.toLowerCase();
    if (pos.includes('ceo') || pos.includes('cto') || pos.includes('cio') || pos.includes('vp')) return 'Executive';
    if (pos.includes('director')) return 'Director';
    if (pos.includes('manager') || pos.includes('lead') || pos.includes('head')) return 'Manager';
    return 'Individual Contributor';
  };

  const getRoleCategory = (position: string): string => {
    const pos = position.toLowerCase();
    if (pos.includes('qa') || pos.includes('quality') || pos.includes('test')) return 'QA/Testing';
    if (pos.includes('crm') || pos.includes('salesforce')) return 'CRM Systems';
    if (pos.includes('erp') || pos.includes('sap') || pos.includes('oracle')) return 'ERP Systems';
    if (pos.includes('business') && pos.includes('analyst')) return 'Business Analysis';
    return 'Technology';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {company} - SCIPAB Research & Generated Content
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Overview */}
          {companyResearch && (
            <div className="avo-card-modern p-6 rounded-2xl avo-shadow-soft">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 avo-text-gradient">
                <Target className="h-5 w-5 text-primary" />
                Company Research & SCIPAB Context
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    Current Initiatives
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {(() => {
                      try {
                        const initiatives = typeof (companyResearch as any)?.initiatives === 'string' 
                          ? JSON.parse((companyResearch as any).initiatives)
                          : (companyResearch as any)?.initiatives || [];
                        return initiatives.length > 0 
                          ? initiatives.map((initiative: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                {initiative}
                              </li>
                            ))
                          : <li className="text-gray-500">No initiatives data available</li>;
                      } catch {
                        return <li className="text-gray-500">Error parsing initiatives data</li>;
                      }
                    })()}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Systems in Use</h4>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      try {
                        const systems = typeof (companyResearch as any)?.currentSystems === 'string' 
                          ? JSON.parse((companyResearch as any).currentSystems)
                          : (companyResearch as any)?.currentSystems || [];
                        return systems.length > 0 
                          ? systems.map((system: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {system}
                              </Badge>
                            ))
                          : <span className="text-gray-500 text-xs">No systems data available</span>;
                      } catch {
                        return <span className="text-gray-500 text-xs">Error parsing systems data</span>;
                      }
                    })()}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Pain Points</h4>
                  <ul className="space-y-1 text-sm">
                    {(() => {
                      try {
                        const painPoints = typeof (companyResearch as any)?.painPoints === 'string' 
                          ? JSON.parse((companyResearch as any).painPoints)
                          : (companyResearch as any)?.painPoints || [];
                        return painPoints.length > 0 
                          ? painPoints.map((pain: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                                {pain}
                              </li>
                            ))
                          : <li className="text-gray-500">No pain points data available</li>;
                      } catch {
                        return <li className="text-gray-500">Error parsing pain points data</li>;
                      }
                    })()}
                  </ul>
                </div>
              </div>
              
              {/* Job Openings Section */}
              <div className="mt-4">
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <Briefcase className="h-4 w-4 text-green-600" />
                  Relevant Job Openings (QA, SDLC, Enterprise Systems)
                </h4>
                <div className="space-y-2">
                  {(() => {
                    try {
                      const jobPostings = typeof (companyResearch as any)?.recentJobPostings === 'string' 
                        ? JSON.parse((companyResearch as any).recentJobPostings)
                        : (companyResearch as any)?.recentJobPostings || [];
                      return jobPostings.length > 0 
                        ? jobPostings.map((job: string, idx: number) => (
                            <div key={idx} className="p-3 avo-badge-green rounded-xl border border-green-100 avo-hover-scale transition-all duration-200">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-bold">{idx + 1}</span>
                                </div>
                                <span className="text-sm text-gray-700 font-medium">{job}</span>
                              </div>
                            </div>
                          ))
                        : <div className="text-sm text-gray-500">No job postings data available</div>;
                    } catch {
                      return <div className="text-sm text-gray-500">Error parsing job postings data</div>;
                    }
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Contacts Tree */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contacts & Generated Content ({prospects.length})
            </h3>
            
            {prospects.map((prospect) => {
              const isContactExpanded = expandedContacts.has(prospect.id);
              const isEmailTreeExpanded = expandedEmailTrees.has(prospect.id);
              const contactEmails = getContactEmails(prospect.id);
              const insights = getPersonaInsights(prospect);
              
              return (
                <div key={prospect.id} className="border rounded-lg overflow-hidden">
                  {/* Contact Header */}
                  <Button
                    variant="ghost"
                    onClick={() => toggleContact(prospect.id)}
                    className="w-full justify-start p-4 h-auto"
                  >
                    <div className="flex items-center gap-3 w-full">
                      {isContactExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div className="flex-1 text-left">
                        <div className="font-medium">{prospect.name}</div>
                        <div className="text-sm text-gray-600">{prospect.position}</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{getSeniorityLevel(prospect.position)}</Badge>
                        <Badge variant="secondary">{getRoleCategory(prospect.position)}</Badge>
                        {contactEmails.length > 0 && (
                          <Badge className="bg-green-100 text-green-700">
                            {contactEmails.length} emails generated
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                  
                  {/* Contact Details */}
                  {isContactExpanded && (
                    <div className="px-4 pb-4 space-y-4 bg-gray-50">
                      {/* Persona Insights */}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <h5 className="font-medium mb-2 text-sm">Care Priorities</h5>
                          <ul className="space-y-1 text-xs">
                            {insights.carePriorities.map((priority, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                {priority}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium mb-2 text-sm">Pain Points</h5>
                          <ul className="space-y-1 text-xs">
                            {insights.painPoints.map((pain, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1 h-1 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
                                {pain}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium mb-2 text-sm">Relevant Metrics</h5>
                          <ul className="space-y-1 text-xs">
                            {insights.metrics.map((metric, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1 h-1 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                {metric}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Email Tree */}
                      {contactEmails.length > 0 && (
                        <div className="border-t pt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEmailTree(prospect.id)}
                            className="mb-3"
                          >
                            {isEmailTreeExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <Mail className="h-4 w-4 ml-1" />
                            Generated Email Cadence ({contactEmails.length} emails)
                          </Button>
                          
                          {isEmailTreeExpanded && (
                            <div className="space-y-2 ml-6">
                              {contactEmails
                                .sort((a: any, b: any) => (a.cadenceStep || 0) - (b.cadenceStep || 0))
                                .map((email: any, idx: number) => (
                                <div key={email.id} className="border rounded p-3 bg-white">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="font-medium text-sm">
                                      Email {email.cadenceStep || idx + 1}: {email.subject}
                                    </div>
                                    <div className="flex gap-2">
                                      <Badge variant="outline" className="text-xs">{email.tone}</Badge>
                                      <Badge variant="outline" className="text-xs">{email.type}</Badge>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-600 line-clamp-3">
                                    {email.content}
                                  </div>
                                  {email.cta && (
                                    <div className="mt-2 text-xs font-medium text-blue-600">
                                      CTA: {email.cta}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}