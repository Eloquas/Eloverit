import { 
  prospects, 
  generatedContent, 
  accountResearch, 
  emailCadences,
  type Prospect, 
  type InsertProspect, 
  type GeneratedContent, 
  type InsertGeneratedContent,
  type AccountResearch,
  type InsertAccountResearch,
  type EmailCadence,
  type InsertEmailCadence
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, count, like, or } from "drizzle-orm";

export interface IStorage {
  // Prospect management
  getProspects(): Promise<Prospect[]>;
  getProspect(id: number): Promise<Prospect | undefined>;
  createProspect(prospect: InsertProspect): Promise<Prospect>;
  updateProspect(id: number, prospect: Partial<InsertProspect>): Promise<Prospect | undefined>;
  deleteProspect(id: number): Promise<boolean>;
  createProspects(prospects: InsertProspect[]): Promise<Prospect[]>;
  searchProspects(query: string): Promise<Prospect[]>;
  
  // Generated content management
  getGeneratedContent(): Promise<(GeneratedContent & { prospectName: string; prospectCompany: string })[]>;
  getGeneratedContentByProspect(prospectId: number): Promise<GeneratedContent[]>;
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;
  deleteGeneratedContent(id: number): Promise<boolean>;
  
  // Account research management
  getAccountResearch(): Promise<AccountResearch[]>;
  getAccountResearchByCompany(companyName: string): Promise<AccountResearch | undefined>;
  createAccountResearch(research: InsertAccountResearch): Promise<AccountResearch>;
  updateAccountResearch(id: number, research: Partial<InsertAccountResearch>): Promise<AccountResearch | undefined>;
  deleteAccountResearch(id: number): Promise<boolean>;
  
  // Email cadence management
  getEmailCadences(): Promise<(EmailCadence & { prospectName: string; prospectCompany: string })[]>;
  getEmailCadencesByProspect(prospectId: number): Promise<EmailCadence[]>;
  createEmailCadence(cadence: InsertEmailCadence): Promise<EmailCadence>;
  updateEmailCadence(id: number, cadence: Partial<InsertEmailCadence>): Promise<EmailCadence | undefined>;
  deleteEmailCadence(id: number): Promise<boolean>;
  
