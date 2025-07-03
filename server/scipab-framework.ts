// SCIPAB Framework Implementation for Consultative Sales Messaging
// Situation, Complication, Implication, Position, Ask, Benefit

export interface SCIPABContext {
  prospect: {
    name: string;
    position: string;
    company: string;
    seniority: string;
    department: string;
  };
  accountResearch: {
    initiatives: string[];
    systemsInUse: string[];
    hiringPatterns: string[];
    painPoints: string[];
    industry: string;
    companySize: string;
  };
  cadenceStep: number;
}

export interface SCIPABEmail {
  situation: string;
  complication: string;
  implication: string;
  position: string;
  ask: string;
  benefit: string;
  thoughtProvokingQuestion: string;
  softCTA: string;
  strongCTA: string;
}

export const cadenceStrategy = {
  step1: {
    focus: "Thought-provoking question + soft resource offer",
    ctaType: "soft",
    purpose: "Capture attention with insight, not sales pitch",
    askOptions: ["Would you mind if I shared a video?", "Would you be open to a brief insight document?", "May I share a relevant case study?"]
  },
  step2: {
    focus: "Build on their potential interest + industry insights",
    ctaType: "soft", 
    purpose: "Deepen engagement with valuable content",
    askOptions: ["Would a quick industry benchmark be helpful?", "Should I send over our latest research?", "Would you find a peer comparison valuable?"]
  },
  step3: {
    focus: "Share specific value proposition + gentle positioning",
    ctaType: "soft",
    purpose: "Position solution while maintaining consultative tone",
    askOptions: ["Would you like to see how others solved this?", "May I share a brief solution overview?", "Would a quick demo be worthwhile?"]
  },
  step4: {
    focus: "Direct value connection + demo opportunity",
    ctaType: "strong",
    purpose: "Move toward qualification conversation",
    askOptions: ["Worth a brief call to review your situation?", "Should we schedule 15 minutes to discuss?", "Would you like to see this in action?"]
  },
  step5: {
    focus: "Initiative-specific positioning + urgency",
    ctaType: "strong", 
    purpose: "Create urgency around their specific initiatives",
    askOptions: ["Given your upcoming initiative, shall we connect?", "With your timeline, would a quick review help?", "Before you move forward, worth a conversation?"]
  },
  step6: {
    focus: "Breakup email + final value offer",
    ctaType: "breakup",
    purpose: "Last attempt with graceful exit",
    askOptions: ["Should I stop reaching out?", "One final resource that might help?", "Worth staying connected for future?"]
  }
};

export function buildSCIPABFramework(context: SCIPABContext): SCIPABEmail {
  const { prospect, accountResearch } = context;
  
  // Situation: Current state based on role + company initiatives
  const situation = `You're leading ${prospect.department} efforts at ${prospect.company}, and I noticed ${accountResearch.initiatives.length > 0 ? 
    `recent initiatives around ${accountResearch.initiatives.slice(0, 2).join(' and ')}` : 
    `your focus on ${prospect.department} excellence`}.`;

  // Complication: Industry-wide challenge affecting their role
  const complications = {
    qa: "manual testing bottlenecks creating release delays",
    systems: "integration complexity slowing down deployments", 
    erp: "system upgrades causing testing overhead",
    d365: "customizations requiring extensive validation",
    sap: "S/4HANA migrations demanding thorough testing",
    oracle: "cloud transitions needing comprehensive QA"
  };
  
  const roleType = categorizeRole(prospect.position);
  const complication = complications[roleType as keyof typeof complications] || "testing challenges impacting delivery speed";

  // Implication: Business impact of the complication
  const implication = `This often means ${prospect.seniority === 'senior' ? 'strategic initiatives get delayed' : 'teams work overtime'} and ${
    accountResearch.companySize === 'enterprise' ? 'enterprise-wide' : 'critical'
  } releases face quality risks.`;

  // Position: Our approach/solution
  const position = `At Avo Automation, we've helped ${roleType} leaders reduce testing time by 80% through AI-powered automation that integrates seamlessly with ${
    accountResearch.systemsInUse.length > 0 ? accountResearch.systemsInUse[0] : 'existing systems'
  }.`;

  // Thought-provoking question tied to their context
  const questions = {
    qa: `How much time does your team spend on regression testing for each ${accountResearch.systemsInUse[0] || 'system'} release?`,
    systems: `What's your biggest challenge when validating integrations across multiple enterprise systems?`,
    erp: `How do you currently handle testing during major ERP updates without disrupting business operations?`,
    d365: `What's your approach to testing D365 customizations while maintaining compliance requirements?`,
    sap: `How are you planning to validate your S/4HANA migration without extending the timeline?`,
    oracle: `What's your strategy for ensuring data integrity during Oracle cloud transitions?`
  };

  const thoughtProvokingQuestion = questions[roleType as keyof typeof questions] || 
    `What's your current approach to balancing testing thoroughness with release velocity?`;

  return {
    situation,
    complication,
    implication, 
    position,
    ask: "", // Will be filled based on cadence step
    benefit: "30% faster releases with 40% fewer post-release issues",
    thoughtProvokingQuestion,
    softCTA: "", // Will be customized per step
    strongCTA: "" // Will be customized per step
  };
}

