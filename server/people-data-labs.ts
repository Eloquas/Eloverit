import axios from 'axios';
import type { InsertContact } from '@shared/schema';

// People Data Labs API integration for contact identification
export class PeopleDataLabsService {
  private apiKey: string;
  private baseUrl: string = 'https://api.peopledatalabs.com/v5';
  private maxContactsPerAccount: number = 20; // Limit as per requirements

  constructor() {
    this.apiKey = process.env.PDL_API_KEY || '';
    if (!this.apiKey) {
      console.warn('PDL_API_KEY not configured - contact identification will be limited');
    }
  }

  // Identify high-value contacts at a target company
  async identifyContactsForAccount(
    companyName: string, 
    companyDomain?: string,
    targetSystems?: string[]
  ): Promise<InsertContact[]> {
    if (!this.apiKey) {
      console.log('PDL API key not configured, returning empty contacts');
      return [];
    }

    try {
      console.log(`Identifying contacts for ${companyName} with domain: ${companyDomain}`);

      // Build search query for target roles
      const searchQuery = this.buildContactSearchQuery(companyName, companyDomain, targetSystems);
      
      // Execute PDL Person Search API
      const contacts = await this.searchPersons(searchQuery);
      
      // Filter and enrich for quality contacts
      const qualityContacts = this.filterQualityContacts(contacts, targetSystems);
      
      // Convert to InsertContact format
      const formattedContacts = qualityContacts.map(contact => 
        this.formatContactForDatabase(contact, companyName)
      );

      console.log(`Found ${formattedContacts.length} quality contacts for ${companyName}`);
      return formattedContacts.slice(0, this.maxContactsPerAccount);

    } catch (error) {
      console.error(`Contact identification failed for ${companyName}:`, error);
      return [];
    }
  }

  // Build targeted search query for PDL Person Search API
  private buildContactSearchQuery(
    companyName: string, 
    companyDomain?: string,
    targetSystems?: string[]
  ): any {
    // Target roles for MS Dynamics, Oracle, SAP implementations
    const targetRoles = [
      'QA Manager', 'Quality Assurance Manager', 'Test Manager',
      'SDLC Manager', 'Software Development Manager', 'DevOps Manager',
      'Enterprise Systems Manager', 'IT Operations Manager',
      'Digital Transformation Manager', 'Technology Director',
      'VP Engineering', 'CTO', 'Director of Quality', 'Head of Engineering'
    ];

    // Build role queries with title matching
    const titleQueries = targetRoles.map(role => ({ title: role }));

    const baseQuery: any = {
      query: {
        bool: {
          must: [
            // Company matching
            companyDomain 
              ? { term: { 'job_company_website': companyDomain } }
              : { match: { 'job_company_name': companyName } },
            
            // Seniority filtering (Manager level and above)
            {
              terms: {
                'job_title_levels': ['manager', 'director', 'vp', 'c_level']
              }
            }
          ],
          should: [
            // Target role titles
            ...titleQueries.map(tq => ({ match: { 'job_title': tq.title } })),
            
            // Target keywords in job descriptions
            { match: { 'job_summary': 'quality assurance automation testing' } },
            { match: { 'job_summary': 'enterprise systems ERP implementation' } },
            { match: { 'job_summary': 'digital transformation technology modernization' } }
          ],
          minimum_should_match: 1
        }
      },
      // Return top 25 (we'll filter to 20)
      size: 25,
      // Sort by relevance and seniority
      sort: [
        { '_score': { 'order': 'desc' } },
        { 'job_start_date': { 'order': 'desc' } }
      ]
    };

    // Add system-specific keywords if specified
    if (targetSystems && targetSystems.length > 0) {
      const systemKeywords = targetSystems.map(system => ({
        match: { 'job_summary': `${system} implementation migration` }
      }));
      baseQuery.query.bool.should.push(...systemKeywords);
    }

    return baseQuery;
  }

