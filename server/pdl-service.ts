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
    
    // Extract from job postings
    const jobTitles = jobPostings.map(job => job.title.toLowerCase());
    
    if (jobTitles.some(title => title.includes('digital') || title.includes('transformation'))) {
      initiatives.push('Digital transformation');
    }
    if (jobTitles.some(title => title.includes('qa') || title.includes('quality') || title.includes('testing'))) {
      initiatives.push('QA automation and testing improvement');
    }
    if (jobTitles.some(title => title.includes('erp') || title.includes('sap') || title.includes('oracle'))) {
      initiatives.push('ERP system implementation/migration');
    }
    if (jobTitles.some(title => title.includes('crm') || title.includes('salesforce'))) {
      initiatives.push('CRM system optimization');
    }
    if (jobTitles.some(title => title.includes('cloud') || title.includes('aws') || title.includes('azure'))) {
      initiatives.push('Cloud migration and modernization');
    }
    if (jobTitles.some(title => title.includes('devops') || title.includes('ci/cd') || title.includes('automation'))) {
      initiatives.push('DevOps and automation implementation');
    }

    // Extract from company technologies
    if (companyData?.technologies) {
      const techs = companyData.technologies.map(t => t.toLowerCase());
      if (techs.some(tech => tech.includes('kubernetes') || tech.includes('docker'))) {
        initiatives.push('Containerization and orchestration');
      }
      if (techs.some(tech => tech.includes('microservices') || tech.includes('api'))) {
        initiatives.push('Microservices architecture adoption');
      }
    }

    return initiatives.length > 0 ? initiatives : ['System modernization', 'Process automation'];
  }

  private extractSystems(companyData: PDLCompanyData | null, jobPostings: any[]): string[] {
    const systems: string[] = [];
    
    // From job postings
    const allText = jobPostings.map(job => `${job.title} ${job.requirements?.join(' ')}`).join(' ').toLowerCase();
    
    if (allText.includes('sap')) systems.push('SAP');
    if (allText.includes('oracle')) systems.push('Oracle');
    if (allText.includes('d365') || allText.includes('dynamics')) systems.push('Dynamics 365');
    if (allText.includes('salesforce')) systems.push('Salesforce');
    if (allText.includes('workday')) systems.push('Workday');
    if (allText.includes('servicenow')) systems.push('ServiceNow');
    if (allText.includes('jira')) systems.push('Jira');
    if (allText.includes('confluence')) systems.push('Confluence');
    if (allText.includes('jenkins')) systems.push('Jenkins');
    if (allText.includes('selenium')) systems.push('Selenium');

    // From company technologies
    if (companyData?.technologies) {
      const techs = companyData.technologies.map(t => t.toLowerCase());
      systems.push(...techs.filter(tech => 
        ['sap', 'oracle', 'salesforce', 'workday', 'servicenow', 'jira', 'confluence'].includes(tech)
      ));
    }

    return systems.length > 0 ? [...new Set(systems)] : ['Enterprise systems'];
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