  // Stats
  getStats(): Promise<{
    totalProspects: number;
    emailsGenerated: number;
    linkedinMessages: number;
    successRate: number;
    activeCadences: number;
    researchedAccounts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getProspects(): Promise<Prospect[]> {
    return await db.select().from(prospects);
  }

  async getProspect(id: number): Promise<Prospect | undefined> {
    const [prospect] = await db.select().from(prospects).where(eq(prospects.id, id));
    return prospect || undefined;
  }

  async createProspect(insertProspect: InsertProspect): Promise<Prospect> {
    const [prospect] = await db
      .insert(prospects)
      .values(insertProspect)
      .returning();
    return prospect;
  }

  async updateProspect(id: number, updateData: Partial<InsertProspect>): Promise<Prospect | undefined> {
    const [prospect] = await db
      .update(prospects)
      .set(updateData)
      .where(eq(prospects.id, id))
      .returning();
    return prospect || undefined;
  }

  async deleteProspect(id: number): Promise<boolean> {
    const result = await db.delete(prospects).where(eq(prospects.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createProspects(insertProspects: InsertProspect[]): Promise<Prospect[]> {
    const created = await db
      .insert(prospects)
      .values(insertProspects)
      .returning();
    return created;
  }

  async searchProspects(query: string): Promise<Prospect[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    return await db.select().from(prospects).where(
      sql`LOWER(name) LIKE ${lowerQuery} OR 
          LOWER(email) LIKE ${lowerQuery} OR 
          LOWER(company) LIKE ${lowerQuery} OR 
          LOWER(position) LIKE ${lowerQuery}`
    );
  }

  async getGeneratedContent(): Promise<(GeneratedContent & { prospectName: string; prospectCompany: string })[]> {
    const result = await db
      .select({
        id: generatedContent.id,
        prospectId: generatedContent.prospectId,
        type: generatedContent.type,
        subject: generatedContent.subject,
        content: generatedContent.content,
        tone: generatedContent.tone,
        cta: generatedContent.cta,
        context: generatedContent.context,
        createdAt: generatedContent.createdAt,
        prospectName: prospects.name,
        prospectCompany: prospects.company
      })
      .from(generatedContent)
      .leftJoin(prospects, eq(generatedContent.prospectId, prospects.id))
      .orderBy(generatedContent.createdAt);
    
    return result.map(item => ({
      ...item,
      prospectName: item.prospectName || "Unknown",
      prospectCompany: item.prospectCompany || "Unknown"
    }));
  }

  async getGeneratedContentByProspect(prospectId: number): Promise<GeneratedContent[]> {
    return await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.prospectId, prospectId))
      .orderBy(generatedContent.createdAt);
  }

  async createGeneratedContent(insertContent: InsertGeneratedContent): Promise<GeneratedContent> {
    const [content] = await db
      .insert(generatedContent)
      .values(insertContent)
      .returning();
    return content;
  }

  async deleteGeneratedContent(id: number): Promise<boolean> {
    const result = await db.delete(generatedContent).where(eq(generatedContent.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Account research methods
  async getAccountResearch(): Promise<AccountResearch[]> {
    return await db.select().from(accountResearch).orderBy(accountResearch.researchDate);
  }

  async getAccountResearchByCompany(companyName: string): Promise<AccountResearch | undefined> {
    const [research] = await db
      .select()
      .from(accountResearch)
      .where(eq(accountResearch.companyName, companyName));
    return research || undefined;
  }

  async createAccountResearch(insertResearch: InsertAccountResearch): Promise<AccountResearch> {
    const [research] = await db
      .insert(accountResearch)
      .values(insertResearch)
      .returning();
    return research;
  }

  async updateAccountResearch(id: number, updateData: Partial<InsertAccountResearch>): Promise<AccountResearch | undefined> {
    const [research] = await db
      .update(accountResearch)
      .set(updateData)
      .where(eq(accountResearch.id, id))
      .returning();
    return research || undefined;
  }

  async deleteAccountResearch(id: number): Promise<boolean> {
    const result = await db.delete(accountResearch).where(eq(accountResearch.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Email cadence methods
  async getEmailCadences(): Promise<(EmailCadence & { prospectName: string; prospectCompany: string })[]> {
    const result = await db
      .select({
        id: emailCadences.id,
        prospectId: emailCadences.prospectId,
        cadenceName: emailCadences.cadenceName,
        currentStep: emailCadences.currentStep,
        totalSteps: emailCadences.totalSteps,
        cadenceType: emailCadences.cadenceType,
        nextSendDate: emailCadences.nextSendDate,
        status: emailCadences.status,
        createdAt: emailCadences.createdAt,
        prospectName: prospects.name,
        prospectCompany: prospects.company
      })
      .from(emailCadences)
      .leftJoin(prospects, eq(emailCadences.prospectId, prospects.id))
      .orderBy(emailCadences.createdAt);
    
    return result.map(item => ({
      ...item,
      prospectName: item.prospectName || "Unknown",
      prospectCompany: item.prospectCompany || "Unknown"
    }));
  }

  async getEmailCadencesByProspect(prospectId: number): Promise<EmailCadence[]> {
    return await db
      .select()
      .from(emailCadences)
      .where(eq(emailCadences.prospectId, prospectId))
      .orderBy(emailCadences.createdAt);
  }

  async createEmailCadence(insertCadence: InsertEmailCadence): Promise<EmailCadence> {
    const [cadence] = await db
      .insert(emailCadences)
      .values(insertCadence)
      .returning();
    return cadence;
  }

  async updateEmailCadence(id: number, updateData: Partial<InsertEmailCadence>): Promise<EmailCadence | undefined> {
    const [cadence] = await db
      .update(emailCadences)
      .set(updateData)
      .where(eq(emailCadences.id, id))
      .returning();
    return cadence || undefined;
  }

  async deleteEmailCadence(id: number): Promise<boolean> {
    const result = await db.delete(emailCadences).where(eq(emailCadences.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getStats(): Promise<{
    totalProspects: number;
    emailsGenerated: number;
    linkedinMessages: number;
    successRate: number;
    activeCadences: number;
    researchedAccounts: number;
  }> {
    const [prospectCount] = await db.select({ count: count() }).from(prospects);
    const [cadenceCount] = await db.select({ count: count() }).from(emailCadences).where(eq(emailCadences.status, "active"));
    const [researchCount] = await db.select({ count: count() }).from(accountResearch);
    const allContent = await db.select().from(generatedContent);
    
    const totalProspects = prospectCount?.count || 0;
    const emailsGenerated = allContent.filter(c => c.type === "email").length;
    const linkedinMessages = allContent.filter(c => c.type === "linkedin").length;
    const successRate = totalProspects > 0 ? Math.round((allContent.length / totalProspects) * 100) : 0;
    const activeCadences = cadenceCount?.count || 0;
    const researchedAccounts = researchCount?.count || 0;

    return {
      totalProspects,
      emailsGenerated,
      linkedinMessages,
      successRate,
      activeCadences,
      researchedAccounts
    };
  }
}

export const storage = new DatabaseStorage();
