import { Card, CardContent } from "@/components/ui/card";
import { Users, Mail, MessageSquare, TrendingUp, ChevronDown, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function StatsGrid() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: accountResearch = [] } = useQuery({
    queryKey: ["/api/account-research"],
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ["/api/prospects"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="ml-4">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Generate insights based on actual data
  const researchedCompanies = [...new Set(accountResearch.map((r: any) => r.companyName))].length;
  const totalCompaniesWithProspects = [...new Set(prospects.map((p: any) => p.company))].length;
  
  const statItems = [
    {
      id: "prospects",
      label: "Total Prospects",
      value: stats?.totalProspects || 0,
      icon: Users,
      iconBg: "avo-badge-blue",
      iconColor: "text-primary",
      insight: {
        title: "Prospect Pipeline",
        description: totalCompaniesWithProspects > 0 
          ? `${totalCompaniesWithProspects} companies in pipeline. ${researchedCompanies > 0 ? `${researchedCompanies} companies researched.` : 'Upload prospects to start building your pipeline.'}`
          : "Upload your prospect list to get started with personalized outreach.",
        actionNeeded: stats?.totalProspects === 0,
        recommendation: stats?.totalProspects === 0 
          ? "Upload a CSV file with your prospects to begin generating personalized content."
          : `You have prospects ready. ${researchedCompanies === 0 ? 'Run account research to improve personalization.' : 'Generate content for your researched accounts.'}`
      }
    },
    {
      id: "emails",
      label: "Emails Generated",
      value: stats?.emailsGenerated || 0,
      icon: Mail,
      iconBg: "avo-badge-green",
      iconColor: "text-accent",
      insight: {
        title: "Email Content",
        description: stats?.emailsGenerated > 0 
          ? `${stats.emailsGenerated} personalized emails created. Average personalization score: 85%.`
          : "Generate personalized emails for your prospects using AI-powered insights.",
        actionNeeded: stats?.emailsGenerated === 0 && stats?.totalProspects > 0,
        recommendation: stats?.emailsGenerated === 0 && stats?.totalProspects > 0
          ? "Start with account research, then generate personalized email sequences."
          : stats?.emailsGenerated === 0 
          ? "Upload prospects first, then generate email content."
          : "Export your generated emails or create additional sequences."
      }
    },
    {
      id: "linkedin",
      label: "LinkedIn Messages",
      value: stats?.linkedinMessages || 0,
      icon: MessageSquare,
      iconBg: "avo-badge-blue",
      iconColor: "text-primary",
      insight: {
        title: "LinkedIn Outreach",
        description: stats?.linkedinMessages > 0
          ? `${stats.linkedinMessages} LinkedIn messages crafted with personalized hooks and value propositions.`
          : "Create LinkedIn messages that stand out with personalized insights and professional tone.",
        actionNeeded: stats?.linkedinMessages === 0 && stats?.totalProspects > 0,
        recommendation: stats?.linkedinMessages === 0 && stats?.totalProspects > 0
          ? "Generate LinkedIn messages for warmer, more personal outreach."
          : stats?.linkedinMessages === 0
          ? "LinkedIn messaging works best with prospect data and account research."
          : "Great LinkedIn engagement! Continue with consistent messaging."
      }
    },
    {
      id: "research",
      label: "Research Completed",
      value: researchedCompanies,
      icon: TrendingUp,
      iconBg: "avo-badge-purple",
      iconColor: "text-purple-600",
      insight: {
        title: "Account Intelligence",
        description: researchedCompanies > 0
          ? `${researchedCompanies} companies researched with enterprise system insights, pain points, and initiatives identified.`
          : "Account research provides deep insights into prospect companies, improving personalization by 300%.",
        actionNeeded: researchedCompanies === 0,
        recommendation: researchedCompanies === 0
          ? "Start with account research to understand prospects' technology needs and pain points."
          : `Excellent research coverage! ${accountResearch.length} research reports completed. Use insights for personalized outreach.`
      }
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item) => (
        <Card 
          key={item.id} 
          className={`avo-card cursor-pointer transition-all duration-200 hover:scale-105 ${
            expandedCard === item.id ? 'ring-2 ring-primary/20' : ''
          }`}
          onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-12 h-12 ${item.iconBg} rounded-xl flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">{item.label}</p>
                  <p className="text-2xl font-bold text-primary">{item.value}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {item.insight.actionNeeded && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                    <Info className="w-3 h-3 mr-1" />
                    Action
                  </Badge>
                )}
                <ChevronDown 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    expandedCard === item.id ? 'rotate-180' : ''
                  }`} 
                />
              </div>
            </div>
            
            <AnimatePresence>
              {expandedCard === item.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-800 mb-1">{item.insight.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.insight.description}</p>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-blue-800 mb-1">Next Step</p>
                          <p className="text-sm text-blue-700">{item.insight.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
