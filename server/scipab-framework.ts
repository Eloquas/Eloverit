import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface SCIPABFramework {
  situation: {
    currentState: string;
    businessContext: string;
    systemsInUse: string[];
    teamStructure: string;
  };
  complication: {
    primaryChallenges: string[];
    operationalPainPoints: string[];
    riskFactors: string[];
    inefficiencies: string[];
  };
  implication: {
    businessImpact: string[];
    costImplications: string[];
    riskConsequences: string[];
    competitiveDisadvantages: string[];
  };
  position: {
    solutionOverview: string;
    valueProposition: string[];
    differentiators: string[];
    strategicFit: string;
  };
  ask: {
    specificRequest: string;
    nextSteps: string[];
    timeline: string;
    decisionMakers: string[];
  };
  benefit: {
    quantifiableOutcomes: string[];
    strategicAdvantages: string[];
    transformationalImpact: string;
    roi: string;
  };
}

export interface SPINFramework {
  situation: {
    currentProcesses: string[];
    existingSystems: string[];
    teamSize: string;
    currentApproach: string;
  };
  problem: {
    identifiedChallenges: string[];
    frequencyOfIssues: string;
    impactOnOperations: string[];
    stakeholderFrustrations: string[];
  };
  implication: {
    continuedPainPoints: string[];
    escalatingCosts: string[];
    competitiveRisks: string[];
    stakeholderImpact: string[];
  };
  needPayoff: {
    desiredOutcomes: string[];
    successMetrics: string[];
    transformationGoals: string[];
    stakeholderBenefits: string[];
  };
}

