import OpenAI from "openai";
import { storage } from "./storage";
import { workflowOrchestrator } from "./workflow-orchestrator";
import { ragIntelligence } from "./rag-intelligence";
import { predictiveIntelligence } from "./predictive-intelligence";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface MonitoringTrigger {
  id: string;
  organizationId: number;
  name: string;
  type: 'intent_surge' | 'competitor_activity' | 'technology_research' | 'job_posting' | 'budget_cycle' | 'engagement_spike';
  conditions: TriggerCondition[];
  actions: TriggerAction[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  active: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

interface TriggerCondition {
  field: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains' | 'increases_by' | 'decreases_by';
  value: any;
  timeframe?: string; // '1h', '24h', '7d', '30d'
}

interface TriggerAction {
  type: 'generate_content' | 'notify_team' | 'update_priority' | 'create_task' | 'trigger_sequence' | 'abm_alert';
  config: any;
  targetUsers?: number[];
}

interface MonitoringAlert {
  id: string;
  organizationId: number;
  triggerId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  accountsAffected: string[];
  suggestedActions: string[];
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: number;
  actionsTaken: string[];
}

interface IntentMonitoringData {
  accountId: string;
  signals: {
    web_research: number;
    content_downloads: number;
    pricing_page_visits: number;
    demo_requests: number;
    competitor_research: number;
    technology_searches: number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  velocity: number; // rate of change
  lastUpdated: Date;
}

interface CompetitorActivity {
  competitor: string;
  activity: 'product_launch' | 'pricing_change' | 'market_expansion' | 'customer_win' | 'funding_round';
  description: string;
  impact: 'high' | 'medium' | 'low';
  affectedAccounts: string[];
  detectedAt: Date;
  source: string;
}

class ProactiveMonitoringEngine {
  private triggers: Map<string, MonitoringTrigger> = new Map();
  private alerts: Map<string, MonitoringAlert[]> = new Map();
  private intentData: Map<string, IntentMonitoringData> = new Map();
  private competitorTracking: Map<string, CompetitorActivity[]> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize proactive monitoring for organization
   */
  async initializeMonitoring(organizationId: number): Promise<void> {
    console.log(`Initializing proactive monitoring for organization ${organizationId}`);
    
    // Set up default triggers
    await this.setupDefaultTriggers(organizationId);
    
    // Start monitoring loop
    this.startMonitoring();
    
    // Initialize intent monitoring
    await this.initializeIntentMonitoring(organizationId);
  }

  /**
   * Add custom monitoring trigger
   */
  async addTrigger(trigger: Omit<MonitoringTrigger, 'id' | 'triggerCount'>): Promise<MonitoringTrigger> {
    const newTrigger: MonitoringTrigger = {
      ...trigger,
      id: `trigger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      triggerCount: 0
    };
    
    this.triggers.set(newTrigger.id, newTrigger);
    
    console.log(`Added monitoring trigger: ${newTrigger.name}`);
    return newTrigger;
  }

  /**
   * Process real-time intent signals
   */
  async processIntentSignals(organizationId: number): Promise<void> {
    // Simulate real-time intent monitoring
    const accounts = await this.getOrganizationAccounts(organizationId);
    
    for (const account of accounts) {
      const currentData = this.intentData.get(account.id) || {
        accountId: account.id,
        signals: {
          web_research: 0,
          content_downloads: 0,
          pricing_page_visits: 0,
          demo_requests: 0,
          competitor_research: 0,
          technology_searches: 0
        },
        trend: 'stable' as const,
        velocity: 0,
        lastUpdated: new Date()
      };

      // Simulate signal updates
      const newSignals = await this.detectNewSignals(account);
      
      // Update intent data
      const updatedData = this.updateIntentData(currentData, newSignals);
      this.intentData.set(account.id, updatedData);

      // Check for trigger conditions
      await this.evaluateIntentTriggers(organizationId, account, updatedData);
    }
  }

  /**
   * Monitor competitor activity
   */
  async monitorCompetitorActivity(organizationId: number): Promise<void> {
    const competitors = ['QualityPro', 'TestMaster', 'QACloud', 'AutoTest'];
    
    for (const competitor of competitors) {
      const activities = await this.detectCompetitorActivity(competitor, organizationId);
      
      if (activities.length > 0) {
        const existing = this.competitorTracking.get(competitor) || [];
        existing.push(...activities);
        this.competitorTracking.set(competitor, existing);
        
        // Trigger alerts for high-impact activities
        for (const activity of activities) {
          if (activity.impact === 'high') {
            await this.createAlert(organizationId, {
              severity: 'high',
              title: `Competitor Alert: ${competitor}`,
              description: `${competitor} ${activity.activity}: ${activity.description}`,
              accountsAffected: activity.affectedAccounts,
              suggestedActions: await this.generateCompetitorResponse(activity)
            });
          }
        }
      }
    }
  }

  /**
   * One-click account processing workflow
   */
  async processAccountListOneClick(
    organizationId: number,
    accounts: any[],
    requesterId: number
  ): Promise<{
    processingId: string;
    readyToSend: any[];
    needsNurturing: any[];
    highPriority: any[];
    suggestedSequences: any[];
  }> {
    const processingId = `processing-${Date.now()}`;
    
    console.log(`Starting one-click processing for ${accounts.length} accounts`);

    // Step 1: Parallel research and intent analysis
    const researchPromises = accounts.map(async (account) => {
      const [research, intentData] = await Promise.all([
        this.conductRapidResearch(account),
        this.analyzeAccountIntent(account)
      ]);
      
      return {
        ...account,
        research,
        intentData,
        priorityScore: this.calculatePriorityScore(research, intentData)
      };
    });

    const enrichedAccounts = await Promise.all(researchPromises);

    // Step 2: Categorize accounts
    const categorized = this.categorizeAccounts(enrichedAccounts);

    // Step 3: Generate suggested sequences
    const suggestedSequences = await this.generateSequenceSuggestions(
      categorized.readyToSend,
      organizationId
    );

    // Step 4: Trigger ABM alerts for marketing team
    await this.triggerABMAlerts(organizationId, categorized.highPriority);

    // Step 5: Create monitoring triggers for all accounts
    for (const account of enrichedAccounts) {
      await this.createAccountMonitoringTrigger(organizationId, account);
    }

    return {
      processingId,
      readyToSend: categorized.readyToSend,
      needsNurturing: categorized.needsNurturing,
      highPriority: categorized.highPriority,
      suggestedSequences
    };
  }

  /**
   * Generate LinkedIn sequences with different modes
   */
  async generateLinkedInSequences(
    organizationId: number,
    accounts: any[],
    mode: 'nurture' | 'brand_awareness' | 'stabilization' | 'acceleration'
  ): Promise<any[]> {
    const sequences = [];
    
    for (const account of accounts) {
      const industryContext = await this.getIndustryContext(account.industry);
      const orgInsights = await this.getOrganizationInsights(organizationId);
      
      const sequence = await this.generateLinkedInSequence(
        account,
        mode,
        industryContext,
        orgInsights
      );
      
      sequences.push({
        accountId: account.id,
        mode,
        sequence,
        estimatedTimeline: this.calculateSequenceTimeline(sequence),
        expectedOutcome: this.predictSequenceOutcome(sequence, account)
      });
    }
    
    return sequences;
  }

  /**
   * Get organization alerts
   */
  async getOrganizationAlerts(organizationId: number): Promise<MonitoringAlert[]> {
    const alerts = this.alerts.get(organizationId.toString()) || [];
    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: number): Promise<void> {
    // Find and acknowledge alert
    for (const [orgId, alerts] of this.alerts.entries()) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedBy = userId;
        break;
      }
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getMonitoringDashboard(organizationId: number): Promise<{
    activeAlerts: MonitoringAlert[];
    intentTrends: any[];
    competitorActivity: CompetitorActivity[];
    triggerPerformance: any[];
    accountHealth: any[];
  }> {
    const activeAlerts = (this.alerts.get(organizationId.toString()) || [])
      .filter(a => !a.acknowledged);

    const intentTrends = Array.from(this.intentData.values())
      .filter(data => data.lastUpdated > new Date(Date.now() - 24 * 60 * 60 * 1000));

    const competitorActivity = Array.from(this.competitorTracking.values())
      .flat()
      .filter(activity => activity.detectedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const triggerPerformance = Array.from(this.triggers.values())
      .filter(t => t.organizationId === organizationId)
      .map(t => ({
        name: t.name,
        triggerCount: t.triggerCount,
        lastTriggered: t.lastTriggered,
        effectiveness: this.calculateTriggerEffectiveness(t)
      }));

    const accountHealth = this.calculateAccountHealth(organizationId);

    return {
      activeAlerts,
      intentTrends,
      competitorActivity,
      triggerPerformance,
      accountHealth
    };
  }

  // Private helper methods
  private async setupDefaultTriggers(organizationId: number): Promise<void> {
    const defaultTriggers = [
      {
        organizationId,
        name: 'High Intent Surge',
        type: 'intent_surge' as const,
        conditions: [
          { field: 'intent_score', operator: 'greater_than' as const, value: 80 },
          { field: 'velocity', operator: 'greater_than' as const, value: 20, timeframe: '24h' }
        ],
        actions: [
          { type: 'notify_team' as const, config: { message: 'High intent account detected' } },
          { type: 'update_priority' as const, config: { priority: 'urgent' } },
          { type: 'generate_content' as const, config: { approach: 'acceleration' } }
        ],
        priority: 'critical' as const,
        active: true,
        triggerCount: 0
      },
      {
        organizationId,
        name: 'Competitor Threat',
        type: 'competitor_activity' as const,
        conditions: [
          { field: 'competitor_mentions', operator: 'greater_than' as const, value: 2, timeframe: '7d' }
        ],
        actions: [
          { type: 'abm_alert' as const, config: { priority: 'high' } },
          { type: 'generate_content' as const, config: { approach: 'competitive_response' } }
        ],
        priority: 'high' as const,
        active: true,
        triggerCount: 0
      },
      {
        organizationId,
        name: 'Technology Research Signal',
        type: 'technology_research' as const,
        conditions: [
          { field: 'tech_research_score', operator: 'greater_than' as const, value: 60 }
        ],
        actions: [
          { type: 'trigger_sequence' as const, config: { sequence: 'nurture_tech_focus' } }
        ],
        priority: 'medium' as const,
        active: true,
        triggerCount: 0
      }
    ];

    for (const trigger of defaultTriggers) {
      await this.addTrigger(trigger);
    }
  }

  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        // Get all organizations
        const organizations = await this.getAllOrganizations();
        
        for (const orgId of organizations) {
          await this.processIntentSignals(orgId);
          await this.monitorCompetitorActivity(orgId);
          await this.evaluateAllTriggers(orgId);
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 60000); // Run every minute
  }

  private async getOrganizationAccounts(organizationId: number): Promise<any[]> {
    // Simulate getting accounts for organization
    return [
      { id: 'account-1', name: 'TechCorp', industry: 'Technology' },
      { id: 'account-2', name: 'DataFlow', industry: 'Data' },
      { id: 'account-3', name: 'InnovateCorp', industry: 'Innovation' }
    ];
  }

  private async detectNewSignals(account: any): Promise<any> {
    // Simulate signal detection
    return {
      web_research: Math.random() * 10,
      content_downloads: Math.random() * 5,
      pricing_page_visits: Math.random() * 3,
      demo_requests: Math.random() * 2,
      competitor_research: Math.random() * 8,
      technology_searches: Math.random() * 12
    };
  }

  private updateIntentData(current: IntentMonitoringData, newSignals: any): IntentMonitoringData {
    const updated = { ...current };
    
    // Update signals
    for (const [key, value] of Object.entries(newSignals)) {
      if (key in updated.signals) {
        updated.signals[key] += value;
      }
    }

    // Calculate trend and velocity
    const totalSignals = Object.values(updated.signals).reduce((sum, val) => sum + val, 0);
    const previousTotal = Object.values(current.signals).reduce((sum, val) => sum + val, 0);
    
    updated.velocity = totalSignals - previousTotal;
    updated.trend = updated.velocity > 2 ? 'increasing' : updated.velocity < -2 ? 'decreasing' : 'stable';
    updated.lastUpdated = new Date();

    return updated;
  }

  private async evaluateIntentTriggers(
    organizationId: number,
    account: any,
    intentData: IntentMonitoringData
  ): Promise<void> {
    const triggers = Array.from(this.triggers.values())
      .filter(t => t.organizationId === organizationId && t.active);

    for (const trigger of triggers) {
      const shouldTrigger = await this.evaluateTriggerConditions(trigger, account, intentData);
      
      if (shouldTrigger) {
        await this.executeTrigger(trigger, account, intentData);
      }
    }
  }

  private async evaluateTriggerConditions(
    trigger: MonitoringTrigger,
    account: any,
    intentData: IntentMonitoringData
  ): Promise<boolean> {
    const totalIntentScore = Object.values(intentData.signals).reduce((sum, val) => sum + val, 0);
    
    for (const condition of trigger.conditions) {
      let value;
      
      switch (condition.field) {
        case 'intent_score':
          value = totalIntentScore;
          break;
        case 'velocity':
          value = intentData.velocity;
          break;
        case 'tech_research_score':
          value = intentData.signals.technology_searches;
          break;
        default:
          continue;
      }

      const conditionMet = this.evaluateCondition(condition, value);
      if (!conditionMet) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(condition: TriggerCondition, value: number): boolean {
    switch (condition.operator) {
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'equals':
        return value === condition.value;
      default:
        return false;
    }
  }

  private async executeTrigger(
    trigger: MonitoringTrigger,
    account: any,
    intentData: IntentMonitoringData
  ): Promise<void> {
    console.log(`Executing trigger: ${trigger.name} for account: ${account.name}`);
    
    trigger.triggerCount++;
    trigger.lastTriggered = new Date();

    for (const action of trigger.actions) {
      await this.executeAction(action, trigger.organizationId, account, intentData);
    }
  }

  private async executeAction(
    action: TriggerAction,
    organizationId: number,
    account: any,
    intentData: IntentMonitoringData
  ): Promise<void> {
    switch (action.type) {
      case 'notify_team':
        await this.notifyTeam(organizationId, action.config, account);
        break;
      case 'update_priority':
        await this.updateAccountPriority(account, action.config);
        break;
      case 'generate_content':
        await this.generatePriorityContent(account, action.config);
        break;
      case 'abm_alert':
        await this.triggerABMAlert(organizationId, account, action.config);
        break;
      case 'trigger_sequence':
        await this.triggerSequence(account, action.config);
        break;
    }
  }

  private async createAlert(
    organizationId: number,
    alertData: {
      severity: 'critical' | 'high' | 'medium' | 'low';
      title: string;
      description: string;
      accountsAffected: string[];
      suggestedActions: string[];
    }
  ): Promise<void> {
    const alert: MonitoringAlert = {
      id: `alert-${Date.now()}`,
      organizationId,
      triggerId: '',
      ...alertData,
      createdAt: new Date(),
      acknowledged: false,
      actionsTaken: []
    };

    const alerts = this.alerts.get(organizationId.toString()) || [];
    alerts.push(alert);
    this.alerts.set(organizationId.toString(), alerts);

    console.log(`Created alert: ${alert.title}`);
  }

  private async detectCompetitorActivity(competitor: string, organizationId: number): Promise<CompetitorActivity[]> {
    // Simulate competitor activity detection
    const activities: CompetitorActivity[] = [];
    
    if (Math.random() > 0.9) {
      activities.push({
        competitor,
        activity: 'product_launch',
        description: 'New QA automation features announced',
        impact: 'high',
        affectedAccounts: ['account-1', 'account-2'],
        detectedAt: new Date(),
        source: 'news_monitoring'
      });
    }

    return activities;
  }

  private async generateCompetitorResponse(activity: CompetitorActivity): Promise<string[]> {
    return [
      'Create competitive comparison content',
      'Reach out to affected accounts',
      'Prepare counter-positioning materials',
      'Schedule team briefing on competitive threat'
    ];
  }

  private async conductRapidResearch(account: any): Promise<any> {
    // Simulate rapid research
    return {
      industry: account.industry,
      size: 'Enterprise',
      technologies: ['Salesforce', 'SAP'],
      recentNews: 'Expanding QA team',
      researchScore: Math.floor(Math.random() * 40) + 60
    };
  }

  private async analyzeAccountIntent(account: any): Promise<any> {
    return {
      intentScore: Math.floor(Math.random() * 50) + 50,
      signals: ['job_posting', 'technology_research'],
      readiness: Math.random() > 0.5 ? 'high' : 'medium'
    };
  }

  private calculatePriorityScore(research: any, intentData: any): number {
    return (research.researchScore * 0.4) + (intentData.intentScore * 0.6);
  }

  private categorizeAccounts(accounts: any[]): any {
    const sorted = accounts.sort((a, b) => b.priorityScore - a.priorityScore);
    
    return {
      readyToSend: sorted.filter(a => a.priorityScore > 80),
      needsNurturing: sorted.filter(a => a.priorityScore > 60 && a.priorityScore <= 80),
      highPriority: sorted.filter(a => a.priorityScore > 85),
      lowPriority: sorted.filter(a => a.priorityScore <= 60)
    };
  }

  private async generateSequenceSuggestions(accounts: any[], organizationId: number): Promise<any[]> {
    const suggestions = [];
    
    for (const account of accounts) {
      suggestions.push({
        accountId: account.id,
        recommended: 'trust_story_combined',
        reasoning: `High intent score (${account.priorityScore}) indicates ready for direct approach`,
        timeline: '7 days',
        expectedOutcome: 'Demo booking probability: 75%'
      });
    }

    return suggestions;
  }

  private async triggerABMAlerts(organizationId: number, accounts: any[]): Promise<void> {
    if (accounts.length > 0) {
      await this.createAlert(organizationId, {
        severity: 'high',
        title: 'ABM Alert: High-Priority Accounts',
        description: `${accounts.length} high-priority accounts ready for coordinated marketing campaign`,
        accountsAffected: accounts.map(a => a.id),
        suggestedActions: [
          'Create targeted ad campaigns',
          'Develop account-specific content',
          'Coordinate sales and marketing outreach',
          'Set up account-based tracking'
        ]
      });
    }
  }

  private async createAccountMonitoringTrigger(organizationId: number, account: any): Promise<void> {
    await this.addTrigger({
      organizationId,
      name: `Account Monitor: ${account.name}`,
      type: 'engagement_spike',
      conditions: [
        { field: 'engagement_score', operator: 'increases_by', value: 20, timeframe: '24h' }
      ],
      actions: [
        { type: 'notify_team', config: { message: `Engagement spike detected for ${account.name}` } }
      ],
      priority: 'medium',
      active: true
    });
  }

  private async generateLinkedInSequence(
    account: any,
    mode: string,
    industryContext: any,
    orgInsights: any
  ): Promise<any> {
    const prompt = `Generate a LinkedIn sequence for ${account.name} in ${mode} mode.
Industry: ${account.industry}
Context: ${JSON.stringify(industryContext)}
Organization insights: ${JSON.stringify(orgInsights)}
Create 3-4 posts with industry-specific messaging.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a LinkedIn outreach strategist. Generate sequences based on account intelligence and organizational insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  }

  private async getIndustryContext(industry: string): Promise<any> {
    return {
      challenges: ['Digital transformation', 'Quality assurance'],
      trends: ['AI adoption', 'Automation'],
      competitors: ['Industry Leader A', 'Industry Leader B']
    };
  }

  private async getOrganizationInsights(organizationId: number): Promise<any> {
    return {
      bestPerformingContent: 'Trust-based approaches',
      topIndustries: ['Technology', 'Finance'],
      successMetrics: { responseRate: 25, conversionRate: 12 }
    };
  }

  private calculateSequenceTimeline(sequence: any): string {
    return '14 days'; // Simulate timeline calculation
  }

  private predictSequenceOutcome(sequence: any, account: any): string {
    return 'Meeting booking probability: 65%'; // Simulate outcome prediction
  }

  private async getAllOrganizations(): Promise<number[]> {
    return [1]; // Simulate organization IDs
  }

  private async evaluateAllTriggers(organizationId: number): Promise<void> {
    // Evaluate all triggers for the organization
    const triggers = Array.from(this.triggers.values())
      .filter(t => t.organizationId === organizationId && t.active);

    // Implementation would evaluate each trigger
    console.log(`Evaluating ${triggers.length} triggers for organization ${organizationId}`);
  }

  private calculateTriggerEffectiveness(trigger: MonitoringTrigger): number {
    // Calculate how effective a trigger has been
    return Math.random() * 100; // Simulate effectiveness score
  }

  private calculateAccountHealth(organizationId: number): any[] {
    // Calculate health metrics for accounts
    return [
      { accountId: 'account-1', healthScore: 85, trend: 'improving' },
      { accountId: 'account-2', healthScore: 72, trend: 'stable' },
      { accountId: 'account-3', healthScore: 91, trend: 'improving' }
    ];
  }

  private async notifyTeam(organizationId: number, config: any, account: any): Promise<void> {
    console.log(`Notifying team: ${config.message} for account: ${account.name}`);
  }

  private async updateAccountPriority(account: any, config: any): Promise<void> {
    console.log(`Updating account priority: ${account.name} to ${config.priority}`);
  }

  private async generatePriorityContent(account: any, config: any): Promise<void> {
    console.log(`Generating priority content for: ${account.name} with approach: ${config.approach}`);
  }

  private async triggerABMAlert(organizationId: number, account: any, config: any): Promise<void> {
    console.log(`Triggering ABM alert for: ${account.name} with priority: ${config.priority}`);
  }

  private async triggerSequence(account: any, config: any): Promise<void> {
    console.log(`Triggering sequence: ${config.sequence} for account: ${account.name}`);
  }
}

export const proactiveMonitoring = new ProactiveMonitoringEngine();