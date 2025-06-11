import { prospects, generatedContent, type Prospect, type InsertProspect, type GeneratedContent, type InsertGeneratedContent } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private prospects: Map<number, Prospect>;
  private generatedContent: Map<number, GeneratedContent>;
  private currentProspectId: number;
  private currentContentId: number;

  constructor() {
    this.prospects = new Map();
    this.generatedContent = new Map();
    this.currentProspectId = 1;
    this.currentContentId = 1;
  }

  async getProspects(): Promise<Prospect[]> {
    return Array.from(this.prospects.values());
  }

  async getProspect(id: number): Promise<Prospect | undefined> {
    return this.prospects.get(id);
  }

  async createProspect(insertProspect: InsertProspect): Promise<Prospect> {
    const id = this.currentProspectId++;
    const prospect: Prospect = { 
      ...insertProspect, 
      id,
      status: insertProspect.status || "active"
    };
    this.prospects.set(id, prospect);
    return prospect;
  }

  async updateProspect(id: number, updateData: Partial<InsertProspect>): Promise<Prospect | undefined> {
    const existing = this.prospects.get(id);
    if (!existing) return undefined;
    
    const updated: Prospect = { ...existing, ...updateData };
    this.prospects.set(id, updated);
    return updated;
  }

  async deleteProspect(id: number): Promise<boolean> {
    return this.prospects.delete(id);
  }

  async createProspects(insertProspects: InsertProspect[]): Promise<Prospect[]> {
    const created: Prospect[] = [];
    for (const insertProspect of insertProspects) {
      const prospect = await this.createProspect(insertProspect);
      created.push(prospect);
    }
    return created;
  }

  async searchProspects(query: string): Promise<Prospect[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.prospects.values()).filter(prospect => 
      prospect.name.toLowerCase().includes(lowerQuery) ||
      prospect.email.toLowerCase().includes(lowerQuery) ||
      prospect.company.toLowerCase().includes(lowerQuery) ||
      prospect.position.toLowerCase().includes(lowerQuery)
    );
  }

  async getGeneratedContent(): Promise<(GeneratedContent & { prospectName: string; prospectCompany: string })[]> {
    const content = Array.from(this.generatedContent.values());
    return content.map(item => {
      const prospect = this.prospects.get(item.prospectId);
      return {
        ...item,
        prospectName: prospect?.name || "Unknown",
        prospectCompany: prospect?.company || "Unknown"
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getGeneratedContentByProspect(prospectId: number): Promise<GeneratedContent[]> {
    return Array.from(this.generatedContent.values())
      .filter(content => content.prospectId === prospectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createGeneratedContent(insertContent: InsertGeneratedContent): Promise<GeneratedContent> {
    const id = this.currentContentId++;
    const content: GeneratedContent = { 
      ...insertContent, 
      id,
      createdAt: new Date()
    };
    this.generatedContent.set(id, content);
    return content;
  }

  async deleteGeneratedContent(id: number): Promise<boolean> {
    return this.generatedContent.delete(id);
  }

  async getStats(): Promise<{
    totalProspects: number;
    emailsGenerated: number;
    linkedinMessages: number;
    successRate: number;
  }> {
    const totalProspects = this.prospects.size;
    const allContent = Array.from(this.generatedContent.values());
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

export const storage = new MemStorage();
