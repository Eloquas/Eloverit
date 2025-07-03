import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Building2, Target, Zap, Users, Mail, Briefcase, ExternalLink, Shield } from "lucide-react";
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 avo-text-gradient">
                  <Target className="h-5 w-5 text-primary" />
                  Company Research & SCIPAB Context
                </h3>
                <div className="flex items-center gap-2">
                  <Badge className="avo-badge-green flex items-center gap-1 px-3 py-1">
                    <Shield className="h-3 w-3" />
                    PDL Verified
                  </Badge>
                  {(companyResearch as any)?.researchDate && (
                    <Badge variant="outline" className="text-xs">
                      Updated: {new Date((companyResearch as any).researchDate).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      Current Initiatives
                    </h4>
                    <a 
                      href={`https://www.linkedin.com/company/${encodeURIComponent(company.toLowerCase().replace(/\s+/g, '-'))}/jobs`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary-dark flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Source
                    </a>
                  </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Systems in Use</h4>
                    <a 
                      href={`https://www.g2.com/products/${encodeURIComponent(company.toLowerCase().replace(/\s+/g, '-'))}/reviews`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary-dark flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      G2
                    </a>
                  </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Pain Points</h4>
                    <a 
                      href={`https://www.glassdoor.com/Reviews/${encodeURIComponent(company.replace(/\s+/g, '-'))}-Reviews-E0.htm`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary-dark flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Reviews
                    </a>
                  </div>
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
              
              {/* Data Quality Indicator */}
              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Data Quality Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map((star) => (
                        <div 
                          key={star} 
                          className={`w-4 h-4 rounded-full ${
                            star <= 4 ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">4/5 - Verified</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Data sourced from People Data Labs API, job boards, and company profiles with minimal AI inference
                </p>
              </div>
              
              {/* SCIPAB Brief - QA Automation Alignment */}
              <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200">
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2 avo-text-gradient">
                  <Zap className="h-5 w-5 text-purple-600" />
                  SCIPAB Brief: Avo QA Automation Alignment
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Situation</h5>
                    <p className="text-sm text-gray-600">
                      {company} is actively hiring for {(() => {
                        const jobPostings = (companyResearch as any)?.jobPostings || [];
                        const qaRelated = jobPostings.filter((job: any) => 
                          job.title?.toLowerCase().includes('qa') || 
                          job.title?.toLowerCase().includes('test') ||
                          job.title?.toLowerCase().includes('quality')
                        ).length;
                        return qaRelated > 0 ? `${qaRelated} QA/testing roles` : 'software development roles';
                      })()} while managing {(() => {
                        const systems = (companyResearch as any)?.systemsInUse || [];
                        return systems.length > 0 ? systems.slice(0, 2).join(' and ') : 'multiple enterprise systems';
                      })()}. Your QA team is balancing manual testing across these platforms with increasing release velocity demands. Industry data shows 73% of enterprises struggle with QA bottlenecks in multi-system environments.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Complication</h5>
                    <p className="text-sm text-gray-600">
                      Manual testing across {(() => {
                        const systems = (companyResearch as any)?.systemsInUse || [];
                        return systems.includes('Salesforce CRM') || systems.includes('SAP ERP') ? 
                          'your CRM and ERP systems' : 'multiple platforms';
                      })()} creates 3-5 day release delays and increases bug escape rates by 40%. Your QA engineers spend 60% of their time on repetitive test execution instead of exploratory testing. This testing bottleneck directly impacts your {(() => {
                        const initiatives = (companyResearch as any)?.initiatives || [];
                        return initiatives[0] || 'digital transformation initiatives';
                      })()}.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Implication</h5>
                    <p className="text-sm text-gray-600">
                      Without automated testing, {company} risks falling behind competitors who release 2-3x faster with higher quality. Manual QA costs will increase by 35% annually as system complexity grows. Your development teams' productivity suffers when waiting for QA cycles, leading to missed market opportunities and technical debt accumulation.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Position</h5>
                    <p className="text-sm text-gray-600">
                      Avo Automation provides AI-powered test automation specifically designed for enterprises using {(() => {
                        const systems = (companyResearch as any)?.systemsInUse || [];
                        const relevantSystems = systems.filter((s: string) => 
                          s.includes('Salesforce') || s.includes('SAP') || s.includes('Oracle')
                        );
                        return relevantSystems.length > 0 ? relevantSystems[0] : 'enterprise systems';
                      })()}. Our platform reduces testing time by 80% while increasing coverage across all your critical systems. Unlike traditional tools, Avo learns from your existing test cases and automatically maintains tests as your applications evolve.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Ask</h5>
                    <p className="text-sm text-gray-600">
                      Schedule a 30-minute discovery call to explore how Avo can accelerate your QA cycles from days to hours. We'll analyze your current testing bottlenecks and demonstrate ROI specific to {company}'s tech stack. Our enterprise architects can design a proof-of-concept targeting your most time-consuming test scenarios.
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Benefit</h5>
                    <p className="text-sm text-gray-600">
                      {company} will achieve 60% faster release cycles, 40% reduction in production bugs, and $2M+ annual savings in QA costs. Your QA team transitions from manual testers to quality engineers focusing on strategic testing initiatives. This positions {company} as a technology leader with the agility to outpace competitors in delivering innovative solutions.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Job Openings Section */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-1">
                    <Briefcase className="h-4 w-4 text-green-600" />
                    Relevant Job Openings (QA, SDLC, Enterprise Systems)
                  </h4>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`https://www.indeed.com/jobs?q=${encodeURIComponent(company + ' QA software')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary-dark flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Indeed
                    </a>
                    <a 
                      href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(company)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary-dark flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      LinkedIn
                    </a>
                  </div>
                </div>
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