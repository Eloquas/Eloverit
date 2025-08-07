import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { intentDiscoveryService } from "./intent-discovery";
import { insertAccountSchema, insertContactSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all accounts
  app.get('/api/accounts', async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
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

  // Intent discovery endpoint
  app.post('/api/discover-intent', async (req, res) => {
    try {
      const { query, systems, isAuto } = req.body;
      
      if (!query || !systems || !Array.isArray(systems)) {
        return res.status(400).json({ 
          message: "Missing required fields: query and systems array" 
        });
      }
      
      console.log(`Starting intent discovery for: ${query}`);
      
      const accounts = await intentDiscoveryService.discoverHighIntentAccounts(
        query, 
        systems, 
        isAuto || false
      );
      
      res.json({ accounts, message: `Discovered ${accounts.length} accounts` });
      
    } catch (error) {
      console.error("Intent discovery error:", error);
      res.status(500).json({ 
        message: error.message || "Intent discovery failed" 
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
        message: error.message || "Contact identification failed" 
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