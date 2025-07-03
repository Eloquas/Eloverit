import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Users, Building2, Zap, Target, Activity, BarChart3, PieChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CompanyInsightsDashboardProps {
  selectedCompany?: string;
}

export default function CompanyInsightsDashboard({ selectedCompany }: CompanyInsightsDashboardProps) {
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Fetch all prospects and account research data
  const { data: prospects = [] } = useQuery({
    queryKey: ["/api/prospects"],
  });

  const { data: accountResearch = [] } = useQuery({
    queryKey: ["/api/account-research"],
  });

  // Fetch company-specific research if a company is selected
  const { data: companyResearch } = useQuery({
    queryKey: ['/api/account-research', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return null;
      const response = await fetch(`/api/account-research/${encodeURIComponent(selectedCompany)}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!selectedCompany,
  });

  // Calculate company metrics
  const companyMetrics = () => {
    if (!selectedCompany) {
      // Overall metrics
      const totalCompanies = [...new Set(prospects.map((p: any) => p.company))].length;
      const researchedCompanies = accountResearch.length;
      const highIntentCompanies = accountResearch.filter((r: any) => {
        try {
          const jobPostings = JSON.parse(r.recentJobPostings || '[]');
          const initiatives = JSON.parse(r.initiatives || '[]');
          return jobPostings.length > 2 || initiatives.some((i: string) => 
            i.toLowerCase().includes('qa') || i.toLowerCase().includes('test')
          );
        } catch {
          return false;
        }
      }).length;

      return {
        totalCompanies,
        researchedCompanies,
        highIntentCompanies,
        researchCoverage: totalCompanies > 0 ? Math.round((researchedCompanies / totalCompanies) * 100) : 0
      };
    } else {
      // Company-specific metrics
      const companyProspects = prospects.filter((p: any) => p.company === selectedCompany);
      const managerPlus = companyProspects.filter((p: any) => 
        p.position?.toLowerCase().includes('manager') ||
        p.position?.toLowerCase().includes('director') ||
        p.position?.toLowerCase().includes('vp') ||
        p.position?.toLowerCase().includes('head')
      ).length;

      return {
        totalContacts: companyProspects.length,
        managerPlusCount: managerPlus,
        targetCoverage: companyProspects.length > 0 ? Math.round((managerPlus / companyProspects.length) * 100) : 0,
        hasResearch: !!companyResearch
      };
    }
  };

  const metrics = companyMetrics();

  // Animation sequences
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    }),
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  const numberVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: (width: number) => ({
      width: `${width}%`,
      transition: {
        duration: 1,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold avo-text-gradient mb-2">
          {selectedCompany ? `${selectedCompany} Insights` : 'Company Insights Overview'}
        </h2>
        <p className="text-gray-600 text-sm">
          Real-time analytics and intelligence for QA automation opportunities
        </p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {!selectedCompany ? (
          <>
            {/* Overall Company Metrics */}
            <motion.div
              custom={0}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="avo-card-modern p-6 cursor-pointer relative overflow-hidden"
                    onClick={() => setActiveMetric('total')}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -mr-16 -mt-16 opacity-50" />
                <CardHeader className="p-0 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <Building2 className="h-8 w-8 text-blue-600" />
                    <Badge className="avo-badge-blue">Total</Badge>
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    <motion.span
                      key={metrics.totalCompanies}
                      variants={numberVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {metrics.totalCompanies}
                    </motion.span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">Companies</p>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div
              custom={1}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="avo-card-modern p-6 cursor-pointer relative overflow-hidden"
                    onClick={() => setActiveMetric('researched')}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -mr-16 -mt-16 opacity-50" />
                <CardHeader className="p-0 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="h-8 w-8 text-green-600" />
                    <Badge className="avo-badge-green">Researched</Badge>
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    <motion.span
                      key={metrics.researchedCompanies}
                      variants={numberVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {metrics.researchedCompanies}
                    </motion.span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">With AI Research</p>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div
              custom={2}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="avo-card-modern p-6 cursor-pointer relative overflow-hidden"
                    onClick={() => setActiveMetric('intent')}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -mr-16 -mt-16 opacity-50" />
                <CardHeader className="p-0 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="h-8 w-8 text-purple-600" />
                    <Badge className="avo-badge-purple">High Intent</Badge>
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    <motion.span
                      key={metrics.highIntentCompanies}
                      variants={numberVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {metrics.highIntentCompanies}
                    </motion.span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">QA Ready</p>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div
              custom={3}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="avo-card-modern p-6 cursor-pointer relative overflow-hidden"
                    onClick={() => setActiveMetric('coverage')}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full -mr-16 -mt-16 opacity-50" />
                <CardHeader className="p-0 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <BarChart3 className="h-8 w-8 text-amber-600" />
                    <Badge variant="outline">Coverage</Badge>
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    <motion.span
                      key={metrics.researchCoverage}
                      variants={numberVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {metrics.researchCoverage}%
                    </motion.span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">Research Rate</p>
                </CardHeader>
              </Card>
            </motion.div>
          </>
        ) : (
          <>
            {/* Company-specific Metrics */}
            <motion.div
              custom={0}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="avo-card-modern p-6 cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -mr-16 -mt-16 opacity-50" />
                <CardHeader className="p-0 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-8 w-8 text-blue-600" />
                    <Badge className="avo-badge-blue">Contacts</Badge>
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    <motion.span
                      key={metrics.totalContacts}
                      variants={numberVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {metrics.totalContacts}
                    </motion.span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">Total Prospects</p>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div
              custom={1}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="avo-card-modern p-6 cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -mr-16 -mt-16 opacity-50" />
                <CardHeader className="p-0 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="h-8 w-8 text-green-600" />
                    <Badge className="avo-badge-green">Manager+</Badge>
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    <motion.span
                      key={metrics.managerPlusCount}
                      variants={numberVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {metrics.managerPlusCount}
                    </motion.span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">Decision Makers</p>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div
              custom={2}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="avo-card-modern p-6 cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -mr-16 -mt-16 opacity-50" />
                <CardHeader className="p-0 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <PieChart className="h-8 w-8 text-purple-600" />
                    <Badge variant="outline">Target %</Badge>
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    <motion.span
                      key={metrics.targetCoverage}
                      variants={numberVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {metrics.targetCoverage}%
                    </motion.span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">Manager Coverage</p>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div
              custom={3}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card className="avo-card-modern p-6 cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full -mr-16 -mt-16 opacity-50" />
                <CardHeader className="p-0 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="h-8 w-8 text-amber-600" />
                    <Badge className={metrics.hasResearch ? "avo-badge-green" : "bg-gray-100 text-gray-600"}>
                      {metrics.hasResearch ? 'Active' : 'Pending'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold">
                    Research Status
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {metrics.hasResearch ? 'AI Analysis Complete' : 'Awaiting Research'}
                  </p>
                </CardHeader>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Progress Bars Section */}
      <AnimatePresence mode="wait">
        {activeMetric && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <Card className="avo-card-modern p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Detailed Breakdown
              </h3>
              <div className="space-y-4">
                {activeMetric === 'coverage' && (
                  <>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Research Coverage</span>
                        <span className="text-sm text-gray-600">{metrics.researchCoverage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          custom={metrics.researchCoverage}
                          variants={progressVariants}
                          initial="hidden"
                          animate="visible"
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">High Intent Rate</span>
                        <span className="text-sm text-gray-600">
                          {metrics.researchedCompanies > 0 
                            ? Math.round((metrics.highIntentCompanies / metrics.researchedCompanies) * 100) 
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          custom={metrics.researchedCompanies > 0 
                            ? Math.round((metrics.highIntentCompanies / metrics.researchedCompanies) * 100) 
                            : 0}
                          variants={progressVariants}
                          initial="hidden"
                          animate="visible"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Insights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="avo-card-modern p-6 bg-gradient-to-r from-purple-50 to-blue-50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Live Insights
          </h3>
          <AnimatePresence mode="wait">
            <motion.div
              key={animationPhase}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-gray-700"
            >
              {animationPhase === 0 && (
                <p>
                  <strong>Opportunity Alert:</strong> {metrics.highIntentCompanies || 0} companies showing 
                  strong QA automation signals based on hiring patterns and initiatives.
                </p>
              )}
              {animationPhase === 1 && (
                <p>
                  <strong>Coverage Analysis:</strong> {100 - metrics.researchCoverage}% of companies 
                  still need AI-powered research to identify QA opportunities.
                </p>
              )}
              {animationPhase === 2 && (
                <p>
                  <strong>Engagement Tip:</strong> Focus on companies with 3+ Manager-level contacts 
                  for multi-threaded engagement strategies.
                </p>
              )}
              {animationPhase === 3 && (
                <p>
                  <strong>Next Action:</strong> Generate SCIPAB cadences for high-intent accounts 
                  to maximize conversion potential.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
}