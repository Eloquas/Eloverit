import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { storage } from "./storage";
import { intentDiscoveryService } from "./intent-discovery";
import { insertAccountSchema, insertContactSchema } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get accounts with SESSION SCOPING for bulletproof isolation
  app.get('/api/accounts', async (req, res) => {
    try {
      const { sessionId } = req.query;
      const accounts = await storage.getAccounts(sessionId as string);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  // Get account by ID
  app.get('/api/accounts/:id', async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = await storage.getAccountById(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json(account);
    } catch (error) {
      console.error("Error fetching account:", error);
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  // DIAGNOSTIC ROUTES for bulletproof debugging
  app.get('/api/intent/_health', async (req, res) => {
    try {
      const model = process.env.INTENT_MODEL || 'o1-pro';
      const testResponse = await openai.chat.completions.create({
        model: 'gpt-4o', // Use simpler model for health check
        messages: [{ role: 'user', content: 'Return JSON with "status": "ok"' }],
        response_format: { type: "json_object" },
        max_tokens: 50
      });
      
      res.json({
        ok: true,
        model: model,
        backupModel: 'gpt-4o',
        tokensUsed: testResponse.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: (error instanceof Error ? error.message : 'Health check failed')
      });
    }
  });

  app.post('/api/intent/_echo', async (req, res) => {
    try {
      const { query, systems } = req.body;
      const model = process.env.INTENT_MODEL || 'o1-pro';
      
      // Build the same prompt that would be used
      const prompt = `Research high-intent companies for: ${systems?.join(', ') || query}
      
Target Systems: ${systems?.join(', ') || 'Not specified'}
Query: ${query || 'Not specified'}

CRITICAL: This is a debugging echo - return minimal JSON response.`;

      res.json({
        prompt: prompt,
        model: model,
        systems: systems,
        query: query,
        timestamp: new Date().toISOString(),
        note: "This is the exact prompt and model that would be used for discovery"
      });
    } catch (error) {
      res.status(500).json({
        error: (error instanceof Error ? error.message : 'Echo failed')
      });
    }
  });

  // Intent discovery endpoint with SESSION SCOPING
  app.post('/api/discover-intent', async (req, res) => {
    try {
      const { query, systems, isAuto } = req.body;
      
      if (!systems || !Array.isArray(systems) || systems.length === 0) {
        return res.status(400).json({ 
          message: "At least one target system must be selected" 
        });
      }
      
      // STEP 1: Create scoped research session for bulletproof isolation
      const sessionId = `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const researchSession = await storage.createResearchSession({
        id: sessionId,
        sessionType: "account_discovery",
        targetSystems: systems,
        status: "running",
        modelUsed: process.env.INTENT_MODEL || 'o1-pro'
      });
      
      console.log(`Starting deep research session ${sessionId} for target systems: ${systems.join(', ')}`);
      
      // STEP 2: Run discovery with session scoping
      const accounts = await intentDiscoveryService.discoverHighIntentAccounts(
        query || systems.join(', '), 
        systems, 
        isAuto || false,
        sessionId  // Pass session ID for account linking
      );
      
      // STEP 3: Update session with final results
      await storage.updateResearchSession(sessionId, {
        status: "completed",
        completedAt: new Date(),
        totalAccounts: accounts.length,
        validatedAccounts: accounts.filter(a => a.isHighIntent).length,
        citationCount: accounts.reduce((total, acc) => total + (acc.citations?.length || 0), 0)
      });
      
      res.json({ 
        accounts, 
        message: `Discovered ${accounts.length} high-intent accounts with verified citations`,
        researchSummary: {
          targetSystems: systems,
          accountsFound: accounts.length,
          highIntentCount: accounts.filter(a => a.isHighIntent).length,
          modelUsed: process.env.INTENT_MODEL || 'o1-pro',
          timestamp: new Date().toISOString()
        },
        // CRITICAL: Return fresh results with session scoping
        freshResults: true,
        sessionId: sessionId  // Frontend will use this for scoped queries
      });
      
    } catch (error) {
      console.error("Intent discovery error:", error);
      res.status(500).json({ 
        message: (error instanceof Error ? error.message : 'Intent discovery failed')
      });
    }
  });

  // Get contacts for an account
  app.get('/api/contacts/:accountId?', async (req, res) => {
    try {
      const accountId = req.params.accountId ? parseInt(req.params.accountId) : null;
      
      if (!accountId) {
        return res.status(400).json({ message: "Account ID is required" });
      }
      
      const contacts = await storage.getContactsByAccountId(accountId);
      res.json(contacts);
      
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Identify contacts for an account
  app.post('/api/accounts/:id/identify-contacts', async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      
      console.log(`Starting contact identification for account ${accountId}`);
      
      const contacts = await intentDiscoveryService.identifyContacts(accountId);
      
      res.json({ 
        contacts, 
        message: `Identified ${contacts.length} contacts (max 20)` 
      });
      
    } catch (error) {
      console.error("Contact identification error:", error);
      res.status(500).json({ 
        message: (error instanceof Error ? error.message : 'Contact identification failed')
      });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'Eloverit.ai Intent Discovery',
      timestamp: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}