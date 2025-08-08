import OpenAI from "openai";
import { storage } from "./storage";
import { searchService } from "./search-service";
import { contentFetcher } from "./content-fetcher";
import type { InsertAccount, CompanyFact } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Model configuration - prefer o3-pro for reasoning
const INTENT_MODEL = process.env.INTENT_MODEL || 'o3-pro';
const BACKUP_MODEL = 'gpt-4o'; // Fallback model

// Grounded Intent Discovery Service - uses real web sources only
export class GroundedIntentDiscoveryService {
  
  // Main discovery function with web research pipeline
  async discoverHighIntentAccounts(
    query: string, 
    targetSystems: string[], 
    isAutoMode: boolean = false,
    sessionId: string
  ) {
    try {
      console.log(`Starting grounded research session ${sessionId} for: ${query}`);
      
      // STEP 1: Extract potential company names from query or use broad search
      const potentialCompanies = this.extractCompanyNames(query);
      const accounts: InsertAccount[] = [];
      
      // If no specific companies in query, do broad market research
      if (potentialCompanies.length === 0) {
        potentialCompanies.push('enterprise software companies', 'technology firms', 'manufacturing companies');
      }
      
      // STEP 2: For each potential company, gather web facts
      for (const companyHint of potentialCompanies.slice(0, 5)) { // Limit to 5 companies
        console.log(`Researching company signals for: ${companyHint}`);
        
        try {
          // Search for intent signals
          const searchResults = await searchService.searchCompanyIntentSignals(companyHint, targetSystems);
          console.log(`Found ${searchResults.length} search results for ${companyHint}`);
          
          if (searchResults.length === 0) {
            console.log(`No search results found for ${companyHint}, skipping`);
            continue;
          }
          
          // Extract facts from web content
          const urls = searchResults.map(r => r.url);
          const facts = await contentFetcher.fetchAndExtractFacts(urls, companyHint, sessionId);
          console.log(`Extracted ${facts.length} facts for ${companyHint}`);
          
          if (facts.length < 2) {
            console.log(`Insufficient facts for ${companyHint} (${facts.length}/2 required), skipping`);
            continue;
          }
          
          // Store facts in database
          for (const fact of facts) {
            await storage.createCompanyFact({
              sessionId: sessionId,
              companyName: fact.companyName,
              snippetText: fact.snippetText,
              snippetHash: fact.snippetHash,
              url: fact.url,
              title: fact.title,
              publishedAt: fact.publishedAt,
              relevanceScore: fact.relevanceScore
            });
          }
          
          // STEP 3: Use model to synthesize findings from facts ONLY
          const accountData = await this.synthesizeAccountFromFacts(
            companyHint,
            facts,
            targetSystems,
            sessionId
          );
          
          if (accountData) {
            accounts.push(accountData);
          }
          
        } catch (error) {
          console.warn(`Failed to research ${companyHint}:`, error);
          continue; // Skip this company but continue with others
        }
      }
      
      console.log(`Grounded research completed: ${accounts.length} accounts with verified sources`);
      return accounts;
      
    } catch (error) {
      console.error('Grounded intent discovery failed:', error);
      throw error;
    }
  }
  
