import OpenAI from "openai";
import { storage } from "./storage";
import { hybridResearchEngine } from "./hybrid-research";
import { emailCadenceEngine } from "./email-cadence-engine";
import { predictiveIntelligence } from "./predictive-intelligence";
import { performanceAnalytics } from "./performance-analytics";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface WorkflowTrigger {
  id: string;
  type: 'intent_spike' | 'competitor_mention' | 'job_posting' | 'budget_approval' | 'technology_research' | 'engagement_threshold';
  condition: any;
  action: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  organizationId: number;
  active: boolean;
}

interface AutomatedWorkflow {
  id: string;
  organizationId: number;
  name: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  lastExecuted?: Date;
}

interface WorkflowStep {
  id: string;
  type: 'research' | 'content_generation' | 'prioritization' | 'team_notification' | 'abm_trigger' | 'linkedin_sequence';
  config: any;
  dependencies: string[];
  status: 'pending' | 'executing' | 'completed' | 'failed';
  results?: any;
}

interface OrganizationIntelligence {
  organizationId: number;
  accounts: AccountIntelligence[];
  teamMembers: TeamMemberIntelligence[];
  sharedInsights: SharedInsight[];
  performanceMetrics: OrganizationPerformance;
  contentLibrary: ContentAsset[];
  lastUpdated: Date;
}

interface AccountIntelligence {
  accountId: string;
  companyName: string;
  industry: string;
  size: string;
  intentSignals: IntentSignal[];
  stakeholders: StakeholderIntel[];
  opportunityScore: number;
  recommendedApproach: 'nurture' | 'brand_awareness' | 'stabilization' | 'acceleration';
  lastResearched: Date;
  assignedRep?: number;
}

interface IntentSignal {
  type: 'technology_research' | 'competitor_analysis' | 'job_posting' | 'budget_approval' | 'initiative_launch';
  strength: number; // 0-100
  source: string;
  description: string;
  detected: Date;
  actionable: boolean;
}

interface StakeholderIntel {
  name: string;
  role: string;
  department: string;
  influence: number; // 0-100
  engagement: number; // 0-100
  preferredChannel: 'email' | 'linkedin' | 'phone';
  lastContact?: Date;
  responsiveness: number; // 0-100
}

interface TeamMemberIntelligence {
  userId: number;
  specialties: string[];
  performance: {
    responseRate: number;
    conversionRate: number;
    revenueGenerated: number;
    bestApproaches: string[];
  };
  activeAccounts: string[];
  capacity: number; // 0-100
}

interface SharedInsight {
  id: string;
  createdBy: number;
  type: 'market_intelligence' | 'competitive_intel' | 'customer_feedback' | 'best_practice';
  content: string;
  relevantAccounts: string[];
  relevantIndustries: string[];
  impact: 'high' | 'medium' | 'low';
  verified: boolean;
  upvotes: number;
  createdAt: Date;
}

interface OrganizationPerformance {
  totalRevenue: number;
  teamResponseRate: number;
  accountPenetration: number;
  topPerformingApproaches: string[];
  industryBreakdown: { [industry: string]: number };
  monthlyTrends: number[];
}

interface ContentAsset {
  id: string;
  type: 'email_template' | 'linkedin_template' | 'case_study' | 'one_pager' | 'demo_script';
  title: string;
  content: string;
  industry: string;
  useCase: string;
  performance: {
    usage: number;
    effectiveness: number;
    lastUpdated: Date;
  };
  createdBy: number;
  approved: boolean;
}

class WorkflowOrchestrator {
  private organizationIntelligence: Map<number, OrganizationIntelligence> = new Map();
  private activeWorkflows: Map<string, AutomatedWorkflow> = new Map();
  private triggers: Map<string, WorkflowTrigger> = new Map();

  /**
   * Initialize organization intelligence and monitoring
   */
  async initializeOrganization(organizationId: number, teamMembers: number[]): Promise<OrganizationIntelligence> {
    const orgIntel: OrganizationIntelligence = {
      organizationId,
      accounts: [],
      teamMembers: [],
      sharedInsights: [],
      performanceMetrics: {
        totalRevenue: 0,
        teamResponseRate: 0,
        accountPenetration: 0,
        topPerformingApproaches: [],
        industryBreakdown: {},
        monthlyTrends: []
      },
      contentLibrary: [],
      lastUpdated: new Date()
    };

    // Initialize team member intelligence
    for (const userId of teamMembers) {
      const memberIntel = await this.initializeTeamMemberIntelligence(userId);
      orgIntel.teamMembers.push(memberIntel);
    }

    this.organizationIntelligence.set(organizationId, orgIntel);
    
    // Set up default monitoring triggers
    await this.setupDefaultTriggers(organizationId);
    
    return orgIntel;
  }

