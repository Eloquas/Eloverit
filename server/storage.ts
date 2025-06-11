import { prospects, generatedContent, type Prospect, type InsertProspect, type GeneratedContent, type InsertGeneratedContent } from "@shared/schema";
import { db } from "./db";
import { eq, sql, count } from "drizzle-orm";

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
  
  // Stats
  getStats(): Promise<{
    totalProspects: number;
    emailsGenerated: number;
    linkedinMessages: number;
    successRate: number;
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

  async getStats(): Promise<{
    totalProspects: number;
    emailsGenerated: number;
    linkedinMessages: number;
    successRate: number;
  }> {
    const [prospectCount] = await db.select({ count: count() }).from(prospects);
    const allContent = await db.select().from(generatedContent);
    
    const totalProspects = prospectCount?.count || 0;
    const emailsGenerated = allContent.filter(c => c.type === "email").length;
    const linkedinMessages = allContent.filter(c => c.type === "linkedin").length;
    const successRate = totalProspects > 0 ? Math.round((allContent.length / totalProspects) * 100) : 0;

    return {
      totalProspects,
      emailsGenerated,
      linkedinMessages,
      successRate
    };
  }
}

export const storage = new DatabaseStorage();
