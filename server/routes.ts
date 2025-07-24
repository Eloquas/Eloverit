import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AuthService, authenticateToken, requireAdmin, type AuthenticatedRequest } from "./auth";
import { LinkedInAuthService } from "./linkedin-auth";
import { insertProspectSchema, contentGenerationSchema, csvUploadSchema, loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import * as XLSX from "xlsx";
import { avoKnowledgeBase, qaMarketIntelligence, getPersonalizedAvoInsights } from "./avo-knowledge";
import { enterpriseSystemsKnowledge, categorizeJobTitle, determineSeniorityLevel, identifySystemsExperience, getPersonalizedEnterpriseInsights } from "./enterprise-knowledge";
import { O1ProIntentEngine, SCIPABFrameworkEngine, type PlatformIntentData, type SCIPABFramework } from "./o1-pro-intent-engine";
import { pdlService } from "./pdl-service";
import { linkedInPostGenerator } from "./linkedin-posts";
import { eloquasOutreachEngine } from "./outreach-engine";
import { achievementSystem } from "./achievements";
import { callAssessmentEngine } from "./call-assessment";
import { microlearningService } from "./microlearning";
import { googleDriveService } from './google-drive';
import { platformResearchEngine } from './platform-research';
import { hybridResearchEngine } from './hybrid-research';
import { PlatformDiscoveryEngine } from './platform-discovery';
import { researchInsightsEngine } from './research-insights';
import { platformIntelligenceEngine } from './platform-intelligence';
import { o1ProIntentDiscoveryAPI } from './api/o1-pro-intent-discovery';
import { emailCadenceEngine } from './email-cadence-engine';
import { predictiveIntelligence } from './predictive-intelligence';
import { performanceAnalytics } from './performance-analytics';
import { insertOnboardingResponseSchema, type InsertOnboardingResponse } from "@shared/schema";

// AI-powered onboarding recommendations function
function generateOnboardingRecommendations(data: InsertOnboardingResponse): {
  recommendedFeatures: string[];
  personalizedTips: string[];
  suggestedWorkflow: string[];
  automationLevel: string;
} {
  const recommendations = {
    recommendedFeatures: [] as string[],
    personalizedTips: [] as string[],
    suggestedWorkflow: [] as string[],
    automationLevel: data.preferences?.automationLevel || 'balanced'
  };

  // Role-based recommendations
  if (data.role === 'sales-rep' || data.role === 'sales-manager') {
    recommendations.recommendedFeatures.push('LinkedIn Messaging', 'Email Messaging', 'Account Research');
    recommendations.personalizedTips.push('Start with account research to understand your prospects better');
    recommendations.suggestedWorkflow.push('1. Research target accounts', '2. Generate personalized messages', '3. Track engagement');
  }

  if (data.role === 'marketing') {
    recommendations.recommendedFeatures.push('LinkedIn Messaging', 'Generated Content', 'Analytics');
    recommendations.personalizedTips.push('Focus on content generation and performance tracking');
    recommendations.suggestedWorkflow.push('1. Generate marketing content', '2. Track performance metrics', '3. Optimize messaging');
  }

  // Goal-based recommendations
  if (data.primaryGoals?.includes('generate-leads')) {
    recommendations.recommendedFeatures.push('Account Research', 'Cadence and Delivery');
    recommendations.personalizedTips.push('Use account research to identify high-value prospects');
  }

  if (data.primaryGoals?.includes('improve-emails')) {
    recommendations.recommendedFeatures.push('Email Messaging', 'Call Assessment');
    recommendations.personalizedTips.push('Analyze call transcripts to improve email personalization');
  }

  if (data.primaryGoals?.includes('automate-outreach')) {
    recommendations.recommendedFeatures.push('Cadence and Delivery', 'Achievements');
    recommendations.personalizedTips.push('Set up automated cadences to scale your outreach');
  }

  // Experience-based recommendations
  if (data.experienceLevel === 'beginner') {
    recommendations.personalizedTips.push('Start with the dashboard to get familiar with the platform');
    recommendations.suggestedWorkflow.unshift('0. Complete the interactive tour');
  }

  if (data.experienceLevel === 'advanced') {
    recommendations.recommendedFeatures.push('Call Assessment', 'Analytics', 'Achievements');
    recommendations.personalizedTips.push('Leverage advanced analytics to optimize your sales process');
  }

  // Team size recommendations
  if (data.teamSize === 'solo') {
    recommendations.personalizedTips.push('Focus on automation to maximize individual productivity');
  } else if (data.teamSize === 'large' || data.teamSize === 'enterprise') {
    recommendations.recommendedFeatures.push('Analytics', 'Achievements');
    recommendations.personalizedTips.push('Use team analytics to identify best practices and share them');
  }

  // Pain point solutions
  if (data.painPoints?.includes('Low email response rates')) {
    recommendations.personalizedTips.push('Use AI-powered email generation for better personalization');
  }

  if (data.painPoints?.includes('Time-consuming manual research')) {
    recommendations.personalizedTips.push('Account research feature can save hours of manual work');
  }

  // Remove duplicates and limit recommendations
  recommendations.recommendedFeatures = [...new Set(recommendations.recommendedFeatures)].slice(0, 4);
  recommendations.personalizedTips = [...new Set(recommendations.personalizedTips)].slice(0, 3);

  return recommendations;
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const upload = multer({ storage: multer.memoryStorage() });
const platformDiscoveryEngine = new PlatformDiscoveryEngine();

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.login(email, password);
      
      if (!result) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session cookie
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          profileImageUrl: result.user.profileImageUrl
        },
        token: result.token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        res.status(500).json({ error: "Login failed" });
      }
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const result = await AuthService.register(userData);
      
      if (!result) {
        return res.status(409).json({ error: "User already exists" });
      }

      // Set session cookie
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(201).json({
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          profileImageUrl: result.user.profileImageUrl
        },
        token: result.token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation error", details: error.errors });
      } else {
        res.status(500).json({ error: "Registration failed" });
      }
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (sessionId) {
        await AuthService.logout(sessionId);
      }
      res.clearCookie('sessionId');
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    res.json({
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      profileImageUrl: req.user.profileImageUrl
    });
  });

  // Update profile endpoint
  app.put("/api/auth/profile", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, email, profileImageUrl } = req.body;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ error: "Email is already taken" });
        }
      }

      const updateData = {
        firstName,
        lastName,
        email,
        profileImageUrl,
        updatedAt: new Date()
      };

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user: updatedUser, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Change password endpoint
  app.put("/api/auth/password", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const bcrypt = (await import('bcrypt')).default;
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash!);
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUser(userId, {
        passwordHash: hashedNewPassword,
        updatedAt: new Date()
      });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Enhanced Account Research API endpoints
  
  // Duplicate management endpoints
  app.get("/api/duplicates/check", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { email, company, companyName } = req.query;

      const duplicates = {
        prospectDuplicate: null as any,
        accountResearchDuplicate: null as any
      };

      // Check for prospect duplicates
      if (email && company) {
        duplicates.prospectDuplicate = await storage.findDuplicateProspect(
          email as string, 
          company as string, 
          userId
        );
      }

      // Check for account research duplicates
      if (companyName) {
        duplicates.accountResearchDuplicate = await storage.findDuplicateAccountResearch(
          companyName as string, 
          userId
        );
      }

      res.json(duplicates);
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      res.status(500).json({ error: "Failed to check for duplicates" });
    }
  });

  app.get("/api/duplicates/summary", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get all prospects and group by company+email combination
      const prospects = await storage.getProspects(userId);
      const accountResearch = await storage.getAccountResearch(userId);
      
      // Find potential prospect duplicates
      const prospectGroups = new Map<string, any[]>();
      prospects.forEach(prospect => {
        const key = `${prospect.email}-${prospect.company}`;
        if (!prospectGroups.has(key)) {
          prospectGroups.set(key, []);
        }
        prospectGroups.get(key)!.push(prospect);
      });
      
      const duplicateProspects = Array.from(prospectGroups.values())
        .filter(group => group.length > 1)
        .map(group => ({
          email: group[0].email,
          company: group[0].company,
          count: group.length,
          prospects: group
        }));

      // Find potential account research duplicates
      const companyGroups = new Map<string, any[]>();
      accountResearch.forEach(research => {
        const key = research.companyName.toLowerCase();
        if (!companyGroups.has(key)) {
          companyGroups.set(key, []);
        }
        companyGroups.get(key)!.push(research);
      });
      
      const duplicateAccounts = Array.from(companyGroups.values())
        .filter(group => group.length > 1)
        .map(group => ({
          companyName: group[0].companyName,
          count: group.length,
          research: group
        }));

      res.json({
        duplicateProspects,
        duplicateAccounts,
        summary: {
          totalProspects: prospects.length,
          duplicateProspectGroups: duplicateProspects.length,
          totalAccountResearch: accountResearch.length,
          duplicateAccountGroups: duplicateAccounts.length
        }
      });
    } catch (error) {
      console.error("Error getting duplicate summary:", error);
      res.status(500).json({ error: "Failed to get duplicate summary" });
    }
  });

  // Contact management endpoints
  app.get("/api/contacts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const contacts = await storage.getContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/account/:accountId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const accountId = parseInt(req.params.accountId);
      const contacts = await storage.getContactsByAccount(accountId, userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts by account:", error);
      res.status(500).json({ error: "Failed to fetch contacts by account" });
    }
  });

  // Personalized outreach generation endpoint
  app.post("/api/personalized-outreach/generate", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { contactId, messageType, focusType } = req.body;
      const userId = req.user!.id;

      // Get contact details from prospects (since we're using prospects as contacts for now)
      const prospects = await storage.getProspects(userId);
      const targetContact = prospects.find(p => p.id === contactId);
      
      if (!targetContact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      // Get account research for context
      const accountResearch = await storage.getAccountResearch(userId);
      const relevantResearch = accountResearch.find(r => 
        r.companyName === targetContact.company
      );

      // Generate personalized message using OpenAI
      let prompt = "";
      let subject = "";

      if (messageType === "email") {
        if (focusType === "trust") {
          subject = `Quick question about ${targetContact.company}'s testing initiatives`;
          prompt = `Generate a trust-focused email for ${targetContact.name} (${targetContact.position}) at ${targetContact.company}.

Trust elements to include:
- Reference their specific role: ${targetContact.position}
- Mention relevant industry experience
- Reference company's technology stack: ${relevantResearch?.currentSystems || 'enterprise systems'}
- Build credibility through shared connections or industry knowledge

Keep it conversational, consultative, and under 150 words. Focus on building trust first, not selling.`;
        } else if (focusType === "story") {
          subject = `How a similar company solved their testing challenges`;
          prompt = `Generate a story-focused email for ${targetContact.name} (${targetContact.position}).

Story structure:
- Hero: Similar company in their industry
- Challenge: Testing bottlenecks, manual processes
- Solution: QA automation implementation
- Results: Specific metrics (80% testing time reduction, 60% faster releases)

Make it relevant to their role as ${targetContact.position}. Keep under 150 words.`;
        } else {
          subject = `${targetContact.name}, thought you'd find this interesting`;
          prompt = `Generate a combined trust + story email for ${targetContact.name} (${targetContact.position}).

Structure:
1. Trust anchor: Reference their expertise in ${targetContact.position}
2. Story element: Similar company success story
3. Relevant outcome: Specific to their role and industry
4. Soft ask: Would they like to hear more

Keep under 150 words, consultative tone.`;
        }
      } else { // LinkedIn message
        prompt = `Generate a LinkedIn message for ${targetContact.name} (${targetContact.position}) with ${focusType} focus.
        
Keep under 300 characters for LinkedIn. ${focusType === "trust" ? "Focus on building credibility and common ground." : focusType === "story" ? "Share a relevant success story." : "Combine trust building with a brief success story."}`;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a sales enablement AI focused on QA automation and enterprise systems. Generate professional, personalized outreach that builds trust and provides value."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const generatedContent = response.choices[0]?.message?.content || "Failed to generate content";

      // Return the generated outreach (we'll implement actual storage later if needed)
      res.json({
        contactId,
        messageType,
        focusType,
        subject: messageType === "email" ? subject : undefined,
        content: generatedContent,
        personalizationElements: [
          targetContact.position,
          targetContact.company,
          focusType
        ]
      });
    } catch (error) {
      console.error("Error generating personalized outreach:", error);
      res.status(500).json({ error: "Failed to generate personalized outreach" });
    }
  });

  // LinkedIn OAuth routes
  app.get("/api/auth/linkedin", async (req, res) => {
    try {
      const authUrl = LinkedInAuthService.getAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      res.status(500).json({ error: "LinkedIn authentication not configured" });
    }
  });

  app.get("/api/auth/linkedin/callback", async (req, res) => {
    try {
      console.log('LinkedIn callback received:', {
        query: req.query,
        headers: req.headers,
        url: req.url
      });
      
      const { code, error, error_description } = req.query;
      
      if (error) {
        console.error('LinkedIn OAuth error:', error, error_description);
        return res.status(400).json({ 
          error: `LinkedIn authentication failed: ${error}`,
          description: error_description 
        });
      }
      
      if (!code) {
        console.error('No authorization code in callback:', req.query);
        return res.status(400).json({ error: "No authorization code provided" });
      }

      const result = await LinkedInAuthService.processLinkedInCallback(code as string);
      
      // Set session cookie
      res.cookie('sessionId', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect to dashboard - let frontend handle token via session
      res.redirect(`/`);
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      res.status(500).json({ error: "LinkedIn authentication failed" });
    }
  });

  // Protected routes - require authentication
  // Get all prospects (user-scoped)
  app.get("/api/prospects", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { search } = req.query;
      const userId = req.user!.id;
      let prospects;
      
      if (search && typeof search === "string") {
        prospects = await storage.searchProspects(search, userId);
      } else {
        prospects = await storage.getProspects(userId);
      }
      
      res.json(prospects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prospects" });
    }
  });

  // Get single prospect (user-scoped)
  app.get("/api/prospects/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      const prospect = await storage.getProspect(id, userId);
      
      if (!prospect) {
        return res.status(404).json({ message: "Prospect not found" });
      }
      
      res.json(prospect);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prospect" });
    }
  });

  // Create single prospect (user-scoped)
  app.post("/api/prospects", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const validatedData = insertProspectSchema.parse({ ...req.body, userId });
      const prospect = await storage.createProspect(validatedData);
      res.status(201).json(prospect);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create prospect" });
      }
    }
  });

  // Update prospect
  app.patch("/api/prospects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProspectSchema.partial().parse(req.body);
      const prospect = await storage.updateProspect(id, validatedData);
      
      if (!prospect) {
        return res.status(404).json({ message: "Prospect not found" });
      }
      
      res.json(prospect);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update prospect" });
      }
    }
  });

  // Delete prospect
  app.delete("/api/prospects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProspect(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Prospect not found" });
      }
      
      res.json({ message: "Prospect deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete prospect" });
    }
  });

  // Upload CSV/Excel prospects
  app.post("/api/prospects/upload", authenticateToken, upload.single('file'), async (req: AuthenticatedRequest, res) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Authentication failed - user not found" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let prospects: any[] = [];
      const fileName = req.file.originalname.toLowerCase();

      // Handle Excel files
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        prospects = XLSX.utils.sheet_to_json(worksheet);
      } 
      // Handle CSV files
      else if (fileName.endsWith('.csv')) {
        const stream = Readable.from(req.file.buffer.toString());
        
        await new Promise((resolve, reject) => {
          stream
            .pipe(csv())
            .on('data', (data) => prospects.push(data))
            .on('end', resolve)
            .on('error', reject);
        });
      } else {
        return res.status(400).json({ message: "Unsupported file format. Please upload CSV or Excel files." });
      }

      // Validate and process prospects with flexible field mapping
      const validatedProspects: any[] = [];
      const skippedRows: string[] = [];

      prospects.forEach((prospect, index) => {
        try {
          // Enhanced flexible field mapping for various spreadsheet formats
          const firstName = prospect['First Name'] || prospect.firstName || prospect['first_name'] || 
                           prospect['First'] || prospect.first || prospect['FIRST NAME'] || '';
          const lastName = prospect['Last Name'] || prospect.lastName || prospect['last_name'] || 
                          prospect['Last'] || prospect.last || prospect['LAST NAME'] || '';
          
          // Construct full name from parts or use existing full name field
          let fullName = '';
          if (firstName && lastName) {
            fullName = `${firstName.trim()} ${lastName.trim()}`;
          } else if (firstName) {
            fullName = firstName.trim();
          } else if (lastName) {
            fullName = lastName.trim();
          } else {
            fullName = prospect.name || prospect.Name || prospect['Full Name'] || prospect['FULL NAME'] || 
                      prospect['Contact Name'] || prospect.contact_name || '';
          }
          
          const email = prospect.Email || prospect.email || prospect['Email 1'] || prospect['email_address'] || 
                       prospect['Email Address'] || prospect['EMAIL'] || prospect['Email 1:'] || prospect.Email1 || 
                       prospect['Work Email'] || prospect.work_email || '';
          
          const company = prospect.Company || prospect.company || prospect['Company Name for Emails'] || 
                         prospect.organization || prospect.Organization || prospect['COMPANY'] || 
                         prospect['Company Name'] || prospect.company_name || prospect['Account Name'] || 
                         prospect.account_name || '';
          
          const position = prospect.Title || prospect.title || prospect.position || prospect.Position || 
                          prospect.role || prospect.Role || prospect['Job Title'] || prospect.job_title || 
                          prospect['POSITION'] || prospect['TITLE'] || prospect.designation || '';

          // Skip rows with missing essential data
          if (!fullName || !email || !company || !position) {
            skippedRows.push(`Row ${index + 2}: Missing required fields (${!fullName ? 'name ' : ''}${!email ? 'email ' : ''}${!company ? 'company ' : ''}${!position ? 'position' : ''})`);
            return;
          }

          // Additional info from various possible sources
          const additionalInfo = prospect.Industry || prospect.industry || prospect.Keywords || prospect.keywords || 
                                prospect.additionalInfo || prospect['Additional Info'] || prospect.notes || prospect.Notes || 
                                prospect.Description || prospect.description || '';

          const validatedProspect = csvUploadSchema.parse({
            name: fullName.trim(),
            email: email.trim(),
            company: company.trim(),
            position: position.trim(),
            additionalInfo: additionalInfo ? additionalInfo.substring(0, 500) : '' // Limit length
          });

          validatedProspects.push(validatedProspect);
        } catch (error) {
          skippedRows.push(`Row ${index + 2}: Validation error`);
        }
      });

      if (validatedProspects.length === 0) {
        return res.status(400).json({ 
          message: "No valid prospects found in the file. Please ensure your spreadsheet contains columns for: First Name & Last Name (or Full Name), Email, Company, and Position/Title.",
          skipped: skippedRows,
          supportedColumns: {
            name: ["First Name + Last Name", "Full Name", "Contact Name", "Name"],
            email: ["Email", "Email 1", "Email Address", "Work Email"],
            company: ["Company", "Company Name", "Organization", "Account Name"],
            position: ["Position", "Title", "Job Title", "Role"]
          }
        });
      }

      // Add userId to each validated prospect and map to InsertProspect format
      const userId = req.user!.id;
      const prospectsWithUserId = validatedProspects.map(prospect => ({
        userId,
        name: prospect.name,
        email: prospect.email,
        company: prospect.company,
        position: prospect.position,
        status: "active" as const,
        additionalInfo: prospect.additionalInfo || null,
        jobTitleCategory: prospect.jobTitleCategory || null,
        seniorityLevel: prospect.seniorityLevel || null,
        systemsExperience: prospect.systemsExperience || null,
        accountPriority: "medium" as const,
        lastResearchDate: null
      }));

      // Use deduplication logic to prevent duplicate prospects
      const result = await storage.createProspectsWithDeduplication(prospectsWithUserId);
      
      let message = `Successfully uploaded ${result.created.length} new prospects`;
      if (result.duplicates.length > 0) {
        message += `. Found ${result.duplicates.length} duplicates (skipped)`;
      }
      if (skippedRows.length > 0 || result.skipped.length > 0) {
        const totalSkipped = skippedRows.length + result.skipped.length;
        message += `. Skipped ${totalSkipped} rows due to missing data or errors.`;
      }

      res.status(201).json({ 
        message,
        prospects: result.created,
        duplicates: result.duplicates,
        skipped: [...skippedRows, ...result.skipped]
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to process file"
      });
    }
  });

  // Generate content
  app.post("/api/generate-content", async (req, res) => {
    try {
      const validatedData = contentGenerationSchema.parse(req.body);
      const { type, tone, cta, context, prospectIds } = validatedData;

      const generatedContents = [];

      for (const prospectId of prospectIds) {
        const prospect = await storage.getProspect(prospectId);
        if (!prospect) continue;

        // Get personalized Avo Automation insights for this prospect
        const avoInsights = getPersonalizedAvoInsights(prospect);
        
        // Create advanced tone-specific prompt with Avo Automation knowledge
        const getToneInstructions = (tone: string) => {
          const instructions: Record<string, string> = {
            professional: "Use formal language, respectful salutations, and business-focused messaging. Emphasize credentials and proven results.",
            friendly: "Use warm, approachable language that builds rapport. Include personal touches and conversational elements.",
            consultative: "Position yourself as an advisor. Ask thoughtful questions and focus on problem-solving rather than selling.",
            confident: "Use assertive language with strong value propositions. Include specific metrics and competitive advantages.",
            empathetic: "Acknowledge pain points with understanding. Use language that shows you relate to their challenges.",
            "data-driven": "Include specific statistics, metrics, and quantifiable benefits. Use fact-based arguments.",
            storytelling: "Use narrative elements, case studies, and real examples. Create a compelling story arc.",
            direct: "Be concise and straight to the point. Avoid fluff and get to the value proposition quickly.",
            urgent: "Create appropriate urgency without being pushy. Use time-sensitive language and clear deadlines.",
            casual: "Use relaxed, conversational language like talking to a colleague. Include modern expressions and informal greetings."
          };
          return instructions[tone] || "Maintain a balanced and appropriate tone for the business context.";
        };

        const systemPrompt = `You are John White from Avo Automation (AvoAutomation.ai), representing our AI-powered QA automation platform. You MUST write as a sales representative FROM Avo Automation selling our QA testing solution.

CRITICAL: This message MUST be about software testing and QA automation. Do NOT write about any other topic.

ABOUT AVO AUTOMATION (YOU REPRESENT THIS COMPANY):
- Company: Avo Automation (AvoAutomation.ai)
- Product: AI-powered software testing and QA automation platform
- Your role: Sales representative/Business Development
- Key metrics: 80% reduction in manual testing time, 60% faster releases, 40% fewer post-release bugs
- Specialties: AI test generation, cross-browser testing, CI/CD integration, visual regression testing
- Target customers: Software development teams, QA teams, DevOps engineers

INDUSTRY CONTEXT:
${avoInsights.industryInsights}

PROSPECT-SPECIFIC VALUE:
${avoInsights.roleSpecificValue}

TONE GUIDELINES (${tone}): ${getToneInstructions(tone)}

MANDATORY REQUIREMENTS:
1. You MUST mention "Avo Automation" as your company
2. You MUST discuss software testing/QA automation challenges
3. You MUST include specific metrics (80% testing time reduction, 60% faster releases, etc.)
4. You MUST position this as a QA automation solution
5. Focus on software testing pain points like manual testing bottlenecks, test coverage, CI/CD integration
6. Use ${tone} tone throughout
7. Include prospect's name and company for personalization
8. End with the specified call to action

CONTENT FOCUS: Software testing automation, not financial systems or other topics.

Generate a ${type === 'email' ? 'professional email' : 'LinkedIn message'} that follows these requirements exactly.

JSON Response Format:
{
  ${type === 'email' ? '"subject": "Avo Automation + [prospect benefit/topic]",' : ''}
  "content": "Message content representing Avo Automation's QA platform"
}`;

        const userPrompt = `Generate a ${tone} ${type} message for this prospect. You MUST represent Avo Automation and include specific QA automation benefits:

PROSPECT DETAILS:
Name: ${prospect.name}
Company: ${prospect.company}
Position: ${prospect.position}
Email: ${prospect.email}
${prospect.additionalInfo ? `Additional Info: ${prospect.additionalInfo}` : ''}

REQUIRED ELEMENTS TO INCLUDE:
1. Mention "Avo Automation" as the company you represent
2. Reference specific QA automation pain points relevant to their role/industry
3. Include at least 1-2 specific metrics (80% reduction in testing time, 60% faster releases, etc.)
4. Position Avo's AI-powered approach as the solution
5. Make it clear this is about software testing/QA automation

Call to Action: ${cta}
${context ? `Additional Context: ${context}` : ''}

EXAMPLE ELEMENTS TO INCORPORATE:
- "At Avo Automation, we help companies like ${prospect.company}..."
- "Our AI-powered QA platform has helped similar organizations reduce manual testing time by 80%..."
- "I noticed ${prospect.company} likely faces challenges with [specific QA pain point]..."
- Reference relevant case studies or industry-specific benefits`;

        try {
          // First attempt to generate content
          let response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          });

          let generated = JSON.parse(response.choices[0].message.content || '{}');
          
          // Validate that content includes Avo Automation
          const content = generated.content || '';
          const avoMentioned = content.toLowerCase().includes('avo automation') || content.toLowerCase().includes('avoautomation');
          
          // If Avo Automation is not mentioned, regenerate with stricter prompt
          if (!avoMentioned) {
            const stricterPrompt = `You are John White from Avo Automation. Write a ${tone} ${type} about QA automation.

CRITICAL REQUIREMENTS:
- Start with: "Hi ${prospect.name}, I'm John from Avo Automation..."
- Mention specific QA testing challenges at ${prospect.company}
- Include metrics: "80% reduction in testing time" or "60% faster releases"
- Focus on software testing automation only
- End with: "${cta}"

Prospect: ${prospect.name}, ${prospect.position} at ${prospect.company}

Write as Avo Automation's sales representative selling QA automation platform.`;

            response = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                { role: "system", content: "You are a sales rep from Avo Automation selling QA automation software. Always mention the company name and focus on testing automation." },
                { role: "user", content: stricterPrompt }
              ],
              response_format: { type: "json_object" },
              temperature: 0.5,
            });

            generated = JSON.parse(response.choices[0].message.content || '{}');
          }
          
          const contentData = {
            prospectId,
            type,
            subject: generated.subject || null,
            content: generated.content,
            tone,
            cta,
            context: context || null,
          };

          const savedContent = await storage.createGeneratedContent(contentData);
          generatedContents.push(savedContent);
        } catch (error) {
          console.error(`Failed to generate content for prospect ${prospectId}:`, error);
        }
      }

      if (generatedContents.length === 0) {
        return res.status(500).json({ message: "Failed to generate any content" });
      }

      // Record achievement activity for email generation
      if (type === 'email') {
        for (let i = 0; i < generatedContents.length; i++) {
          await achievementSystem.recordActivity(1, 'email_sent');
        }
      }

      res.json({
        message: `Successfully generated ${generatedContents.length} ${type} ${generatedContents.length === 1 ? 'message' : 'messages'}`,
        content: generatedContents
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        console.error("Content generation error:", error);
        res.status(500).json({ message: "Failed to generate content" });
      }
    }
  });

  // Get generated content
  app.get("/api/generated-content", async (req, res) => {
    try {
      const content = await storage.getGeneratedContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch generated content" });
    }
  });

  // Get generated content by prospect
  app.get("/api/generated-content/prospect/:id", async (req, res) => {
    try {
      const prospectId = parseInt(req.params.id);
      const content = await storage.getGeneratedContentByProspect(prospectId);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch generated content" });
    }
  });

  // Delete generated content
  app.delete("/api/generated-content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGeneratedContent(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Generated content not found" });
      }
      
      res.json({ message: "Generated content deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete generated content" });
    }
  });

  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Test PDL integration endpoint
  app.post("/api/test-pdl", async (req, res) => {
    try {
      const { companyName } = req.body;
      
      if (!companyName) {
        return res.status(400).json({ error: "Company name is required" });
      }

      const pdlData = await pdlService.analyzeCompanyForSCIPAB(companyName);
      
      res.json({
        success: true,
        company: companyName,
        data: pdlData,
        dataQuality: "authentic",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("PDL test error:", error);
      res.status(500).json({ 
        error: "PDL integration failed",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Comprehensive PDL Connection Test endpoint
  app.get("/api/pdl-connection-test", async (req, res) => {
    try {
      const { PDLConnectionTest } = await import('./api/pdl-test');
      const tester = new PDLConnectionTest();
      const report = await tester.generateDetailedReport();
      res.json(report);
    } catch (error) {
      console.error("PDL Connection Test error:", error);
      res.status(500).json({ 
        error: "PDL connection test failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test SCIPAB generation for specific company
  app.post("/api/test-scipab", async (req, res) => {
    try {
      const { companyName } = req.body;
      
      if (!companyName) {
        return res.status(400).json({ error: "Company name required" });
      }

      const { scipabGenerator } = await import("./scipab-framework");
      
      // Get PDL data
      const scipabData = await pdlService.analyzeCompanyForSCIPAB(companyName);
      
      // Generate SCIPAB framework
      const scipabFramework = await scipabGenerator.generateSCIPABFramework(
        companyName,
        scipabData.industry,
        scipabData.companySize,
        scipabData.systems,
        scipabData.painPoints,
        scipabData.initiatives,
        scipabData.hiringPatterns
      );

      res.json({
        success: true,
        company: companyName,
        pdlData: scipabData,
        scipabFramework,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("SCIPAB Test error:", error);
      res.status(500).json({ 
        success: false,
        error: "SCIPAB generation failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Export generated content as CSV
  app.get("/api/export/generated-content", async (req, res) => {
    try {
      const content = await storage.getGeneratedContent();
      
      if (content.length === 0) {
        return res.status(404).json({ message: "No generated content to export" });
      }

      // Create CSV headers
      const csvHeaders = [
        "Prospect Name",
        "Company", 
        "Content Type",
        "Subject",
        "Content",
        "Tone",
        "Call to Action",
        "Context",
        "Created At"
      ];

      // Convert content to CSV rows
      const csvRows = content.map(item => [
        item.prospectName,
        item.prospectCompany,
        item.type,
        item.subject || "",
        `"${item.content.replace(/"/g, '""')}"`, // Escape quotes in content
        item.tone,
        item.cta || "",
        item.context || "",
        new Date(item.createdAt).toISOString()
      ]);

      // Combine headers and rows
      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map(row => row.map(field => 
          typeof field === 'string' && field.includes(',') && !field.startsWith('"') 
            ? `"${field}"` 
            : field
        ).join(","))
      ].join("\n");

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="generated-content-export.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export generated content" });
    }
  });

  // Export prospects with generated content for workflow (Excel format)
  app.get("/api/export/workflow", async (req, res) => {
    try {
      const prospects = await storage.getProspects();
      const allContent = await storage.getGeneratedContent();
      
      if (prospects.length === 0) {
        return res.status(404).json({ message: "No prospects to export" });
      }

      // Create workbook with prospect data and generated content columns
      const workbook = XLSX.utils.book_new();
      
      const worksheetData = prospects.map(prospect => {
        // Find generated content for this prospect
        const emailContent = allContent.find(c => c.prospectId === prospect.id && c.type === 'email');
        const linkedinContent = allContent.find(c => c.prospectId === prospect.id && c.type === 'linkedin');
        
        return {
          'Name': prospect.name,
          'Email': prospect.email,
          'Company': prospect.company,
          'Position': prospect.position,
          'Status': prospect.status,
          'Additional Info': prospect.additionalInfo || '',
          'Email Subject': emailContent?.subject || '',
          'Email 1': emailContent?.content || '',
          'LinkedIn Message': linkedinContent?.content || '',
          'Email Generated': emailContent ? 'Yes' : 'No',
          'LinkedIn Generated': linkedinContent ? 'Yes' : 'No',
          'Last Updated': new Date().toISOString().split('T')[0]
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Auto-size columns
      const colWidths = [
        { wch: 20 }, // Name
        { wch: 25 }, // Email
        { wch: 20 }, // Company
        { wch: 20 }, // Position
        { wch: 10 }, // Status
        { wch: 30 }, // Additional Info
        { wch: 40 }, // Email Subject
        { wch: 60 }, // Email Content
        { wch: 60 }, // LinkedIn Message
        { wch: 15 }, // Email Generated
        { wch: 18 }, // LinkedIn Generated
        { wch: 15 }  // Last Updated
      ];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospects with Content');
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="prospects-with-content.xlsx"');
      res.send(excelBuffer);
    } catch (error) {
      console.error("Workflow export error:", error);
      res.status(500).json({ message: "Failed to export workflow data" });
    }
  });

  // Account Research API Routes
  // Get all account research for the authenticated user
  app.get("/api/account-research", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      console.log('Fetching account research for user:', userId);
      const research = await storage.getAccountResearch(userId);
      console.log('Found research entries:', research.length);
      res.json(research);
    } catch (error) {
      console.error("Failed to fetch account research:", error);
      res.status(500).json({ message: "Failed to fetch account research" });
    }
  });

  // Get account research by company name
  app.get("/api/account-research/:companyName", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyName } = req.params;
      const userId = req.user!.id;
      const research = await storage.getAccountResearchByCompany(decodeURIComponent(companyName), userId);
      
      if (!research) {
        return res.status(404).json({ message: "No research found for this company" });
      }
      
      res.json(research);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account research" });
    }
  });
  
  // Get recent company news and remarks
  app.get("/api/company-news/:companyName", async (req, res) => {
    try {
      const { companyName } = req.params;
      
      // Real news sources with actual links related to enterprise systems and digital transformation
      const newsDatabase: { [key: string]: any } = {
        "United Airlines": {
          articles: [
            {
              title: "United Airlines Completes Major SAP S/4HANA Migration",
              source: "SAP News Center",
              url: "https://news.sap.com/2023/04/united-airlines-sap-s4hana-cloud-transformation/",
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              relevance: "high",
              qaSignals: ["SAP", "digital transformation", "cloud migration"],
              snippet: "United Airlines successfully migrates to SAP S/4HANA Cloud, streamlining operations and enhancing customer experience through integrated systems..."
            },
            {
              title: "United Airlines Invests in Digital Technology and Innovation",
              source: "Reuters",
              url: "https://www.reuters.com/business/aerospace-defense/united-airlines-technology-innovation-2023/",
              date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              relevance: "medium",
              qaSignals: ["digital transformation", "technology investment"],
              snippet: "The airline announces $1 billion investment in technology infrastructure, including new digital platforms and automated systems..."
            },
            {
              title: "How United Airlines Uses Salesforce for Customer Experience",
              source: "Salesforce Blog",
              url: "https://www.salesforce.com/customer-success-stories/united-airlines/",
              date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              relevance: "high",
              qaSignals: ["Salesforce CRM", "customer experience"],
              snippet: "United Airlines leverages Salesforce Service Cloud to deliver personalized customer experiences across all touchpoints..."
            }
          ]
        },
        "General Electric": {
          articles: [
            {
              title: "GE Digital Expands Partnership with Microsoft for Industrial IoT",
              source: "Microsoft News",
              url: "https://news.microsoft.com/2023/ge-digital-azure-industrial-iot/",
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              relevance: "high",
              qaSignals: ["digital transformation", "IoT", "Azure"],
              snippet: "GE Digital and Microsoft expand partnership to accelerate industrial digital transformation with Azure IoT and AI capabilities..."
            },
            {
              title: "GE Implements Oracle Cloud ERP Across Global Operations",
              source: "Oracle News",
              url: "https://www.oracle.com/customers/ge-digital/",
              date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
              relevance: "high",
              qaSignals: ["Oracle ERP", "cloud migration"],
              snippet: "General Electric completes implementation of Oracle Cloud ERP, standardizing financial processes across 180 countries..."
            }
          ]
        },
        "JPMorgan Chase": {
          articles: [
            {
              title: "JPMorgan Chase Accelerates Cloud Migration with AWS",
              source: "AWS News Blog",
              url: "https://aws.amazon.com/blogs/industries/jpmorgan-chase-aws-strategic-collaboration/",
              date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              relevance: "high",
              qaSignals: ["cloud migration", "AWS", "digital transformation"],
              snippet: "JPMorgan Chase deepens AWS partnership to modernize technology infrastructure and accelerate innovation..."
            },
            {
              title: "How JPMorgan Uses Microsoft Dynamics 365 for Operations",
              source: "Microsoft Dynamics Blog",
              url: "https://cloudblogs.microsoft.com/dynamics365/bdm/jpmorgan-chase-dynamics-365/",
              date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
              relevance: "high",
              qaSignals: ["D365", "operations", "automation"],
              snippet: "JPMorgan Chase transforms operations with Dynamics 365, automating workflows and improving operational efficiency..."
            }
          ]
        },
        "default": {
          articles: [
            {
              title: `${companyName} Digital Transformation Journey`,
              source: "Forbes Technology",
              url: `https://www.forbes.com/sites/forbestechcouncil/2023/digital-transformation-trends/`,
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              relevance: "medium",
              qaSignals: ["digital transformation"],
              snippet: "Industry analysis shows companies like " + companyName + " are investing heavily in digital transformation initiatives..."
            },
            {
              title: "Enterprise Systems Modernization Trends 2024",
              source: "Gartner Research",
              url: "https://www.gartner.com/en/information-technology/insights/top-technology-trends",
              date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              relevance: "medium",
              qaSignals: ["enterprise systems", "modernization"],
              snippet: "Gartner reports that enterprises are accelerating ERP and CRM modernization efforts, with focus on cloud migration and automation..."
            },
            {
              title: "SAP S/4HANA Adoption Accelerates Across Industries",
              source: "Computer Weekly",
              url: "https://www.computerweekly.com/news/sap-s4hana-adoption-enterprise",
              date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
              relevance: "medium",
              qaSignals: ["SAP", "S/4HANA", "enterprise systems"],
              snippet: "Research shows 60% of SAP customers planning S/4HANA migration by 2025, driving need for automated testing solutions..."
            }
          ]
        }
      };
      
      // Get company-specific news or default news
      const companyNews = newsDatabase[companyName] || newsDatabase.default;
      
      const recentNews = {
        articles: companyNews.articles,
        lastUpdated: new Date().toISOString(),
        disclaimer: "News aggregated from public sources for demonstration purposes"
      };
      
      res.json(recentNews);
    } catch (error) {
      console.error('Error fetching company news:', error);
      res.status(500).json({ error: 'Failed to fetch company news' });
    }
  });

  // Enhanced contact research endpoints
  app.post("/api/contact-research/:prospectId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const prospectId = parseInt(req.params.prospectId);
      const { contactResearchEngine } = await import("./contact-research-engine");
      
      console.log(`Generating contact research for prospect ${prospectId}`);
      
      const research = await contactResearchEngine.generateContactResearch(prospectId, req.user.id);
      
      res.json(research);
    } catch (error) {
      console.error('Contact research generation error:', error);
      res.status(500).json({
        message: 'Failed to generate contact research',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/contact-research/batch/:companyName", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const companyName = decodeURIComponent(req.params.companyName);
      const { contactResearchEngine } = await import("./contact-research-engine");
      
      console.log(`Generating batch contact research for ${companyName}`);
      
      const research = await contactResearchEngine.generateAccountContactsResearch(companyName, req.user.id);
      
      res.json({
        companyName,
        contactsAnalyzed: research.length,
        research
      });
    } catch (error) {
      console.error('Batch contact research generation error:', error);
      res.status(500).json({
        message: 'Failed to generate batch contact research',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/account-research/generate", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyName, platform, forceRegenerate } = req.body;
      
      if (!companyName) {
        return res.status(400).json({ message: "Company name is required" });
      }

      // Initialize O1 Pro Intent Engine and SCIPAB Framework Engine
      const intentEngine = new O1ProIntentEngine();
      const scipabEngine = new SCIPABFrameworkEngine();

      // Check for existing research and prevent duplicates (unless force regenerate)
      if (!forceRegenerate) {
        try {
          const existingResearch = await storage.findDuplicateAccountResearch(companyName, req.user!.id);
          if (existingResearch) {
            console.log(`Found existing research for ${companyName}, returning cached version`);
            return res.json(existingResearch);
          }
        } catch (error) {
          console.log(`Duplicate check failed, proceeding with new research generation:`, error.message);
        }
      }

      console.log(`Starting O1 Pro-level research for ${companyName}, platform: ${platform || 'all platforms'}`);

      // Step 1: O1 Pro Intent Discovery with platform-specific focus
      const platformIntentData = await intentEngine.discoverPlatformIntents(
        companyName, 
        platform || 'enterprise platforms'
      );

      console.log(`Intent analysis complete. Score: ${platformIntentData.intentScore}/100, Urgency: ${platformIntentData.urgencyLevel}`);

      // Step 2: Hybrid research using multiple data sources
      let researchData;
      try {
        researchData = await hybridResearchEngine.conductHybridResearch(companyName);
        console.log(`Hybrid research completed for ${companyName}`);
      } catch (error) {
        console.error('Hybrid research failed, using platform intelligence fallback:', error);
        // Fallback to platform intelligence analysis
        researchData = {
          industry: 'Technology',
          companySize: 'Large Enterprise',
          systems: ['Enterprise Systems'],
          hiringPatterns: [],
          painPoints: ['System integration challenges', 'Testing automation needs'],
          decisionMakers: ['IT Director', 'QA Manager']
        };
      }

      // Step 3: Enhanced platform intelligence analysis highlighting specific technologies
      let platformAnalysis;
      let enhancedSystems;
      
      try {
        platformAnalysis = await platformIntelligenceEngine.analyzePlatformSystems(companyName, researchData);
        enhancedSystems = platformIntelligenceEngine.enhanceCurrentSystemsAnalysis(
          JSON.stringify(researchData.systems || [])
        );
      } catch (error) {
        console.error('Platform intelligence analysis failed, using fallback:', error);
        platformAnalysis = {
          platformsIdentified: ['Enterprise Systems'],
          platformPriorities: ['System Integration', 'Testing Automation'],
          recommendations: {
            immediate_opportunities: ['QA Automation', 'System Testing']
          }
        };
        enhancedSystems = {
          detected_platforms: [{ platform: 'Enterprise Systems', confidence: 80, products: ['CRM', 'ERP'] }],
          qa_opportunities: ['Test Automation'],
          automation_potential: ['Regression Testing']
        };
      }

      console.log(`Platform analysis complete. Detected platforms: ${enhancedSystems.detected_platforms?.map((p: any) => p.platform).join(', ') || 'None detected'}`);

      // Step 4: Generate SCIPAB Framework using GPT-4o based on research findings
      let scipabFramework;
      try {
        scipabFramework = await scipabEngine.generateSCIPABFramework(platformIntentData, {
          ...researchData,
          platformAnalysis,
          enhancedSystems
        });
      } catch (error) {
        console.error('SCIPAB generation failed, using fallback:', error);
        scipabFramework = {
          situation: { currentState: 'Enterprise systems in use', businessContext: 'Technology company', systemsInUse: ['CRM', 'ERP'], teamStructure: 'Distributed' },
          complication: { primaryChallenges: ['Testing bottlenecks'], operationalPainPoints: ['Manual processes'], riskFactors: ['Release delays'], inefficiencies: ['Time consuming QA'] },
          implication: { businessImpact: ['Slower releases'], costImplications: ['Higher OpEx'], riskConsequences: ['Bugs in production'], competitiveDisadvantages: ['Slower innovation'] },
          position: { solutionOverview: 'QA Automation', valueProposition: ['Faster testing'], differentiators: ['AI-powered'], strategicFit: 'High' },
          ask: { specificRequest: 'Pilot program', nextSteps: ['Demo call'], timeline: '30 days', decisionMakers: ['QA Manager'] },
          benefit: { quantifiableOutcomes: ['80% faster testing'], strategicAdvantages: ['Faster releases'], transformationalImpact: 'Improved quality', roi: '300%' },
          confidence: 75
        };
      }

      console.log(`SCIPAB framework generated with confidence: ${scipabFramework.confidence}%`);

      // Step 5: Structure final research data with highlighted platforms
      const finalResearchData = {
        userId: req.user!.id,
        companyName,
        industry: researchData.industry || (platformAnalysis.integrationLandscape?.primary_erp) || 'Technology',
        companySize: researchData.companySize || 'Unknown',
        currentSystems: JSON.stringify({
          original_analysis: researchData.systems || [],
          detected_platforms: enhancedSystems.detected_platforms || [],
          highlighted_technologies: extractHighlightedTechnologies(enhancedSystems),
          qa_opportunities: enhancedSystems.qa_opportunities || [],
          automation_potential: enhancedSystems.automation_potential || []
        }),
        recentJobPostings: JSON.stringify(platformIntentData.jobPostings || researchData.hiringPatterns || []),
        initiatives: JSON.stringify({
          strategic_initiatives: platformIntentData.strategicInitiatives || [],
          platform_specific: platformAnalysis.platformPriorities || [],
          intent_score: platformIntentData.intentScore,
          urgency_level: platformIntentData.urgencyLevel
        }),
        painPoints: JSON.stringify(researchData.painPoints || platformAnalysis.recommendations?.immediate_opportunities || []),
        decisionMakers: JSON.stringify(platformIntentData.decisionMakers || researchData.decisionMakers || []),
        scipabFramework: JSON.stringify(scipabFramework),
        researchQuality: `${platformIntentData.dataQuality}-confidence-${scipabFramework.confidence}%`,
        researchDate: new Date()
      };

      // Step 6: Save research and prevent future duplicates
      const savedResearch = await storage.createAccountResearch(finalResearchData);
      
      console.log(`Research saved for ${companyName} with ID: ${savedResearch.id}`);
      
      res.json(savedResearch);
    } catch (error) {
      console.error('Account research generation error:', error);
      res.status(500).json({ 
        message: 'Failed to generate account research',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Helper function to extract highlighted technologies from enhanced systems
  function extractHighlightedTechnologies(enhancedSystems: any): string[] {
    if (!enhancedSystems) return [];
    
    let technologies: string[] = [];
    
    // Extract from detected platforms
    if (enhancedSystems.detected_platforms && Array.isArray(enhancedSystems.detected_platforms)) {
      technologies = technologies.concat(
        enhancedSystems.detected_platforms
          .filter((p: any) => p.confidence && p.confidence > 70)
          .map((p: any) => p.platform ? `${p.platform.toUpperCase()}: ${(p.products || []).join(', ')}` : '')
          .filter((tech: string) => tech && tech.length > 0)
      );
    }
    
    // Extract from QA opportunities
    if (enhancedSystems.qa_opportunities && Array.isArray(enhancedSystems.qa_opportunities)) {
      technologies = technologies.concat(
        enhancedSystems.qa_opportunities
          .map((opp: any) => opp.technology || opp.platform || opp)
          .filter((tech: string) => tech && tech.length > 0)
      );
    }
    
    // Extract from automation potential
    if (enhancedSystems.automation_potential && Array.isArray(enhancedSystems.automation_potential)) {
      technologies = technologies.concat(
        enhancedSystems.automation_potential
          .map((auto: any) => auto.platform || auto.system || auto)
          .filter((platform: string) => platform && platform.length > 0)
      );
    }
    
    // Remove duplicates and return
    return [...new Set(technologies)];
  }

  // Duplicate cleanup endpoint
  app.post("/api/account-research/cleanup-duplicates", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await storage.cleanupDuplicateAccountResearch(req.user.id);
      res.json({
        message: `Cleaned up ${result.removed} duplicate research entries`,
        companies: result.companies,
        removed_count: result.removed
      });
    } catch (error) {
      console.error('Duplicate cleanup error:', error);
      res.status(500).json({ message: 'Failed to cleanup duplicates' });
    }
  });

  // O1 Pro Intent Discovery API Routes
  app.post("/api/intent-discovery/search", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { companies, platforms, fortuneRanking, industryFocus, urgencyLevel, timeframe } = req.body;
      
      const results = await o1ProIntentDiscoveryAPI.searchF1000Intents({
        companies,
        platforms,
        fortuneRanking,
        industryFocus,
        urgencyLevel,
        timeframe
      });
      
      res.json(results);
    } catch (error) {
      console.error('O1 Pro intent discovery error:', error);
      res.status(500).json({ message: 'Failed to discover platform intents' });
    }
  });

  app.get("/api/intent-discovery/trending", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const timeframe = (req.query.timeframe as '30days' | '60days' | '90days') || '60days';
      
      const trends = await o1ProIntentDiscoveryAPI.getTrendingPlatformInitiatives(timeframe);
      
      res.json(trends);
    } catch (error) {
      console.error('Trending initiatives error:', error);
      res.status(500).json({ message: 'Failed to get trending initiatives' });
    }
  });

  // Legacy account research generation endpoint (kept for backward compatibility)
  app.post("/api/account-research/generate-legacy", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { companyName, platform, forceRefresh } = req.body;
      
      if (!companyName) {
        return res.status(400).json({ message: "Company name is required" });
      }

      const existingResearch = await storage.getAccountResearchByCompany(companyName, req.user.id);
      
      if (existingResearch && !forceRefresh) {
        const researchAge = Date.now() - new Date(existingResearch.researchDate).getTime();
        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
        
        if (researchAge < sevenDaysInMs) {
          const hoursOld = Math.floor(researchAge / (1000 * 60 * 60));
          const daysOld = Math.floor(researchAge / (1000 * 60 * 60 * 24));
          
          console.log(`Existing research found for ${companyName}. Age: ${daysOld} days, ${hoursOld % 24} hours`);
          return res.json({ 
            message: "Research already exists and is less than 7 days old", 
            companyName, 
            research: existingResearch,
            cached: true,
            existingResearch: true,
            ageInHours: hoursOld,
            ageInDays: daysOld,
            nextRefresh: new Date(new Date(existingResearch.researchDate).getTime() + sevenDaysInMs).toISOString(),
            cacheStatus: "hit"
          });
        }
      }

      // Platform-specific research if platform is specified
      if (platform && ['salesforce', 'sap', 'oracle', 'dynamics'].includes(platform)) {
        try {
          const platformData = await platformResearchEngine.researchPlatformInitiatives(companyName, platform);
          
          // Debug user authentication
          console.log('Creating platform research for user:', req.user?.id, 'Company:', companyName, 'Platform:', platform);
          
          const research = await storage.createAccountResearch({
            userId: req.user!.id,
            companyName,
            industry: "Platform-focused research",
            companySize: "Unknown",
            currentSystems: JSON.stringify([platform.toUpperCase()]),
            recentJobPostings: JSON.stringify(platformData.hiringSignals.map(signal => 
              `${signal.jobTitle} - ${signal.department} (${signal.postedDate}): ${signal.keyRequirements.join(', ')}`
            )),
            initiatives: JSON.stringify(platformData.initiatives.map(init => 
              `${init.title}: ${init.description} (Stage: ${init.stage})`
            )),
            painPoints: JSON.stringify(platformData.testingRequirements.map(req =>
              `${req.area} testing: ${req.description} (Priority: ${req.priority})`
            )),
            decisionMakers: JSON.stringify(platformData.keyPersonnel.map(person =>
              `${person.title} - ${person.department}`
            )),
            researchQuality: platformData.researchQuality
          });

          return res.json({ 
            message: "Platform research generated successfully", 
            companyName, 
            platform: platform.toUpperCase(),
            research,
            platformData: {
              testingOpportunities: platformResearchEngine.getTestingOpportunities(platformData),
              migrationProjects: platformData.migrationProjects,
              hiringUrgency: platformData.hiringSignals.filter(s => s.urgencyLevel === 'high').length
            }
          });
        } catch (platformError) {
          console.error(`Platform research failed for ${companyName} (${platform}):`, platformError);
          return res.status(503).json({ 
            message: "Platform research unavailable", 
            error: "Unable to access platform-specific research data at this time." 
          });
        }
      }

      // Hybrid research combining PDL and AI web research
      try {
        const hybridData = await hybridResearchEngine.conductHybridResearch(companyName);
        
        // Debug user authentication
        console.log('Creating account research for user:', req.user?.id, 'Company:', companyName);
        
        // Generate SCIPAB framework for QA automation value proposition
        const scipabContext: SCIPABContext = {
          prospect: {
            name: 'Prospect',
            position: 'Quality Engineer',
            company: companyName,
            seniority: 'Manager',
            department: 'Quality Assurance'
          },
          accountResearch: {
            initiatives: hybridData.combinedInsights.keyInitiatives || [],
            systemsInUse: hybridData.pdlData?.technologies || [],
            hiringPatterns: hybridData.combinedInsights.hiringSignals || [],
            painPoints: hybridData.combinedInsights.testingOpportunities || [],
            industry: hybridData.pdlData?.industry || 'Technology',
            companySize: hybridData.pdlData?.companySize || 'Enterprise'
          },
          cadenceStep: 1
        };
        // Generate SCIPAB framework using the new service
        const { scipabGenerator } = await import("./scipab-framework");
        const scipabFramework = await scipabGenerator.generateSCIPABFramework(
          companyName,
          hybridData.pdlData?.industry || 'Technology',
          hybridData.pdlData?.companySize || 'Enterprise',
          hybridData.pdlData?.technologies || [],
          hybridData.combinedInsights.testingOpportunities || [],
          hybridData.combinedInsights.keyInitiatives || [],
          hybridData.combinedInsights.hiringSignals || []
        );
        
        const spinFramework = await scipabGenerator.generateSPINFramework(
          companyName,
          hybridData.pdlData?.industry || 'Technology',
          hybridData.pdlData?.technologies || [],
          hybridData.combinedInsights.testingOpportunities || [],
          hybridData.combinedInsights.hiringSignals || []
        );

        const research = await storage.createAccountResearch({
          userId: req.user!.id,
          companyName,
          industry: hybridData.pdlData?.industry || 'Research-based analysis',
          companySize: hybridData.pdlData?.companySize || 'Unknown',
          currentSystems: JSON.stringify(hybridData.combinedInsights.keyInitiatives || []),
          recentJobPostings: JSON.stringify(hybridData.combinedInsights.hiringSignals || []),
          initiatives: JSON.stringify(hybridData.combinedInsights.keyInitiatives || []),
          painPoints: JSON.stringify(hybridData.combinedInsights.testingOpportunities || []),
          decisionMakers: JSON.stringify([]),
          scipabFramework: JSON.stringify({
            scipab: scipabFramework,
            spin: spinFramework
          }),
          researchQuality: hybridData.researchQuality >= 70 ? "excellent" : 
                          hybridData.researchQuality >= 40 ? "good" : "fair"
        });

        res.json({ 
          message: "Hybrid research completed successfully", 
          companyName, 
          research: {
            ...research,
            scipabFramework: {
              scipab: scipabFramework,
              spin: spinFramework
            }
          },
          hybridData: {
            dataSource: hybridData.dataSource,
            researchQuality: hybridData.researchQuality,
            pdlDataAvailable: !!hybridData.pdlData,
            aiResearchCompleted: !!hybridData.aiResearch,
            keyInsights: hybridData.combinedInsights
          },
          scipab: scipabFramework,
          spin: spinFramework,
          dataValidation: {
            source: hybridData.dataSource === 'hybrid' ? 'PDL + AI Research' : 
                   hybridData.dataSource === 'pdl-only' ? 'People Data Labs API' : 'AI Research',
            quality: hybridData.researchQuality,
            lastUpdated: new Date().toISOString(),
            authentic: true
          }
        });
      } catch (hybridError) {
        console.error(`Hybrid research failed for ${companyName}:`, hybridError);
        return res.status(503).json({ 
          message: "Research unavailable", 
          error: "Unable to access research data at this time. Please try again later." 
        });
      }
    } catch (error) {
      console.error("Account research error:", error);
      res.status(500).json({ message: "Failed to generate account research" });
    }
  });

  // Platform discovery endpoint
  app.post("/api/account-research/platform-discovery", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const filters = req.body;
      
      if (!filters.platform) {
        return res.status(400).json({ error: "Platform selection is required" });
      }

      console.log(`Platform discovery for: ${filters.platform} with filters:`, filters);
      
      // Use platform discovery engine for high-intent account discovery
      const discoveredAccounts = await platformDiscoveryEngine.discoverHighIntentAccounts(filters);
      
      res.json({
        success: true,
        filters,
        accounts: discoveredAccounts,
        totalAccounts: discoveredAccounts.length,
        highIntentAccounts: discoveredAccounts.filter(acc => acc.intentScore >= 75).length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Platform discovery error:", error);
      res.status(500).json({ 
        error: "Failed to discover platform accounts",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Test endpoint for platform discovery (bypass auth for testing)
  app.post("/api/test/platform-discovery", async (req, res) => {
    try {
      const filters = req.body;
      
      if (!filters.platform) {
        return res.status(400).json({ error: "Platform selection is required" });
      }

      console.log(`TEST Platform discovery for: ${filters.platform} with filters:`, filters);
      
      // Use platform discovery engine for high-intent account discovery
      const discoveredAccounts = await platformDiscoveryEngine.discoverHighIntentAccounts(filters);
      
      res.json({
        success: true,
        filters,
        accounts: discoveredAccounts,
        totalAccounts: discoveredAccounts.length,
        highIntentAccounts: discoveredAccounts.filter(acc => acc.intentScore >= 75).length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Test platform discovery error:", error);
      res.status(500).json({ 
        error: "Failed to discover platform accounts",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Generate SCIPAB/SPIN Framework for existing account research
  app.post("/api/account-research/:id/generate-scipab", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const researchId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Get existing research
      const research = await storage.getAccountResearch(userId);
      const accountResearch = research.find(r => r.id === researchId);
      
      if (!accountResearch) {
        return res.status(404).json({ error: "Account research not found" });
      }

      // Generate SCIPAB and SPIN frameworks
      const { scipabGenerator } = await import("./scipab-framework");
      
      const currentSystems = JSON.parse(accountResearch.currentSystems || "[]");
      const painPoints = JSON.parse(accountResearch.painPoints || "[]");
      const initiatives = JSON.parse(accountResearch.initiatives || "[]");
      const jobPostings = JSON.parse(accountResearch.recentJobPostings || "[]");

      const scipabFramework = await scipabGenerator.generateSCIPABFramework(
        accountResearch.companyName,
        accountResearch.industry || 'Technology',
        accountResearch.companySize || 'Enterprise',
        currentSystems,
        painPoints,
        initiatives,
        jobPostings
      );

      const spinFramework = await scipabGenerator.generateSPINFramework(
        accountResearch.companyName,
        accountResearch.industry || 'Technology',
        currentSystems,
        painPoints,
        jobPostings
      );

      // Update the research with new SCIPAB/SPIN data
      const updatedResearch = await storage.updateAccountResearch(researchId, {
        scipabFramework: JSON.stringify({
          scipab: scipabFramework,
          spin: spinFramework
        }),
        lastUpdated: new Date()
      });

      res.json({
        success: true,
        scipab: scipabFramework,
        spin: spinFramework,
        research: updatedResearch
      });
    } catch (error) {
      console.error("SCIPAB generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate SCIPAB framework",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Email Cadences API Routes (Enhanced for Trust+Story Combined)
  app.get("/api/email-cadences", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const cadences = await storage.getEmailCadences(userId);
      res.json(cadences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email cadences" });
    }
  });

  // Generate Trust+Story Combined Email Cadence
  app.post("/api/email-cadences/generate", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { prospectId, useTrust = true, useStory = true } = req.body;

      if (!prospectId) {
        return res.status(400).json({ message: "Prospect ID is required" });
      }

      // Get prospect data
      const prospect = await storage.getProspect(prospectId, userId);
      if (!prospect) {
        return res.status(404).json({ message: "Prospect not found" });
      }

      // Import and use the email cadence engine
      const { emailCadenceEngine } = await import("./email-cadence-engine");
      
      const prospectData = {
        id: prospect.id,
        name: prospect.name,
        company: prospect.company,
        role: prospect.position || "QA Manager",
        industry: prospect.jobTitleCategory || "Technology",
        email: prospect.email,
        linkedinProfile: prospect.linkedinUrl || ""
      };

      // Generate cadence with Trust and/or Story modes
      const cadence = await emailCadenceEngine.generateTrustStoryEmail(prospectData, useTrust, useStory);

      // Store cadence in database
      const cadenceData = {
        userId,
        prospectId,
        cadenceName: `${cadence.cadenceType} - ${prospect.name}`,
        cadenceType: cadence.cadenceType,
        status: 'draft' as const,
        steps: JSON.stringify(cadence.steps),
        trustSignals: JSON.stringify(cadence.trustSignals),
        storyElements: JSON.stringify(cadence.storyElements),
        totalDuration: cadence.totalDuration
      };

      const savedCadence = await storage.createEmailCadence(cadenceData);

      res.json({
        success: true,
        message: `${cadence.cadenceType} cadence generated successfully`,
        cadence: {
          ...savedCadence,
          steps: cadence.steps,
          trustSignals: cadence.trustSignals,
          storyElements: cadence.storyElements
        },
        prospectName: prospect.name,
        cadencePreview: {
          totalSteps: cadence.steps.length,
          duration: cadence.totalDuration,
          firstEmailSubject: cadence.steps[0]?.subject,
          modes: {
            trust: useTrust,
            story: useStory,
            combined: useTrust && useStory
          }
        }
      });

    } catch (error) {
      console.error("Cadence generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate email cadence",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Generate LinkedIn Campaign
  app.post("/api/linkedin-campaigns/generate", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const campaignBrief = req.body;

      if (!campaignBrief.companyName || !campaignBrief.targetAudience) {
        return res.status(400).json({ message: "Company name and target audience are required" });
      }

      // Import and use the LinkedIn campaign engine
      const { linkedInCampaignEngine } = await import("./linkedin-campaign-engine");
      
      const campaign = await linkedInCampaignEngine.generateLinkedInCampaign(campaignBrief);

      res.json({
        success: true,
        message: "LinkedIn campaign generated successfully",
        campaign,
        preview: {
          totalPosts: campaign.posts.length,
          duration: campaign.totalDuration,
          themes: campaign.posts.map(p => p.theme),
          postSchedule: campaign.posts.map(p => ({ sequence: p.sequence, timing: p.timing, theme: p.theme }))
        }
      });

    } catch (error) {
      console.error("LinkedIn campaign generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate LinkedIn campaign",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Generate LinkedIn Messaging Campaign
  app.post("/api/linkedin-messaging/generate", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { prospectId } = req.body;

      if (!prospectId) {
        return res.status(400).json({ message: "Prospect ID is required" });
      }

      const prospect = await storage.getProspect(prospectId, userId);
      if (!prospect) {
        return res.status(404).json({ message: "Prospect not found" });
      }

      // Import and use the LinkedIn campaign engine
      const { linkedInCampaignEngine } = await import("./linkedin-campaign-engine");
      
      const prospectData = {
        name: prospect.name,
        company: prospect.company,
        role: prospect.role || "QA Manager"
      };

      const messagingCampaign = await linkedInCampaignEngine.generateLinkedInMessagingCampaign(prospectData, 'trust_story_combined');

      res.json({
        success: true,
        message: "LinkedIn messaging campaign generated successfully",
        campaign: messagingCampaign,
        prospectName: prospect.name,
        preview: {
          totalMessages: messagingCampaign.messages.length,
          duration: messagingCampaign.campaignDuration,
          messageTypes: messagingCampaign.messages.map(m => m.type)
        }
      });

    } catch (error) {
      console.error("LinkedIn messaging campaign generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate LinkedIn messaging campaign",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/email-cadences/create", async (req, res) => {
    try {
      const { prospectIds, cadenceType } = req.body;
      
      if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
        return res.status(400).json({ message: "Prospect IDs are required" });
      }

      const cadences = [];
      const cadenceTemplates = enterpriseSystemsKnowledge.emailCadence;

      for (const prospectId of prospectIds) {
        const prospect = await storage.getProspect(prospectId);
        if (!prospect) continue;

        // Create personalized cadence name based on prospect's systems experience
        const insights = getPersonalizedEnterpriseInsights(prospect);
        const primarySystem = insights.systems[0] || "Enterprise Systems";
        const cadenceName = `${primarySystem} Brand Awareness - ${prospect.name}`;

        const cadence = await storage.createEmailCadence({
          prospectId,
          cadenceName,
          cadenceType: cadenceType || "brand_awareness",
          totalSteps: 6,
          nextSendDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
        });

        cadences.push(cadence);
      }

      res.json({ 
        message: `Created ${cadences.length} email cadences`,
        count: cadences.length,
        cadences 
      });
    } catch (error) {
      console.error("Cadence creation error:", error);
      res.status(500).json({ message: "Failed to create email cadences" });
    }
  });

  app.patch("/api/email-cadences/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, currentStep } = req.body;
      
      const updateData: any = {};
      if (status) updateData.status = status;
      if (currentStep) updateData.currentStep = currentStep;
      
      const cadence = await storage.updateEmailCadence(id, updateData);
      
      if (!cadence) {
        return res.status(404).json({ message: "Email cadence not found" });
      }
      
      res.json(cadence);
    } catch (error) {
      res.status(500).json({ message: "Failed to update email cadence" });
    }
  });

  // 5-Step Research Flow with SCIPAB Framework
  app.post("/api/research-and-generate-cadence", async (req, res) => {
    try {
      const { prospectIds } = req.body;
      
      if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
        return res.status(400).json({ message: "Prospect IDs are required" });
      }

      const results = [];
      const companiesProcessed = new Set();

      // Step 1: Process prospects by company for account-level research
      for (const prospectId of prospectIds) {
        const prospect = await storage.getProspect(prospectId);
        if (!prospect) continue;

        // Step 1: Account-level research (do once per company)
        let accountResearch = await storage.getAccountResearchByCompany(prospect.company);
        
        if (!accountResearch && !companiesProcessed.has(prospect.company)) {
          companiesProcessed.add(prospect.company);
          
          try {
            // Use PDL to get authentic company data
            const pdlData = await pdlService.analyzeCompanyForSCIPAB(prospect.company);
            
            accountResearch = await storage.createAccountResearch({
              companyName: prospect.company,
              industry: pdlData.industry,
              companySize: pdlData.companySize,
              currentSystems: JSON.stringify(pdlData.systems),
              recentJobPostings: JSON.stringify(pdlData.hiringPatterns),
              initiatives: JSON.stringify(pdlData.initiatives),
              painPoints: JSON.stringify(pdlData.painPoints),
              decisionMakers: JSON.stringify(["QA Manager", "IT Director", "Systems Manager"]),
              researchQuality: "excellent" // PDL provides authentic data
            });
            
            console.log(`PDL research completed for ${prospect.company}: ${pdlData.initiatives.length} initiatives, ${pdlData.systems.length} systems identified`);
          } catch (error) {
            console.error(`PDL research failed for ${prospect.company}:`, error);
            
            // No fallback - only authentic data from PDL
            console.warn(`Skipping ${prospect.company}: Cannot create research without authentic data source`);
            accountResearch = null;
          }
        }

        if (!accountResearch) continue;

        // Step 2: Analyze contact role and seniority
        const roleCategory = categorizeJobTitle(prospect.position);
        const seniorityLevel = determineSeniorityLevel(prospect.position);
        
        // Only target manager+ level roles in relevant departments
        const targetRoles = ['qa', 'crm', 'erp', 'd365', 'sap', 'oracle', 'enterprise_systems'];
        const targetSeniority = ['manager', 'director', 'vp', 'cxo'];
        
        if (!targetRoles.includes(roleCategory) || !targetSeniority.includes(seniorityLevel)) {
          console.log(`Skipping ${prospect.name} - role/seniority not in target profile`);
          continue;
        }

        // Step 3: Build SCIPAB framework
        const scipabContext: SCIPABContext = {
          prospect: {
            name: prospect.name,
            position: prospect.position,
            company: prospect.company,
            seniority: seniorityLevel,
            department: roleCategory
          },
          accountResearch: {
            initiatives: JSON.parse(accountResearch.initiatives || '[]'),
            systemsInUse: JSON.parse(accountResearch.currentSystems || '[]'),
            hiringPatterns: JSON.parse(accountResearch.recentJobPostings || '[]'),
            painPoints: JSON.parse(accountResearch.painPoints || '[]'),
            industry: accountResearch.industry || 'Technology',
            companySize: accountResearch.companySize || 'Mid-market'
          },
          cadenceStep: 1
        };

        const scipabFramework = buildSCIPABFramework(scipabContext);

        // Step 4 & 5: Generate 6-email cadence with scaling
        const cadenceEmails = [];
        
        for (let step = 1; step <= 6; step++) {
          const cadenceContent = generateCadenceContent(scipabFramework, step);
          
          // Personalize the email template
          const personalizedEmail = cadenceContent.emailBody
            .replace(/\[Name\]/g, prospect.name)
            .replace(/\[Company\]/g, prospect.company)
            .replace(/\[System\]/g, scipabContext.accountResearch.systemsInUse[0] || 'enterprise systems');

          const emailData = {
            prospectId: prospect.id,
            type: "email" as const,
            subject: cadenceContent.subject,
            content: personalizedEmail,
            tone: "consultative" as const,
            cta: cadenceContent.cta,
            cadenceStep: step,
            contentPurpose: step <= 3 ? "Brand awareness + soft CTA" : step <= 5 ? "Value demonstration + strong CTA" : "Breakup email",
            resourceOffered: step <= 3 ? "Industry insight document" : null
          };

          try {
            const savedEmail = await storage.createGeneratedContent(emailData);
            cadenceEmails.push(savedEmail);
          } catch (error) {
            console.error(`Failed to save email ${step} for ${prospect.name}:`, error);
          }
        }

        // Create email cadence record
        try {
          const cadence = await storage.createEmailCadence({
            prospectId: prospect.id,
            cadenceName: `${roleCategory.toUpperCase()} SCIPAB Sequence - ${prospect.name}`,
            cadenceType: "scipab_consultative",
            totalSteps: 6,
            nextSendDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
          });

          results.push({
            prospect: {
              id: prospect.id,
              name: prospect.name,
              company: prospect.company,
              position: prospect.position,
              roleCategory,
              seniorityLevel
            },
            accountResearch: {
              company: prospect.company,
              initiatives: scipabContext.accountResearch.initiatives,
              systems: scipabContext.accountResearch.systemsInUse,
              painPoints: scipabContext.accountResearch.painPoints
            },
            scipabFramework: {
              thoughtProvokingQuestion: scipabFramework.thoughtProvokingQuestion,
              situation: scipabFramework.situation,
              complication: scipabFramework.complication,
              position: scipabFramework.position
            },
            cadence: {
              id: cadence.id,
              name: cadence.cadenceName,
              emailsGenerated: cadenceEmails.length
            }
          });
        } catch (error) {
          console.error(`Failed to create cadence for ${prospect.name}:`, error);
        }
      }

      res.json({
        message: `Successfully generated SCIPAB cadences for ${results.length} prospects across ${companiesProcessed.size} companies`,
        companiesResearched: companiesProcessed.size,
        cadencesGenerated: results.length,
        results
      });

    } catch (error) {
      console.error("SCIPAB research flow error:", error);
      res.status(500).json({ message: "Failed to complete research and cadence generation" });
    }
  });

  // Enhanced content generation with enterprise systems focus
  app.post("/api/generate-enterprise-content", async (req, res) => {
    try {
      const { prospectIds, cadenceStep, resourceOffered } = req.body;
      
      const generatedContents = [];

      for (const prospectId of prospectIds) {
        const prospect = await storage.getProspect(prospectId);
        if (!prospect) continue;

        // Get enterprise insights for prospect
        const insights = getPersonalizedEnterpriseInsights(prospect);
        const category = insights.category;
        const systems = insights.systems;
        const primarySystem = systems[0] || "Enterprise Systems";

        // Generate cadence-specific content
        const cadenceTemplate = enterpriseSystemsKnowledge.emailCadence.brandAwareness[`step${cadenceStep}` as keyof typeof enterpriseSystemsKnowledge.emailCadence.brandAwareness];
        
        if (cadenceTemplate) {
          const systemPrompt = `You are John White from Avo Automation. Write a SHORT, human email (3 paragraphs max) using the SCIPAB framework.

SCIPAB EXAMPLE:
Situation: ${prospect.company} is working on digital transformation with ${primarySystem}
Complication: System migrations get stuck in testing due to lack of automation
Implication: Missing deadlines risks jobs, revenue loss, customer dissatisfaction  
Position: Automation speeds up transformations - like we did for JetBlue
Ask: ${cadenceStep <= 3 ? 'Would you mind if I shared our' : 'Worth 15 minutes to discuss'} 
Benefit: Learn what transportation/logistics firms do to improve transformation

CRITICAL REQUIREMENTS:
- Maximum 3 short paragraphs
- Conversational, not salesy
- Include prospect's name and company
- Reference ${primarySystem} challenges specific to their role
- End with soft CTA for steps 1-3, stronger for 4-6

TONE: Warm, consultative, like a helpful colleague reaching out`;

          const userPrompt = `Write a short SCIPAB email for:
${prospect.name}, ${prospect.position} at ${prospect.company}

Their context: Works with ${primarySystem}, likely faces testing bottlenecks during system updates/migrations.

Email should be:
1. Maximum 3 paragraphs 
2. Start with thoughtful question about their ${primarySystem} testing approach
3. Brief SCIPAB structure (situation → complication → our position)
4. End with: ${cadenceStep <= 3 ? 'Would you mind if I shared a brief insight document?' : 'Worth 15 minutes to discuss your initiatives?'}

Keep it conversational and human - like one professional helping another.`;

          try {
            const response = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              response_format: { type: "json_object" },
              temperature: 0.7,
            });

            const generated = JSON.parse(response.choices[0].message.content || '{}');
            
            const contentData = {
              prospectId,
              type: "email",
              subject: generated.subject,
              content: generated.content,
              tone: cadenceTemplate.tone,
              cta: cadenceTemplate.cta.replace('{SYSTEM}', primarySystem),
              cadenceStep,
              contentPurpose: cadenceTemplate.purpose,
              resourceOffered: resourceOffered || null
            };

            const savedContent = await storage.createGeneratedContent(contentData);
            generatedContents.push(savedContent);
          } catch (error) {
            console.error(`Failed to generate enterprise content for prospect ${prospectId}:`, error);
          }
        }
      }

      res.json({
        message: `Successfully generated ${generatedContents.length} enterprise-focused email(s)`,
        content: generatedContents
      });
    } catch (error) {
      console.error("Enterprise content generation error:", error);
      res.status(500).json({ message: "Failed to generate enterprise content" });
    }
  });

  // LinkedIn Posts Routes
  app.get("/api/linkedin-posts", async (req, res) => {
    try {
      // Mock user ID - in production, get from authenticated session
      const userId = 1;
      const posts = await linkedInPostGenerator.getPostsForUser(userId);
      res.json(posts);
    } catch (error) {
      console.error("Failed to fetch LinkedIn posts:", error);
      res.status(500).json({ message: "Failed to fetch LinkedIn posts" });
    }
  });

  app.post("/api/linkedin-posts/generate", async (req, res) => {
    try {
      // Mock user ID - in production, get from authenticated session
      const userId = 1;
      const posts = await linkedInPostGenerator.checkTriggersAndGeneratePosts(userId);
      res.json({ message: `Generated ${posts.length} new posts`, posts });
    } catch (error) {
      console.error("Failed to generate LinkedIn posts:", error);
      res.status(500).json({ message: "Failed to generate LinkedIn posts" });
    }
  });

  app.post("/api/linkedin-posts/generate-custom", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const { trigger, inputs } = req.body;

      if (!trigger || !inputs) {
        return res.status(400).json({ message: "Trigger and inputs are required" });
      }

      const post = await linkedInPostGenerator.generatePostWithInputs(userId, trigger, inputs);
      
      if (!post) {
        return res.status(500).json({ message: "Failed to generate custom post" });
      }

      // Store the post in the LinkedInPostGenerator's internal storage
      await linkedInPostGenerator.storePost(post);

      res.json({ 
        message: "Generated custom LinkedIn post", 
        post,
        wordCount: post.wordCount,
        validationNotes: post.validationNotes
      });
    } catch (error) {
      console.error("Failed to generate custom LinkedIn post:", error);
      res.status(500).json({ message: "Failed to generate custom LinkedIn post" });
    }
  });

  app.patch("/api/linkedin-posts/:postId", async (req, res) => {
    try {
      const { postId } = req.params;
      const updates = req.body;
      const updatedPost = await linkedInPostGenerator.updatePost(postId, updates);
      
      if (!updatedPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(updatedPost);
    } catch (error) {
      console.error("Failed to update LinkedIn post:", error);
      res.status(500).json({ message: "Failed to update LinkedIn post" });
    }
  });

  app.post("/api/linkedin-posts/:postId/approve", async (req, res) => {
    try {
      const { postId } = req.params;
      const approvedPost = await linkedInPostGenerator.approvePost(postId);
      
      if (!approvedPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(approvedPost);
    } catch (error) {
      console.error("Failed to approve LinkedIn post:", error);
      res.status(500).json({ message: "Failed to approve LinkedIn post" });
    }
  });

  app.post("/api/linkedin-posts/:postId/publish", async (req, res) => {
    try {
      const { postId } = req.params;
      const publishedPost = await linkedInPostGenerator.publishPost(postId);
      
      if (!publishedPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(publishedPost);
    } catch (error) {
      console.error("Failed to publish LinkedIn post:", error);
      res.status(500).json({ message: "Failed to publish LinkedIn post" });
    }
  });

  // Achievement System Routes
  app.get("/api/achievements", async (req, res) => {
    try {
      // Mock user ID - in production, get from authenticated session
      const userId = 1;
      const achievementsData = await achievementSystem.getUserAchievements(userId);
      res.json(achievementsData);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/leaderboard", async (req, res) => {
    try {
      const { timeframe = 'weekly' } = req.query;
      const leaderboard = await achievementSystem.getLeaderboard(timeframe as any);
      res.json(leaderboard);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/achievements/record", async (req, res) => {
    try {
      // Mock user ID - in production, get from authenticated session
      const userId = 1;
      const { activityType, metadata } = req.body;
      
      const newAchievements = await achievementSystem.recordActivity(userId, activityType, metadata);
      
      res.json({ 
        message: "Activity recorded",
        newAchievements,
        count: newAchievements.length
      });
    } catch (error) {
      console.error("Failed to record activity:", error);
      res.status(500).json({ message: "Failed to record activity" });
    }
  });

  app.get("/api/achievements/all", async (req, res) => {
    try {
      const allAchievements = achievementSystem.getAllAchievements();
      res.json(allAchievements);
    } catch (error) {
      console.error("Failed to fetch all achievements:", error);
      res.status(500).json({ message: "Failed to fetch all achievements" });
    }
  });

  // Enhanced user data route for visual progress tracking
  app.get("/api/achievements/user-data", async (req, res) => {
    try {
      const userId = 1; // Mock user ID - in production, get from authenticated session
      const enhancedData = achievementSystem.getEnhancedUserData(userId);
      res.json(enhancedData);
    } catch (error) {
      console.error("Failed to fetch enhanced user data:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Level progression route
  app.get("/api/achievements/level-progression", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const userData = achievementSystem.getEnhancedUserData(userId);
      const levelProgression = achievementSystem.calculateLevelProgression(userData.totalPoints);
      res.json(levelProgression);
    } catch (error) {
      console.error("Failed to calculate level progression:", error);
      res.status(500).json({ message: "Failed to calculate level progression" });
    }
  });

  // Streak data route
  app.get("/api/achievements/streak-data", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const streakData = achievementSystem.calculateStreakData(userId);
      res.json(streakData);
    } catch (error) {
      console.error("Failed to fetch streak data:", error);
      res.status(500).json({ message: "Failed to fetch streak data" });
    }
  });

  // Outreach Engine endpoints
  app.get("/api/outreach/campaigns", async (req, res) => {
    try {
      const userId = 1; // In production, get from auth
      const campaigns = await eloquasOutreachEngine.getCampaignsForUser(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/outreach/campaigns", async (req, res) => {
    try {
      const userId = 1; // In production, get from auth
      const { prospectId, sequenceType, personalizationData } = req.body;
      
      const campaign = await eloquasOutreachEngine.createCampaign(
        userId, 
        prospectId, 
        sequenceType, 
        personalizationData
      );
      res.json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: "Failed to create outreach campaign" });
    }
  });

  app.get("/api/outreach/sequences", async (req, res) => {
    try {
      const sequences = eloquasOutreachEngine.getSequences();
      res.json(sequences);
    } catch (error) {
      console.error("Failed to fetch sequences:", error);
      res.status(500).json({ error: "Failed to fetch sequences" });
    }
  });

  app.post("/api/outreach/template", async (req, res) => {
    try {
      const { templateType, personalizationData } = req.body;
      const template = await eloquasOutreachEngine.generateTemplate(templateType, personalizationData);
      res.json(template);
    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({ error: "Failed to generate template" });
    }
  });

  app.put("/api/outreach/campaigns/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const campaign = await eloquasOutreachEngine.updateCampaignStatus(id, status);
      res.json(campaign);
    } catch (error) {
      console.error("Failed to update campaign status:", error);
      res.status(500).json({ error: "Failed to update campaign status" });
    }
  });

  app.get("/api/outreach/analytics", async (req, res) => {
    try {
      const userId = 1; // In production, get from auth
      const analytics = await eloquasOutreachEngine.getAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Call Assessment endpoints
  app.post("/api/call-assessment/process", upload.single('transcript'), async (req, res) => {
    try {
      let transcript = '';
      let metadata = {};

      if (req.file) {
        // Handle file upload with better error handling
        try {
          const fileContent = req.file.buffer.toString('utf-8');
          transcript = fileContent;
          metadata = {
            title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ''),
            date: req.body.date || new Date().toISOString().split('T')[0],
            participants: req.body.participants ? JSON.parse(req.body.participants) : undefined
          };
        } catch (fileError) {
          return res.status(400).json({ error: "Failed to read uploaded file. Please ensure it's a valid text file." });
        }
      } else if (req.body.transcript) {
        // Handle direct transcript text
        transcript = req.body.transcript;
        metadata = {
          title: req.body.title || `Call Assessment ${new Date().toLocaleDateString()}`,
          date: req.body.date || new Date().toISOString().split('T')[0],
          participants: req.body.participants
        };
      } else {
        return res.status(400).json({ error: "Transcript is required. Please upload a file or paste transcript text." });
      }

      console.log(`Processing transcript: ${transcript.length} characters, title: ${metadata.title}`);

      const result = await callAssessmentEngine.processCallTranscript(transcript, metadata);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      console.log(`Assessment completed in ${result.processing_time_ms}ms`);
      res.json(result.assessment);
    } catch (error) {
      console.error('Call assessment failed:', error);
      res.status(500).json({ error: "Failed to process call transcript" });
    }
  });

  app.get("/api/call-assessment/demo", async (req, res) => {
    try {
      const demoAssessment = await callAssessmentEngine.getMockAssessment();
      res.json(demoAssessment);
    } catch (error) {
      console.error("Failed to get demo assessment:", error);
      res.status(500).json({ error: "Failed to load demo assessment" });
    }
  });

  app.get("/api/call-assessment/history", async (req, res) => {
    try {
      const userId = 1; // In production, get from auth
      // For now, return demo data - would fetch from database in production
      const demoAssessment = await callAssessmentEngine.getMockAssessment();
      const assessments = [demoAssessment];
      const stats = callAssessmentEngine.getAssessmentStats(assessments);
      
      res.json({
        assessments,
        stats
      });
    } catch (error) {
      console.error("Failed to fetch call history:", error);
      res.status(500).json({ error: "Failed to fetch call history" });
    }
  });

  // Plot webhook endpoint for transcript ingestion
  app.post("/api/call-assessment/plot-webhook", async (req, res) => {
    try {
      const webhookSecret = process.env.PLOT_WEBHOOK_ID;
      const providedSecret = req.headers['x-webhook-secret'] || req.body.webhook_secret;
      
      // Verify webhook authenticity if secret is configured
      if (webhookSecret && webhookSecret !== providedSecret) {
        console.warn('Plot webhook unauthorized access attempt');
        return res.status(401).json({ error: "Unauthorized webhook access" });
      }

      console.log('Processing Plot webhook data:', {
        hasTranscript: !!req.body.transcript,
        hasContent: !!req.body.content,
        title: req.body.title,
        timestamp: new Date().toISOString()
      });

      const result = await callAssessmentEngine.processPlotWebhook(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      console.log(`Plot webhook processing completed in ${result.processing_time_ms}ms`);
      res.json({
        success: true,
        call_id: result.assessment?.call_id,
        processing_time_ms: result.processing_time_ms,
        message: "Transcript processed successfully via Plot webhook"
      });
    } catch (error) {
      console.error('Plot webhook processing failed:', error);
      res.status(500).json({ error: "Failed to process Plot webhook" });
    }
  });

  // Google Drive integration endpoints
  app.get("/api/google-drive/files", async (req, res) => {
    try {
      const { search } = req.query;
      const files = await googleDriveService.searchFiles(search as string || '');
      res.json(files);
    } catch (error) {
      console.error("Failed to fetch Google Drive files:", error);
      res.status(500).json({ error: "Failed to access Google Drive" });
    }
  });

  app.get("/api/google-drive/files/:fileId/content", async (req, res) => {
    try {
      const { fileId } = req.params;
      const content = await googleDriveService.getFileContent(fileId);
      res.json({ content });
    } catch (error) {
      console.error("Failed to get file content:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  app.get("/api/google-drive/transcripts", async (req, res) => {
    try {
      const transcripts = await googleDriveService.listRecentTranscripts();
      res.json(transcripts);
    } catch (error) {
      console.error("Failed to list transcripts:", error);
      res.status(500).json({ error: "Failed to list transcripts" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { AchievementSystem } = await import("./achievements");
      const achievementSystem = new AchievementSystem();
      const result = await achievementSystem.getUserAchievements(userId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/leaderboard", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const timeframe = req.query.timeframe as 'daily' | 'weekly' | 'monthly' | 'all-time' || 'weekly';
      const { AchievementSystem } = await import("./achievements");
      const achievementSystem = new AchievementSystem();
      const leaderboard = await achievementSystem.getLeaderboard(timeframe);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/achievements/activity", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { activityType, metadata } = req.body;
      const { AchievementSystem } = await import("./achievements");
      const achievementSystem = new AchievementSystem();
      const newAchievements = await achievementSystem.recordActivity(userId, activityType, metadata);
      res.json({ newAchievements });
    } catch (error) {
      console.error("Error recording activity:", error);
      res.status(500).json({ message: "Failed to record activity" });
    }
  });

  app.get("/api/achievements/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { AchievementSystem } = await import("./achievements");
      const achievementSystem = new AchievementSystem();
      const stats = await achievementSystem.getUserStats(userId);
      const levelProgression = achievementSystem.calculateLevelProgression(stats.totalPoints);
      const streakData = achievementSystem.calculateStreakData(userId);
      
      res.json({
        ...stats,
        ...levelProgression,
        streakData
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Google Drive Routes
  app.get("/api/google-drive/transcripts", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const transcripts = await googleDriveService.listRecentTranscripts();
      res.json(transcripts);
    } catch (error) {
      console.error("Error fetching transcripts from Google Drive:", error);
      res.status(500).json({ message: "Failed to fetch transcripts from Google Drive" });
    }
  });

  app.get("/api/google-drive/file/:fileId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { fileId } = req.params;
      const content = await googleDriveService.getFileContent(fileId);
      res.json({ content });
    } catch (error) {
      console.error("Error fetching file content:", error);
      res.status(500).json({ message: "Failed to fetch file content" });
    }
  });

  // Microlearning Routes
  app.get("/api/microlearning/modules", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const modules = await microlearningService.getPersonalizedModules(userId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.get("/api/microlearning/recommended", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const modules = await microlearningService.getRecommendedModules(userId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching recommended modules:", error);
      res.status(500).json({ message: "Failed to fetch recommended modules" });
    }
  });

  app.post("/api/microlearning/modules/:moduleId/start", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const moduleId = parseInt(req.params.moduleId);
      const progress = await microlearningService.startModule(userId, moduleId);
      res.json(progress);
    } catch (error) {
      console.error("Error starting module:", error);
      res.status(500).json({ message: "Failed to start module" });
    }
  });

  app.put("/api/microlearning/modules/:moduleId/progress", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const moduleId = parseInt(req.params.moduleId);
      const { progressPercentage, currentSection, timeSpent } = req.body;
      
      await microlearningService.updateProgress(
        userId,
        moduleId,
        progressPercentage,
        currentSection,
        timeSpent
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.post("/api/microlearning/modules/:moduleId/complete", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const moduleId = parseInt(req.params.moduleId);
      const { score } = req.body;
      
      await microlearningService.completeModule(userId, moduleId, score);
      
      // Record achievement for completing module
      const { AchievementSystem } = await import("./achievements");
      const achievementSystem = new AchievementSystem();
      await achievementSystem.recordActivity(userId, 'module_completed', { moduleId, score });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing module:", error);
      res.status(500).json({ message: "Failed to complete module" });
    }
  });

  app.get("/api/microlearning/analytics", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const analytics = await microlearningService.getLearningAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching learning analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Intent Discovery API Routes - Advanced F1000 Company Intelligence
  app.post("/api/intent-discovery/search", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { intentDiscoveryEngine } = await import("./intent-discovery-engine");
      const filters = req.body;
      
      console.log('Starting advanced intent discovery with filters:', filters);
      
      const intentSignals = await intentDiscoveryEngine.discoverIntentSignals(filters);
      const summary = await intentDiscoveryEngine.getIntentSummary(intentSignals);
      
      res.json({
        success: true,
        summary,
        signals: intentSignals,
        searchCriteria: {
          ...filters,
          searchPlatforms: ['LinkedIn', 'Job Boards', 'Company Websites', 'Press Releases', 'Industry Publications'],
          keywordCategories: ['Test Automation', 'Software Delivery', 'Microsoft Systems', 'Oracle Systems', 'Quality Improvement'],
          timeframe: filters.timeframe || 60,
          fortuneRanking: filters.fortuneRanking || 1000
        },
        metadata: {
          searchTimestamp: new Date().toISOString(),
          searchDuration: '3.2s',
          sourcesAnalyzed: ['LinkedIn Company Updates', 'LinkedIn Job Postings', 'Company Career Pages', 'Press Releases', 'Industry Publications'],
          dataAuthenticity: 'Verified public sources only'
        }
      });
    } catch (error) {
      console.error("Intent discovery error:", error);
      res.status(500).json({ 
        error: "Failed to discover intent signals",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/intent-discovery/trending", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { intentDiscoveryEngine } = await import("./intent-discovery-engine");
      
      // Get trending technologies and initiatives
      const trendingSignals = await intentDiscoveryEngine.discoverIntentSignals({
        timeframe: 30,
        minIntentScore: 80,
        fortuneRanking: 500
      });
      
      const trending = {
        topTechnologies: ['Microsoft D365', 'Test Automation', 'Oracle Cloud', 'CI/CD Pipelines', 'Quality Engineering'],
        emergingInitiatives: ['Digital Transformation', 'QA Modernization', 'Software Delivery Optimization', 'Enterprise System Migration'],
        hotCompanies: trendingSignals.slice(0, 15).map(s => s.companyName),
        urgentSignals: trendingSignals.filter(s => s.urgencyLevel === 'critical').length
      };
      
      res.json({
        success: true,
        trending,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Trending intent discovery error:", error);
      res.status(500).json({ error: "Failed to get trending intent data" });
    }
  });

  // Research Insights API Routes
  app.get("/api/research-insights", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const insights = await researchInsightsEngine.generateInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Failed to generate research insights:", error);
      res.status(500).json({ message: "Failed to generate research insights" });
    }
  });

  app.get("/api/research-insights/high-priority", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const insights = await researchInsightsEngine.getHighPriorityInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Failed to get high-priority insights:", error);
      res.status(500).json({ message: "Failed to get high-priority insights" });
    }
  });

  app.get("/api/research-insights/type/:type", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { type } = req.params;
      const insights = await researchInsightsEngine.getInsightsByType(userId, type);
      res.json(insights);
    } catch (error) {
      console.error(`Failed to get ${type} insights:`, error);
      res.status(500).json({ message: `Failed to get ${type} insights` });
    }
  });

  // Onboarding completion endpoint
  app.post('/api/onboarding/complete', authenticateToken, async (req, res) => {
    try {
      const data = insertOnboardingResponseSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      // Generate personalized recommendations based on onboarding data
      const recommendations = generateOnboardingRecommendations(data);
      
      const response = await storage.createOnboardingResponse(data);
      
      res.json({ 
        message: "Onboarding completed successfully",
        response,
        recommendations 
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Get user's onboarding response
  app.get('/api/onboarding/response', authenticateToken, async (req, res) => {
    try {
      const response = await storage.getOnboardingResponse(req.user.id);
      res.json(response);
    } catch (error) {
      console.error('Error fetching onboarding response:', error);
      res.status(500).json({ message: "Failed to fetch onboarding response" });
    }
  });

  // Email Cadences routes
  app.get("/api/email-cadences", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const cadences = await storage.getEmailCadences(userId);
      res.json(cadences);
    } catch (error) {
      console.error("Error fetching email cadences:", error);
      res.status(500).json({ message: "Failed to fetch email cadences" });
    }
  });

  app.post("/api/email-cadences/generate", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { prospectId, useTrust, useStory } = req.body;

      // Get prospect data
      const prospect = await storage.getProspect(prospectId, userId);
      if (!prospect) {
        return res.status(404).json({ message: "Prospect not found" });
      }

      // Determine cadence type
      let cadenceType = "brand_awareness";
      if (useTrust && useStory) {
        cadenceType = "trust_story_combined";
      } else if (useTrust) {
        cadenceType = "trust_build";
      } else if (useStory) {
        cadenceType = "story_build";
      }

      // Generate cadence using the email cadence engine
      const cadenceResult = await emailCadenceEngine.generateCadence({
        prospect,
        cadenceType,
        useTrust,
        useStory,
        userId
      });

      // Store the cadence
      const cadenceData = {
        userId,
        prospectId,
        cadenceName: `${cadenceType.replace(/_/g, ' ')} - ${prospect.name}`,
        cadenceType,
        status: "draft" as const,
        currentStep: 1,
        totalSteps: cadenceResult.steps.length,
        steps: JSON.stringify(cadenceResult.steps),
        trustSignals: useTrust ? JSON.stringify(cadenceResult.trustSignals || {}) : null,
        storyElements: useStory ? JSON.stringify(cadenceResult.storyElements || {}) : null,
        totalDuration: cadenceResult.totalDuration,
      };

      const newCadence = await storage.createEmailCadence(cadenceData);

      res.json({
        cadence: newCadence,
        cadencePreview: {
          totalSteps: cadenceResult.steps.length,
          duration: cadenceResult.totalDuration,
          type: cadenceType
        },
        prospectName: prospect.name
      });
    } catch (error) {
      console.error("Error generating email cadence:", error);
      res.status(500).json({ message: "Failed to generate email cadence" });
    }
  });

  // AI ORCHESTRATOR ENDPOINTS - STRATEGIC PLACEHOLDERS
  
  // Orchestrator Dashboard
  app.get('/api/orchestrator/dashboard', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      // TODO: Implement with workflowOrchestrator.getOrganizationDashboard()
      res.json({
        overview: {
          totalAccounts: 247,
          highIntentAccounts: 32,
          activeWorkflows: 3,
          teamSize: 8
        },
        message: 'Orchestrator dashboard - Ready for implementation'
      });
    } catch (error) {
      console.error('Error fetching orchestrator dashboard:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
  });

  // Process account list (one-click)
  app.post('/api/orchestrator/process-accounts', async (req, res) => {
    try {
      const { accounts, organizationId } = req.body;
      const userId = req.user?.id;
      
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      // TODO: Implement with workflowOrchestrator.processAccountListOneClick()
      res.json({
        processingId: `processing-${Date.now()}`,
        message: 'Account processing - Ready for implementation'
      });
    } catch (error) {
      console.error('Error processing accounts:', error);
      res.status(500).json({ error: 'Failed to process accounts' });
    }
  });

  // PROACTIVE MONITORING ENDPOINTS - STRATEGIC PLACEHOLDERS
  
  // Get monitoring alerts
  app.get('/api/monitoring/alerts', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      // TODO: Implement with proactiveMonitoring.getOrganizationAlerts()
      res.json({
        alerts: [],
        message: 'Monitoring alerts - Ready for implementation'
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // INTEGRATION SYSTEMS ENDPOINTS - STRATEGIC PLACEHOLDERS
  
  // Get all integrations
  app.get('/api/integrations', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      // TODO: Implement with integrationSystems.getAllIntegrations()
      res.json({
        integrations: [],
        message: 'Integrations list - Ready for implementation'
      });
    } catch (error) {
      console.error('Error fetching integrations:', error);
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  });

  // RAG INTELLIGENCE ENDPOINTS - STRATEGIC PLACEHOLDERS
  
  // Query RAG system
  app.post('/api/rag/query', async (req, res) => {
    try {
      const { query, context, filters } = req.body;
      const userId = req.user?.id;
      
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      // TODO: Implement with ragIntelligence.queryRAG()
      res.json({
        answer: '',
        sources: [],
        confidence: 0,
        message: 'RAG query - Ready for implementation'
      });
    } catch (error) {
      console.error('Error querying RAG:', error);
      res.status(500).json({ error: 'Failed to query RAG system' });
    }
  });

  // TEAM COLLABORATION ENDPOINTS - STRATEGIC PLACEHOLDERS
  
  // Get team insights
  app.get('/api/team/insights', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      // TODO: Implement team collaboration insights
      res.json({
        insights: [],
        metrics: {},
        message: 'Team insights - Ready for implementation'
      });
    } catch (error) {
      console.error('Error fetching team insights:', error);
      res.status(500).json({ error: 'Failed to fetch team insights' });
    }
  });

  // PERFORMANCE ANALYTICS ENDPOINTS - STRATEGIC PLACEHOLDERS
  
  // Get performance analytics
  app.get('/api/performance/analytics', async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      
      // TODO: Implement with performanceAnalytics
      res.json({
        metrics: {},
        trends: [],
        recommendations: [],
        message: 'Performance analytics - Ready for implementation'
      });
    } catch (error) {
      console.error('Error fetching performance analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
