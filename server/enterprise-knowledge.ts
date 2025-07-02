// Enterprise Systems Knowledge Base for Avo Automation
// Focused on enterprise systems, job title targeting, and brand awareness

export const enterpriseSystemsKnowledge = {
  // Core Enterprise Systems and Their Challenges
  systems: {
    d365: {
      name: "Microsoft Dynamics 365",
      commonChallenges: [
        "Complex customization and configuration management",
        "Integration challenges with legacy systems",
        "User adoption and training difficulties",
        "Data migration complexities",
        "Compliance and security concerns"
      ],
      decisionMakers: ["D365 Administrator", "IT Director", "Business Systems Manager", "CRM Manager"],
      painPoints: [
        "Manual testing of customizations slows deployments",
        "Regression testing after updates is time-consuming",
        "Integration testing between D365 and other systems",
        "Quality assurance for business process automation"
      ],
      avoSolutions: [
        "Automated testing for D365 customizations and workflows",
        "Integration testing for D365 and third-party systems",
        "Regression testing after Microsoft updates",
        "Business process validation and compliance testing"
      ]
    },
    sap: {
      name: "SAP Enterprise Resource Planning",
      commonChallenges: [
        "S/4HANA migration complexities",
        "Custom ABAP code quality and testing",
        "Integration with cloud and hybrid environments",
        "Compliance and audit requirements",
        "Performance optimization"
      ],
      decisionMakers: ["SAP Basis Administrator", "SAP Functional Consultant", "Enterprise Architect", "IT Manager"],
      painPoints: [
        "Manual testing of SAP customizations is resource-intensive",
        "Regression testing after SAP updates",
        "End-to-end business process testing",
        "Performance testing for SAP applications"
      ],
      avoSolutions: [
        "Automated SAP testing for custom transactions",
        "S/4HANA migration testing and validation",
        "Integration testing for SAP and external systems",
        "Performance and load testing for SAP environments"
      ]
    },
    oracle: {
      name: "Oracle Enterprise Applications",
      commonChallenges: [
        "Oracle Cloud migration and hybrid deployments",
        "Custom PL/SQL and application testing",
        "Integration with modern cloud services",
        "Database performance and optimization",
        "Compliance and security testing"
      ],
      decisionMakers: ["Oracle DBA", "Applications Manager", "IT Director", "Database Administrator"],
      painPoints: [
        "Complex Oracle application testing scenarios",
        "Database performance regression testing",
        "Oracle Cloud integration testing",
        "Custom application quality assurance"
      ],
      avoSolutions: [
        "Automated Oracle application testing",
        "Database regression and performance testing",
        "Oracle Cloud integration validation",
        "Custom PL/SQL and application QA"
      ]
    },
    greatPlains: {
      name: "Microsoft Great Plains (Legacy)",
      commonChallenges: [
        "Legacy system modernization",
        "Migration to modern ERP systems",
        "Data quality and integrity issues",
        "Limited integration capabilities",
        "End-of-life support concerns"
      ],
      decisionMakers: ["ERP Manager", "IT Director", "Finance Director", "Operations Manager"],
      painPoints: [
        "Manual testing during migration projects",
        "Data validation and quality assurance",
        "Legacy system integration testing",
        "Business process continuity testing"
      ],
      avoSolutions: [
        "Migration testing and validation",
        "Data quality assurance and testing",
        "Legacy system integration testing",
        "Business continuity testing during transitions"
      ]
    },
    crm: {
      name: "Customer Relationship Management",
      commonChallenges: [
        "CRM integration with marketing automation",
        "Data quality and deduplication",
        "Custom workflow and automation testing",
        "User adoption and training",
        "Compliance with data privacy regulations"
      ],
      decisionMakers: ["CRM Manager", "Sales Operations Manager", "Marketing Operations", "IT Manager"],
      painPoints: [
        "Manual testing of CRM workflows and automations",
        "Data quality and integration testing",
        "Custom CRM application testing",
        "User experience and adoption testing"
      ],
      avoSolutions: [
        "Automated CRM workflow testing",
        "Data quality and integration validation",
        "Custom CRM application QA",
        "User experience and adoption testing"
      ]
    },
    erp: {
      name: "Enterprise Resource Planning",
      commonChallenges: [
        "Multi-module integration complexity",
        "Custom business process automation",
        "Data migration and quality issues",
        "Compliance and audit requirements",
        "Performance optimization"
      ],
      decisionMakers: ["ERP Manager", "Business Systems Analyst", "IT Director", "Operations Manager"],
      painPoints: [
        "End-to-end business process testing",
        "Integration testing between ERP modules",
        "Custom development quality assurance",
        "Performance and scalability testing"
      ],
      avoSolutions: [
        "Comprehensive ERP testing automation",
        "Multi-module integration testing",
        "Custom business process validation",
        "Performance and scalability testing"
      ]
    }
  },

  // Job Title Categories and Messaging
  jobTitleCategories: {
    qa: {
      titles: ["QA Manager", "Quality Assurance Director", "Test Manager", "QA Engineer Manager"],
      seniorityLevels: ["Manager", "Director", "VP"],
      keyMessages: [
        "Reduce manual testing time by 80%",
        "Accelerate release cycles by 60%",
        "Improve test coverage and quality",
        "Eliminate testing bottlenecks"
      ],
      painPoints: [
        "Manual testing is time-consuming and error-prone",
        "Limited test coverage due to resource constraints",
        "Difficulty scaling testing with agile development",
        "Regression testing after system updates"
      ]
    },
    enterpriseSystems: {
      titles: ["Enterprise Systems Manager", "IT Systems Manager", "Applications Manager", "Systems Architect"],
      seniorityLevels: ["Manager", "Director", "VP", "Chief"],
      keyMessages: [
        "Ensure enterprise system reliability and performance",
        "Reduce integration testing complexity",
        "Improve system quality and user experience",
        "Accelerate digital transformation initiatives"
      ],
      painPoints: [
        "Complex system integrations are difficult to test",
        "Manual testing slows digital transformation",
        "Quality issues impact business operations",
        "Resource constraints limit testing coverage"
      ]
    },
    businessSystems: {
      titles: ["Business Systems Manager", "Business Systems Analyst", "Process Manager", "Operations Manager"],
      seniorityLevels: ["Manager", "Director", "VP"],
      keyMessages: [
        "Validate business processes and workflows",
        "Ensure system changes don't break operations",
        "Improve business process efficiency",
        "Reduce operational risk and downtime"
      ],
      painPoints: [
        "Business process changes require extensive testing",
        "Manual validation is time-consuming",
        "Risk of business disruption from system changes",
        "Limited visibility into process quality"
      ]
    },
    crm: {
      titles: ["CRM Manager", "Sales Operations Manager", "Customer Success Manager", "Marketing Operations Manager"],
      seniorityLevels: ["Manager", "Director", "VP"],
      keyMessages: [
        "Ensure CRM reliability and data quality",
        "Validate customer-facing processes",
        "Improve sales and marketing efficiency",
        "Enhance customer experience quality"
      ],
      painPoints: [
        "CRM customizations require thorough testing",
        "Data quality issues impact sales effectiveness",
        "Manual testing of customer workflows",
        "Integration testing with marketing tools"
      ]
    }
  },

  // ICP and Differentiation
  icp: {
    companySize: ["Mid-market (500-5000 employees)", "Enterprise (5000+ employees)"],
    industries: [
      "Manufacturing", "Financial Services", "Healthcare", "Retail", "Technology",
      "Professional Services", "Government", "Education"
    ],
    systemsInUse: ["D365", "SAP", "Oracle", "Salesforce", "Custom ERP", "Legacy Systems"],
    painPoints: [
      "Manual testing is time-consuming and expensive",
      "Limited test coverage due to resource constraints",
      "Quality issues impact business operations",
      "Slow release cycles due to testing bottlenecks"
    ],
    decisionCriteria: [
      "Cost reduction and ROI",
      "Ease of implementation and use",
      "Comprehensive support and partnership",
      "Scalability and flexibility"
    ]
  },

  differentiation: {
    strongSupport: {
      message: "Comprehensive support system with dedicated customer success managers",
      proof: "24/7 support, dedicated implementation specialists, ongoing training and best practices"
    },
    nonLineItemPricing: {
      message: "Transparent, all-inclusive pricing without hidden fees or a la carte charges",
      proof: "Single subscription covers all features, unlimited users, comprehensive support"
    },
    costAdvantage: {
      message: "Typically 30% lower total cost of ownership compared to competitors",
      proof: "No implementation fees, no per-user charges, faster time to value"
    },
    aiEnabled: {
      message: "AI-powered test generation and maintenance reduces manual effort",
      proof: "Intelligent test creation, self-healing tests, predictive analytics"
    },
    easeOfUse: {
      message: "Intuitive interface that business users can operate without extensive training",
      proof: "No-code test creation, visual workflow builder, business-friendly reporting"
    }
  },

  // Brand Awareness Content Strategy
  brandAwareness: {
    d365Workbook: {
      title: "The Complete Guide to D365 Testing and Quality Assurance",
      description: "Comprehensive workbook covering D365 testing best practices, automation strategies, and quality assurance frameworks",
      valueProposition: "Learn how leading organizations reduce D365 testing time by 80% while improving quality",
      keyTopics: [
        "D365 Testing Framework Design",
        "Automation Strategy for D365 Customizations",
        "Integration Testing Best Practices",
        "Quality Assurance for D365 Implementations"
      ]
    },
    sapEbook: {
      title: "SAP Testing Automation: A Strategic Guide for Enterprise Success",
      description: "Essential guide for SAP testing automation, covering S/4HANA migration, custom ABAP testing, and integration strategies",
      valueProposition: "Master SAP testing automation and accelerate your digital transformation",
      keyTopics: [
        "S/4HANA Migration Testing Strategies",
        "Custom ABAP Testing Automation",
        "SAP Integration Testing Framework",
        "Performance Testing for SAP Systems"
      ]
    },
    oracleGuide: {
      title: "Oracle Application Testing: Modern Approaches for Enterprise Systems",
      description: "Comprehensive guide to Oracle application testing, cloud migration strategies, and quality assurance best practices",
      valueProposition: "Optimize Oracle application quality and accelerate cloud adoption",
      keyTopics: [
        "Oracle Cloud Testing Strategies",
        "Database Performance Testing",
        "Custom Application QA Framework",
        "Oracle Integration Testing"
      ]
    }
  },

  // Email Cadence Templates
  emailCadence: {
    brandAwareness: {
      step1: {
        purpose: "brand_awareness",
        subject: "The Hidden Cost of Manual {SYSTEM} Testing",
        tone: "educational",
        cta: "Download our {SYSTEM} Testing Guide",
        focusArea: "Problem awareness and education"
      },
      step2: {
        purpose: "education", 
        subject: "How {COMPANY_TYPE} Companies Reduce Testing Time by 80%",
        tone: "data_driven",
        cta: "See the {SYSTEM} Testing Framework",
        focusArea: "Solution awareness and proof"
      },
      step3: {
        purpose: "education",
        subject: "{PROSPECT_NAME}, Your {SYSTEM} Testing Challenges Have Solutions",
        tone: "personalized",
        cta: "Get Your Custom {SYSTEM} Assessment",
        focusArea: "Personalized solution positioning"
      },
      step4: {
        purpose: "demo_request",
        subject: "See How {SIMILAR_COMPANY} Automated Their {SYSTEM} Testing",
        tone: "solution_focused",
        cta: "Schedule a {SYSTEM} Demo",
        focusArea: "Social proof and demonstration"
      },
      step5: {
        purpose: "follow_up",
        subject: "Final Opportunity: {SYSTEM} Testing Automation Workshop",
        tone: "urgent",
        cta: "Reserve Your Workshop Spot",
        focusArea: "Urgency and scarcity"
      },
      step6: {
        purpose: "follow_up",
        subject: "Staying Connected: {SYSTEM} Testing Best Practices",
        tone: "professional",
        cta: "Join Our {SYSTEM} Community",
        focusArea: "Relationship building and future engagement"
      }
    }
  }
};

