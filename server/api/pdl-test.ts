import { PDLService } from '../pdl-service';

export class PDLConnectionTest {
  private pdlService: PDLService;

  constructor() {
    this.pdlService = new PDLService();
  }

  async testConnection(companyName: string) {
    const results = {
      timestamp: new Date().toISOString(),
      company: companyName,
      tests: {
        companyEnrichment: { status: 'testing', data: null as any, error: null as string | null },
        personEnrichment: { status: 'testing', data: null as any, error: null as string | null },
        jobSearch: { status: 'testing', data: null as any, error: null as string | null },
        scipabAnalysis: { status: 'testing', data: null as any, error: null as string | null }
      },
      fieldsUsed: {
        pdl: [
          'Company Name',
          'Industry Classification',
          'Employee Count',
          'Company Size Category',
          'Technologies (if available)',
          'Location Data',
          'Founded Year',
          'Revenue Range'
        ],
        scipab: [
          'Current Systems Analysis',
          'Pain Points Inference',
          'Initiative Detection',
          'Hiring Pattern Analysis',
          'Industry Context',
          'Company Size Factor'
        ]
      }
    };

    // Test Company Enrichment
    try {
      const companyData = await this.pdlService.enrichCompany(companyName);
      results.tests.companyEnrichment.status = 'success';
      results.tests.companyEnrichment.data = companyData;
    } catch (error) {
      results.tests.companyEnrichment.status = 'failed';
      results.tests.companyEnrichment.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test Job Search (expected to fail with current API tier)
    try {
      const jobData = await this.pdlService.getCompanyJobPostings(companyName);
      results.tests.jobSearch.status = 'success';
      results.tests.jobSearch.data = jobData;
    } catch (error) {
      results.tests.jobSearch.status = 'failed';
      results.tests.jobSearch.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test SCIPAB Analysis Integration
    try {
      const scipabData = await this.pdlService.analyzeCompanyForSCIPAB(companyName);
      results.tests.scipabAnalysis.status = 'success';
      results.tests.scipabAnalysis.data = scipabData;
    } catch (error) {
      results.tests.scipabAnalysis.status = 'failed';
      results.tests.scipabAnalysis.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return results;
  }

  async generateDetailedReport() {
    const companies = ['United Airlines', 'General Electric', 'JPMorgan Chase', 'Microsoft'];
    const reports = [];

    for (const company of companies) {
      const report = await this.testConnection(company);
      reports.push(report);
    }

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: reports.length,
        successfulCompanyEnrichments: reports.filter(r => r.tests.companyEnrichment.status === 'success').length,
        failedJobSearches: reports.filter(r => r.tests.jobSearch.status === 'failed').length,
        scipabAnalysisSuccess: reports.filter(r => r.tests.scipabAnalysis.status === 'success').length
      },
      dataFields: {
        pdlFieldsRetrieved: [
          'name (company name)',
          'industry (industry classification)', 
          'size (company size category)',
          'location (headquarters info)',
          'employee_count (workforce size)',
          'technologies[] (tech stack - limited availability)',
          'founded (founding year)',
          'revenue (revenue range)'
        ],
        scipabDataGenerated: [
          'initiatives[] (business initiatives detected)',
          'systems[] (technology systems in use)',
          'painPoints[] (operational challenges)',
          'hiringPatterns[] (recruitment activity)',
          'industry (sector classification)',
          'companySize (employee range)'
        ]
      },
      reports
    };
  }
}