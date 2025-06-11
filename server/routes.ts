import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProspectSchema, contentGenerationSchema, csvUploadSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import * as XLSX from "xlsx";

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

  // Upload CSV/Excel prospects
  app.post("/api/prospects/upload", upload.single('file'), async (req, res) => {
    try {
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

      const createdProspects = await storage.createProspects(validatedProspects);
      
      let message = `Successfully uploaded ${createdProspects.length} prospects`;
      if (skippedRows.length > 0) {
        message += `. Skipped ${skippedRows.length} rows due to missing data.`;
      }

      res.status(201).json({ 
        message,
        prospects: createdProspects,
        skipped: skippedRows.length > 0 ? skippedRows : undefined
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

        // Create advanced tone-specific prompt based on prospect data
        const getToneInstructions = (tone: string) => {
          const instructions = {
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

        const systemPrompt = `You are an expert sales copywriter specializing in ${tone} communication. Generate personalized ${type === 'email' ? 'email' : 'LinkedIn message'} copy.

Tone Guidelines for ${tone}: ${getToneInstructions(tone)}

Requirements:
- Personalize using prospect's name, company, and position
- Apply the ${tone} tone consistently throughout
- Include the specified call to action naturally
- Keep it concise and engaging (${type === 'email' ? '150-200 words' : 'under 300 characters'})
- Make it feel authentic and human-written
- ${type === 'email' ? 'Create a compelling subject line that matches the tone' : 'Optimize for LinkedIn mobile viewing'}

Respond with JSON in this format:
{
  ${type === 'email' ? '"subject": "subject line matching the tone",' : ''}
  "content": "the ${type} message content with ${tone} tone"
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

  const httpServer = createServer(app);
  return httpServer;
}
