import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  position: text("position").notNull(),
  status: text("status").notNull().default("active"), // active, pending, inactive
  additionalInfo: text("additional_info"),
  // Enhanced fields for enterprise systems targeting
  jobTitleCategory: text("job_title_category"), // QA, CRM, ERP, D365, SAP, Oracle, Enterprise Systems
  seniorityLevel: text("seniority_level"), // Manager, Director, VP, C-Level
  systemsExperience: text("systems_experience"), // JSON array of systems they work with
  accountPriority: text("account_priority").default("medium"), // high, medium, low
  lastResearchDate: timestamp("last_research_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// New table for account-level research and intelligence
export const accountResearch = pgTable("account_research", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  industry: text("industry"),
  companySize: text("company_size"),
  currentSystems: text("current_systems"), // JSON array of systems in use
  recentJobPostings: text("recent_job_postings"), // JSON array of relevant postings
  initiatives: text("initiatives"), // JSON array of current initiatives
  painPoints: text("pain_points"), // JSON array of identified challenges
  decisionMakers: text("decision_makers"), // JSON array of key contacts
  researchDate: timestamp("research_date").notNull().defaultNow(),
  researchQuality: text("research_quality").default("pending"), // excellent, good, fair, pending
});

// New table for email cadence management
export const emailCadences = pgTable("email_cadences", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull(),
  cadenceName: text("cadence_name").notNull(), // Brand Awareness D365, SAP Enterprise, etc.
  currentStep: integer("current_step").notNull().default(1),
  totalSteps: integer("total_steps").notNull().default(6),
  cadenceType: text("cadence_type").notNull(), // brand_awareness, product_demo, follow_up
  nextSendDate: timestamp("next_send_date"),
  status: text("status").notNull().default("active"), // active, paused, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const generatedContent = pgTable("generated_content", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull(),
  cadenceId: integer("cadence_id"), // Link to email cadence if part of sequence
  type: text("type").notNull(), // email, linkedin
  subject: text("subject"),
  content: text("content").notNull(),
  tone: text("tone", { 
    enum: [
      "professional", 
      "friendly", 
      "casual", 
      "urgent", 
      "consultative", 
      "confident", 
      "empathetic", 
      "direct", 
      "storytelling",
      "data_driven",
      "brand_awareness",
      "educational",
      "solution_focused",
      "executive",
      "personalized"
    ] 
  }).notNull(),
  cta: text("cta"),
  context: text("context"),
  cadenceStep: integer("cadence_step"), // Which step in the cadence (1-6)
  contentPurpose: text("content_purpose"), // brand_awareness, education, demo_request, follow_up
  resourceOffered: text("resource_offered"), // D365 workbook, SAP ebook, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProspectSchema = createInsertSchema(prospects).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedContentSchema = createInsertSchema(generatedContent).omit({
  id: true,
  createdAt: true,
});

export const insertAccountResearchSchema = createInsertSchema(accountResearch).omit({
  id: true,
  researchDate: true,
});

export const insertEmailCadenceSchema = createInsertSchema(emailCadences).omit({
  id: true,
  createdAt: true,
});

export type InsertProspect = z.infer<typeof insertProspectSchema>;
export type Prospect = typeof prospects.$inferSelect;
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;
export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertAccountResearch = z.infer<typeof insertAccountResearchSchema>;
export type AccountResearch = typeof accountResearch.$inferSelect;
export type InsertEmailCadence = z.infer<typeof insertEmailCadenceSchema>;
export type EmailCadence = typeof emailCadences.$inferSelect;

// Enhanced form schemas for new features
export const contentGenerationSchema = z.object({
  type: z.enum(["email", "linkedin"]),
  tone: z.enum([
    "professional", 
    "friendly", 
    "casual", 
    "urgent", 
    "consultative", 
    "confident", 
    "empathetic", 
    "direct", 
    "storytelling",
    "data_driven",
    "brand_awareness",
    "educational", 
    "solution_focused",
    "executive",
    "personalized"
  ]),
  cta: z.string().min(1, "Call to action is required"),
  context: z.string().optional(),
  prospectIds: z.array(z.number()).min(1, "At least one prospect must be selected"),
  cadenceStep: z.number().optional(),
  contentPurpose: z.enum(["brand_awareness", "education", "demo_request", "follow_up"]).optional(),
  resourceOffered: z.string().optional(),
});

export type ContentGenerationRequest = z.infer<typeof contentGenerationSchema>;

// Account research schema
export const accountResearchSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  currentSystems: z.string().optional(),
  recentJobPostings: z.string().optional(),
  initiatives: z.string().optional(),
  painPoints: z.string().optional(),
  decisionMakers: z.string().optional(),
});

export type AccountResearchRequest = z.infer<typeof accountResearchSchema>;

// Email cadence schema
export const emailCadenceSchema = z.object({
  prospectId: z.number(),
  cadenceName: z.string().min(1, "Cadence name is required"),
  cadenceType: z.enum(["brand_awareness", "product_demo", "follow_up"]),
  totalSteps: z.number().default(6),
});

export type EmailCadenceRequest = z.infer<typeof emailCadenceSchema>;

export const csvUploadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  additionalInfo: z.string().optional(),
  jobTitleCategory: z.string().optional(),
  seniorityLevel: z.string().optional(),
  systemsExperience: z.string().optional(),
});
