import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  json,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Account table for high-intent companies
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  revenue: varchar("revenue", { length: 50 }),
  location: varchar("location", { length: 255 }),
  
  // Intent signals
  targetSystems: json("target_systems").$type<string[]>().default([]), // MS Dynamics, Oracle, SAP
  intentSignals: json("intent_signals").$type<{
    initiatives?: string[];
    hiring_activity?: any[];
    tech_stack?: string[];
    financial_signals?: string[];
  }>().default({}),
  intentScore: integer("intent_score").default(0), // 0-100
  
  // Research data with citations
  researchData: json("research_data").$type<{
    sources?: Array<{
      id: string;
      url: string;
      title: string;
      content: string;
      sourceType: 'financial_filing' | 'press_release' | 'job_posting' | 'blog_post' | 'news_article';
      publishedDate?: string;
      hash: string;
    }>;
    initiatives?: Array<{
      title: string;
      summary: string;
      signals: string[];
      confidence: number; // 0-1
      citationIds: string[];
    }>;
  }>().default({}),
  
  // Account-level SCIPAB with citations
  scipab: json("scipab").$type<{
    situation?: string;
    complication?: string;
    implication?: string;
    position?: string;
    ask?: string;
    benefit?: string;
    citations?: string[]; // Citation IDs linking back to sources
    hasVerifiedData?: boolean;
  }>(),
  
  // Status tracking
  status: varchar("status", { length: 50 }).default("discovered"), // discovered, researched, contacts_identified
  isHighIntent: boolean("is_high_intent").default(false),
  
  // CRITICAL: Session scoping for bulletproof data isolation
  researchSessionId: varchar("research_session_id", { length: 255 }), // Links to specific research run
  
  // BULLETPROOF: Citations array for zero-hallucination enforcement
  citations: json("citations").$type<Array<{
    source_type: string;
    url: string;
    date: string;
    relevance: string;
  }>>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts table for identified personnel
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  
  // Contact info
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  email: varchar("email", { length: 255 }),
  linkedinUrl: varchar("linkedin_url", { length: 500 }),
  title: varchar("title", { length: 255 }),
  department: varchar("department", { length: 100 }),
  seniority: varchar("seniority", { length: 50 }), // Manager, Director, VP, C-Level
  
  // Role categorization
  focusAreas: json("focus_areas").$type<string[]>().default([]), // QA, SDLC, Enterprise Systems, Digital Transformation
  roleCategory: varchar("role_category", { length: 100 }), // Primary role grouping
  
  // Role-level SCIPAB with citations
  roleSCIPAB: json("role_scipab").$type<{
    situation?: string;
    complication?: string;
    implication?: string;
    position?: string;
    ask?: string;
    benefit?: string;
    role_specific_pains?: string[];
    citations?: string[]; // Citation IDs linking back to sources
    hasVerifiedData?: boolean;
  }>(),
  
  // Contact quality
  confidence: integer("confidence").default(0), // 0-100 confidence in contact accuracy
  dataSource: varchar("data_source", { length: 100 }), // PDL, LinkedIn, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SCOPED Research sessions for bulletproof data isolation
export const researchSessions = pgTable("research_sessions", {
  id: varchar("id").primaryKey(), // UUID for session scoping
  sessionType: varchar("session_type", { length: 50 }).default("account_discovery"), 
  targetSystems: json("target_systems").$type<string[]>().default([]),
  status: varchar("status", { length: 50 }).default("running"), // 'running' | 'completed' | 'failed'
  totalAccounts: integer("total_accounts").default(0),
  validatedAccounts: integer("validated_accounts").default(0),
  citationCount: integer("citation_count").default(0),
  modelUsed: varchar("model_used", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Individual research session logs (detailed tracking)  
export const sessionLogs = pgTable("session_logs", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").references(() => researchSessions.id),
  accountId: integer("account_id").references(() => accounts.id),
  researchType: varchar("research_type", { length: 100 }),
  prompt: text("prompt"),
  response: json("response").$type<any>().default({}),
  model: varchar("model", { length: 50 }),
  hasHallucinations: boolean("has_hallucinations").default(false),
  qualityScore: integer("quality_score").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectAccountSchema = createSelectSchema(accounts);

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectContactSchema = createSelectSchema(contacts);

export const insertResearchSessionSchema = createInsertSchema(researchSessions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const selectResearchSessionSchema = createSelectSchema(researchSessions);
export const insertSessionLogSchema = createInsertSchema(sessionLogs).omit({
  id: true,
  createdAt: true,
});

// BULLETPROOF VALIDATION SCHEMAS for zero-hallucination policy
export const intentResultValidationSchema = z.object({
  accounts: z.array(z.object({
    companyName: z.string().min(1, "Company name required"),
    domain: z.string().optional(),
    industry: z.string().min(1, "Industry required"),
    intentScore: z.number().int().min(0).max(100),
    isHighIntent: z.boolean(),
    targetSystems: z.array(z.string()).min(1, "At least one target system required"),
    initiatives: z.array(z.object({
      title: z.string().min(1, "Initiative title required"),
      summary: z.string().min(1, "Initiative summary required"),
      signals: z.array(z.string()).min(1, "At least one signal required"),
      citations: z.array(z.object({
        source_type: z.string(),
        url: z.string().url("Valid URL required for citation"),
        date: z.string(),
        relevance: z.string().min(1, "Citation relevance required")
      })).min(3, "CRITICAL: Minimum 3 citations required per initiative")
    })).min(1, "At least one initiative with citations required"),
    citations: z.array(z.object({
      source_type: z.string(),
      url: z.string().url("Valid URL required"),
      date: z.string(),
      relevance: z.string()
    })).min(3, "CRITICAL: Minimum 3 citations required per account")
  }))
});

// Types
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type ResearchSession = typeof researchSessions.$inferSelect;
export type InsertResearchSession = z.infer<typeof insertResearchSessionSchema>;
export type SessionLog = typeof sessionLogs.$inferSelect;
export type InsertSessionLog = z.infer<typeof insertSessionLogSchema>;
export type IntentResultValidation = z.infer<typeof intentResultValidationSchema>;

// SCIPAB type for reuse
export type SCIPAB = {
  situation?: string;
  complication?: string;
  implication?: string;
  position?: string;
  ask?: string;
  benefit?: string;
};

export type RoleSCIPAB = SCIPAB & {
  role_specific_pains?: string[];
};