  // Extract company names from user query
  private extractCompanyNames(query: string): string[] {
    // Simple extraction - look for proper nouns or quoted company names
    const companies: string[] = [];
    
    // Look for quoted company names
    const quotedMatches = query.match(/"([^"]+)"/g);
    if (quotedMatches) {
      companies.push(...quotedMatches.map(m => m.replace(/"/g, '')));
    }
    
    // Look for common company patterns
    const companyPatterns = [
      /\b([A-Z][a-z]+ [A-Z][a-z]+(?:\s+(?:Inc|Corp|LLC|Ltd|Company|Technologies|Systems|Solutions))?)\b/g,
      /\b([A-Z][a-z]+(?:\s+(?:Inc|Corp|LLC|Ltd|Company|Technologies|Systems|Solutions))?)\b/g
    ];
    
    for (const pattern of companyPatterns) {
      const matches = query.match(pattern);
      if (matches) {
        companies.push(...matches);
      }
    }
    
    // Remove duplicates and common false positives
    const uniqueCompanies = Array.from(new Set(companies));
    const filtered = uniqueCompanies
      .filter(name => !['Microsoft', 'Oracle', 'SAP', 'Dynamics', 'Enterprise'].includes(name))
      .slice(0, 3); // Limit to 3 companies
    
    return filtered;
  }
  
  // Synthesize account data from verified facts using model
  private async synthesizeAccountFromFacts(
    companyName: string,
    facts: any[],
    targetSystems: string[],
    sessionId: string
  ): Promise<InsertAccount | null> {
    try {
      // Build facts context for model
      const factsContext = facts.map((fact, index) => 
        `FACT ${index + 1} (${fact.url}): ${fact.snippetText}`
      ).join('\n\n');
      
      const synthesisPrompt = this.buildSynthesisPrompt(companyName, factsContext, targetSystems);
      
      // Call model with STRICT instructions to use only provided facts
      let response;
      const modelToUse = INTENT_MODEL;
      
      try {
        if (modelToUse === 'o3-pro') {
          // o3-pro not yet available in chat completions
          throw new Error('o3-pro requires different endpoint');
        }
        
        response = await openai.chat.completions.create({
          model: modelToUse,
          messages: [
            {
              role: 'system',
              content: 'You are a precision analyst. Use ONLY the provided facts. If insufficient evidence exists, return INSUFFICIENT_EVIDENCE. NEVER invent or assume information. Temperature: 0.1 for maximum accuracy.'
            },
            {
              role: 'user',
              content: synthesisPrompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1, // Low temperature for factual accuracy
        });
      } catch (error) {
        console.log(`Failed to use ${modelToUse}, falling back to ${BACKUP_MODEL}`);
        
        response = await openai.chat.completions.create({
          model: BACKUP_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a precision analyst. Use ONLY the provided facts. If insufficient evidence exists, return INSUFFICIENT_EVIDENCE. NEVER invent or assume information.'
            },
            {
              role: 'user',
              content: synthesisPrompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        });
      }
      
      const synthesisResult = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate synthesis has required evidence
      if (synthesisResult.status === 'INSUFFICIENT_EVIDENCE' || !synthesisResult.account) {
        console.log(`Insufficient evidence for ${companyName}, excluding from results`);
        return null;
      }
      
      // Validate required citations exist
      const account = synthesisResult.account;
      if (!account.initiatives || account.initiatives.length === 0) {
        console.log(`No initiatives found for ${companyName}, excluding`);
        return null;
      }
      
      // Check each initiative has citations
      const validInitiatives = account.initiatives.filter((init: any) => 
        init.citations && init.citations.length >= 1
      );
      
      if (validInitiatives.length === 0) {
        console.log(`No initiatives with citations for ${companyName}, excluding`);
        return null;
      }
      
      // Build final account data with session scoping
      return {
        companyName: account.companyName || companyName,
        domain: account.domain || 'Not available',
        industry: account.industry || 'Not available',
        companySize: account.companySize || 'Not available', 
        revenue: account.revenue || 'Not available',
        location: account.location || 'Not available',
        intentScore: Math.min(100, Math.max(0, account.intentScore || 0)),
        isHighIntent: account.intentScore >= 70,
        researchSessionId: sessionId,
        initiatives: validInitiatives,
        scipab: null, // Will be generated later if needed
        targetSystems: targetSystems,
        intentSignals: account.intentSignals || {},
        citations: this.buildCitationsFromFacts(facts)
      };
      
    } catch (error) {
      console.error(`Synthesis failed for ${companyName}:`, error);
      return null;
    }
  }
  
  // Build synthesis prompt for model
  private buildSynthesisPrompt(companyName: string, factsContext: string, targetSystems: string[]): string {
    return `
COMPANY ANALYSIS TASK
Company: ${companyName}
Target Systems: ${targetSystems.join(', ')}

VERIFIED FACTS FROM WEB RESEARCH:
${factsContext}

STRICT INSTRUCTIONS:
1. Use ONLY the facts provided above - do not add any external knowledge
2. If facts are insufficient to determine intent, return: {"status": "INSUFFICIENT_EVIDENCE"}
3. Extract only initiatives that are explicitly mentioned in the facts
4. Each initiative MUST include citations to specific facts that support it
5. Assign intent score based only on strength of evidence in facts
6. If you cannot find clear evidence of intent, return INSUFFICIENT_EVIDENCE

OUTPUT FORMAT (JSON):
{
  "status": "SUCCESS" | "INSUFFICIENT_EVIDENCE",
  "account": {
    "companyName": "exact name from facts",
    "domain": "domain if mentioned or 'Not available'",
    "industry": "industry if clearly stated or 'Not available'",
    "companySize": "size if mentioned or 'Not available'",
    "revenue": "revenue if mentioned or 'Not available'",
    "location": "location if mentioned or 'Not available'",
    "intentScore": number_0_to_100_based_on_evidence_strength,
    "initiatives": [
      {
        "title": "specific initiative from facts",
        "summary": "summary based only on facts",
        "signals": ["specific signals from facts"],
        "citations": [{"fact_number": 1, "url": "source_url", "relevance": "why this supports the initiative"}]
      }
    ],
    "intentSignals": {
      "hiring_activity": ["roles from facts"],
      "tech_investments": ["investments from facts"],
      "financial_signals": ["financial info from facts"]
    }
  }
}

REMEMBER: If evidence is weak or unclear, return INSUFFICIENT_EVIDENCE. Quality over quantity.
`;
  }
  
  // Build citations array from facts
  private buildCitationsFromFacts(facts: any[]): any[] {
    return facts.map(fact => ({
      source_type: this.classifySourceType(fact.url),
      url: fact.url,
      date: fact.publishedAt || 'Date not available',
      relevance: fact.snippetText.substring(0, 100) + '...'
    }));
  }
  
  // Classify source type based on URL
  private classifySourceType(url: string): string {
    if (url.includes('linkedin.com')) return 'LinkedIn Job Posting';
    if (url.includes('sec.gov')) return '10-K Filing';
    if (url.includes('investor')) return 'Investor Relations';
    if (url.includes('blog') || url.includes('medium')) return 'Blog Post';
    if (url.includes('news') || url.includes('press')) return 'News Article';
    return 'Web Source';
  }
  
  // Contact identification using People Data Labs
  async identifyContacts(accountId: number): Promise<any[]> {
    try {
      // Get account details from storage
      const account = await storage.getAccountById(accountId);
      if (!account) {
        throw new Error(`Account ${accountId} not found`);
      }

      console.log(`Identifying contacts for ${account.companyName} (Domain: ${account.domain})`);
      
      // Use PDL to find contacts
      const { peopleDataLabs } = await import('./people-data-labs');
      const contacts = await peopleDataLabs.identifyContactsForAccount(
        account.companyName,
        account.domain !== 'Not available' ? account.domain : undefined,
        account.targetSystems
      );

      // Save contacts to database
      const savedContacts = [];
      for (const contactData of contacts) {
        const contactWithAccount = { ...contactData, accountId: accountId };
        const savedContact = await storage.createContact(contactWithAccount);
        savedContacts.push(savedContact);
      }

      console.log(`Successfully identified and saved ${savedContacts.length} contacts for ${account.companyName}`);
      return savedContacts;

    } catch (error) {
      console.error(`Contact identification failed for account ${accountId}:`, error);
      throw error;
    }
  }

  // Get service status for diagnostics
  getStatus() {
    return {
      model: INTENT_MODEL,
      backupModel: BACKUP_MODEL,
      searchProvider: searchService.getSearchStatus().provider,
      contentFetcher: contentFetcher.getStatus().status,
      status: 'grounded_research_active'
    };
  }
}

// Export singleton instance
export const groundedIntentDiscovery = new GroundedIntentDiscoveryService();