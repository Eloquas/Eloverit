interface PDLCompanyData {
  name: string;
  industry: string;
  size: string;
  location: {
    country: string;
    region: string;
    locality: string;
  };
  founded: number;
  employee_count: number;
  revenue: string;
  technologies: string[];
  recent_news: string[];
  funding_rounds: Array<{
    amount: string;
    type: string;
    date: string;
  }>;
  job_postings: Array<{
    title: string;
    department: string;
    posted_date: string;
    requirements: string[];
  }>;
}

interface PDLPersonData {
  full_name: string;
  job_title: string;
  job_company_name: string;
  experience: Array<{
    company: string;
    title: string;
    start_date: string;
    end_date: string;
  }>;
  skills: string[];
  education: Array<{
    school: string;
    degree: string;
    field_of_study: string;
  }>;
}

export class PDLService {
  private apiKey: string;
  private baseUrl = 'https://api.peopledatalabs.com/v5';

  constructor() {
    this.apiKey = process.env.PDL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('PDL_API_KEY is required');
    }
  }

  async enrichCompany(companyName: string): Promise<PDLCompanyData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/company/enrich`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName,
        }),
      });

      if (!response.ok) {
        console.error(`PDL Company API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return this.formatCompanyData(data);
    } catch (error) {
      console.error('PDL Company enrichment error:', error);
      return null;
    }
  }

  async enrichPerson(email: string): Promise<PDLPersonData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/person/enrich`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      if (!response.ok) {
        console.error(`PDL Person API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return this.formatPersonData(data);
    } catch (error) {
      console.error('PDL Person enrichment error:', error);
      return null;
    }
  }

  async getCompanyJobPostings(companyName: string): Promise<Array<{
    title: string;
    department: string;
    posted_date: string;
    requirements: string[];
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/job/search`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: {
            company_name: companyName,
            posted_date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() }, // Last 90 days
          },
          size: 20,
        }),
      });

      if (!response.ok) {
        console.error(`PDL Job Search API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.data?.map((job: any) => ({
        title: job.title,
        department: job.department,
        posted_date: job.posted_date,
        requirements: job.requirements || [],
      })) || [];
    } catch (error) {
      console.error('PDL Job search error:', error);
      return [];
    }
  }

  private formatCompanyData(data: any): PDLCompanyData {
    return {
      name: data.name || '',
      industry: data.industry || '',
      size: data.size || '',
      location: {
        country: data.location?.country || '',
        region: data.location?.region || '',
        locality: data.location?.locality || '',
      },
      founded: data.founded || 0,
      employee_count: data.employee_count || 0,
      revenue: data.revenue || '',
      technologies: data.technologies || [],
      recent_news: data.recent_news || [],
      funding_rounds: data.funding_rounds || [],
      job_postings: [],
    };
  }

  private formatPersonData(data: any): PDLPersonData {
    return {
      full_name: data.full_name || '',
      job_title: data.job_title || '',
      job_company_name: data.job_company_name || '',
      experience: data.experience || [],
      skills: data.skills || [],
      education: data.education || [],
    };
  }

  // Helper method to analyze company for SCIPAB research
  async analyzeCompanyForSCIPAB(companyName: string): Promise<{
    initiatives: string[];
    systems: string[];
    painPoints: string[];
    hiringPatterns: string[];
    industry: string;
    companySize: string;
  }> {
    const [companyData, jobPostings] = await Promise.all([
      this.enrichCompany(companyName),
      this.getCompanyJobPostings(companyName),
    ]);

    const initiatives = this.extractInitiatives(companyData, jobPostings);
    const systems = this.extractSystems(companyData, jobPostings);
    const painPoints = this.inferPainPoints(companyData, jobPostings);
    const hiringPatterns = this.analyzeHiringPatterns(jobPostings);

    return {
      initiatives,
      systems,
      painPoints,
      hiringPatterns,
      industry: companyData?.industry || 'Unknown',
      companySize: companyData?.size || 'Unknown',
    };
  }

  private extractInitiatives(companyData: PDLCompanyData | null, jobPostings: any[]): string[] {
    const initiatives: string[] = [];
    
    // Extract from job postings with enhanced detection
    const allJobText = jobPostings.map(job => 
      `${job.title} ${job.requirements?.join(' ')} ${job.department || ''}`
    ).join(' ').toLowerCase();
    
    // Digital transformation initiatives
    if (allJobText.includes('digital') || allJobText.includes('transformation')) {
      initiatives.push('Digital transformation and modernization');
    }
    
    // QA and testing initiatives
    if (allJobText.includes('qa') || allJobText.includes('quality') || allJobText.includes('testing') || allJobText.includes('automation test')) {
      initiatives.push('Test automation and QA process improvement');
    }
    
    // ERP initiatives with specific systems
    if (allJobText.includes('sap') && (allJobText.includes('migration') || allJobText.includes('implementation') || allJobText.includes('upgrade'))) {
      initiatives.push('SAP system migration/upgrade project');
    }
    if (allJobText.includes('oracle') && (allJobText.includes('fusion') || allJobText.includes('cloud') || allJobText.includes('migration'))) {
      initiatives.push('Oracle Fusion Cloud migration');
    }
    if (allJobText.includes('d365') || allJobText.includes('dynamics')) {
      initiatives.push('Microsoft Dynamics 365 implementation');
    }
    
    // CRM initiatives
    if (allJobText.includes('salesforce') && (allJobText.includes('implementation') || allJobText.includes('admin') || allJobText.includes('developer'))) {
      initiatives.push('Salesforce CRM optimization and expansion');
    }
    
    // Cloud initiatives
    if (allJobText.includes('cloud') && (allJobText.includes('migration') || allJobText.includes('aws') || allJobText.includes('azure'))) {
      initiatives.push('Enterprise cloud migration strategy');
    }
    
    // DevOps and automation
    if (allJobText.includes('devops') || allJobText.includes('ci/cd') || allJobText.includes('pipeline')) {
      initiatives.push('DevOps pipeline automation and CI/CD implementation');
    }
    
    // Data and analytics
    if (allJobText.includes('data') && (allJobText.includes('analytics') || allJobText.includes('scientist') || allJobText.includes('engineer'))) {
      initiatives.push('Data analytics and business intelligence modernization');
    }
    
    // Cybersecurity
    if (allJobText.includes('security') || allJobText.includes('cyber') || allJobText.includes('compliance')) {
      initiatives.push('Cybersecurity and compliance enhancement');
    }
    
    // Mobile and customer experience
    if (allJobText.includes('mobile') || allJobText.includes('app') || allJobText.includes('customer experience')) {
      initiatives.push('Mobile application and customer experience improvement');
    }

    // Industry-specific initiatives based on company data
    if (companyData?.industry) {
      const industry = companyData.industry.toLowerCase();
      if (industry.includes('airline') || industry.includes('aviation') || industry.includes('transportation')) {
        if (allJobText.includes('operational') || allJobText.includes('flight') || allJobText.includes('passenger')) {
          initiatives.push('Operational efficiency and passenger experience technology');
        }
      }
      if (industry.includes('healthcare') || industry.includes('medical')) {
        if (allJobText.includes('electronic health') || allJobText.includes('ehr') || allJobText.includes('patient')) {
          initiatives.push('Electronic health records and patient data systems');
        }
      }
      if (industry.includes('financial') || industry.includes('banking')) {
        if (allJobText.includes('regulatory') || allJobText.includes('compliance') || allJobText.includes('risk')) {
          initiatives.push('Financial regulatory compliance and risk management systems');
        }
      }
    }

    return initiatives.length > 0 ? initiatives : ['Technology modernization', 'Process automation'];
  }

  private extractSystems(companyData: PDLCompanyData | null, jobPostings: any[]): string[] {
    const systems: string[] = [];
    
    // From job postings - more comprehensive search
    const allText = jobPostings.map(job => `${job.title} ${job.requirements?.join(' ')}`).join(' ').toLowerCase();
    
    // ERP Systems
    if (allText.includes('sap')) systems.push('SAP ERP');
    if (allText.includes('oracle') && (allText.includes('erp') || allText.includes('fusion'))) systems.push('Oracle ERP');
    if (allText.includes('d365') || allText.includes('dynamics')) systems.push('Dynamics 365');
    if (allText.includes('netsuite')) systems.push('NetSuite');
    
    // CRM Systems
    if (allText.includes('salesforce')) systems.push('Salesforce CRM');
    if (allText.includes('hubspot')) systems.push('HubSpot');
    if (allText.includes('pipedrive')) systems.push('Pipedrive');
    
    // HR Systems
    if (allText.includes('workday')) systems.push('Workday HCM');
    if (allText.includes('successfactors')) systems.push('SAP SuccessFactors');
    if (allText.includes('bamboohr')) systems.push('BambooHR');
    
    // Testing & QA
    if (allText.includes('selenium')) systems.push('Selenium Testing');
    if (allText.includes('testcomplete')) systems.push('TestComplete');
    if (allText.includes('katalon')) systems.push('Katalon Studio');
    if (allText.includes('cypress')) systems.push('Cypress Testing');
    
    // DevOps & Project Management
    if (allText.includes('jira')) systems.push('Jira');
    if (allText.includes('servicenow')) systems.push('ServiceNow');
    if (allText.includes('jenkins')) systems.push('Jenkins CI/CD');
    if (allText.includes('azure devops')) systems.push('Azure DevOps');
    
    // From company technologies
    if (companyData?.technologies) {
      const techs = companyData.technologies.map(t => t.toLowerCase());
      
      // Map technology names to business systems
      const techMapping: Record<string, string> = {
        'salesforce': 'Salesforce CRM',
        'sap': 'SAP ERP',
        'oracle': 'Oracle Database',
        'workday': 'Workday HCM',
        'servicenow': 'ServiceNow',
        'jira': 'Jira',
        'dynamics': 'Dynamics 365',
        'netsuite': 'NetSuite ERP'
      };
      
      techs.forEach(tech => {
        Object.entries(techMapping).forEach(([key, value]) => {
          if (tech.includes(key) && !systems.includes(value)) {
            systems.push(value);
          }
        });
      });
    }

    // Remove generic "Systems" entries and return specific systems only
    const specificSystems = systems.filter(system => 
      !system.toLowerCase().includes('systems') || 
      system.includes('ERP') || 
      system.includes('CRM') || 
      system.includes('HCM') ||
      system.includes('Testing') ||
      system.includes('CI/CD')
    );

    return specificSystems.length > 0 ? [...new Set(specificSystems)] : [];
  }

  private inferPainPoints(companyData: PDLCompanyData | null, jobPostings: any[]): string[] {
    const painPoints: string[] = [];
    
    // Analyze job postings for pain point indicators
    const urgentKeywords = ['urgent', 'immediate', 'asap', 'critical', 'bottleneck'];
    const hasUrgentHiring = jobPostings.some(job => 
      urgentKeywords.some(keyword => job.title.toLowerCase().includes(keyword))
    );
    
    if (hasUrgentHiring) {
      painPoints.push('Urgent need for skilled technical talent');
    }

    // QA and testing related pain points
    const qaJobs = jobPostings.filter(job => 
      job.title.toLowerCase().includes('qa') || 
      job.title.toLowerCase().includes('test') ||
      job.title.toLowerCase().includes('quality')
    );
    
    if (qaJobs.length > 0) {
      painPoints.push('Manual testing bottlenecks slowing releases');
      painPoints.push('Need for automated testing frameworks');
    }

    // System integration pain points
    const systemJobs = jobPostings.filter(job => 
      job.title.toLowerCase().includes('integration') ||
      job.title.toLowerCase().includes('system') ||
      job.title.toLowerCase().includes('migration')
    );
    
    if (systemJobs.length > 0) {
      painPoints.push('Complex system integrations causing delays');
      painPoints.push('Legacy system modernization challenges');
    }

    // Default pain points based on company size
    if (companyData?.employee_count) {
      if (companyData.employee_count > 1000) {
        painPoints.push('Scaling testing processes across multiple teams');
        painPoints.push('Maintaining quality while accelerating delivery');
      } else {
        painPoints.push('Limited resources for comprehensive testing');
        painPoints.push('Balancing speed and quality in releases');
      }
    }

    return painPoints.length > 0 ? painPoints : [
      'Manual testing bottlenecks',
      'System integration challenges',
      'Quality assurance scalability'
    ];
  }

  private analyzeHiringPatterns(jobPostings: any[]): string[] {
    const patterns: string[] = [];
    
    // Group jobs by department
    const departments = jobPostings.reduce((acc, job) => {
      const dept = job.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find top hiring departments
    const topDepts = Object.entries(departments)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([dept, count]) => `${dept} (${count} roles)`);

    if (topDepts.length > 0) {
      patterns.push(`Active hiring in: ${topDepts.join(', ')}`);
    }

    // Analyze recent posting frequency
    const recentJobs = jobPostings.filter(job => {
      const postDate = new Date(job.posted_date);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return postDate > thirtyDaysAgo;
    });

    if (recentJobs.length > 5) {
      patterns.push('Rapid hiring pace - 5+ roles in last 30 days');
    }

    // Look for technical roles
    const techRoles = jobPostings.filter(job => 
      job.title.toLowerCase().includes('engineer') ||
      job.title.toLowerCase().includes('developer') ||
      job.title.toLowerCase().includes('qa') ||
      job.title.toLowerCase().includes('architect')
    );

    if (techRoles.length > 0) {
      patterns.push(`${techRoles.length} technical roles - likely scaling development`);
    }

    return patterns.length > 0 ? patterns : ['Standard hiring patterns'];
  }
}

export const pdlService = new PDLService();