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
});

export const generatedContent = pgTable("generated_content", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull(),
  type: text("type").notNull(), // email, linkedin
  subject: text("subject"),
  content: text("content").notNull(),
  tone: text("tone").notNull(),
  cta: text("cta"),
  context: text("context"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProspectSchema = createInsertSchema(prospects).omit({
  id: true,
});

export const insertGeneratedContentSchema = createInsertSchema(generatedContent).omit({
  id: true,
  createdAt: true,
});

export type InsertProspect = z.infer<typeof insertProspectSchema>;
export type Prospect = typeof prospects.$inferSelect;
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;
export type GeneratedContent = typeof generatedContent.$inferSelect;

// Form schemas for validation
export const contentGenerationSchema = z.object({
  type: z.enum(["email", "linkedin"]),
  tone: z.enum(["professional", "friendly", "casual", "urgent"]),
  cta: z.string().min(1, "Call to action is required"),
  context: z.string().optional(),
  prospectIds: z.array(z.number()).min(1, "At least one prospect must be selected"),
});

export type ContentGenerationRequest = z.infer<typeof contentGenerationSchema>;

export const csvUploadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  additionalInfo: z.string().optional(),
});
