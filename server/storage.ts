import { accounts, contacts, researchSessions, sessionLogs, companyFacts, type Account, type Contact, type InsertAccount, type InsertContact, type InsertResearchSession, type ResearchSession, type InsertSessionLog, type CompanyFact, type InsertCompanyFact } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// BULLETPROOF STORAGE INTERFACE with session scoping
export interface IStorage {
  // Account operations with session scoping
  getAccounts(sessionId?: string): Promise<Account[]>;
  getAccountById(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account>;
  
  // Contact operations
  getContactsByAccountId(accountId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact>;
  
  // SCOPED Research session operations
  createResearchSession(session: InsertResearchSession): Promise<ResearchSession>;
  getResearchSessionById(id: string): Promise<ResearchSession | undefined>;
  updateResearchSession(id: string, updates: Partial<InsertResearchSession>): Promise<ResearchSession>;
  
  // Session logs for detailed tracking
  createSessionLog(log: InsertSessionLog): Promise<any>;
  getSessionLogsBySessionId(sessionId: string): Promise<any[]>;
  
  // Company facts for web research
  createCompanyFact(fact: InsertCompanyFact): Promise<CompanyFact>;
  getFactsBySessionId(sessionId: string): Promise<CompanyFact[]>;
  getFactsByCompany(companyName: string, sessionId?: string): Promise<CompanyFact[]>;
}

export class DatabaseStorage implements IStorage {
  // Account operations with SESSION SCOPING for bulletproof isolation
  async getAccounts(sessionId?: string): Promise<Account[]> {
    if (sessionId) {
      // Return only accounts from specific research session
      return await db.select().from(accounts)
        .where(eq(accounts.researchSessionId, sessionId))
        .orderBy(desc(accounts.createdAt));
    }
    // Return all accounts if no session specified (fallback for historical data)
    return await db.select().from(accounts).orderBy(desc(accounts.createdAt));
  }

  async getAccountById(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async createContact(contactData: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(contactData)
      .returning();
    return contact;
  }

  async getContactsByAccountId(accountId: number): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.accountId, accountId))
      .orderBy(desc(contacts.confidence));
  }

  async createAccount(accountData: InsertAccount): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values(accountData)
      .returning();
    return account;
  }

  async updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account> {
    const [account] = await db
      .update(accounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return account;
  }

  // Contact operations
  async getContactsByAccountId(accountId: number): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.accountId, accountId));
  }

  async createContact(contactData: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values([contactData])
      .returning();
    return contact;
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact> {
    const [contact] = await db
      .update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  // SCOPED Research session operations
  async createResearchSession(sessionData: InsertResearchSession): Promise<ResearchSession> {
    const [session] = await db
      .insert(researchSessions)
      .values([sessionData])
      .returning();
    return session;
  }

  async getResearchSessionById(id: string): Promise<ResearchSession | undefined> {
    const [session] = await db.select().from(researchSessions).where(eq(researchSessions.id, id));
    return session;
  }

  async updateResearchSession(id: string, updates: any): Promise<ResearchSession> {
    const validUpdates: any = {};
    if (updates.status) validUpdates.status = updates.status;
    if (updates.totalAccounts !== undefined) validUpdates.totalAccounts = updates.totalAccounts;
    if (updates.validatedAccounts !== undefined) validUpdates.validatedAccounts = updates.validatedAccounts;
    if (updates.citationCount !== undefined) validUpdates.citationCount = updates.citationCount;
    
    const [session] = await db
      .update(researchSessions)
      .set(validUpdates)
      .where(eq(researchSessions.id, id))
      .returning();
    return session;
  }

  // Session logs for detailed tracking
  async createSessionLog(logData: InsertSessionLog): Promise<any> {
    const [log] = await db
      .insert(sessionLogs)
      .values([logData])
      .returning();
    return log;
  }

  async getSessionLogsBySessionId(sessionId: string): Promise<any[]> {
    return await db.select().from(sessionLogs).where(eq(sessionLogs.sessionId, sessionId));
  }

  // Company facts operations for web research
  async createCompanyFact(factData: InsertCompanyFact): Promise<CompanyFact> {
    const [fact] = await db
      .insert(companyFacts)
      .values(factData)
      .onConflictDoNothing() // Skip duplicate snippets
      .returning();
    return fact;
  }

  async getFactsBySessionId(sessionId: string): Promise<CompanyFact[]> {
    return await db.select().from(companyFacts)
      .where(eq(companyFacts.sessionId, sessionId))
      .orderBy(desc(companyFacts.relevanceScore));
  }

  async getFactsByCompany(companyName: string, sessionId?: string): Promise<CompanyFact[]> {
    let query = db.select().from(companyFacts).where(eq(companyFacts.companyName, companyName));
    
    if (sessionId) {
      query = query.where(eq(companyFacts.sessionId, sessionId));
    }
    
    return await query.orderBy(desc(companyFacts.relevanceScore));
  }
}

export const storage = new DatabaseStorage();