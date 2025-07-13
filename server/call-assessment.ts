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
  category: 'CRM Update' | 'Customer Follow-Up' | 'Demo/Meeting Scheduling' | 
           'Documentation Request' | 'Internal Coordination' | 'Champion Development' |
           'Objection Handling' | 'Competitive Intel';
  platform: string;
  link: string;
}

export interface SalesGrading {
  rapport: number; // 1-5
  tone_match: number; // 1-5
  clarity: number; // 1-5
  discovery: number; // 1-5
  storytelling: number; // 1-5
  closing: number; // 1-5
}

export interface CoachingNote {
  quote: string;
  reasoning: string;
}

export interface CallAssessment {
  call_id: string;
  date: string;
  participants: CallParticipant[];
  summary: string;
  action_items: ActionItem[];
  grading: SalesGrading;
  coaching_notes: CoachingNote[];
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

  private async generateAssessment(
    transcript: string,
    metadata?: { title?: string; date?: string; participants?: string[] },
    participants?: string[]
  ): Promise<CallAssessment> {
    const prompt = `
You are a sales call assessment AI. Analyze this sales call transcript and return a structured JSON assessment.

TRANSCRIPT:
${transcript}

METADATA:
- Title: ${metadata?.title || 'Sales Call'}
- Date: ${metadata?.date || new Date().toISOString().split('T')[0]}
- Participants: ${participants?.join(', ') || 'Unknown'}

REQUIREMENTS:
1. Extract ALL action items and categorize them exactly as:
   - CRM Update, Customer Follow-Up, Demo/Meeting Scheduling, Documentation Request,
   - Internal Coordination, Champion Development, Objection Handling, Competitive Intel

2. Analyze each speaker's sentiment (positive/neutral/negative), energy_level (low/medium/high), 
   and influence score (1-10)

3. Grade sales behaviors (1-5 scale):
   - rapport: Rapport & Trust Building
   - tone_match: Tone Matching  
   - clarity: Clarity of Response
   - discovery: Discovery Depth
   - storytelling: Storytelling Effectiveness
   - closing: Call-to-Action & Next Steps Clarity

4. Identify coachable moments with specific quotes and reasoning

Return ONLY valid JSON in this exact format:
{
  "call_id": "unique_id",
  "date": "YYYY-MM-DD",
  "participants": [
    {
      "name": "string",
      "role": "Sales" | "Prospect", 
      "sentiment": "positive" | "neutral" | "negative",
      "energy_level": "low" | "medium" | "high",
      "influence": 1-10
    }
  ],
  "summary": "Concise paragraph summary",
  "action_items": [
    {
      "task": "description",
      "category": "exact_category_from_list",
      "platform": "platform_name",
      "link": "placeholder_url"
    }
  ],
  "grading": {
    "rapport": 1-5,
    "tone_match": 1-5,
    "clarity": 1-5,
    "discovery": 1-5,
    "storytelling": 1-5,
    "closing": 1-5
  },
  "coaching_notes": [
    {
      "quote": "exact quote from transcript",
      "reasoning": "coaching insight"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a sales call assessment expert. Return only valid JSON as specified."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
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
      
      const assessment = JSON.parse(cleanedResponse.trim());
      
      // Enhance action items with proper platform links
      assessment.action_items = assessment.action_items.map((item: any) => {
        const platformInfo = this.categoryPlatformMap[item.category as keyof typeof this.categoryPlatformMap];
        return {
          ...item,
          platform: platformInfo?.platform || item.platform,
          link: platformInfo?.link || item.link
        };
      });

      // Generate unique ID if not provided
      assessment.call_id = assessment.call_id || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
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
      date: "2025-01-12",
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
      summary: "Discovery call with Sarah Johnson (QA Director at TechCorp) discussing their manual testing challenges and Avo Automation's potential to reduce testing time by 80%. Strong interest shown in D365 integration capabilities.",
      action_items: [
        {
          task: "Send ROI calculator showing 80% testing time reduction",
          category: "Customer Follow-Up",
          platform: "Eloquas Messaging",
          link: "https://eloquas.ai/follow-up-composer"
        },
        {
          task: "Schedule technical demo of D365 integration",
          category: "Demo/Meeting Scheduling",
          platform: "Outlook Calendar",
          link: "https://outlook.office.com/calendar/event/new"
        },
        {
          task: "Send D365 testing automation case studies",
          category: "Documentation Request",
          platform: "Avo Automation Docs",
          link: "https://avoautomation.com/resources/d365"
        },
        {
          task: "Update opportunity stage to 'Technical Evaluation'",
          category: "CRM Update",
          platform: "Salesforce",
          link: "https://salesforce.com/opportunity/placeholder"
        }
      ],
      grading: {
        rapport: 4,
        tone_match: 4,
        clarity: 3,
        discovery: 5,
        storytelling: 3,
        closing: 4
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
      rapport: assessments.reduce((sum, a) => sum + a.grading.rapport, 0) / assessments.length,
      tone_match: assessments.reduce((sum, a) => sum + a.grading.tone_match, 0) / assessments.length,
      clarity: assessments.reduce((sum, a) => sum + a.grading.clarity, 0) / assessments.length,
      discovery: assessments.reduce((sum, a) => sum + a.grading.discovery, 0) / assessments.length,
      storytelling: assessments.reduce((sum, a) => sum + a.grading.storytelling, 0) / assessments.length,
      closing: assessments.reduce((sum, a) => sum + a.grading.closing, 0) / assessments.length
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