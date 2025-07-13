import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PersonalizationData {
  firstName: string;
  lastName: string;
  company: string;
  role: string;
  industry: string;
  painPoints: string[];
  recentAchievement?: string;
  sharedConnection?: string;
  mutualInterest?: string;
  eventName?: string;
  eventDate?: string;
  keyInsights?: string[];
}

interface MessageTemplate {
  id: string;
  type: 'general_outreach_1' | 'general_outreach_2' | 'pre_event' | 'did_not_register' | 
        'registered_no_attend' | 'post_event' | 'nurture';
  subject: string;
  body: string;
  trustStoryScore: number;
  trustStoryNote: string;
  suggestedTiming: string;
  wordCount: number;
}

interface OutreachSequence {
  id: string;
  name: string;
  type: 'general' | 'event' | 'nurture';
  templates: MessageTemplate[];
  cadence: string[];
  totalDuration: string;
}

interface OutreachCampaign {
  id: string;
  userId: number;
  prospectId: number;
  sequenceId: string;
  personalizationData: PersonalizationData;
  messages: GeneratedMessage[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  performance: CampaignPerformance;
}

interface GeneratedMessage {
  id: string;
  templateType: string;
  subject: string;
  body: string;
  scheduledFor: Date;
  sentAt?: Date;
  status: 'scheduled' | 'sent' | 'opened' | 'replied' | 'bounced';
  trustStoryScore: number;
  wordCount: number;
}

interface CampaignPerformance {
  sentCount: number;
  openRate: number;
  replyRate: number;
  meetingBookings: number;
  trustScoreAvg: number;
  storyScoreAvg: number;
}

export class EloquasOutreachEngine {
  private campaigns: Map<string, OutreachCampaign> = new Map();
  private sequences: Map<string, OutreachSequence> = new Map();

  constructor() {
    this.initializeDefaultSequences();
  }

  private initializeDefaultSequences() {
    // General Outreach Sequence
    this.sequences.set('general_outreach', {
      id: 'general_outreach',
      name: 'General QA & Enterprise Systems Outreach',
      type: 'general',
      templates: [],
      cadence: ['Day 1: Initial', 'Day 3: Follow-up', 'Day 7: Final nudge'],
      totalDuration: '7 days'
    });

    // Event-Driven Sequence
    this.sequences.set('event_driven', {
      id: 'event_driven',
      name: 'Event-Driven Engagement',
      type: 'event',
      templates: [],
      cadence: ['7 days before', '2 days before', 'Day +1 post-event', 'Day +3 recap'],
      totalDuration: '10 days'
    });

    // Nurture Sequence
    this.sequences.set('nurture_campaign', {
      id: 'nurture_campaign',
      name: 'Ongoing Value-Add Nurture',
      type: 'nurture',
      templates: [],
      cadence: ['Every 2-4 weeks'],
      totalDuration: 'Ongoing'
    });
  }

  async generateTemplate(
    templateType: MessageTemplate['type'], 
    personalizationData: PersonalizationData
  ): Promise<MessageTemplate> {
    const templateSpecs = this.getTemplateSpecifications(templateType);
    
    // Use proven Dynamics 365 QA automation templates based on performance data
    const d365Templates = this.getDynamics365Template(templateType, personalizationData);
    if (d365Templates) {
      return d365Templates;
    }

    const prompt = `You are Eloquas AI, a specialized sales outreach engine for Dynamics 365 QA automation.

Generate a ${templateType.replace(/_/g, ' ')} email using proven Avo Automation messaging:

PERSONALIZATION DATA:
- Name: ${personalizationData.firstName} ${personalizationData.lastName}
- Company: ${personalizationData.company}
- Role: ${personalizationData.role}
- Industry: ${personalizationData.industry}
- Pain Points: ${personalizationData.painPoints.join(', ')}

KEY MESSAGING FRAMEWORK:
- 99.9% uptime = 8.76 hours downtime = $4.7M annual cost
- Avo cuts testing time by 5x, reduces maintenance 30-50%
- Self-healing automation prevents script breakage
- Focus on Dynamics 365, QA automation, enterprise systems

TEMPLATE TYPE: ${templateSpecs.description}
CONTEXT: ${templateSpecs.context}

Generate email with subject and body (40-80 words max):`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are Eloquas AI, expert at crafting personalized, trust-building outreach messages for QA and enterprise systems professionals. Follow the modular architecture precisely and keep messages concise (40-80 words)."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const content = response.choices[0].message.content || "";
      const { subject, body } = this.parseEmailContent(content);
      const wordCount = body.split(/\s+/).filter(word => word.length > 0).length;
      const trustStoryScore = this.calculateTrustStoryScore(body, personalizationData);

      return {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: templateType,
        subject,
        body,
        trustStoryScore,
        trustStoryNote: this.generateTrustStoryNote(templateType, trustStoryScore),
        suggestedTiming: templateSpecs.timing,
        wordCount
      };
    } catch (error) {
      console.error('Error generating template:', error);
      throw new Error('Failed to generate outreach template');
    }
  }

