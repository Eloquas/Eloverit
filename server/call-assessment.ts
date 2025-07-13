import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface CallParticipant {
  name: string;
  role: 'Sales' | 'Prospect';
  sentiment: 'positive' | 'neutral' | 'negative';
  energy_level: 'low' | 'medium' | 'high';
  influence: number; // 1-10
}

export interface ActionItem {
  task: string;
  category: 'Follow-up' | 'CRM Entry' | 'Documentation' | 'Demo Scheduling';
  urgency: 'High' | 'Medium' | 'Low';
}

export interface SalesGrading {
  rapport_trust: number; // 1-10
  discovery_depth: number; // 1-10
  tone_match_succinctness: number; // 1-10
  storytelling: number; // 1-10
  overall_score: number; // Average of above criteria
}

export interface CoachingNote {
  quote: string;
  reasoning: string;
}

export interface SentimentAnalysis {
  overall_sentiment: 'Positive' | 'Neutral' | 'Negative';
  urgency_detected: 'High' | 'Medium' | 'Low';
}

export interface TalkTimeEstimation {
  rep_percentage: number;
  prospect_percentage: number;
}

export interface CallAssessment {
  call_id: string;
  date: string;
  participants: CallParticipant[];
  summary: string;
  action_items: ActionItem[];
  grading: SalesGrading;
  coaching_notes: CoachingNote[];
  sentiment_analysis: SentimentAnalysis;
  talk_time_estimation: TalkTimeEstimation;
  transcript?: string;
  processed_at: string;
  processing_time_ms: number;
}

interface CallProcessingResult {
  success: boolean;
  assessment?: CallAssessment;
  error?: string;
  processing_time_ms: number;
}

export class CallAssessmentEngine {
  private categoryPlatformMap = {
    'CRM Update': {
      platform: 'Salesforce',
      link: 'https://salesforce.com/opportunity/placeholder'
    },
    'Customer Follow-Up': {
      platform: 'Eloquas Messaging',
      link: 'https://eloquas.ai/follow-up-composer'
    },
    'Demo/Meeting Scheduling': {
      platform: 'Outlook Calendar',
      link: 'https://outlook.office.com/calendar/event/new'
    },
    'Documentation Request': {
      platform: 'Avo Automation Docs',
      link: 'https://avoautomation.com/resources/d365'
    },
    'Internal Coordination': {
      platform: 'Internal Platform',
      link: 'https://internal.platform/action-item'
    },
    'Champion Development': {
      platform: 'Coaching Tool',
      link: 'https://coaching.platform/champion-plan'
    },
    'Objection Handling': {
      platform: 'Knowledge Base',
      link: 'https://kb.company.com/objections/handling'
    },
    'Competitive Intel': {
      platform: 'CI Dashboard',
      link: 'https://ci.company.com/competitor/placeholder'
    }
  };

  async processCallTranscript(transcript: string, metadata?: {
    title?: string;
    date?: string;
    participants?: string[];
  }): Promise<CallProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Clean and validate transcript
      const cleanTranscript = this.cleanTranscript(transcript);
      
      if (!cleanTranscript || cleanTranscript.trim().length < 50) {
        return {
          success: false,
          error: 'Transcript too short or empty. Please ensure your transcript has at least 50 characters.',
          processing_time_ms: Date.now() - startTime
        };
      }

      // Extract participants from transcript if not provided
      const participants = this.extractParticipants(cleanTranscript, metadata?.participants);
      
