// Avo Automation Knowledge Base and QA Market Intelligence
export const avoKnowledgeBase = {
  company: {
    name: "Avo Automation",
    website: "AvoAutomation.ai",
    tagline: "Intelligent QA Automation Platform",
    founded: "2020s",
    focus: "AI-powered software testing and quality assurance automation"
  },
  
  valuePropositions: {
    primary: [
      "Reduce manual testing time by up to 80%",
      "AI-powered test case generation and execution",
      "Seamless integration with existing development workflows",
      "Real-time defect detection and reporting",
      "Cross-platform testing capabilities"
    ],
    technical: [
      "Machine learning algorithms for intelligent test prioritization",
      "Natural language test case creation",
      "Visual regression testing with AI comparison",
      "API testing automation with smart assertions",
      "Continuous integration/continuous deployment (CI/CD) integration"
    ],
    business: [
      "Accelerate time-to-market by 40-60%",
      "Reduce QA costs while improving coverage",
      "Minimize post-release defects and customer complaints",
      "Scale testing efforts without proportional headcount increase",
      "Improve developer productivity through faster feedback loops"
    ]
  },

  targetMarkets: {
    industries: [
      "Software companies (SaaS, enterprise software)",
      "E-commerce and retail technology",
      "Financial services and fintech",
      "Healthcare technology",
      "Gaming and entertainment",
      "Mobile app development"
    ],
    companyTypes: [
      "High-growth startups scaling their QA processes",
      "Mid-market companies with complex testing needs",
      "Enterprise organizations seeking QA efficiency",
      "Agencies managing multiple client projects"
    ],
    teamSizes: [
      "Development teams of 10-500+ engineers",
      "QA teams looking to automate manual processes",
      "DevOps teams implementing quality gates"
    ]
  },

  competitiveAdvantages: [
    "AI-first approach vs traditional rule-based automation",
    "No-code/low-code test creation for non-technical team members",
    "Superior cross-browser and cross-device testing capabilities",
    "Advanced analytics and insights into testing effectiveness",
    "Faster setup and implementation compared to legacy tools"
  ],

  commonPainPoints: {
    manual: [
      "Time-consuming manual regression testing",
      "Difficulty scaling QA with development velocity",
      "Inconsistent test execution and human error",
      "Limited test coverage due to resource constraints"
    ],
    legacy: [
      "Brittle automated tests that break frequently",
      "High maintenance overhead for test suites",
      "Poor integration with modern development tools",
      "Limited reporting and visibility into test results"
    ],
    organizational: [
      "QA bottlenecks slowing down releases",
      "Lack of QA expertise within development teams",
      "Pressure to release faster while maintaining quality",
      "Difficulty justifying QA investment to stakeholders"
    ]
  },

  roi: {
    timeToValue: "2-4 weeks for initial implementation",
    metrics: [
      "80% reduction in manual testing time",
      "60% faster release cycles",
      "40% reduction in post-release defects",
      "300% increase in test coverage",
      "50% cost savings on QA operations"
    ]
  },

  caseStudies: [
    {
      industry: "E-commerce",
      challenge: "Manual testing bottleneck preventing daily deployments",
      solution: "Implemented AI-powered regression suite covering 95% of user journeys",
      result: "Enabled daily deployments, reduced testing time from 3 days to 4 hours"
    },
    {
      industry: "Fintech",
      challenge: "Complex compliance requirements and risk of financial errors",
      solution: "Automated compliance testing with AI-driven edge case detection",
      result: "100% compliance audit success, 70% reduction in manual validation time"
    },
    {
      industry: "SaaS",
      challenge: "Scaling QA for multi-tenant platform with frequent feature releases",
      solution: "Cross-tenant testing automation with intelligent test prioritization",
      result: "Maintained quality while increasing release frequency by 200%"
    }
  ],

  integrations: [
    "Jira, Azure DevOps, Linear for issue tracking",
    "GitHub, GitLab, Bitbucket for CI/CD",
    "Slack, Microsoft Teams for notifications",
    "Jenkins, CircleCI, GitHub Actions for automation pipelines",
    "Selenium, Cypress, Playwright for existing test frameworks"
  ]
};