  private getTemplateSpecifications(templateType: MessageTemplate['type']) {
    const specs = {
      'general_outreach_1': {
        description: 'Initial brand awareness and trust-building message',
        context: 'First contact to establish credibility and share valuable insights',
        timing: 'Day 1 - Initial outreach'
      },
      'general_outreach_2': {
        description: 'Follow-up with additional value and softer CTA',
        context: 'Second touchpoint with different angle and continued value',
        timing: 'Day 3 - Follow-up'
      },
      'pre_event': {
        description: 'Invitation to upcoming industry event or webinar',
        context: 'Pre-event engagement with exclusive invitation',
        timing: '7 days before event'
      },
      'did_not_register': {
        description: 'Recap for those who missed event registration',
        context: 'Share key insights and offer alternative engagement',
        timing: 'Day +1 after event'
      },
      'registered_no_attend': {
        description: 'Follow-up for registered but no-show attendees',
        context: 'Provide missed content and maintain engagement',
        timing: 'Day +1 after event'
      },
      'post_event': {
        description: 'Thank you and next steps for event attendees',
        context: 'Post-event nurture with continued value',
        timing: 'Day +1 after event'
      },
      'nurture': {
        description: 'Ongoing value-add touchpoint with industry insights',
        context: 'Periodic check-in with fresh insights or resources',
        timing: 'Every 2-4 weeks'
      }
    };

    return specs[templateType];
  }