      // Generate AI analysis
      const assessment = await this.generateAssessment(cleanTranscript, metadata, participants);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        assessment: {
          ...assessment,
          transcript: cleanTranscript,
          processing_time_ms: processingTime,
          processed_at: new Date().toISOString()
        },
        processing_time_ms: processingTime
      };
    } catch (error) {
      console.error('Call assessment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed. Please check your transcript format and try again.',
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  private cleanTranscript(transcript: string): string {
    if (!transcript) return '';
    
    // Remove common file artifacts and clean up formatting
    return transcript
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/^\uFEFF/, '') // Remove BOM
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters that might cause issues
      .trim();
  }

  private extractParticipants(transcript: string, providedParticipants?: string[]): string[] {
    // Extract speaker names from transcript (e.g., "Alex:", "Jenna:")
    const speakerPattern = /^([A-Za-z\s]+):/gm;
    const matches = transcript.match(speakerPattern);
    
    if (matches) {
      const speakers = Array.from(new Set(
        matches.map(match => match.replace(':', '').trim())
      ));
      return speakers;
    }
    
    return providedParticipants || ['Unknown Speaker'];
  }

  // Plot webhook integration
  async processPlotWebhook(webhookData: any): Promise<CallProcessingResult> {
    const startTime = Date.now();
    
    try {
      const transcript = webhookData.transcript || webhookData.content || '';
      const metadata = {
        title: webhookData.title || 'Plot Webhook Call',
        date: webhookData.date || new Date().toISOString().split('T')[0],
        participants: webhookData.participants
      };

      return await this.processCallTranscript(transcript, metadata);
    } catch (error) {
      console.error('Plot webhook processing failed:', error);
      return {
        success: false,
        error: 'Failed to process Plot webhook data',
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  private async generateAssessment(
    transcript: string,
    metadata?: { title?: string; date?: string; participants?: string[] },
    participants?: string[]
  ): Promise<CallAssessment> {
    const prompt = `Analyze the provided call transcript. Generate the following structured JSON output:
{
  "summary": "Brief, actionable summary (50-80 words)",
  "action_items": [
    {"category": "Follow-up | CRM Entry | Documentation | Demo Scheduling", "task": "Brief description of action", "urgency": "High | Medium | Low"}
  ],
  "call_grade": {
    "rapport_trust": "1-10",
    "discovery_depth": "1-10",
    "tone_match_succinctness": "1-10",
    "storytelling": "1-10",
    "overall_score": "Average of above criteria"
  },
  "sentiment_analysis": {
    "overall_sentiment": "Positive | Neutral | Negative",
    "urgency_detected": "High | Medium | Low"
  },
  "talk_time_estimation": {
    "rep_percentage": "Estimated % of total speaking",
    "prospect_percentage": "Estimated % of total speaking"
  }
}

TRANSCRIPT:
${transcript}

METADATA:
- Title: ${metadata?.title || 'Sales Call'}
- Date: ${metadata?.date || new Date().toISOString().split('T')[0]}
- Participants: ${participants?.join(', ') || 'Unknown'}

Requirements:
1. Categorize action items exactly as: Follow-up, CRM Entry, Documentation, Demo Scheduling
2. Grade call on 1-10 scale for rapport/trust-building, discovery question depth, tone match and succinctness, storytelling effectiveness
3. Analyze overall sentiment and urgency level
4. Estimate talk-time distribution as percentages (beta functionality)
5. Identify coachable moments with specific quotes

Analyze each speaker's sentiment, energy level, and influence score.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a sales call assessment expert specializing in sales coaching and performance analysis. Return only valid JSON."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2500
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    try {
      // Clean the response - remove code blocks and extra whitespace  
      let cleanedResponse = response.trim();
      
      // Remove ```json and ``` if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const aiResult = JSON.parse(cleanedResponse.trim());

      // Map AI response to our CallAssessment format
      const assessment: CallAssessment = {
        call_id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: metadata?.date || new Date().toISOString().split('T')[0],
        participants: participants?.map(name => ({
          name,
          role: name.toLowerCase().includes('rep') || name.toLowerCase().includes('sales') ? 'Sales' : 'Prospect',
          sentiment: 'neutral',
          energy_level: 'medium',
          influence: 5
        })) || [],
        summary: aiResult.summary || '',
        action_items: aiResult.action_items || [],
        grading: aiResult.call_grade || {
          rapport_trust: 5,
          discovery_depth: 5,
          tone_match_succinctness: 5,
          storytelling: 5,
          overall_score: 5
        },
        coaching_notes: aiResult.coaching_notes || [],
        sentiment_analysis: aiResult.sentiment_analysis || {
          overall_sentiment: 'Neutral',
          urgency_detected: 'Medium'
        },
        talk_time_estimation: aiResult.talk_time_estimation || {
          rep_percentage: 50,
          prospect_percentage: 50
        },
        processed_at: new Date().toISOString(),
        processing_time_ms: 0
      };
      
      return assessment;
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      console.error('Parse error details:', parseError);
      throw new Error('Invalid JSON response from AI assessment');
    }
  }

  async getMockAssessment(): Promise<CallAssessment> {
    return {
      call_id: "demo_call_2025_001",
      date: "2025-01-13",
      participants: [
        {
          name: "Alex Chen",
          role: "Sales",
          sentiment: "positive",
          energy_level: "high",
          influence: 8
        },
        {
          name: "Sarah Johnson",
          role: "Prospect",
          sentiment: "neutral",
          energy_level: "medium",
          influence: 6
        }
      ],
      summary: "Discovery call with Sarah Johnson (QA Director at TechCorp) discussing manual testing challenges. Strong interest in Avo Automation's D365 integration and 80% testing time reduction capabilities. Next steps include technical demo and ROI analysis.",
      action_items: [
        {
          task: "Send ROI calculator showing 80% testing time reduction",
          category: "Follow-up",
          urgency: "High"
        },
        {
          task: "Schedule technical demo of D365 integration",
          category: "Demo Scheduling",
          urgency: "High"
        },
        {
          task: "Send D365 testing automation case studies",
          category: "Documentation",
          urgency: "Medium"
        },
        {
          task: "Update opportunity stage to 'Technical Evaluation'",
          category: "CRM Entry",
          urgency: "Medium"
        }
      ],
      grading: {
        rapport_trust: 8,
        discovery_depth: 9,
        tone_match_succinctness: 7,
        storytelling: 6,
        overall_score: 7.5
      },
      sentiment_analysis: {
        overall_sentiment: "Positive",
        urgency_detected: "High"
      },
      talk_time_estimation: {
        rep_percentage: 45,
        prospect_percentage: 55
      },
      coaching_notes: [
        {
          quote: "We're still trying to understand how this would fit into our workflow.",
          reasoning: "Coach on asking clearer discovery questions to align with the buyer's existing process before positioning solution."
        },
        {
          quote: "That's interesting, let me tell you about our D365 integration...",
          reasoning: "Great example of active listening and connecting prospect's pain point to specific solution capability."
        }
      ],
      processed_at: new Date().toISOString(),
      processing_time_ms: 2340
    };
  }

  getAssessmentStats(assessments: CallAssessment[]) {
    if (assessments.length === 0) {
      return {
        totalCalls: 0,
        avgGrading: null,
        topCoachingAreas: [],
        avgProcessingTime: 0
      };
    }

    const avgGrading = {
      rapport_trust: assessments.reduce((sum, a) => sum + a.grading.rapport_trust, 0) / assessments.length,
      discovery_depth: assessments.reduce((sum, a) => sum + a.grading.discovery_depth, 0) / assessments.length,
      tone_match_succinctness: assessments.reduce((sum, a) => sum + a.grading.tone_match_succinctness, 0) / assessments.length,
      storytelling: assessments.reduce((sum, a) => sum + a.grading.storytelling, 0) / assessments.length,
      overall_score: assessments.reduce((sum, a) => sum + a.grading.overall_score, 0) / assessments.length
    };

    const topCoachingAreas = Object.entries(avgGrading)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 3)
      .map(([skill, score]) => ({ skill, score: Math.round(score * 10) / 10 }));

    const avgProcessingTime = assessments.reduce((sum, a) => sum + a.processing_time_ms, 0) / assessments.length;

    return {
      totalCalls: assessments.length,
      avgGrading,
      topCoachingAreas,
      avgProcessingTime: Math.round(avgProcessingTime)
    };
  }
}

export const callAssessmentEngine = new CallAssessmentEngine();