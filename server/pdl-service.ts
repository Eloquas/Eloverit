// People Data Labs integration service
interface PDLContact {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  job_title_role?: string;
  job_title_levels?: string[];
  emails?: Array<{ address: string; type: string }>;
  linkedin_url?: string;
  work_email?: string;
  job_company_name?: string;
  job_company_website?: string;
  industry?: string;
  summary?: string;
}

interface PDLSearchParams {
  company?: string;
  title?: string[];
  seniority?: string[];
  size?: number;
  pretty?: boolean;
}

export class PDLService {
  private apiKey: string;
  private baseUrl = 'https://api.peopledatalabs.com/v5';

  constructor() {
    this.apiKey = process.env.PDL_API_KEY!;
    if (!this.apiKey) {
      throw new Error('PDL_API_KEY environment variable is required');
    }
  }

  // Get targeted contact profiles for a company
  async searchContacts(companyDomain: string, companyName: string): Promise<{
    contacts: PDLContact[];
    status: 'success' | 'no_results' | 'rate_limited' | 'invalid_key' | 'error';
    retryAfter?: number;
    message?: string;
  }> {
    try {
      console.log(`Starting PDL contact search for ${companyName} (${companyDomain})`);
      
      // Target roles for QA, SDLC, Enterprise Systems buyers
      const targetTitles = [
        'qa', 'quality assurance', 'quality engineer', 'test engineer', 'test manager',
        'product manager', 'product owner', 'product director',
        'engineering manager', 'engineering director', 'development manager', 'software engineering manager',
        'enterprise systems', 'business systems', 'systems architect', 'enterprise architect',
        'devops', 'platform engineer', 'reliability engineer', 'infrastructure'
      ];

      const targetSeniority = ['c_suite', 'vp', 'director', 'manager', 'senior'];

      const searchParams: PDLSearchParams = {
        company: companyDomain,
        title: targetTitles,
        seniority: targetSeniority,
        size: 20, // Max 20 contacts as per requirements
        pretty: true
      };

      const searchQuery = this.buildSearchQuery(searchParams);
      console.log(`PDL search query: ${searchQuery}`);
      
      const response = await fetch(`${this.baseUrl}/person/search`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          size: searchParams.size,
          pretty: searchParams.pretty
        })
      });

      if (response.status === 401) {
        return { contacts: [], status: 'invalid_key', message: 'Invalid PDL API key' };
      }

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60');
        return { contacts: [], status: 'rate_limited', retryAfter, message: `Rate limited, retry in ${retryAfter} seconds` };
      }

      if (!response.ok) {
        console.error(`PDL API error: ${response.status} ${response.statusText}`);
        return { contacts: [], status: 'error', message: `API error: ${response.status}` };
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        return { contacts: [], status: 'no_results', message: 'No contacts found for selected filters' };
      }

      console.log(`PDL found ${data.data.length} contacts for ${companyName}`);
      
      return {
        contacts: data.data,
        status: 'success'
      };

    } catch (error) {
      console.error('PDL search error:', error);
      return { 
        contacts: [], 
        status: 'error', 
        message: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Build Elasticsearch-style query for PDL
  private buildSearchQuery(params: PDLSearchParams): any {
    const must = [];

    if (params.company) {
      must.push({
        term: { "job_company_website": params.company }
      });
    }

    if (params.title && params.title.length > 0) {
      must.push({
        bool: {
          should: params.title.map(title => ({
            wildcard: { "job_title": `*${title}*` }
          }))
        }
      });
    }

    if (params.seniority && params.seniority.length > 0) {
      must.push({
        terms: { "job_title_levels": params.seniority }
      });
    }

    return {
      query: {
        bool: { must }
      }
    };
  }

  // Calculate confidence score for contact relevance
  calculateContactConfidence(contact: PDLContact, targetRoles: string[]): number {
    let confidence = 0.5; // Base confidence

    // Boost for matching job titles
    if (contact.job_title) {
      const title = contact.job_title.toLowerCase();
      const matchingRoles = targetRoles.filter(role => 
        title.includes(role.toLowerCase())
      );
      confidence += matchingRoles.length * 0.2;
    }

    // Boost for seniority
    if (contact.job_title_levels?.some(level => 
      ['c_suite', 'vp', 'director'].includes(level)
    )) {
      confidence += 0.2;
    }

    // Boost for complete profile
    if (contact.emails?.length && contact.linkedin_url) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  // Convert PDL contact to our Contact schema
  convertToContact(pdlContact: PDLContact, accountId: number, targetRoles: string[]): any {
    const confidence = this.calculateContactConfidence(pdlContact, targetRoles);
    
    return {
      accountId,
      firstName: pdlContact.first_name || '',
      lastName: pdlContact.last_name || '',
      email: pdlContact.work_email || pdlContact.emails?.[0]?.address || null,
      linkedinUrl: pdlContact.linkedin_url || null,
      title: pdlContact.job_title || '',
      department: this.extractDepartment(pdlContact.job_title || ''),
      seniority: this.extractSeniority(pdlContact.job_title_levels || []),
      focusAreas: this.extractFocusAreas(pdlContact.job_title || ''),
      roleCategory: this.categorizeRole(pdlContact.job_title || ''),
      confidence: Math.round(confidence * 100),
      dataSource: 'people_data_labs'
    };
  }

  private extractDepartment(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('qa') || titleLower.includes('quality')) return 'Quality Assurance';
    if (titleLower.includes('product')) return 'Product';
    if (titleLower.includes('engineering') || titleLower.includes('development')) return 'Engineering';
    if (titleLower.includes('enterprise') || titleLower.includes('systems')) return 'Enterprise Systems';
    if (titleLower.includes('devops') || titleLower.includes('platform')) return 'Platform/DevOps';
    return 'Technology';
  }

  private extractSeniority(levels: string[]): string {
    if (levels.includes('c_suite')) return 'C-Suite';
    if (levels.includes('vp')) return 'VP';
    if (levels.includes('director')) return 'Director';
    if (levels.includes('manager')) return 'Manager';
    return 'IC';
  }

  private extractFocusAreas(title: string): string[] {
    const areas = [];
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('qa') || titleLower.includes('quality') || titleLower.includes('test')) {
      areas.push('Quality Assurance', 'Testing');
    }
    if (titleLower.includes('product')) {
      areas.push('Product Management');
    }
    if (titleLower.includes('devops') || titleLower.includes('platform')) {
      areas.push('DevOps', 'Platform Engineering');
    }
    if (titleLower.includes('enterprise') || titleLower.includes('systems')) {
      areas.push('Enterprise Systems', 'System Integration');
    }
    
    return areas;
  }

  private categorizeRole(title: string): string {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('qa') || titleLower.includes('quality') || titleLower.includes('test')) {
      return 'QA/Testing';
    }
    if (titleLower.includes('product')) {
      return 'Product';
    }
    if (titleLower.includes('engineering') || titleLower.includes('development')) {
      return 'Engineering/SDLC';
    }
    if (titleLower.includes('enterprise') || titleLower.includes('systems')) {
      return 'Enterprise Applications';
    }
    return 'Business Systems';
  }
}

export const pdlService = new PDLService();