  private parseEmailContent(content: string): { subject: string; body: string } {
    // Extract subject line and body from AI response
    const lines = content.trim().split('\n');
    let subject = '';
    let body = '';
    let inBody = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.toLowerCase().startsWith('subject:') || trimmedLine.toLowerCase().startsWith('subject line:')) {
        subject = trimmedLine.replace(/^subject:?\s*/i, '');
      } else if (trimmedLine.toLowerCase().startsWith('body:') || inBody) {
        if (trimmedLine.toLowerCase().startsWith('body:')) {
          body += trimmedLine.replace(/^body:\s*/i, '') + '\n';
        } else if (trimmedLine && !trimmedLine.startsWith('**') && !trimmedLine.startsWith('Subject')) {
          body += trimmedLine + '\n';
        }
        inBody = true;
      } else if (!subject && trimmedLine && !trimmedLine.startsWith('**')) {
        // If no explicit subject found, use first meaningful line
        subject = trimmedLine;
      }
    }

    return {
      subject: subject || 'Quick QA automation insight',
      body: body.trim() || content.trim()
    };
  }

  private getDynamics365Template(templateType: MessageTemplate['type'], personalizationData: PersonalizationData): MessageTemplate | null {
    const d365Templates = {
      'general_outreach_1': {
        subject: `${personalizationData.company} & $4.7M nobody budgets for`,
        body: `Hi ${personalizationData.firstName},

99.9% uptime still means **8.76 hours** of Dynamics downtime a year—≈**$4.7M** slipping out the door.
Teams that replaced manual tests with Avo's self‑healing automation cut those outages in half while shipping **5× faster**.

What's the single failure you never want to see in your next update cycle?

Best,
[Your Name]`
      },
      'general_outreach_2': {
        subject: `5× faster QA isn't hype`,
        body: `Hi ${personalizationData.firstName},

The last F&O release we touched shrank its full regression window from 10 days to 2—**5× faster**—without adding head‑count.
That freed **640 engineering hours** in a single quarter.

Curious which test suites you'd automate first at ${personalizationData.company}?

Best,
[Your Name]`
      }
    };

    const template = d365Templates[templateType as keyof typeof d365Templates];
    if (!template) return null;

    return {
      id: `d365_${templateType}_${Date.now()}`,
      type: templateType,
      subject: template.subject,
      body: template.body,
      trustStoryScore: 85, // High score for proven templates
      trustStoryNote: 'Using proven Dynamics 365 QA automation messaging',
      suggestedTiming: this.getTemplateSpecifications(templateType).timing,
      wordCount: template.body.split(/\s+/).filter(w => w.length > 0).length
    };
  }

  private calculateTrustStoryScore(body: string, personalizationData: PersonalizationData): number {
    let score = 50; // Base score

    // Check for personalization elements
    if (body.includes(personalizationData.firstName)) score += 10;
    if (body.includes(personalizationData.company)) score += 10;
    if (personalizationData.painPoints.some(pain => body.toLowerCase().includes(pain.toLowerCase()))) score += 15;

    // Check for proven D365/QA messaging
    if (body.includes('8.76 hours') || body.includes('$4.7M')) score += 20;
    if (body.includes('5× faster') || body.includes('30-50%')) score += 15;
    if (body.includes('Dynamics') || body.includes('automation')) score += 10;

    // Check for trust-building elements
    if (body.match(/\b(experience|learned|discovered|found|helped|reduced|improved)\b/i)) score += 10;
    
    // Check for story elements
    if (body.match(/\b(story|example|case|similar|like|recently|last week|just)\b/i)) score += 10;

    // Check for social proof
    if (body.match(/\b(client|customer|team|company|organization)\b/i)) score += 5;

    return Math.min(score, 100);
  }

  private generateTrustStoryNote(templateType: MessageTemplate['type'], score: number): string {
    const effectiveness = score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Low';
    
    const notes = {
      'general_outreach_1': `${effectiveness} trust-building through industry-specific insights and consultative tone. Story elements create relatability and credibility.`,
      'general_outreach_2': `${effectiveness} continued value delivery with different angle. Trust maintained through consistent helpful approach.`,
      'pre_event': `${effectiveness} exclusivity and insider access builds trust. Event context provides natural story framework.`,
      'did_not_register': `${effectiveness} generous value-sharing without attendance builds goodwill. Story of missed opportunity creates urgency.`,
      'registered_no_attend': `${effectiveness} understanding tone acknowledges missed event. Story provides value regardless of attendance.`,
      'post_event': `${effectiveness} gratitude and continued engagement. Shared experience creates strong trust foundation.`,
      'nurture': `${effectiveness} ongoing value without ask builds long-term trust. Fresh insights maintain story relevance.`
    };

    return notes[templateType] || `${effectiveness} trust and story effectiveness for outreach engagement.`;
  }

  async createCampaign(
    userId: number,
    prospectId: number,
    sequenceType: 'general' | 'event' | 'nurture',
    personalizationData: PersonalizationData
  ): Promise<OutreachCampaign> {
    const sequenceId = sequenceType === 'general' ? 'general_outreach' : 
                     sequenceType === 'event' ? 'event_driven' : 'nurture_campaign';
    
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) throw new Error('Sequence not found');

    // Generate messages based on sequence type
    const messages: GeneratedMessage[] = [];
    const templateTypes = this.getTemplateTypesForSequence(sequenceType);

    for (let i = 0; i < templateTypes.length; i++) {
      const template = await this.generateTemplate(templateTypes[i], personalizationData);
      const scheduledDate = this.calculateScheduledDate(sequenceType, i);

      messages.push({
        id: `msg_${Date.now()}_${i}`,
        templateType: template.type,
        subject: template.subject,
        body: template.body,
        scheduledFor: scheduledDate,
        status: 'scheduled',
        trustStoryScore: template.trustStoryScore,
        wordCount: template.wordCount
      });
    }

    const campaign: OutreachCampaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      prospectId,
      sequenceId,
      personalizationData,
      messages,
      status: 'draft',
      createdAt: new Date(),
      performance: {
        sentCount: 0,
        openRate: 0,
        replyRate: 0,
        meetingBookings: 0,
        trustScoreAvg: messages.reduce((sum, msg) => sum + msg.trustStoryScore, 0) / messages.length,
        storyScoreAvg: 0
      }
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  private getTemplateTypesForSequence(sequenceType: 'general' | 'event' | 'nurture'): MessageTemplate['type'][] {
    switch (sequenceType) {
      case 'general':
        return ['general_outreach_1', 'general_outreach_2'];
      case 'event':
        return ['pre_event', 'post_event', 'did_not_register'];
      case 'nurture':
        return ['nurture'];
      default:
        return ['general_outreach_1'];
    }
  }

  private calculateScheduledDate(sequenceType: 'general' | 'event' | 'nurture', messageIndex: number): Date {
    const now = new Date();
    const result = new Date(now);

    switch (sequenceType) {
      case 'general':
        const generalDays = [0, 3, 7];
        result.setDate(now.getDate() + (generalDays[messageIndex] || 0));
        break;
      case 'event':
        const eventDays = [-7, 1, 3]; // 7 days before, 1 day after, 3 days after
        result.setDate(now.getDate() + (eventDays[messageIndex] || 0));
        break;
      case 'nurture':
        result.setDate(now.getDate() + 14); // 2 weeks from now
        break;
    }

    return result;
  }

  async getCampaignsForUser(userId: number): Promise<OutreachCampaign[]> {
    return Array.from(this.campaigns.values())
      .filter(campaign => campaign.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateCampaignStatus(campaignId: string, status: OutreachCampaign['status']): Promise<OutreachCampaign | null> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return null;

    campaign.status = status;
    this.campaigns.set(campaignId, campaign);
    return campaign;
  }

  async trackMessagePerformance(campaignId: string, messageId: string, event: 'sent' | 'opened' | 'replied' | 'bounced'): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    const message = campaign.messages.find(msg => msg.id === messageId);
    if (!message) return;

    message.status = event;
    if (event === 'sent') {
      message.sentAt = new Date();
      campaign.performance.sentCount++;
    }

    // Update campaign performance metrics
    this.updateCampaignPerformance(campaign);
    this.campaigns.set(campaignId, campaign);
  }

  private updateCampaignPerformance(campaign: OutreachCampaign): void {
    const sentMessages = campaign.messages.filter(msg => msg.status !== 'scheduled');
    const openedMessages = campaign.messages.filter(msg => msg.status === 'opened' || msg.status === 'replied');
    const repliedMessages = campaign.messages.filter(msg => msg.status === 'replied');

    campaign.performance.openRate = sentMessages.length > 0 ? (openedMessages.length / sentMessages.length) * 100 : 0;
    campaign.performance.replyRate = sentMessages.length > 0 ? (repliedMessages.length / sentMessages.length) * 100 : 0;
  }

  getSequences(): OutreachSequence[] {
    return Array.from(this.sequences.values());
  }

  async getAnalytics(userId: number): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    averageTrustScore: number;
    averageReplyRate: number;
    totalMessagesSent: number;
  }> {
    const userCampaigns = await this.getCampaignsForUser(userId);
    
    return {
      totalCampaigns: userCampaigns.length,
      activeCampaigns: userCampaigns.filter(c => c.status === 'active').length,
      averageTrustScore: userCampaigns.reduce((sum, c) => sum + c.performance.trustScoreAvg, 0) / userCampaigns.length || 0,
      averageReplyRate: userCampaigns.reduce((sum, c) => sum + c.performance.replyRate, 0) / userCampaigns.length || 0,
      totalMessagesSent: userCampaigns.reduce((sum, c) => sum + c.performance.sentCount, 0)
    };
  }
}

export const eloquasOutreachEngine = new EloquasOutreachEngine();