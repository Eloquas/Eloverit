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

// Research sessions for tracking GPT o3-pro research
export const researchSessions = pgTable("research_sessions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  
  researchType: varchar("research_type", { length: 50 }).notNull(), // account_discovery, contact_identification
  prompt: text("prompt"),
  response: json("response").$type<any>(),
  model: varchar("model", { length: 50 }).default("gpt-4o"), // For now, will upgrade to o3-pro
  
  // Quality control
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
});

export const selectResearchSessionSchema = createSelectSchema(researchSessions);

// Types
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type ResearchSession = typeof researchSessions.$inferSelect;
export type InsertResearchSession = z.infer<typeof insertResearchSessionSchema>;

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