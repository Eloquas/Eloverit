import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProspectSchema, contentGenerationSchema, csvUploadSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all prospects
  app.get("/api/prospects", async (req, res) => {
    try {
      const { search } = req.query;
      let prospects;
      
      if (search && typeof search === "string") {
        prospects = await storage.searchProspects(search);
      } else {
        prospects = await storage.getProspects();
      }
      
      res.json(prospects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prospects" });
    }
  });

  // Get single prospect
  app.get("/api/prospects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prospect = await storage.getProspect(id);
      
      if (!prospect) {
        return res.status(404).json({ message: "Prospect not found" });
      }
      
      res.json(prospect);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prospect" });
    }
  });

  // Create single prospect
  app.post("/api/prospects", async (req, res) => {
    try {
      const validatedData = insertProspectSchema.parse(req.body);
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

  // Upload CSV prospects
  app.post("/api/prospects/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const prospects: any[] = [];
      const stream = Readable.from(req.file.buffer.toString());
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data) => prospects.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      // Validate each prospect - handle Apollo.io format
      const validatedProspects = prospects.map((prospect, index) => {
        try {
          // Handle Apollo.io CSV format
          const firstName = prospect['First Name'] || prospect.firstName || prospect.name || prospect.Name;
          const lastName = prospect['Last Name'] || prospect.lastName || '';
          const fullName = lastName ? `${firstName} ${lastName}` : firstName;
          
          return csvUploadSchema.parse({
            name: fullName,
            email: prospect.Email || prospect.email,
            company: prospect.Company || prospect['Company Name for Emails'] || prospect.company,
            position: prospect.Title || prospect.position || prospect.Position,
            additionalInfo: prospect.Industry || prospect.Keywords || prospect.additionalInfo || prospect['Additional Info'] || prospect.notes || prospect.Notes || ''
          });
        } catch (error) {
          throw new Error(`Invalid data for prospect at row ${index + 2}: Missing required fields (name, email, company, or position)`);
        }
      });

      const createdProspects = await storage.createProspects(validatedProspects);
      res.status(201).json({ 
        message: `Successfully uploaded ${createdProspects.length} prospects`,
        prospects: createdProspects
      });
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to process CSV file"
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

        // Create personalized prompt based on prospect data
        const systemPrompt = `You are an expert sales copywriter. Generate personalized ${type === 'email' ? 'email' : 'LinkedIn message'} copy that is ${tone} in tone.

Requirements:
- Personalize the message using the prospect's information
- Include the specified call to action
- Keep it concise and engaging
- Make it feel natural and not overly salesy
- ${type === 'email' ? 'Include a compelling subject line' : 'Keep it under 300 characters for LinkedIn'}

Respond with JSON in this format:
{
  ${type === 'email' ? '"subject": "email subject line",' : ''}
  "content": "the ${type} message content"
}`;

        const userPrompt = `Generate a ${tone} ${type} message for this prospect:

Name: ${prospect.name}
Company: ${prospect.company}
Position: ${prospect.position}
Email: ${prospect.email}
${prospect.additionalInfo ? `Additional Info: ${prospect.additionalInfo}` : ''}

Call to Action: ${cta}
${context ? `Additional Context: ${context}` : ''}`;

        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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

  const httpServer = createServer(app);
  return httpServer;
}