export const qaMarketIntelligence = {
  trends: [
    "Shift-left testing moving QA earlier in development cycle",
    "AI/ML adoption in testing growing 40% year-over-year",
    "Increased focus on API and microservices testing",
    "DevOps teams taking ownership of quality processes",
    "Visual and UX testing becoming critical for user experience"
  ],
  
  challenges: [
    "Skills gap in test automation expertise",
    "Legacy testing tools unable to keep up with modern development",
    "Balancing speed vs quality in agile/DevOps environments",
    "Testing complex cloud-native and distributed applications",
    "Managing test data and environments at scale"
  ],

  budgetDrivers: [
    "Cost of post-release defects (10x more expensive than pre-release)",
    "Developer time spent on manual testing vs feature development",
    "Customer churn due to quality issues",
    "Compliance and security testing requirements",
    "Scaling QA teams vs automation investment"
  ],

  decisionMakers: {
    technical: ["VP of Engineering", "CTO", "Engineering Managers", "QA Directors", "DevOps Leaders"],
    business: ["VP of Product", "Head of Technology", "Chief Product Officer"],
    influencers: ["Senior QA Engineers", "Test Automation Engineers", "Technical Leads"]
  }
};

export function getPersonalizedAvoInsights(prospect: any) {
  const { position, company, additionalInfo } = prospect;
  const positionLower = position.toLowerCase();
  const companyLower = company.toLowerCase();
  
  // Industry-specific insights
  let industryInsights = "";
  if (companyLower.includes("fintech") || companyLower.includes("financial") || companyLower.includes("bank")) {
    industryInsights = "In the financial sector, automated testing is crucial for compliance and security. Our platform helps ensure regulatory requirements are met while accelerating development cycles.";
  } else if (companyLower.includes("ecommerce") || companyLower.includes("retail") || companyLower.includes("commerce")) {
    industryInsights = "E-commerce platforms require extensive testing across multiple user journeys and payment flows. Our AI-powered testing ensures seamless customer experiences during peak traffic periods.";
  } else if (companyLower.includes("healthcare") || companyLower.includes("health")) {
    industryInsights = "Healthcare technology demands rigorous testing for patient safety and HIPAA compliance. Our platform provides comprehensive validation while maintaining development velocity.";
  } else {
    industryInsights = "Modern software development requires intelligent testing that scales with your team's velocity while maintaining quality standards.";
  }

  // Role-specific pain points and solutions
  let roleSpecificValue = "";
  if (positionLower.includes("qa") || positionLower.includes("quality")) {
    roleSpecificValue = "As a QA professional, you understand the challenge of maintaining comprehensive test coverage while keeping pace with development. Our AI-powered platform reduces manual testing effort by 80% while improving coverage.";
  } else if (positionLower.includes("engineer") || positionLower.includes("developer")) {
    roleSpecificValue = "Our platform integrates seamlessly into your development workflow, providing instant feedback on code quality and catching issues before they reach production.";
  } else if (positionLower.includes("manager") || positionLower.includes("director") || positionLower.includes("vp")) {
    roleSpecificValue = "From a strategic perspective, our platform delivers measurable ROI through faster release cycles, reduced defect rates, and optimized team productivity.";
  } else if (positionLower.includes("cto") || positionLower.includes("chief")) {
    roleSpecificValue = "Our enterprise-grade platform aligns with your technology strategy, providing scalable QA automation that grows with your organization.";
  } else {
    roleSpecificValue = "Our platform addresses the common challenge of balancing development speed with quality assurance.";
  }

  return {
    industryInsights,
    roleSpecificValue,
    relevantMetrics: avoKnowledgeBase.roi.metrics,
    painPoints: positionLower.includes("qa") ? qaMarketIntelligence.challenges : avoKnowledgeBase.commonPainPoints.organizational
  };
}