  /**
   * Process uploaded account list and create automated workflows
   */
  async processAccountList(
    organizationId: number, 
    accounts: any[], 
    requesterId: number
  ): Promise<{
    workflow: AutomatedWorkflow;
    prioritizedAccounts: AccountIntelligence[];
    readyToSend: AccountIntelligence[];
    needsNurturing: AccountIntelligence[];
  }> {
    const workflowId = `account-processing-${Date.now()}`;
    
    // Create workflow
    const workflow: AutomatedWorkflow = {
      id: workflowId,
      organizationId,
      name: `Account Processing - ${accounts.length} accounts`,
      triggers: [],
      steps: [
        {
          id: 'research',
          type: 'research',
          config: { accounts },
          dependencies: [],
          status: 'pending'
        },
        {
          id: 'prioritization',
          type: 'prioritization',
          config: {},
          dependencies: ['research'],
          status: 'pending'
        },
        {
          id: 'content_generation',
          type: 'content_generation',
          config: { userId: requesterId },
          dependencies: ['prioritization'],
          status: 'pending'
        },
        {
          id: 'team_notification',
          type: 'team_notification',
          config: { requester: requesterId },
          dependencies: ['content_generation'],
          status: 'pending'
        }
      ],
      status: 'active',
      createdAt: new Date()
    };

    this.activeWorkflows.set(workflowId, workflow);

    // Execute workflow
    const results = await this.executeWorkflow(workflowId);
    
    return {
      workflow,
      prioritizedAccounts: results.prioritized,
      readyToSend: results.ready,
      needsNurturing: results.nurture
    };
  }

  /**
   * Execute automated workflow
   */
  async executeWorkflow(workflowId: string): Promise<any> {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const results = {
      prioritized: [],
      ready: [],
      nurture: []
    };

    // Execute steps in dependency order
    for (const step of workflow.steps) {
      step.status = 'executing';
      
      try {
        switch (step.type) {
          case 'research':
            step.results = await this.executeResearchStep(step, workflow.organizationId);
            break;
          case 'prioritization':
            step.results = await this.executePrioritizationStep(step, workflow.organizationId);
            break;
          case 'content_generation':
            step.results = await this.executeContentGenerationStep(step, workflow.organizationId);
            break;
          case 'team_notification':
            step.results = await this.executeTeamNotificationStep(step, workflow.organizationId);
            break;
        }
        
        step.status = 'completed';
      } catch (error) {
        step.status = 'failed';
        console.error(`Workflow step ${step.id} failed:`, error);
      }
    }

    // Aggregate results
    const researchResults = workflow.steps.find(s => s.type === 'research')?.results;
    const prioritizationResults = workflow.steps.find(s => s.type === 'prioritization')?.results;

    if (researchResults && prioritizationResults) {
      results.prioritized = prioritizationResults.prioritized;
      results.ready = prioritizationResults.ready;
      results.nurture = prioritizationResults.nurture;
    }

    workflow.status = 'completed';
    workflow.lastExecuted = new Date();

    return results;
  }

  /**
   * Monitor for intent signals and trigger workflows
   */
  async monitorIntentSignals(organizationId: number): Promise<void> {
    const orgIntel = this.organizationIntelligence.get(organizationId);
    if (!orgIntel) return;

    // Check all accounts for new intent signals
    for (const account of orgIntel.accounts) {
      const newSignals = await this.detectIntentSignals(account);
      
      for (const signal of newSignals) {
        account.intentSignals.push(signal);
        
        // Check if any triggers should fire
        await this.evaluateTriggers(organizationId, account, signal);
      }
    }
  }