// Utility functions for enterprise targeting
export function categorizeJobTitle(position: string): string {
  const pos = position.toLowerCase();
  
  if (pos.includes('qa') || pos.includes('quality') || pos.includes('test')) {
    return 'qa';
  } else if (pos.includes('crm') || pos.includes('customer') || pos.includes('sales ops')) {
    return 'crm';
  } else if (pos.includes('erp') || pos.includes('enterprise') || pos.includes('business systems')) {
    return 'businessSystems';
  } else if (pos.includes('d365') || pos.includes('dynamics')) {
    return 'd365';
  } else if (pos.includes('sap')) {
    return 'sap';
  } else if (pos.includes('oracle')) {
    return 'oracle';
  } else if (pos.includes('systems') || pos.includes('applications') || pos.includes('it')) {
    return 'enterpriseSystems';
  }
  
  return 'general';
}

export function determineSeniorityLevel(position: string): string {
  const pos = position.toLowerCase();
  
  if (pos.includes('chief') || pos.includes('cto') || pos.includes('cio') || pos.includes('vp') || pos.includes('vice president')) {
    return 'C-Level';
  } else if (pos.includes('director') || pos.includes('head of')) {
    return 'Director';
  } else if (pos.includes('manager') || pos.includes('lead')) {
    return 'Manager';
  } else if (pos.includes('senior') || pos.includes('principal')) {
    return 'Senior';
  }
  
  return 'Individual Contributor';
}

