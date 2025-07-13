import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 50 }).notNull().default("rep"), // 'rep', 'admin'
  linkedinId: varchar("linkedin_id", { length: 100 }),
  linkedinProfile: json("linkedin_profile"),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("users_email_idx").on(table.email),
  index("users_linkedin_id_idx").on(table.linkedinId),
]);

// Session storage for authentication
export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
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
}, (table) => [
  index("prospects_user_id_idx").on(table.userId),
  index("prospects_email_idx").on(table.email),
  index("prospects_company_idx").on(table.company),
]);

// New table for account-level research and intelligence
export const accountResearch = pgTable("account_research", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
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
}, (table) => [
  index("account_research_user_id_idx").on(table.userId),
]);

// New table for email cadence management
export const emailCadences = pgTable("email_cadences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  prospectId: integer("prospect_id").notNull().references(() => prospects.id),
  cadenceName: text("cadence_name").notNull(), // Brand Awareness D365, SAP Enterprise, etc.
  currentStep: integer("current_step").notNull().default(1),
  totalSteps: integer("total_steps").notNull().default(6),
  cadenceType: text("cadence_type").notNull(), // brand_awareness, product_demo, follow_up
  nextSendDate: timestamp("next_send_date"),
  status: text("status").notNull().default("active"), // active, paused, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("email_cadences_user_id_idx").on(table.userId),
]);

export const generatedContent = pgTable("generated_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  prospectId: integer("prospect_id").notNull().references(() => prospects.id),
  cadenceId: integer("cadence_id").references(() => emailCadences.id), // Link to email cadence if part of sequence
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

// User achievements tracking
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: varchar("achievement_id", { length: 100 }).notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  isNew: boolean("is_new").default(true),
  progress: integer("progress").default(0),
  metadata: json("metadata"), // Additional data for achievement tracking
}, (table) => [
  index("user_achievements_user_id_idx").on(table.userId),
  index("user_achievements_achievement_id_idx").on(table.achievementId),
]);

// User statistics for gamification
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  totalPoints: integer("total_points").default(0),
  level: integer("level").default(1),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalEmails: integer("total_emails").default(0),
  totalLinkedInPosts: integer("total_linkedin_posts").default(0),
  totalCallsAnalyzed: integer("total_calls_analyzed").default(0),
  totalCampaigns: integer("total_campaigns").default(0),
  highestTrustScore: integer("highest_trust_score").default(0),
  bestStoryScore: integer("best_story_score").default(0),
  weeklyActivity: integer("weekly_activity").default(0),
  monthlyActivity: integer("monthly_activity").default(0),
  totalLoginDays: integer("total_login_days").default(0),
  lastActivityDate: timestamp("last_activity_date"),
  streakUpdatedAt: timestamp("streak_updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_stats_user_id_idx").on(table.userId),
]);

// Activity log for achievement triggers
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: varchar("activity_type", { length: 100 }).notNull(),
  activityData: json("activity_data"),
  pointsEarned: integer("points_earned").default(0),
  triggerAchievements: text("trigger_achievements"), // JSON array of achievement IDs triggered
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("activity_log_user_id_idx").on(table.userId),
  index("activity_log_activity_type_idx").on(table.activityType),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  prospects: many(prospects),
  generatedContent: many(generatedContent),
  userAchievements: many(userAchievements),
  stats: many(userStats),
  activityLog: many(activityLog),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = typeof prospects.$inferInsert;
export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = typeof generatedContent.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
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
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Call Assessment schema
export const callAssessments = pgTable("call_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  callId: varchar("call_id", { length: 255 }).notNull(),
  date: varchar("date", { length: 50 }),
  summary: text("summary"),
  participants: jsonb("participants").notNull(),
  grading: jsonb("grading").notNull(),
  actionItems: jsonb("action_items").notNull(),
  coachingNotes: jsonb("coaching_notes").notNull(),
  sentimentAnalysis: jsonb("sentiment_analysis").notNull(),
  talkTimeEstimation: jsonb("talk_time_estimation").notNull(),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Microlearning modules
export const microlearningModules = pgTable("microlearning_modules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  skillArea: varchar("skill_area", { length: 100 }).notNull(), // rapport_trust, discovery_depth, etc.
  moduleType: varchar("module_type", { length: 50 }).notNull(), // video, article, exercise, quiz
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  content: jsonb("content").notNull(), // flexible content structure
  duration: integer("duration").notNull(), // in minutes
  difficulty: varchar("difficulty", { length: 20 }).notNull(), // beginner, intermediate, advanced
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  score: integer("score"), // for quizzes/exercises
  createdAt: timestamp("created_at").defaultNow(),
  triggeredBy: varchar("triggered_by", { length: 100 }), // call_assessment, manual, achievement
});

export const microlearningProgress = pgTable("microlearning_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  moduleId: integer("module_id").references(() => microlearningModules.id),
  startedAt: timestamp("started_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  progressPercentage: integer("progress_percentage").default(0),
  timeSpent: integer("time_spent").default(0), // in seconds
  currentSection: integer("current_section").default(0),
});

// Onboarding schema
export const onboardingResponses = pgTable("onboarding_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  role: varchar("role", { length: 50 }),
  experienceLevel: varchar("experience_level", { length: 50 }),
  primaryGoals: text("primary_goals").array(),
  company: varchar("company", { length: 255 }),
  teamSize: varchar("team_size", { length: 50 }),
  currentTools: text("current_tools").array(),
  painPoints: text("pain_points").array(),
  preferences: json("preferences").$type<{
    emailFrequency: string;
    communicationStyle: string;
    automationLevel: string;
  }>(),
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOnboardingResponseSchema = createInsertSchema(onboardingResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOnboardingResponse = z.infer<typeof insertOnboardingResponseSchema>;
export type OnboardingResponse = typeof onboardingResponses.$inferSelect;

// Call Assessment types
export type CallAssessment = typeof callAssessments.$inferSelect;
export type InsertCallAssessment = typeof callAssessments.$inferInsert;

// Microlearning types
export type MicrolearningModule = typeof microlearningModules.$inferSelect;
export type InsertMicrolearningModule = typeof microlearningModules.$inferInsert;
export type MicrolearningProgress = typeof microlearningProgress.$inferSelect;
export type InsertMicrolearningProgress = typeof microlearningProgress.$inferInsert;

// Additional relations for new tables
export const callAssessmentsRelations = relations(callAssessments, ({ one }) => ({
  user: one(users, {
    fields: [callAssessments.userId],
    references: [users.id],
  }),
}));

export const microlearningModulesRelations = relations(microlearningModules, ({ one, many }) => ({
  user: one(users, {
    fields: [microlearningModules.userId],
    references: [users.id],
  }),
  progress: many(microlearningProgress),
}));

export const microlearningProgressRelations = relations(microlearningProgress, ({ one }) => ({
  user: one(users, {
    fields: [microlearningProgress.userId],
    references: [users.id],
  }),
  module: one(microlearningModules, {
    fields: [microlearningProgress.moduleId],
    references: [microlearningModules.id],
  }),
}));

// Relations
export const userRelations = relations(users, ({ many }) => ({
  prospects: many(prospects),
  accountResearch: many(accountResearch),
  emailCadences: many(emailCadences),
  generatedContent: many(generatedContent),
  sessions: many(sessions),
}));

export const prospectRelations = relations(prospects, ({ one, many }) => ({
  user: one(users, {
    fields: [prospects.userId],
    references: [users.id],
  }),
  emailCadences: many(emailCadences),
  generatedContent: many(generatedContent),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

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

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["rep", "admin"]).default("rep"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;


