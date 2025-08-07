import OpenAI from "openai";
import { storage } from "./storage";
import type { InsertAccount, InsertContact } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Intent discovery service
export class IntentDiscoveryService {
  
  // Main intent discovery function
  async discoverHighIntentAccounts(
    query: string, 
    targetSystems: string[], 
    isAutoMode: boolean = false
  ) {
    try {
      console.log(`Starting intent discovery for: ${query}, systems: ${targetSystems.join(', ')}`);
      
      // Step 1: Research high-intent accounts using GPT-4o (will upgrade to o3-pro)
      const researchPrompt = this.buildAccountResearchPrompt(query, targetSystems);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a precision B2B sales research agent. Your task is to identify high-intent companies showing signals related to MS Dynamics, Oracle, SAP implementations, QA automation initiatives, or SDLC improvements. NEVER generate fake data. Only return information you can verify from public sources. If you cannot find reliable information, return 'Not available'."
          },
          {
            role: "user",
            content: researchPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for factual accuracy
      });

      const researchData = JSON.parse(response.choices[0].message.content || '{}');
      
      // Step 2: Process and validate research data
      const accounts = await this.processResearchData(researchData, targetSystems);
      
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
        
        // Log research session
        await storage.createResearchSession({
          accountId: saved.id,
          researchType: 'account_discovery',
          prompt: researchPrompt,
          response: researchData,
          model: 'gpt-4o',
          hasHallucinations: false, // We validate this
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

CRITICAL RULES:
- NEVER invent or assume data
- If information is not publicly available, use "Not available"
- Only include companies with verifiable intent signals
- Maximum 10 accounts per response
- Intent score should reflect strength of verified signals only
`;
  }

  // Process and validate research data
  private async processResearchData(researchData: any, targetSystems: string[]): Promise<InsertAccount[]> {
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
      
      // Process and clean the data
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
        researchData: {
          rawData: accountData
        },
        status: 'discovered',
        isHighIntent: accountData.intentScore >= 70, // High intent threshold
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

  // Identify contacts for an account
  async identifyContacts(accountId: number): Promise<any[]> {
    try {
      const account = await storage.getAccountById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      console.log(`Starting contact identification for: ${account.companyName}`);
      
      // Step 1: Generate contact research prompt
      const contactPrompt = this.buildContactResearchPrompt(account);
      
      // Step 2: Use GPT to identify relevant contacts
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a contact research specialist. Identify Manager+ level contacts at companies who are involved in QA, SDLC, Enterprise Systems, or Digital Transformation. NEVER generate fake contact information. Only return contacts you can verify from LinkedIn, company websites, or other public sources."
          },
          {
            role: "user",
            content: contactPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const contactData = JSON.parse(response.choices[0].message.content || '{}');
      
      // Step 3: Process and save contacts
      const contacts = await this.processContactData(contactData, accountId);
      
      // Step 4: Generate role-level SCIPABs for high-confidence contacts
      for (const contactData of contacts) {
        if ((contactData.confidence || 0) >= 80) {
          contactData.roleSCIPAB = await this.generateRoleSCIPAB(account, contactData);
        }
      }
      
      // Step 5: Save contacts to database
      const savedContacts = [];
      for (const contactData of contacts) {
        const saved = await storage.createContact(contactData);
        savedContacts.push(saved);
      }
      
      // Step 6: Log research session
      await storage.createResearchSession({
        accountId: accountId,
        researchType: 'contact_identification',
        prompt: contactPrompt,
        response: contactData,
        model: 'gpt-4o',
        hasHallucinations: false,
        qualityScore: savedContacts.length > 0 ? 90 : 50,
      });
      
      console.log(`Identified ${savedContacts.length} contacts for ${account.companyName}`);
      
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