export class SCIPABGenerator {
  async generateSCIPABFramework(
    companyName: string,
    industry: string,
    companySize: string,
    currentSystems: string[],
    painPoints: string[],
    initiatives: string[],
    jobPostings: string[]
  ): Promise<SCIPABFramework> {
    const prompt = this.buildSCIPABPrompt(
      companyName, industry, companySize, currentSystems, 
      painPoints, initiatives, jobPostings
    );

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a senior sales consultant specializing in QA automation and enterprise systems. Generate detailed SCIPAB framework analysis based on the provided company intelligence. Focus on quality assurance, test automation, and software delivery optimization opportunities."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 3000
      });

      const scipabData = JSON.parse(response.choices[0]?.message?.content || '{}');
      return this.validateAndStructureSCIPAB(scipabData);
    } catch (error) {
      console.error('SCIPAB generation error:', error);
      return this.generateFallbackSCIPAB(companyName, industry, currentSystems, painPoints);
    }
  }

  async generateSPINFramework(
    companyName: string,
    industry: string,
    currentSystems: string[],
    painPoints: string[],
    jobPostings: string[]
  ): Promise<SPINFramework> {
    const prompt = this.buildSPINPrompt(companyName, industry, currentSystems, painPoints, jobPostings);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert sales consultant using SPIN selling methodology. Generate comprehensive SPIN analysis for QA automation and enterprise systems optimization opportunities."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2500
      });

      const spinData = JSON.parse(response.choices[0]?.message?.content || '{}');
      return this.validateAndStructureSPIN(spinData);
    } catch (error) {
      console.error('SPIN generation error:', error);
      return this.generateFallbackSPIN(companyName, industry, currentSystems, painPoints);
    }
  }

  private buildSCIPABPrompt(
    companyName: string,
    industry: string,
    companySize: string,
    currentSystems: string[],
    painPoints: string[],
    initiatives: string[],
    jobPostings: string[]
  ): string {
    return `
# SCIPAB Framework Analysis for ${companyName}

## Company Intelligence
- **Industry**: ${industry}
- **Company Size**: ${companySize}
- **Current Systems**: ${currentSystems.join(', ')}
- **Identified Pain Points**: ${painPoints.join(', ')}
- **Current Initiatives**: ${initiatives.join(', ')}
- **Recent Job Postings**: ${jobPostings.join(', ')}

## SCIPAB Framework Requirements

Generate a comprehensive SCIPAB analysis focused on QA automation, test automation, and software delivery optimization opportunities.

### Key Focus Areas:
1. **Test Automation & Quality Assurance**
   - Manual testing inefficiencies
   - Quality bottlenecks in delivery
   - Defect detection delays
   - Test coverage gaps

2. **Software Delivery Optimization**
   - CI/CD pipeline maturity
   - Release cycle speed
   - Deployment risks
   - Time-to-market challenges

3. **Enterprise System Integration**
   - System testing complexity
   - Cross-platform quality
   - Integration testing gaps
   - Data quality issues

## Response Format
Return a JSON object with this exact structure:

\`\`\`json
{
  "situation": {
    "currentState": "Current QA and software delivery state",
    "businessContext": "Business context and market pressures",
    "systemsInUse": ["system1", "system2"],
    "teamStructure": "Current team structure and roles"
  },
  "complication": {
    "primaryChallenges": ["challenge1", "challenge2"],
    "operationalPainPoints": ["pain1", "pain2"],
    "riskFactors": ["risk1", "risk2"],
    "inefficiencies": ["inefficiency1", "inefficiency2"]
  },
  "implication": {
    "businessImpact": ["impact1", "impact2"],
    "costImplications": ["cost1", "cost2"],
    "riskConsequences": ["consequence1", "consequence2"],
    "competitiveDisadvantages": ["disadvantage1", "disadvantage2"]
  },
  "position": {
    "solutionOverview": "High-level solution positioning",
    "valueProposition": ["value1", "value2"],
    "differentiators": ["diff1", "diff2"],
    "strategicFit": "Why this solution fits their strategy"
  },
  "ask": {
    "specificRequest": "Specific request or call to action",
    "nextSteps": ["step1", "step2"],
    "timeline": "Suggested timeline",
    "decisionMakers": ["role1", "role2"]
  },
  "benefit": {
    "quantifiableOutcomes": ["80% reduction in testing time", "60% faster releases"],
    "strategicAdvantages": ["advantage1", "advantage2"],
    "transformationalImpact": "Long-term transformation impact",
    "roi": "Expected ROI and timeframe"
  }
}
\`\`\`

Focus on authentic, industry-specific insights based on the provided company intelligence.
    `;
  }

  private buildSPINPrompt(
    companyName: string,
    industry: string,
    currentSystems: string[],
    painPoints: string[],
    jobPostings: string[]
  ): string {
    return `
# SPIN Selling Framework Analysis for ${companyName}

## Company Intelligence
- **Industry**: ${industry}
- **Current Systems**: ${currentSystems.join(', ')}
- **Pain Points**: ${painPoints.join(', ')}
- **Job Postings**: ${jobPostings.join(', ')}

Generate a comprehensive SPIN analysis for QA automation and software delivery optimization.

## Response Format
\`\`\`json
{
  "situation": {
    "currentProcesses": ["process1", "process2"],
    "existingSystems": ["system1", "system2"],
    "teamSize": "Team size and structure",
    "currentApproach": "Current approach to QA and testing"
  },
  "problem": {
    "identifiedChallenges": ["challenge1", "challenge2"],
    "frequencyOfIssues": "How often problems occur",
    "impactOnOperations": ["impact1", "impact2"],
    "stakeholderFrustrations": ["frustration1", "frustration2"]
  },
  "implication": {
    "continuedPainPoints": ["pain1", "pain2"],
    "escalatingCosts": ["cost1", "cost2"],
    "competitiveRisks": ["risk1", "risk2"],
    "stakeholderImpact": ["impact1", "impact2"]
  },
  "needPayoff": {
    "desiredOutcomes": ["outcome1", "outcome2"],
    "successMetrics": ["metric1", "metric2"],
    "transformationGoals": ["goal1", "goal2"],
    "stakeholderBenefits": ["benefit1", "benefit2"]
  }
}
\`\`\`
    `;
  }

  private validateAndStructureSCIPAB(data: any): SCIPABFramework {
    return {
      situation: {
        currentState: data.situation?.currentState || 'Current state analysis pending',
        businessContext: data.situation?.businessContext || 'Business context assessment needed',
        systemsInUse: data.situation?.systemsInUse || [],
        teamStructure: data.situation?.teamStructure || 'Team structure analysis required'
      },
      complication: {
        primaryChallenges: data.complication?.primaryChallenges || [],
        operationalPainPoints: data.complication?.operationalPainPoints || [],
        riskFactors: data.complication?.riskFactors || [],
        inefficiencies: data.complication?.inefficiencies || []
      },
      implication: {
        businessImpact: data.implication?.businessImpact || [],
        costImplications: data.implication?.costImplications || [],
        riskConsequences: data.implication?.riskConsequences || [],
        competitiveDisadvantages: data.implication?.competitiveDisadvantages || []
      },
      position: {
        solutionOverview: data.position?.solutionOverview || 'Solution positioning to be developed',
        valueProposition: data.position?.valueProposition || [],
        differentiators: data.position?.differentiators || [],
        strategicFit: data.position?.strategicFit || 'Strategic fit analysis pending'
      },
      ask: {
        specificRequest: data.ask?.specificRequest || 'Specific request to be formulated',
        nextSteps: data.ask?.nextSteps || [],
        timeline: data.ask?.timeline || 'Timeline to be determined',
        decisionMakers: data.ask?.decisionMakers || []
      },
      benefit: {
        quantifiableOutcomes: data.benefit?.quantifiableOutcomes || [],
        strategicAdvantages: data.benefit?.strategicAdvantages || [],
        transformationalImpact: data.benefit?.transformationalImpact || 'Transformation impact analysis pending',
        roi: data.benefit?.roi || 'ROI calculation in progress'
      }
    };
  }

  private validateAndStructureSPIN(data: any): SPINFramework {
    return {
      situation: {
        currentProcesses: data.situation?.currentProcesses || [],
        existingSystems: data.situation?.existingSystems || [],
        teamSize: data.situation?.teamSize || 'Team size assessment needed',
        currentApproach: data.situation?.currentApproach || 'Current approach analysis required'
      },
      problem: {
        identifiedChallenges: data.problem?.identifiedChallenges || [],
        frequencyOfIssues: data.problem?.frequencyOfIssues || 'Issue frequency analysis needed',
        impactOnOperations: data.problem?.impactOnOperations || [],
        stakeholderFrustrations: data.problem?.stakeholderFrustrations || []
      },
      implication: {
        continuedPainPoints: data.implication?.continuedPainPoints || [],
        escalatingCosts: data.implication?.escalatingCosts || [],
        competitiveRisks: data.implication?.competitiveRisks || [],
        stakeholderImpact: data.implication?.stakeholderImpact || []
      },
      needPayoff: {
        desiredOutcomes: data.needPayoff?.desiredOutcomes || [],
        successMetrics: data.needPayoff?.successMetrics || [],
        transformationGoals: data.needPayoff?.transformationGoals || [],
        stakeholderBenefits: data.needPayoff?.stakeholderBenefits || []
      }
    };
  }

  private generateFallbackSCIPAB(
    companyName: string,
    industry: string,
    currentSystems: string[],
    painPoints: string[]
  ): SCIPABFramework {
    return {
      situation: {
        currentState: `${companyName} operates in the ${industry} industry with existing systems including ${currentSystems.slice(0, 3).join(', ')}`,
        businessContext: `Competitive pressures in ${industry} require efficient software delivery and quality assurance`,
        systemsInUse: currentSystems,
        teamStructure: "Distributed development and QA teams across multiple locations"
      },
      complication: {
        primaryChallenges: painPoints.length > 0 ? painPoints : ["Manual testing bottlenecks", "Inconsistent quality across releases"],
        operationalPainPoints: ["Slow release cycles", "High defect rates in production", "Testing resource constraints"],
        riskFactors: ["Quality issues affecting customer satisfaction", "Delayed time-to-market"],
        inefficiencies: ["Manual regression testing", "Siloed testing processes", "Lack of test automation"]
      },
      implication: {
        businessImpact: ["Reduced competitive advantage", "Customer satisfaction decline", "Increased operational costs"],
        costImplications: ["Higher testing costs", "Increased defect remediation expenses", "Lost revenue from delays"],
        riskConsequences: ["Reputation damage from quality issues", "Market share loss to competitors"],
        competitiveDisadvantages: ["Slower innovation cycles", "Higher operational overhead", "Quality perception issues"]
      },
      position: {
        solutionOverview: "Comprehensive test automation and quality engineering transformation",
        valueProposition: ["80% reduction in testing time", "60% faster release cycles", "90% improvement in test coverage"],
        differentiators: ["AI-powered test generation", "Seamless CI/CD integration", "Enterprise-scale reliability"],
        strategicFit: "Aligns with digital transformation initiatives and operational excellence goals"
      },
      ask: {
        specificRequest: "Pilot implementation of automated testing framework for critical business applications",
        nextSteps: ["Technical assessment meeting", "Proof of concept development", "Executive stakeholder alignment"],
        timeline: "90-day pilot program with phased rollout",
        decisionMakers: ["CTO", "VP of Engineering", "QA Director", "DevOps Lead"]
      },
      benefit: {
        quantifiableOutcomes: ["80% reduction in manual testing effort", "60% faster release cycles", "40% reduction in production defects"],
        strategicAdvantages: ["Accelerated innovation capability", "Enhanced competitive positioning", "Improved customer satisfaction"],
        transformationalImpact: "Evolution from reactive quality assurance to proactive quality engineering culture",
        roi: "300% ROI within 18 months through efficiency gains and quality improvements"
      }
    };
  }

  private generateFallbackSPIN(
    companyName: string,
    industry: string,
    currentSystems: string[],
    painPoints: string[]
  ): SPINFramework {
    return {
      situation: {
        currentProcesses: ["Manual testing processes", "Waterfall development cycles", "Siloed QA activities"],
        existingSystems: currentSystems,
        teamSize: "Medium-sized development and QA teams",
        currentApproach: "Traditional manual testing with limited automation"
      },
      problem: {
        identifiedChallenges: painPoints.length > 0 ? painPoints : ["Long testing cycles", "Inconsistent quality", "Resource bottlenecks"],
        frequencyOfIssues: "Quality issues occur in 30-40% of releases",
        impactOnOperations: ["Delayed product launches", "Increased support costs", "Customer escalations"],
        stakeholderFrustrations: ["Development team blocked by testing", "Business frustrated with delays", "Customers experiencing defects"]
      },
      implication: {
        continuedPainPoints: ["Escalating testing costs", "Longer time-to-market", "Quality reputation decline"],
        escalatingCosts: ["Increasing manual testing overhead", "Production defect remediation", "Customer churn costs"],
        competitiveRisks: ["Competitors launching faster", "Market share erosion", "Innovation slowdown"],
        stakeholderImpact: ["Team morale decline", "Customer satisfaction drop", "Revenue impact"]
      },
      needPayoff: {
        desiredOutcomes: ["Faster, more reliable releases", "Reduced testing costs", "Improved product quality"],
        successMetrics: ["50% reduction in testing cycle time", "80% improvement in defect detection", "90% test automation coverage"],
        transformationGoals: ["Shift-left testing approach", "Continuous quality integration", "Automated regression testing"],
        stakeholderBenefits: ["Development team efficiency", "Business agility improvement", "Customer satisfaction increase"]
      }
    };
  }
}

export const scipabGenerator = new SCIPABGenerator();