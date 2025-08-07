import { accounts, contacts, researchSessions, type Account, type Contact, type InsertAccount, type InsertContact, type InsertResearchSession } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // Account operations
  getAccounts(): Promise<Account[]>;
  getAccountById(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account>;
  
  // Contact operations
  getContactsByAccountId(accountId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact>;
  
  // Research session operations
  createResearchSession(session: InsertResearchSession): Promise<any>;
  getResearchSessionsByAccountId(accountId: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Account operations
  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts).orderBy(desc(accounts.createdAt));
  }

  async getAccountById(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
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
      .set(updates)
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
      .values(contactData)
      .returning();
    return contact;
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact> {
    const [contact] = await db
      .update(contacts)
      .set(updates)
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  // Research session operations
  async createResearchSession(sessionData: InsertResearchSession): Promise<any> {
    const [session] = await db
      .insert(researchSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async getResearchSessionsByAccountId(accountId: number): Promise<any[]> {
    return await db.select().from(researchSessions).where(eq(researchSessions.accountId, accountId));
  }
}

export const storage = new DatabaseStorage();