export function identifySystemsExperience(position: string, company: string, additionalInfo?: string): string[] {
  const text = `${position} ${company} ${additionalInfo || ''}`.toLowerCase();
  const systems = [];
  
  if (text.includes('d365') || text.includes('dynamics')) systems.push('D365');
  if (text.includes('sap')) systems.push('SAP');
  if (text.includes('oracle')) systems.push('Oracle');
  if (text.includes('salesforce')) systems.push('Salesforce');
  if (text.includes('great plains')) systems.push('Great Plains');
  if (text.includes('crm')) systems.push('CRM');
  if (text.includes('erp')) systems.push('ERP');
  
  return systems;
}

export function getPersonalizedEnterpriseInsights(prospect: any) {
  const category = categorizeJobTitle(prospect.position);
  const seniority = determineSeniorityLevel(prospect.position);
  const systems = identifySystemsExperience(prospect.position, prospect.company, prospect.additionalInfo);
  
  const categoryData = enterpriseSystemsKnowledge.jobTitleCategories[category as keyof typeof enterpriseSystemsKnowledge.jobTitleCategories];
  
  if (!categoryData) {
    return {
      category: 'general',
      seniority,
      systems,
      keyMessages: enterpriseSystemsKnowledge.differentiation.strongSupport.message,
      painPoints: ["Manual processes are time-consuming", "Limited visibility into system quality"],
      solutions: ["Automated testing and quality assurance", "Comprehensive support and partnership"]
    };
  }
  
  return {
    category,
    seniority,
    systems,
    keyMessages: categoryData.keyMessages,
    painPoints: categoryData.painPoints,
    solutions: systems.map(system => {
      const systemKey = system.toLowerCase().replace(/\s+/g, '').replace('365', '365') as keyof typeof enterpriseSystemsKnowledge.systems;
      const systemData = enterpriseSystemsKnowledge.systems[systemKey];
      return systemData ? systemData.avoSolutions : ["Automated testing and quality assurance"];
    }).flat()
  };
}