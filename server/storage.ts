import { 
  prospects, 
  generatedContent, 
  accountResearch, 
  emailCadences,
  users,
  sessions,
  callAssessments,
  onboardingResponses,
  contacts,
  personalizedOutreach,
  adminContent,
  type Prospect, 
  type InsertProspect, 
  type GeneratedContent, 
  type InsertGeneratedContent,
  type AccountResearch,
  type InsertAccountResearch,
  type EmailCadence,
  type InsertEmailCadence,
  type User,
  type InsertUser,
  type Session,
  type InsertSession,
  type CallAssessment,
  type InsertCallAssessment,
  type OnboardingResponse,
  type InsertOnboardingResponse,
  type Contact,
  type InsertContact,
  type PersonalizedOutreach,
  type InsertPersonalizedOutreach,
  type AdminContent,
  type InsertAdminContent
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, count, like, or, and, desc } from "drizzle-orm";

export interface IStorage {
  // User authentication
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByLinkedInId(linkedinId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  
  // Session management
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  
  // Prospect management (user-scoped)
  getProspects(userId: number): Promise<Prospect[]>;
  getProspect(id: number, userId: number): Promise<Prospect | undefined>;
  createProspect(prospect: InsertProspect): Promise<Prospect>;
  updateProspect(id: number, prospect: Partial<InsertProspect>, userId: number): Promise<Prospect | undefined>;
  deleteProspect(id: number, userId: number): Promise<boolean>;
  createProspects(prospects: InsertProspect[]): Promise<Prospect[]>;
  searchProspects(query: string, userId: number): Promise<Prospect[]>;
  
  // Deduplication methods
  findDuplicateProspect(email: string, company: string, userId: number): Promise<Prospect | undefined>;
  findDuplicateAccountResearch(companyName: string, userId: number): Promise<AccountResearch | undefined>;
  createProspectsWithDeduplication(prospects: InsertProspect[]): Promise<{ created: Prospect[], duplicates: any[], skipped: any[] }>;
  
  // Generated content management (user-scoped)
  getGeneratedContent(userId: number): Promise<(GeneratedContent & { prospectName: string; prospectCompany: string })[]>;
  getGeneratedContentByProspect(prospectId: number, userId: number): Promise<GeneratedContent[]>;
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;
  deleteGeneratedContent(id: number, userId: number): Promise<boolean>;
  
  // Account research management (user-scoped)
  getAccountResearch(userId: number): Promise<AccountResearch[]>;
  getAccountResearchByCompany(companyName: string, userId: number): Promise<AccountResearch | undefined>;
  createAccountResearch(research: InsertAccountResearch): Promise<AccountResearch>;
  updateAccountResearch(id: number, research: Partial<InsertAccountResearch>, userId: number): Promise<AccountResearch | undefined>;
  deleteAccountResearch(id: number, userId: number): Promise<boolean>;
  
  // Email cadence management (user-scoped)
  getEmailCadences(userId: number): Promise<(EmailCadence & { prospectName: string; prospectCompany: string })[]>;
  getEmailCadencesByProspect(prospectId: number, userId: number): Promise<EmailCadence[]>;
  createEmailCadence(cadence: InsertEmailCadence): Promise<EmailCadence>;
  updateEmailCadence(id: number, cadence: Partial<InsertEmailCadence>, userId: number): Promise<EmailCadence | undefined>;
  deleteEmailCadence(id: number, userId: number): Promise<boolean>;
  
  // Call assessments (user-scoped)
  getCallAssessments(userId: number): Promise<CallAssessment[]>;
  createCallAssessment(assessment: InsertCallAssessment): Promise<CallAssessment>;
  
  // Onboarding management (user-scoped)
  getOnboardingResponse(userId: number): Promise<OnboardingResponse | undefined>;
  createOnboardingResponse(onboarding: InsertOnboardingResponse): Promise<OnboardingResponse>;
  
  // Email cadence methods (user-scoped) - note: duplicated above, removing duplicates
  
  // Stats (user-scoped)
  getStats(userId: number): Promise<{
    totalProspects: number;
    emailsGenerated: number;
    linkedinMessages: number;
    successRate: number;
    activeCadences: number;
    researchedAccounts: number;
  }>;
  
  // Contact management (user-scoped)
  getContacts(userId: number): Promise<Contact[]>;
  getContactsByAccount(accountResearchId: number, userId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>, userId: number): Promise<Contact | undefined>;
  deleteContact(id: number, userId: number): Promise<boolean>;
  
  // Personalized outreach management (user-scoped)
  getPersonalizedOutreach(contactId: number, userId: number): Promise<PersonalizedOutreach[]>;
  createPersonalizedOutreach(outreach: InsertPersonalizedOutreach): Promise<PersonalizedOutreach>;
  deletePersonalizedOutreach(id: number, userId: number): Promise<boolean>;

  // Admin functions
  getAllUsers(): Promise<User[]>;
  getAllStats(): Promise<{
    totalUsers: number;
    totalProspects: number;
    totalContent: number;
    totalCallAssessments: number;
  }>;

  // Admin content management
  getAdminContentByKey(contentKey: string): Promise<AdminContent | undefined>;
  getAllAdminContent(): Promise<AdminContent[]>;
  createAdminContent(content: InsertAdminContent): Promise<AdminContent>;
  updateAdminContent(id: number, content: Partial<InsertAdminContent>): Promise<AdminContent | undefined>;
  deleteAdminContent(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User authentication methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByLinkedInId(linkedinId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.linkedinId, linkedinId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.getUserById(id);
  }

  // Session management methods
  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Prospect methods (user-scoped)
  async getProspects(userId: number): Promise<Prospect[]> {
    return await db.select().from(prospects).where(eq(prospects.userId, userId));
  }

  async getProspect(id: number, userId: number): Promise<Prospect | undefined> {
    const [prospect] = await db.select().from(prospects)
      .where(and(eq(prospects.id, id), eq(prospects.userId, userId)));
    return prospect || undefined;
  }

  async createProspect(insertProspect: InsertProspect): Promise<Prospect> {
    const [prospect] = await db
      .insert(prospects)
      .values(insertProspect)
      .returning();
    return prospect;
  }

  async updateProspect(id: number, updateProspect: Partial<InsertProspect>, userId: number): Promise<Prospect | undefined> {
    const [prospect] = await db
      .update(prospects)
      .set(updateProspect)
      .where(and(eq(prospects.id, id), eq(prospects.userId, userId)))
      .returning();
    return prospect || undefined;
  }

  async deleteProspect(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(prospects)
      .where(and(eq(prospects.id, id), eq(prospects.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async createProspects(insertProspects: InsertProspect[]): Promise<Prospect[]> {
    const created = await db
      .insert(prospects)
      .values(insertProspects)
      .returning();
    return created;
  }

  // Deduplication methods implementation
  async findDuplicateProspect(email: string, company: string, userId: number): Promise<Prospect | undefined> {
    const [prospect] = await db.select().from(prospects)
      .where(
        and(
          eq(prospects.userId, userId),
          or(
            eq(prospects.email, email),
            and(
              eq(prospects.company, company),
              eq(prospects.name, email.split('@')[0]) // Basic name matching
            )
          )
        )
      );
    return prospect || undefined;
  }

  async findDuplicateAccountResearch(companyName: string, userId: number): Promise<AccountResearch | undefined> {
    const [research] = await db.select({
      id: accountResearch.id,
      userId: accountResearch.userId,
      companyName: accountResearch.companyName,
      industry: accountResearch.industry,
      companySize: accountResearch.companySize,
      currentSystems: accountResearch.currentSystems,
      recentJobPostings: accountResearch.recentJobPostings,
      initiatives: accountResearch.initiatives,
      painPoints: accountResearch.painPoints,
      decisionMakers: accountResearch.decisionMakers,
      scipabFramework: accountResearch.scipabFramework,
      researchDate: accountResearch.researchDate,
      researchQuality: accountResearch.researchQuality,
      lastUpdated: accountResearch.lastUpdated,
    }).from(accountResearch)
      .where(
        and(
          eq(accountResearch.userId, userId),
          eq(accountResearch.companyName, companyName)
        )
      )
      .orderBy(desc(accountResearch.researchDate))
      .limit(1);
    return research || undefined;
  }

  // New method to clean up duplicate research entries
  async cleanupDuplicateAccountResearch(userId: number): Promise<{ removed: number; companies: string[] }> {
    // Get all research entries for the user
    const allResearch = await db.select({
      id: accountResearch.id,
      companyName: accountResearch.companyName,
      researchDate: accountResearch.researchDate,
    }).from(accountResearch)
      .where(eq(accountResearch.userId, userId))
      .orderBy(accountResearch.companyName, desc(accountResearch.researchDate));

    // Group by company name and find duplicates
    const companyGroups: { [key: string]: Array<{ id: number; researchDate: Date }> } = {};
    
    for (const research of allResearch) {
      if (!companyGroups[research.companyName]) {
        companyGroups[research.companyName] = [];
      }
      companyGroups[research.companyName].push({
        id: research.id,
        researchDate: research.researchDate || new Date(0)
      });
    }

    const companiesWithDuplicates: string[] = [];
    const idsToDelete: number[] = [];

    // For each company with multiple entries, keep only the most recent
    for (const [companyName, entries] of Object.entries(companyGroups)) {
      if (entries.length > 1) {
        companiesWithDuplicates.push(companyName);
        // Sort by date (most recent first) and keep the first one
        entries.sort((a, b) => new Date(b.researchDate).getTime() - new Date(a.researchDate).getTime());
        // Add all but the first (most recent) to deletion list
        for (let i = 1; i < entries.length; i++) {
          idsToDelete.push(entries[i].id);
        }
      }
    }

    // Delete the duplicate entries
    let removedCount = 0;
    if (idsToDelete.length > 0) {
      for (const id of idsToDelete) {
        await db.delete(accountResearch)
          .where(
            and(
              eq(accountResearch.userId, userId),
              eq(accountResearch.id, id)
            )
          );
        removedCount++;
      }
    }

    return {
      removed: removedCount,
      companies: companiesWithDuplicates
    };
  }

  async createProspectsWithDeduplication(insertProspects: InsertProspect[]): Promise<{ created: Prospect[], duplicates: any[], skipped: any[] }> {
    const created: Prospect[] = [];
    const duplicates: any[] = [];
    const skipped: any[] = [];

    for (const prospectData of insertProspects) {
      try {
        // Check for duplicate by email and company
        const existingProspect = await this.findDuplicateProspect(
          prospectData.email, 
          prospectData.company, 
          prospectData.userId
        );

        if (existingProspect) {
          duplicates.push({
            ...prospectData,
            existingId: existingProspect.id,
            reason: 'Duplicate email or company+name combination'
          });
        } else {
          const [newProspect] = await db
            .insert(prospects)
            .values(prospectData)
            .returning();
          created.push(newProspect);
        }
      } catch (error) {
        skipped.push({
          ...prospectData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { created, duplicates, skipped };
  }

  async searchProspects(query: string, userId: number): Promise<Prospect[]> {
    return await db.select().from(prospects).where(
      and(
        eq(prospects.userId, userId),
        or(
          like(prospects.name, `%${query}%`),
          like(prospects.email, `%${query}%`),
          like(prospects.company, `%${query}%`),
          like(prospects.position, `%${query}%`)
        )
      )
    );
  }

  // Generated content methods (user-scoped)
  async getGeneratedContent(userId: number): Promise<(GeneratedContent & { prospectName: string; prospectCompany: string })[]> {
    const result = await db
      .select({
        id: generatedContent.id,
        userId: generatedContent.userId,
        prospectId: generatedContent.prospectId,
        cadenceId: generatedContent.cadenceId,
        type: generatedContent.type,
        subject: generatedContent.subject,
        content: generatedContent.content,
        tone: generatedContent.tone,
        cta: generatedContent.cta,
        context: generatedContent.context,
        cadenceStep: generatedContent.cadenceStep,
        contentPurpose: generatedContent.contentPurpose,
        resourceOffered: generatedContent.resourceOffered,
        createdAt: generatedContent.createdAt,
        prospectName: prospects.name,
        prospectCompany: prospects.company
      })
      .from(generatedContent)
      .leftJoin(prospects, eq(generatedContent.prospectId, prospects.id))
      .where(eq(generatedContent.userId, userId))
      .orderBy(generatedContent.createdAt);
    
    return result.map(item => ({
      ...item,
      prospectName: item.prospectName || "Unknown",
      prospectCompany: item.prospectCompany || "Unknown"
    }));
  }

  async getGeneratedContentByProspect(prospectId: number, userId: number): Promise<GeneratedContent[]> {
    return await db
      .select()
      .from(generatedContent)
      .where(and(eq(generatedContent.prospectId, prospectId), eq(generatedContent.userId, userId)))
      .orderBy(generatedContent.createdAt);
  }

  async createGeneratedContent(insertContent: InsertGeneratedContent): Promise<GeneratedContent> {
    const [content] = await db
      .insert(generatedContent)
      .values(insertContent)
      .returning();
    return content;
  }

  async deleteGeneratedContent(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(generatedContent)
      .where(and(eq(generatedContent.id, id), eq(generatedContent.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Account research methods (user-scoped)
  async getAccountResearch(userId: number): Promise<AccountResearch[]> {
    console.log('DatabaseStorage.getAccountResearch called with userId:', userId);
    const results = await db.select({
      id: accountResearch.id,
      userId: accountResearch.userId,
      companyName: accountResearch.companyName,
      industry: accountResearch.industry,
      companySize: accountResearch.companySize,
      currentSystems: accountResearch.currentSystems,
      recentJobPostings: accountResearch.recentJobPostings,
      initiatives: accountResearch.initiatives,
      painPoints: accountResearch.painPoints,
      decisionMakers: accountResearch.decisionMakers,
      researchDate: accountResearch.researchDate,
      researchQuality: accountResearch.researchQuality,
    }).from(accountResearch)
      .where(eq(accountResearch.userId, userId))
      .orderBy(desc(accountResearch.researchDate));
    console.log('DatabaseStorage.getAccountResearch found entries:', results.length);
    return results as AccountResearch[];
  }

  async getAccountResearchByCompany(companyName: string, userId: number): Promise<AccountResearch | undefined> {
    const [research] = await db
      .select({
        id: accountResearch.id,
        userId: accountResearch.userId,
        companyName: accountResearch.companyName,
        industry: accountResearch.industry,
        companySize: accountResearch.companySize,
        currentSystems: accountResearch.currentSystems,
        recentJobPostings: accountResearch.recentJobPostings,
        initiatives: accountResearch.initiatives,
        painPoints: accountResearch.painPoints,
        decisionMakers: accountResearch.decisionMakers,
        researchDate: accountResearch.researchDate,
        researchQuality: accountResearch.researchQuality,
      })
      .from(accountResearch)
      .where(and(eq(accountResearch.companyName, companyName), eq(accountResearch.userId, userId)));
    return research as AccountResearch || undefined;
  }

  async createAccountResearch(insertResearch: InsertAccountResearch): Promise<AccountResearch> {
    // Check for existing research first
    const existingResearch = await this.findDuplicateAccountResearch(
      insertResearch.companyName, 
      insertResearch.userId
    );

    if (existingResearch) {
      // Return existing research instead of creating duplicate
      return existingResearch;
    }

    const [research] = await db
      .insert(accountResearch)
      .values(insertResearch)
      .returning();
    return research;
  }

  async updateAccountResearch(id: number, updateData: Partial<InsertAccountResearch>, userId: number): Promise<AccountResearch | undefined> {
    const [research] = await db
      .update(accountResearch)
      .set(updateData)
      .where(and(eq(accountResearch.id, id), eq(accountResearch.userId, userId)))
      .returning();
    return research || undefined;
  }

  async deleteAccountResearch(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(accountResearch)
      .where(and(eq(accountResearch.id, id), eq(accountResearch.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Email cadence methods (user-scoped)
  async getEmailCadences(userId: number): Promise<(EmailCadence & { prospectName: string; prospectCompany: string })[]> {
    try {
      const result = await db
      .select({
        id: emailCadences.id,
        userId: emailCadences.userId,
        prospectId: emailCadences.prospectId,
        cadenceName: emailCadences.cadenceName,
        currentStep: emailCadences.currentStep,
        totalSteps: emailCadences.totalSteps,
        cadenceType: emailCadences.cadenceType,
        nextSendDate: emailCadences.nextSendDate,
        status: emailCadences.status,
        createdAt: emailCadences.createdAt,
        updatedAt: emailCadences.updatedAt,
        steps: emailCadences.steps,
        trustSignals: emailCadences.trustSignals,
        storyElements: emailCadences.storyElements,
        totalDuration: emailCadences.totalDuration,
        prospectName: prospects.name,
        prospectCompany: prospects.company
      })
      .from(emailCadences)
      .leftJoin(prospects, eq(emailCadences.prospectId, prospects.id))
      .where(eq(emailCadences.userId, userId))
      .orderBy(emailCadences.createdAt);
    
      return result.map(item => ({
        ...item,
        prospectName: item.prospectName || "Unknown",
        prospectCompany: item.prospectCompany || "Unknown"
      }));
    } catch (error) {
      console.error("Error fetching email cadences:", error);
      return [];
    }
  }

  async getEmailCadencesByProspect(prospectId: number, userId: number): Promise<EmailCadence[]> {
    return await db
      .select()
      .from(emailCadences)
      .where(and(eq(emailCadences.prospectId, prospectId), eq(emailCadences.userId, userId)))
      .orderBy(emailCadences.createdAt);
  }

  async createEmailCadence(insertCadence: InsertEmailCadence): Promise<EmailCadence> {
    const [cadence] = await db
      .insert(emailCadences)
      .values(insertCadence)
      .returning();
    return cadence;
  }

  async updateEmailCadence(id: number, updateData: Partial<InsertEmailCadence>, userId: number): Promise<EmailCadence | undefined> {
    const [cadence] = await db
      .update(emailCadences)
      .set(updateData)
      .where(and(eq(emailCadences.id, id), eq(emailCadences.userId, userId)))
      .returning();
    return cadence || undefined;
  }

  async deleteEmailCadence(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(emailCadences)
      .where(and(eq(emailCadences.id, id), eq(emailCadences.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Call assessment methods (user-scoped)
  async getCallAssessments(userId: number): Promise<CallAssessment[]> {
    return await db.select().from(callAssessments)
      .where(eq(callAssessments.userId, userId))
      .orderBy(callAssessments.createdAt);
  }

  async createCallAssessment(insertAssessment: InsertCallAssessment): Promise<CallAssessment> {
    const [assessment] = await db
      .insert(callAssessments)
      .values(insertAssessment)
      .returning();
    return assessment;
  }

  // Stats methods (user-scoped)
  async getStats(userId: number): Promise<{
    totalProspects: number;
    emailsGenerated: number;
    linkedinMessages: number;
    successRate: number;
    activeCadences: number;
    researchedAccounts: number;
  }> {
    const [
      prospectsCount,
      emailsCount,
      linkedinCount,
      cadencesCount,
      researchCount
    ] = await Promise.all([
      db.select({ count: count() }).from(prospects).where(eq(prospects.userId, userId)),
      db.select({ count: count() }).from(generatedContent).where(
        and(eq(generatedContent.userId, userId), eq(generatedContent.type, "email"))
      ),
      db.select({ count: count() }).from(generatedContent).where(
        and(eq(generatedContent.userId, userId), eq(generatedContent.type, "linkedin"))
      ),
      db.select({ count: count() }).from(emailCadences).where(
        and(eq(emailCadences.userId, userId), eq(emailCadences.status, "active"))
      ),
      db.select({ count: count() }).from(accountResearch).where(eq(accountResearch.userId, userId))
    ]);

    return {
      totalProspects: prospectsCount[0]?.count ?? 0,
      emailsGenerated: emailsCount[0]?.count ?? 0,
      linkedinMessages: linkedinCount[0]?.count ?? 0,
      successRate: 0.15, // Mock success rate
      activeCadences: cadencesCount[0]?.count ?? 0,
      researchedAccounts: researchCount[0]?.count ?? 0,
    };
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async getAllStats(): Promise<{
    totalUsers: number;
    totalProspects: number;
    totalContent: number;
    totalCallAssessments: number;
  }> {
    const [
      usersCount,
      prospectsCount,
      contentCount,
      assessmentsCount
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(prospects),
      db.select({ count: count() }).from(generatedContent),
      db.select({ count: count() }).from(callAssessments)
    ]);

    return {
      totalUsers: usersCount[0]?.count ?? 0,
      totalProspects: prospectsCount[0]?.count ?? 0,
      totalContent: contentCount[0]?.count ?? 0,
      totalCallAssessments: assessmentsCount[0]?.count ?? 0,
    };
  }

  // Onboarding methods
  async getOnboardingResponse(userId: number): Promise<OnboardingResponse | undefined> {
    const [response] = await db.select().from(onboardingResponses).where(eq(onboardingResponses.userId, userId));
    return response || undefined;
  }

  async createOnboardingResponse(onboarding: InsertOnboardingResponse): Promise<OnboardingResponse> {
    const [response] = await db
      .insert(onboardingResponses)
      .values(onboarding)
      .returning();
    return response;
  }

  // Contact management methods (user-scoped)
  async getContacts(userId: number): Promise<Contact[]> {
    return await db.select().from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(contacts.createdAt);
  }

  async getContactsByAccount(accountResearchId: number, userId: number): Promise<Contact[]> {
    return await db.select().from(contacts)
      .where(and(eq(contacts.accountResearchId, accountResearchId), eq(contacts.userId, userId)))
      .orderBy(contacts.createdAt);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async updateContact(id: number, updateData: Partial<InsertContact>, userId: number): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set(updateData)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .returning();
    return contact || undefined;
  }

  async deleteContact(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Personalized outreach methods (user-scoped)
  async getPersonalizedOutreach(contactId: number, userId: number): Promise<PersonalizedOutreach[]> {
    return await db.select().from(personalizedOutreach)
      .where(and(eq(personalizedOutreach.contactId, contactId), eq(personalizedOutreach.userId, userId)))
      .orderBy(personalizedOutreach.generatedAt);
  }

  async createPersonalizedOutreach(insertOutreach: InsertPersonalizedOutreach): Promise<PersonalizedOutreach> {
    const [outreach] = await db
      .insert(personalizedOutreach)
      .values(insertOutreach)
      .returning();
    return outreach;
  }

  async deletePersonalizedOutreach(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(personalizedOutreach)
      .where(and(eq(personalizedOutreach.id, id), eq(personalizedOutreach.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();