  // Execute Person Search API call
  private async searchPersons(searchQuery: any): Promise<any[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/person/search`,
        searchQuery,
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.data) {
        console.log(`PDL returned ${response.data.data.length} potential contacts`);
        return response.data.data;
      }

      return [];
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('PDL API key invalid or expired');
      } else if (error.response?.status === 429) {
        throw new Error('PDL rate limit exceeded - upgrade plan or retry later');
      } else {
        throw new Error(`PDL API error: ${error.message}`);
      }
    }
  }

  // Filter contacts for quality and relevance
  private filterQualityContacts(contacts: any[], targetSystems?: string[]): any[] {
    return contacts.filter(contact => {
      // Must have valid email
      if (!contact.emails || contact.emails.length === 0) {
        return false;
      }

      // Must have current job title and company
      if (!contact.job_title || !contact.job_company_name) {
        return false;
      }

      // Must be current role (within last 2 years)
      const jobStartDate = contact.job_start_date;
      if (jobStartDate) {
        const startDate = new Date(jobStartDate);
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        
        if (startDate < twoYearsAgo) {
          return false;
        }
      }

      // Prefer manager+ level roles
      const title = contact.job_title.toLowerCase();
      const seniorityKeywords = ['manager', 'director', 'vp', 'head', 'lead', 'principal', 'senior'];
      const hasSeniority = seniorityKeywords.some(keyword => title.includes(keyword));

      return hasSeniority;
    })
    .sort((a, b) => {
      // Sort by likelihood score (higher is better)
      return (b.likelihood || 0) - (a.likelihood || 0);
    });
  }

  // Format PDL contact data for database storage
  private formatContactForDatabase(contact: any, companyName: string): InsertContact {
    // Extract focus areas from job title and summary
    const focusAreas = this.extractFocusAreas(contact.job_title, contact.job_summary);
    
    // Determine role category
    const roleCategory = this.categorizeRole(contact.job_title);
    
    // Determine seniority level
    const seniority = this.extractSeniority(contact.job_title);

    return {
      firstName: contact.first_name || 'Not available',
      lastName: contact.last_name || 'Not available', 
      email: contact.emails?.[0] || 'Not available',
      linkedinUrl: contact.linkedin_url || null,
      title: contact.job_title || 'Not available',
      department: this.extractDepartment(contact.job_title),
      seniority: seniority,
      focusAreas: focusAreas,
      roleCategory: roleCategory,
      confidence: Math.round((contact.likelihood || 0.5) * 100), // Convert to percentage
      // Account ID will be set when saving to database
      accountId: null
    };
  }

  // Extract focus areas from job title and description
  private extractFocusAreas(title: string, summary?: string): string[] {
    const areas: string[] = [];
    const text = `${title} ${summary || ''}`.toLowerCase();

    if (text.includes('qa') || text.includes('quality') || text.includes('testing')) {
      areas.push('QA');
    }
    if (text.includes('sdlc') || text.includes('development') || text.includes('software')) {
      areas.push('SDLC');
    }
    if (text.includes('enterprise') || text.includes('erp') || text.includes('systems')) {
      areas.push('Enterprise Systems');
    }
    if (text.includes('digital') || text.includes('transformation') || text.includes('modernization')) {
      areas.push('Digital Transformation');
    }
    if (text.includes('devops') || text.includes('automation') || text.includes('ci/cd')) {
      areas.push('DevOps');
    }

    return areas.length > 0 ? areas : ['Technology'];
  }

  // Categorize role for easier filtering
  private categorizeRole(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('qa') || lowerTitle.includes('quality') || lowerTitle.includes('test')) {
      return 'Quality Assurance';
    }
    if (lowerTitle.includes('enterprise') || lowerTitle.includes('erp') || lowerTitle.includes('systems')) {
      return 'Enterprise Systems';
    }
    if (lowerTitle.includes('digital') || lowerTitle.includes('transformation')) {
      return 'Digital Transformation';
    }
    if (lowerTitle.includes('development') || lowerTitle.includes('software') || lowerTitle.includes('engineering')) {
      return 'Software Development';
    }
    if (lowerTitle.includes('devops') || lowerTitle.includes('automation')) {
      return 'DevOps';
    }
    
    return 'Technology Leadership';
  }

  // Extract department from job title
  private extractDepartment(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('engineering') || lowerTitle.includes('development')) {
      return 'Engineering';
    }
    if (lowerTitle.includes('quality') || lowerTitle.includes('qa') || lowerTitle.includes('test')) {
      return 'Quality Assurance';
    }
    if (lowerTitle.includes('it') || lowerTitle.includes('technology') || lowerTitle.includes('systems')) {
      return 'Information Technology';
    }
    if (lowerTitle.includes('operations') || lowerTitle.includes('ops')) {
      return 'Operations';
    }
    
    return 'Technology';
  }

  // Extract seniority level from title
  private extractSeniority(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('cto') || lowerTitle.includes('cio') || lowerTitle.includes('chief')) {
      return 'C-Level';
    }
    if (lowerTitle.includes('vp') || lowerTitle.includes('vice president')) {
      return 'VP';
    }
    if (lowerTitle.includes('director') || lowerTitle.includes('head of')) {
      return 'Director';
    }
    if (lowerTitle.includes('manager') || lowerTitle.includes('lead')) {
      return 'Manager';
    }
    
    return 'Senior Individual Contributor';
  }

  // Get service status for diagnostics
  getStatus() {
    return {
      hasApiKey: !!this.apiKey,
      maxContactsPerAccount: this.maxContactsPerAccount,
      baseUrl: this.baseUrl,
      status: this.apiKey ? 'ready' : 'api_key_required'
    };
  }

  // Test API connectivity
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.apiKey) {
      return { success: false, message: 'PDL API key not configured' };
    }

    try {
      // Simple test query
      const response = await axios.post(
        `${this.baseUrl}/person/search`,
        {
          query: { bool: { must: [{ term: { 'job_title': 'manager' } }] } },
          size: 1
        },
        {
          headers: {
            'X-Api-Key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return { 
        success: true, 
        message: `PDL API connected successfully. Credits available: ${response.headers['x-credits-remaining'] || 'unknown'}` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `PDL API test failed: ${error.response?.data?.error || error.message}` 
      };
    }
  }
}

// Export singleton instance
export const peopleDataLabs = new PeopleDataLabsService();