  /**
   * Generate LinkedIn messages based on account intelligence
   */
  async generateLinkedInSequence(
    organizationId: number,
    accountId: string,
    mode: 'nurture' | 'brand_awareness' | 'stabilization' | 'acceleration'
  ): Promise<{
    sequence: any[];
    approach: string;
    timeline: string;
    personalization: any;
  }> {
    const orgIntel = this.organizationIntelligence.get(organizationId);
    const account = orgIntel?.accounts.find(a => a.accountId === accountId);
    
    if (!account) throw new Error('Account not found');

    const prompt = this.buildLinkedInSequencePrompt(account, mode, orgIntel);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a LinkedIn outreach strategist. Generate a 3-4 post sequence based on the account intelligence and mode provided. Focus on industry-specific insights and crowdsourced team intelligence."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      sequence: result.sequence,
      approach: result.approach,
      timeline: result.timeline,
      personalization: result.personalization
    };
  }

  /**
   * Update organization intelligence with new insights
   */
  async updateOrganizationIntelligence(
    organizationId: number,
    insight: SharedInsight
  ): Promise<void> {
    const orgIntel = this.organizationIntelligence.get(organizationId);
    if (!orgIntel) return;

    // Add insight to shared knowledge
    orgIntel.sharedInsights.push(insight);

    // Update relevant accounts
    for (const accountId of insight.relevantAccounts) {
      const account = orgIntel.accounts.find(a => a.accountId === accountId);
      if (account) {
        // Recalculate opportunity score based on new insight
        account.opportunityScore = await this.calculateOpportunityScore(account, orgIntel);
        
        // Update recommended approach
        account.recommendedApproach = await this.determineRecommendedApproach(account, orgIntel);
      }
    }

    orgIntel.lastUpdated = new Date();
  }

  /**
   * Get organization dashboard data
   */
  async getOrganizationDashboard(organizationId: number): Promise<{
    overview: any;
    accountSummary: any;
    teamPerformance: any;
    activeWorkflows: any;
    recentInsights: any;
    recommendedActions: any;
  }> {
    const orgIntel = this.organizationIntelligence.get(organizationId);
    if (!orgIntel) throw new Error('Organization not found');

    const activeWorkflows = Array.from(this.activeWorkflows.values())
      .filter(w => w.organizationId === organizationId && w.status === 'active');

    const recentInsights = orgIntel.sharedInsights
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    const recommendedActions = await this.generateRecommendedActions(orgIntel);

    return {
      overview: {
        totalAccounts: orgIntel.accounts.length,
        highIntentAccounts: orgIntel.accounts.filter(a => a.opportunityScore > 75).length,
        teamSize: orgIntel.teamMembers.length,
        activeWorkflows: activeWorkflows.length,
        totalRevenue: orgIntel.performanceMetrics.totalRevenue,
        avgResponseRate: orgIntel.performanceMetrics.teamResponseRate
      },
      accountSummary: {
        byStage: this.categorizeAccountsByStage(orgIntel.accounts),
        byIndustry: this.categorizeAccountsByIndustry(orgIntel.accounts),
        topOpportunities: orgIntel.accounts
          .sort((a, b) => b.opportunityScore - a.opportunityScore)
          .slice(0, 10)
      },
      teamPerformance: {
        members: orgIntel.teamMembers,
        topPerformers: orgIntel.teamMembers
          .sort((a, b) => b.performance.conversionRate - a.performance.conversionRate)
          .slice(0, 5)
      },
      activeWorkflows,
      recentInsights,
      recommendedActions
    };
  }

  // Private helper methods
  private async initializeTeamMemberIntelligence(userId: number): Promise<TeamMemberIntelligence> {
    const prospects = await storage.getProspects(userId);
    const content = await storage.getGeneratedContent(userId);
    
    return {
      userId,
      specialties: [], // Would be determined from content analysis
      performance: {
        responseRate: Math.random() * 30 + 10, // Simulated
        conversionRate: Math.random() * 15 + 5,
        revenueGenerated: Math.random() * 200000 + 50000,
        bestApproaches: ['consultative', 'trust_build']
      },
      activeAccounts: prospects.map(p => p.company),
      capacity: Math.random() * 40 + 60 // 60-100% capacity
    };
  }

  private async setupDefaultTriggers(organizationId: number): Promise<void> {
    const defaultTriggers: WorkflowTrigger[] = [
      {
        id: `intent-spike-${organizationId}`,
        type: 'intent_spike',
        condition: { threshold: 80 },
        action: 'generate_priority_outreach',
        priority: 'urgent',
        organizationId,
        active: true
      },
      {
        id: `competitor-mention-${organizationId}`,
        type: 'competitor_mention',
        condition: { competitors: ['QualityPro', 'TestMaster'] },
        action: 'create_competitive_response',
        priority: 'high',
        organizationId,
        active: true
      },
      {
        id: `job-posting-${organizationId}`,
        type: 'job_posting',
        condition: { keywords: ['QA', 'testing', 'automation'] },
        action: 'trigger_nurture_sequence',
        priority: 'medium',
        organizationId,
        active: true
      }
    ];

    for (const trigger of defaultTriggers) {
      this.triggers.set(trigger.id, trigger);
    }
  }

  private async executeResearchStep(step: WorkflowStep, organizationId: number): Promise<any> {
    const accounts = step.config.accounts;
    const researched = [];

    for (const account of accounts) {
      try {
        const research = await hybridResearchEngine.generateComprehensiveResearch(
          account.company,
          account.industry || 'Technology',
          1 // Default user ID for system research
        );

        const accountIntel: AccountIntelligence = {
          accountId: `${account.company}-${Date.now()}`,
          companyName: account.company,
          industry: account.industry || 'Technology',
          size: account.size || 'Unknown',
          intentSignals: [],
          stakeholders: [],
          opportunityScore: 0,
          recommendedApproach: 'brand_awareness',
          lastResearched: new Date()
        };

        researched.push(accountIntel);
      } catch (error) {
        console.error(`Research failed for ${account.company}:`, error);
      }
    }

    return { researched };
  }

  private async executePrioritizationStep(step: WorkflowStep, organizationId: number): Promise<any> {
    const researchStep = step.dependencies.find(d => d === 'research');
    if (!researchStep) throw new Error('Research step not found');

    // Get research results and prioritize
    const orgIntel = this.organizationIntelligence.get(organizationId);
    const accounts = orgIntel?.accounts || [];

    const prioritized = accounts.sort((a, b) => b.opportunityScore - a.opportunityScore);
    const ready = prioritized.filter(a => a.opportunityScore > 75);
    const nurture = prioritized.filter(a => a.opportunityScore <= 75 && a.opportunityScore > 40);

    return { prioritized, ready, nurture };
  }

  private async executeContentGenerationStep(step: WorkflowStep, organizationId: number): Promise<any> {
    // Generate content for ready accounts
    const userId = step.config.userId;
    const generated = [];

    // Implementation would generate content for each ready account
    // This would integrate with the email cadence engine

    return { generated };
  }

  private async executeTeamNotificationStep(step: WorkflowStep, organizationId: number): Promise<any> {
    // Send notifications to team members
    const notifications = [];

    // Implementation would send notifications about ready accounts
    // and generated content to appropriate team members

    return { notifications };
  }

  private async detectIntentSignals(account: AccountIntelligence): Promise<IntentSignal[]> {
    const signals: IntentSignal[] = [];

    // Simulate intent signal detection
    if (Math.random() > 0.7) {
      signals.push({
        type: 'technology_research',
        strength: Math.floor(Math.random() * 30) + 70,
        source: 'web_research',
        description: 'Researching QA automation solutions',
        detected: new Date(),
        actionable: true
      });
    }

    return signals;
  }

  private async evaluateTriggers(
    organizationId: number,
    account: AccountIntelligence,
    signal: IntentSignal
  ): Promise<void> {
    const orgTriggers = Array.from(this.triggers.values())
      .filter(t => t.organizationId === organizationId && t.active);

    for (const trigger of orgTriggers) {
      const shouldTrigger = await this.evaluateTriggerCondition(trigger, account, signal);
      
      if (shouldTrigger) {
        await this.executeTriggerAction(trigger, account, signal);
      }
    }
  }

  private async evaluateTriggerCondition(
    trigger: WorkflowTrigger,
    account: AccountIntelligence,
    signal: IntentSignal
  ): Promise<boolean> {
    switch (trigger.type) {
      case 'intent_spike':
        return signal.strength >= trigger.condition.threshold;
      case 'competitor_mention':
        return trigger.condition.competitors.some(c => 
          signal.description.toLowerCase().includes(c.toLowerCase())
        );
      case 'technology_research':
        return signal.type === 'technology_research' && signal.strength > 60;
      default:
        return false;
    }
  }

  private async executeTriggerAction(
    trigger: WorkflowTrigger,
    account: AccountIntelligence,
    signal: IntentSignal
  ): Promise<void> {
    switch (trigger.action) {
      case 'generate_priority_outreach':
        await this.generatePriorityOutreach(account, signal);
        break;
      case 'create_competitive_response':
        await this.createCompetitiveResponse(account, signal);
        break;
      case 'trigger_nurture_sequence':
        await this.triggerNurtureSequence(account, signal);
        break;
    }
  }

  private async generatePriorityOutreach(account: AccountIntelligence, signal: IntentSignal): Promise<void> {
    // Generate high-priority outreach content
    console.log(`Generating priority outreach for ${account.companyName}`);
  }

  private async createCompetitiveResponse(account: AccountIntelligence, signal: IntentSignal): Promise<void> {
    // Create competitive response content
    console.log(`Creating competitive response for ${account.companyName}`);
  }

  private async triggerNurtureSequence(account: AccountIntelligence, signal: IntentSignal): Promise<void> {
    // Trigger nurture sequence
    console.log(`Triggering nurture sequence for ${account.companyName}`);
  }

  private buildLinkedInSequencePrompt(
    account: AccountIntelligence,
    mode: string,
    orgIntel: OrganizationIntelligence
  ): string {
    return `Generate a LinkedIn outreach sequence for:
Company: ${account.companyName}
Industry: ${account.industry}
Mode: ${mode}
Opportunity Score: ${account.opportunityScore}
Intent Signals: ${account.intentSignals.map(s => s.description).join(', ')}
Team Insights: ${orgIntel.sharedInsights.slice(0, 3).map(i => i.content).join('; ')}

Create a 3-4 post sequence with industry-specific messaging and team intelligence integration.`;
  }

  private async calculateOpportunityScore(account: AccountIntelligence, orgIntel: OrganizationIntelligence): Promise<number> {
    let score = 50; // Base score
    
    // Add points for intent signals
    score += account.intentSignals.reduce((sum, signal) => sum + (signal.strength * 0.3), 0);
    
    // Add points for relevant insights
    const relevantInsights = orgIntel.sharedInsights.filter(i => 
      i.relevantAccounts.includes(account.accountId) ||
      i.relevantIndustries.includes(account.industry)
    );
    score += relevantInsights.length * 5;
    
    // Add points for stakeholder engagement
    const avgStakeholderEngagement = account.stakeholders.reduce((sum, s) => sum + s.engagement, 0) / account.stakeholders.length;
    score += avgStakeholderEngagement * 0.2;
    
    return Math.min(score, 100);
  }

  private async determineRecommendedApproach(
    account: AccountIntelligence,
    orgIntel: OrganizationIntelligence
  ): Promise<'nurture' | 'brand_awareness' | 'stabilization' | 'acceleration'> {
    if (account.opportunityScore > 80) return 'acceleration';
    if (account.opportunityScore > 60) return 'stabilization';
    if (account.opportunityScore > 40) return 'brand_awareness';
    return 'nurture';
  }

  private async generateRecommendedActions(orgIntel: OrganizationIntelligence): Promise<any[]> {
    const actions = [];
    
    // High-intent accounts
    const highIntentAccounts = orgIntel.accounts.filter(a => a.opportunityScore > 75);
    if (highIntentAccounts.length > 0) {
      actions.push({
        type: 'urgent_outreach',
        title: `${highIntentAccounts.length} high-intent accounts need immediate attention`,
        accounts: highIntentAccounts.slice(0, 5),
        priority: 'urgent'
      });
    }

    // Underperforming team members
    const underPerformers = orgIntel.teamMembers.filter(m => m.performance.responseRate < 15);
    if (underPerformers.length > 0) {
      actions.push({
        type: 'coaching_needed',
        title: `${underPerformers.length} team members need coaching`,
        members: underPerformers,
        priority: 'medium'
      });
    }

    return actions;
  }

  private categorizeAccountsByStage(accounts: AccountIntelligence[]): any {
    return {
      nurture: accounts.filter(a => a.recommendedApproach === 'nurture').length,
      brand_awareness: accounts.filter(a => a.recommendedApproach === 'brand_awareness').length,
      stabilization: accounts.filter(a => a.recommendedApproach === 'stabilization').length,
      acceleration: accounts.filter(a => a.recommendedApproach === 'acceleration').length
    };
  }

  private categorizeAccountsByIndustry(accounts: AccountIntelligence[]): any {
    return accounts.reduce((acc, account) => {
      acc[account.industry] = (acc[account.industry] || 0) + 1;
      return acc;
    }, {});
  }
}

export const workflowOrchestrator = new WorkflowOrchestrator();