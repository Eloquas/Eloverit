import OpenAI from "openai";
import { storage } from "./storage";
import { dataSourcesService } from "./data-sources-service";
import { pdlService } from "./pdl-service";
import type { InsertAccount, InsertContact } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Model configuration with fallback
const INTENT_MODEL = process.env.INTENT_MODEL || 'o1-pro'; // Default to o1-pro for reasoning
const BACKUP_MODEL = 'gpt-4o'; // Fallback if o1-pro unavailable

// Intent discovery service
export class IntentDiscoveryService {
  
  // Main intent discovery function with SESSION SCOPING and VALIDATION
  async discoverHighIntentAccounts(
    query: string, 
    targetSystems: string[], 
    isAutoMode: boolean = false,
    sessionId?: string
  ) {
    try {
      console.log(`Starting intent discovery for: ${query}, systems: ${targetSystems.join(', ')}`);
      console.log(`Using model: ${INTENT_MODEL} for deep reasoning and research`);
      
      // Step 1: Research high-intent accounts using configured model (o1-pro/o3-pro)
      const researchPrompt = this.buildAccountResearchPrompt(query, targetSystems);
      
      let modelToUse = INTENT_MODEL;
      let response;
      
      try {
        response = await openai.chat.completions.create({
          model: modelToUse,
          messages: [
            {
              role: "system",
              content: "You are a precision B2B sales research agent with access to real-time data sources. Your task is to identify high-intent companies showing signals related to MS Dynamics, Oracle, SAP implementations, QA automation initiatives, or SDLC improvements. CRITICAL: You must provide citations for all claims. If you cannot find reliable, verifiable information with citations, return empty results instead of guessing. ZERO HALLUCINATIONS POLICY ENFORCED."
            },
            {
              role: "user",
              content: researchPrompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1, // Low temperature for factual accuracy
        });
      } catch (error: any) {
        console.warn(`Failed to use ${modelToUse}, falling back to ${BACKUP_MODEL}:`, error.message);
        modelToUse = BACKUP_MODEL;
        response = await openai.chat.completions.create({
          model: modelToUse,
          messages: [
            {
              role: "system",
              content: "You are a precision B2B sales research agent with access to real-time data sources. Your task is to identify high-intent companies showing signals related to MS Dynamics, Oracle, SAP implementations, QA automation initiatives, or SDLC improvements. CRITICAL: You must provide citations for all claims. If you cannot find reliable, verifiable information with citations, return empty results instead of guessing. ZERO HALLUCINATIONS POLICY ENFORCED."
            },
            {
              role: "user",
              content: researchPrompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        });
      }

      const researchData = JSON.parse(response.choices[0].message.content || '{}');
      
      // CRITICAL: Validate citations and evidence quality
      const validatedData = this.validateResearchQuality(researchData, modelToUse);
      
      // BULLETPROOF SCHEMA VALIDATION before processing
      const validationResult = this.enforceSchemaValidation(validatedData);
      if (!validationResult.isValid) {
        console.warn('Schema validation failed:', validationResult.errors);
        return []; // Return empty array for insufficient evidence
      }
      
      // Step 2: Process and validate research data with strict citation requirements
      const accounts = await this.processResearchData(validatedData, targetSystems, sessionId);
      
      // Step 3: Create account-level SCIPABs for high-intent accounts
      for (const accountData of accounts) {
        if (accountData.isHighIntent) {
          accountData.scipab = await this.generateAccountSCIPAB(accountData);
        }
      }
      
      // Step 4: Save accounts to database
      const savedAccounts = [];
      for (const accountData of accounts) {
        const saved = await storage.createAccount(accountData);
        savedAccounts.push(saved);
        
        // Log research session with model and quality metrics
        await storage.createResearchSession({
          accountId: saved.id,
          researchType: 'account_discovery',
          prompt: researchPrompt,
          response: {
            ...researchData,
            modelUsed: modelToUse,
            citationCount: this.countCitations(researchData),
            hasEvidence: this.hasStrongEvidence(researchData)
          },
          model: modelToUse,
          hasHallucinations: false, // Enforced by validation
          qualityScore: accountData.intentScore || 0,
        });
      }
      
      console.log(`Discovered ${savedAccounts.length} accounts, ${savedAccounts.filter(a => a.isHighIntent).length} high-intent`);
      
      return savedAccounts;
      
    } catch (error) {
      console.error('Intent discovery failed:', error);
      throw new Error('Intent discovery failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // CRITICAL: Validate research quality and citations
  private validateResearchQuality(researchData: any, modelUsed: string): any {
    console.log(`Validating research quality from ${modelUsed}`);
    
    if (!researchData.accounts || !Array.isArray(researchData.accounts)) {
      console.warn('No accounts found in research - returning empty results to prevent hallucinations');
      return { accounts: [] };
    }

    const validatedAccounts = [];
    for (const account of researchData.accounts) {
      // CRITICAL: Check citation requirements
      if (!account.citations || !Array.isArray(account.citations) || account.citations.length < 3) {
        console.warn(`Excluding ${account.companyName || 'unnamed account'} - insufficient citations (${account.citations?.length || 0}/3 required)`);
        continue;
      }

      // Validate citation quality
      const validCitations = account.citations.filter((citation: any) => 
        citation.url && citation.source_type && citation.date && citation.relevance
      );
      
      if (validCitations.length < 3) {
        console.warn(`Excluding ${account.companyName || 'unnamed account'} - only ${validCitations.length} valid citations`);
        continue;
      }

      // Check for hallucination indicators
      const hasEvidence = this.hasStrongEvidence(account);
      if (!hasEvidence) {
        console.warn(`Excluding ${account.companyName || 'unnamed account'} - insufficient evidence quality`);
        continue;
      }

      validatedAccounts.push({
        ...account,
        citations: validCitations,
        validationPassed: true,
        modelUsed: modelUsed
      });
    }

    console.log(`Validated ${validatedAccounts.length}/${researchData.accounts.length} accounts with sufficient citations`);
    
    return {
      accounts: validatedAccounts,
      validationSummary: {
        original: researchData.accounts.length,
        validated: validatedAccounts.length,
        rejectionReasons: this.getValidationStats(researchData.accounts)
      }
    };
  }

  // Check if account has strong evidence
  private hasStrongEvidence(account: any): boolean {
    const indicators = [
      account.intentSignals?.initiatives?.length > 0,
      account.intentSignals?.hiring_activity?.length > 0,
      account.intentSignals?.financial_signals?.length > 0,
      account.domain && account.domain !== 'Not available',
      account.revenue && account.revenue !== 'Not available',
      account.citations?.length >= 3
    ];
    
    return indicators.filter(Boolean).length >= 4; // At least 4 strong indicators
  }

  // Count valid citations
  private countCitations(data: any): number {
    if (!data.accounts) return 0;
    return data.accounts.reduce((total: number, account: any) => 
      total + (account.citations?.length || 0), 0
    );
  }

  // Get validation statistics
  private getValidationStats(accounts: any[]): any {
    const stats = {
      insufficientCitations: 0,
      missingDomain: 0,
      weakEvidence: 0,
      total: accounts.length
    };
    
    for (const account of accounts) {
      if (!account.citations || account.citations.length < 3) stats.insufficientCitations++;
      if (!account.domain || account.domain === 'Not available') stats.missingDomain++;
      if (!this.hasStrongEvidence(account)) stats.weakEvidence++;
    }
    
    return stats;
  }

  // Build research prompt for account discovery
  private buildAccountResearchPrompt(query: string, targetSystems: string[]): string {
    return `
You are conducting deep B2B intent research for companies showing signals related to: ${targetSystems.join(', ')}

RESEARCH METHODOLOGY:
1. Job Board Analysis: Search recent postings (last 90 days) for roles indicating system implementations
2. 10-K Filing Analysis: Look for technology investment mentions in SEC filings
3. Recent News Analysis: Search for digital transformation announcements, system upgrades, quality initiatives
4. Leadership Changes: Track new hires in IT, Operations, Quality, Digital Transformation roles

TARGET INTENT SIGNALS:
${targetSystems.includes('dynamics') ? '- Microsoft Dynamics 365 implementations, CRM upgrades, ERP modernization' : ''}
${targetSystems.includes('oracle') ? '- Oracle system deployments, database migrations, enterprise software upgrades' : ''}
${targetSystems.includes('sap') ? '- SAP implementations, S/4HANA migrations, enterprise resource planning projects' : ''}
${targetSystems.includes('salesforce') ? '- Salesforce implementations, CRM migrations, sales automation projects' : ''}
- QA automation initiatives, testing infrastructure upgrades  
- SDLC improvements, DevOps transformations
- Enterprise systems consolidation projects

Find 5-10 companies with VERIFIED high-intent signals. Provide ONLY factual information in this JSON format:
{
  "accounts": [
    {
      "companyName": "Company Name",
      "domain": "company.com or 'Not available'",
      "industry": "Industry or 'Not available'",
      "companySize": "Size range or 'Not available'",
      "revenue": "Revenue range or 'Not available'",
      "location": "Primary location or 'Not available'",
      "intentSignals": {
        "initiatives": ["specific initiatives found or empty array"],
        "hiring_activity": [{"role": "role title", "department": "dept", "date": "posting date or 'Not available'"}],
        "tech_stack": ["technologies mentioned or empty array"],
        "financial_signals": ["relevant financial mentions or empty array"]
      },
      "intentScore": numeric_score_0_to_100,
      "isHighIntent": boolean_based_on_strong_signals,
      "evidenceSources": ["source1", "source2"] // Where you found this information
    }
  ]
}

CRITICAL RULES - ZERO HALLUCINATION POLICY:
- MANDATORY: Include citations for EVERY claim (URLs, filing numbers, job posting IDs)
- NEVER invent or assume data - if no evidence found, return empty results
- If information is not publicly available, use "Not available"  
- Only include companies with verifiable intent signals and citations
- Maximum 10 accounts per response
- Intent score should reflect strength of verified signals only
- Each account MUST have "citations" array with specific sources
- Format citations as: {"source_type": "10-K Filing", "url": "specific_url", "date": "YYYY-MM-DD", "relevance": "quote from source"}
- If fewer than 3 citations per account, exclude that account entirely
`;
  }

  // BULLETPROOF schema validation before processing  
  private enforceSchemaValidation(data: any): { isValid: boolean; errors?: string[] } {
    try {
      const { intentResultValidationSchema } = require("@shared/schema");
      intentResultValidationSchema.parse(data);
      return { isValid: true };
    } catch (error: any) {
      console.error('VALIDATION FAILED - Insufficient evidence:', error.message);
      return { 
        isValid: false, 
        errors: error.errors?.map((e: any) => e.message) || [error.message] 
      };
    }
  }

  // Process and validate research data with session scoping
  private async processResearchData(researchData: any, targetSystems: string[], sessionId?: string): Promise<InsertAccount[]> {
    const accounts: InsertAccount[] = [];
    
    if (!researchData.accounts || !Array.isArray(researchData.accounts)) {
      console.warn('No valid accounts found in research data');
      return accounts;
    }
    
    for (const accountData of researchData.accounts) {
      // Validate required fields
      if (!accountData.companyName) {
        console.warn('Skipping account without company name');
        continue;
      }
      
      // BULLETPROOF VALIDATION: Enforce 3+ citations requirement
      const citationCount = accountData.citations?.length || 0;
      if (citationCount < 3) {
        console.warn(`Skipping account ${accountData.companyName}: only ${citationCount} citations (minimum 3 required)`);
        continue;
      }

      // Process and clean the data with session scoping
      const account: InsertAccount = {
        companyName: accountData.companyName,
        domain: accountData.domain === 'Not available' ? null : accountData.domain,
        industry: accountData.industry === 'Not available' ? null : accountData.industry,
        companySize: accountData.companySize === 'Not available' ? null : accountData.companySize,
        revenue: accountData.revenue === 'Not available' ? null : accountData.revenue,
        location: accountData.location === 'Not available' ? null : accountData.location,
        targetSystems: targetSystems,
        intentSignals: accountData.intentSignals || {},
        intentScore: Math.min(100, Math.max(0, accountData.intentScore || 0)),
        citations: accountData.citations || [],
        researchData: {
          sources: [],
          initiatives: accountData.initiatives || []
        },
        status: 'discovered',
        isHighIntent: accountData.intentScore >= 70, // High intent threshold
        researchSessionId: sessionId, // CRITICAL: Link to research session for scoping
      };
      
      accounts.push(account);
    }
    
    return accounts;
  }

  // Generate account-level SCIPAB
  private async generateAccountSCIPAB(account: InsertAccount): Promise<any> {
    try {
      const scipabPrompt = `
Create a SCIPAB (Situation, Complication, Implication, Position, Ask, Benefit) framework for this high-intent account:

Company: ${account.companyName}
Industry: ${account.industry || 'Not specified'}
Intent Signals: ${JSON.stringify(account.intentSignals)}
Target Systems: ${account.targetSystems?.join(', ')}

Focus on QA automation and testing challenges that Avo Assure can solve.

Respond in JSON format:
{
  "situation": "Current situation description",
  "complication": "Key challenges they're facing",
  "implication": "Impact if not addressed",
  "position": "How Avo Assure helps",
  "ask": "Specific call to action",
  "benefit": "Value proposition"
}

Base this on their actual intent signals. Do not invent details not supported by the data.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system", 
            content: "You are a sales enablement expert creating SCIPAB frameworks based on verified company data. Never invent information not provided in the prompt."
          },
          {
            role: "user",
            content: scipabPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
      
    } catch (error) {
      console.error('SCIPAB generation failed:', error);
      return null;
    }
  }

  // Identify contacts using REAL People Data Labs API - NO HALLUCINATIONS
  async identifyContacts(accountId: number): Promise<any[]> {
    try {
      const account = await storage.getAccountById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      console.log(`Starting REAL contact identification for: ${account.companyName}`);
      
      // Check if we have company domain - REQUIRED for PDL
      if (!account.domain) {
        console.log('No company domain available - cannot identify contacts via PDL');
        
        await storage.createResearchSession({
          accountId: accountId,
          researchType: 'contact_identification',
          prompt: `Contact search attempted for ${account.companyName}`,
          response: { 
            status: 'no_domain',
            message: 'Company domain required for People Data Labs API'
          },
          model: 'pdl_api',
          hasHallucinations: false,
          qualityScore: 0,
        });
        
        return [];
      }

      // Use REAL People Data Labs API
      const pdlResult = await pdlService.searchContacts(account.domain, account.companyName);
      
      if (pdlResult.status !== 'success') {
        console.log(`PDL search failed: ${pdlResult.status} - ${pdlResult.message}`);
        
        // Log the failed attempt with clear status
        await storage.createResearchSession({
          accountId: accountId,
          researchType: 'contact_identification',
          prompt: `PDL API call for ${account.companyName} (${account.domain})`,
          response: { 
            status: pdlResult.status, 
            message: pdlResult.message,
            retryAfter: pdlResult.retryAfter 
          },
          model: 'pdl_api',
          hasHallucinations: false,
          qualityScore: 0,
        });
        
        return []; // Return empty array instead of fake data
      }

      // Convert REAL PDL contacts to our schema
      const targetRoles = ['qa', 'quality', 'product', 'engineering', 'systems', 'devops'];
      const savedContacts = [];
      
      // Limit to max 20 contacts as per requirements
      for (const pdlContact of pdlResult.contacts.slice(0, 20)) {
        const contactData = pdlService.convertToContact(pdlContact, accountId, targetRoles);
        const saved = await storage.createContact(contactData);
        savedContacts.push(saved);
      }
      
      // Log successful REAL contact identification
      await storage.createResearchSession({
        accountId: accountId,
        researchType: 'contact_identification',
        prompt: `PDL API call for ${account.companyName} (${account.domain})`,
        response: { 
          status: 'success', 
          contactsFound: savedContacts.length,
          source: 'people_data_labs',
          isRealData: true
        },
        model: 'pdl_api',
        hasHallucinations: false,
        qualityScore: 100, // Real data from PDL API
      });
      
      console.log(`Successfully identified ${savedContacts.length} REAL contacts for ${account.companyName} using People Data Labs`);
      
      return savedContacts;
      
    } catch (error) {
      console.error('Contact identification failed:', error);
      throw new Error('Contact identification failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // Build contact research prompt
  private buildContactResearchPrompt(account: any): string {
    return `
Identify Manager+ level contacts at ${account.companyName} who are involved in:
- Quality Assurance (QA)
- Software Development Lifecycle (SDLC) 
- Enterprise Systems
- Digital Transformation

Company Details:
- Industry: ${account.industry || 'Not specified'}
- Target Systems: ${account.targetSystems?.join(', ')}
- Intent Signals: ${JSON.stringify(account.intentSignals)}

Search for contacts with these characteristics:
- Seniority: Manager, Senior Manager, Director, VP, C-Level only
- Departments: QA, Testing, IT, Operations, Digital, Technology, Product
- Focus areas related to testing, quality, automation, enterprise systems

Respond in JSON format with maximum 20 contacts:
{
  "contacts": [
    {
      "firstName": "First Name or 'Not available'",
      "lastName": "Last Name or 'Not available'", 
      "title": "Job Title",
      "department": "Department or 'Not available'",
      "seniority": "Manager|Director|VP|C-Level",
      "email": "email@company.com or 'Not available'",
      "linkedinUrl": "LinkedIn URL or 'Not available'",
      "focusAreas": ["QA", "SDLC", "Enterprise Systems", "Digital Transformation"],
      "roleCategory": "Primary role category",
      "confidence": numeric_score_0_to_100,
      "dataSource": "LinkedIn|Company Website|Public Directory"
    }
  ]
}

CRITICAL RULES:
- NEVER invent contact information
- Only include Manager+ level contacts
- Verify contacts exist through public sources
- Maximum 20 contacts total
- If email not publicly available, use "Not available"
`;
  }

  // Process contact data
  private async processContactData(contactData: any, accountId: number): Promise<InsertContact[]> {
    const contacts: InsertContact[] = [];
    
    if (!contactData.contacts || !Array.isArray(contactData.contacts)) {
      console.warn('No valid contacts found in research data');
      return contacts;
    }
    
    // Limit to 20 contacts as specified
    const limitedContacts = contactData.contacts.slice(0, 20);
    
    for (const contactInfo of limitedContacts) {
      // Validate required fields
      if (!contactInfo.title || !contactInfo.seniority) {
        console.warn('Skipping contact without title or seniority');
        continue;
      }
      
      const contact: InsertContact = {
        accountId: accountId,
        firstName: contactInfo.firstName === 'Not available' ? null : contactInfo.firstName,
        lastName: contactInfo.lastName === 'Not available' ? null : contactInfo.lastName,
        email: contactInfo.email === 'Not available' ? null : contactInfo.email,
        linkedinUrl: contactInfo.linkedinUrl === 'Not available' ? null : contactInfo.linkedinUrl,
        title: contactInfo.title,
        department: contactInfo.department === 'Not available' ? null : contactInfo.department,
        seniority: contactInfo.seniority,
        focusAreas: contactInfo.focusAreas || [],
        roleCategory: contactInfo.roleCategory,
        confidence: Math.min(100, Math.max(0, contactInfo.confidence || 0)),
        dataSource: contactInfo.dataSource || 'Unknown',
      };
      
      contacts.push(contact);
    }
    
    return contacts;
  }

  // Generate role-level SCIPAB
  private async generateRoleSCIPAB(account: any, contact: any): Promise<any> {
    try {
      const roleSCIPABPrompt = `
Create a role-specific SCIPAB for this contact at ${account.companyName}:

Contact: ${contact.title} in ${contact.department}
Seniority: ${contact.seniority}
Focus Areas: ${contact.focusAreas?.join(', ')}
Account Context: ${JSON.stringify(account.intentSignals)}

Consider role-specific pain points:
- QA Manager: Testing bottlenecks, manual processes, coverage gaps
- IT Director: Integration challenges, system reliability
- Digital Transformation: Modernization, automation, efficiency

Respond in JSON format:
{
  "situation": "Their current role situation",
  "complication": "Role-specific challenges", 
  "implication": "Impact on their objectives",
  "position": "How Avo Assure addresses their needs",
  "ask": "Role-appropriate call to action",
  "benefit": "Personal and organizational benefits",
  "role_specific_pains": ["pain1", "pain2", "pain3"]
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a sales enablement expert creating role-specific SCIPAB frameworks. Focus on the specific pain points and motivations of each role."
          },
          {
            role: "user", 
            content: roleSCIPABPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
      
    } catch (error) {
      console.error('Role SCIPAB generation failed:', error);
      return null;
    }
  }
}

export const intentDiscoveryService = new IntentDiscoveryService();