function categorizeRole(position: string): string {
  const pos = position.toLowerCase();
  if (pos.includes('qa') || pos.includes('quality') || pos.includes('test')) return 'qa';
  if (pos.includes('d365') || pos.includes('dynamics')) return 'd365';
  if (pos.includes('sap')) return 'sap';
  if (pos.includes('oracle')) return 'oracle';
  if (pos.includes('erp')) return 'erp';
  if (pos.includes('crm')) return 'systems';
  if (pos.includes('system') || pos.includes('application')) return 'systems';
  return 'systems';
}

export function generateCadenceContent(scipab: SCIPABEmail, step: number): {
  subject: string;
  emailBody: string;
  cta: string;
  ctaType: 'soft' | 'strong' | 'breakup';
} {
  const strategy = cadenceStrategy[`step${step}` as keyof typeof cadenceStrategy];
  
  const subjects = {
    1: "Quick question about [Company] testing approach",
    2: "Reducing testing overhead at [Company]", 
    3: "How [Industry] companies solved this",
    4: "Worth 15 minutes to discuss [Company] initiatives?",
    5: "Before your next release cycle...",
    6: "Final thought + staying connected"
  };

  const subject = subjects[step as keyof typeof subjects] || "Following up on QA automation";

  let emailBody = "";
  let cta = "";

  if (step <= 3) {
    // Soft CTA emails - short and consultative
    emailBody = `Hi [Name],

${scipab.thoughtProvokingQuestion}

${scipab.situation} ${scipab.complication}, which often means delays and quality risks.

${strategy.askOptions[0]} It shows how similar organizations reduced testing time by 80%.

Best,
John White
Avo Automation`;

    cta = strategy.askOptions[0];
  } else if (step <= 5) {
    // Stronger CTA emails - still concise
    emailBody = `Hi [Name],

${scipab.thoughtProvokingQuestion}

${scipab.position} Our clients typically see ${scipab.benefit}.

${strategy.askOptions[0]} I can show you how similar teams accelerated their initiatives.

Best,
John White
Avo Automation`;

    cta = strategy.askOptions[0];
  } else {
    // Breakup email - very short
    emailBody = `Hi [Name],

I haven't heard back, so I'll assume this isn't a priority right now.

If testing automation becomes relevant for your upcoming initiatives, I'm here to help.

Best,
John White
Avo Automation`;

    cta = strategy.askOptions[0];
  }

  return {
    subject,
    emailBody,
    cta,
    ctaType: strategy.ctaType as 'soft' | 'strong' | 'breakup'
  };
}