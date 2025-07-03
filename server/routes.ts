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
import { avoKnowledgeBase, qaMarketIntelligence, getPersonalizedAvoInsights } from "./avo-knowledge";
import { enterpriseSystemsKnowledge, categorizeJobTitle, determineSeniorityLevel, identifySystemsExperience, getPersonalizedEnterpriseInsights } from "./enterprise-knowledge";
import { buildSCIPABFramework, generateCadenceContent, type SCIPABContext } from "./scipab-framework";
import { pdlService } from "./pdl-service";

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
  app.get("/api/account-research", async (req, res) => {
    try {
      const research = await storage.getAccountResearch();
      res.json(research);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account research" });
    }
  });

  // Get account research by company name
  app.get("/api/account-research/:companyName", async (req, res) => {
    try {
      const { companyName } = req.params;
      const research = await storage.getAccountResearchByCompany(decodeURIComponent(companyName));
      
      if (!research) {
        return res.status(404).json({ message: "No research found for this company" });
      }
      
      res.json(research);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account research" });
    }
  });

  app.post("/api/account-research/generate", async (req, res) => {
    try {
      const { companyName } = req.body;
      
      if (!companyName) {
        return res.status(400).json({ message: "Company name is required" });
      }

      // Enhanced AI-powered account research using enterprise knowledge
      const researchPrompt = `Generate comprehensive account research for ${companyName}. Focus on enterprise systems, QA automation opportunities, and decision makers.

Research Requirements:
1. Current enterprise systems (D365, SAP, Oracle, Salesforce, etc.)
2. Recent job postings for QA, IT systems, enterprise applications roles
3. Technology initiatives and system migrations
4. Key decision makers in IT, QA, and enterprise systems
5. Pain points related to software testing and quality assurance

Provide structured JSON response with:
{
  "currentSystems": ["system1", "system2"],
  "recentJobPostings": ["QA Manager - focus on test automation", "D365 Administrator - seeking testing expertise"],
  "initiatives": ["SAP S/4HANA migration", "Quality assurance modernization"],
  "painPoints": ["Manual testing bottlenecks", "Integration testing challenges"],
  "decisionMakers": ["IT Director", "QA Manager", "Enterprise Systems Manager"],
  "industry": "Manufacturing/Healthcare/Finance",
  "companySize": "Mid-market (500-2000 employees)",
  "researchQuality": "excellent"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are a B2B research analyst specializing in enterprise systems and QA automation. Generate detailed, actionable research for ${companyName} focusing on software testing and enterprise systems opportunities.` 
          },
          { role: "user", content: researchPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const researchData = JSON.parse(response.choices[0].message.content || '{}');
      
      const research = await storage.createAccountResearch({
        companyName,
        industry: researchData.industry || null,
        companySize: researchData.companySize || null,
        currentSystems: JSON.stringify(researchData.currentSystems || []),
        recentJobPostings: JSON.stringify(researchData.recentJobPostings || []),
        initiatives: JSON.stringify(researchData.initiatives || []),
        painPoints: JSON.stringify(researchData.painPoints || []),
        decisionMakers: JSON.stringify(researchData.decisionMakers || []),
        researchQuality: researchData.researchQuality || "good"
      });

      res.json({ message: "Account research generated successfully", companyName, research });
    } catch (error) {
      console.error("Account research error:", error);
      res.status(500).json({ message: "Failed to generate account research" });
    }
  });

  // Email Cadences API Routes
  app.get("/api/email-cadences", async (req, res) => {
    try {
      const cadences = await storage.getEmailCadences();
      res.json(cadences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email cadences" });
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
            
            // Fallback to limited research if PDL fails
            accountResearch = await storage.createAccountResearch({
              companyName: prospect.company,
              industry: "Technology",
              companySize: "Mid-market",
              currentSystems: JSON.stringify(["Enterprise systems"]),
              recentJobPostings: JSON.stringify(["QA and systems roles"]),
              initiatives: JSON.stringify(["System modernization", "Quality improvement"]),
              painPoints: JSON.stringify(["Manual testing bottlenecks", "Integration complexity"]),
              decisionMakers: JSON.stringify(["QA Manager", "IT Director", "Systems Manager"]),
              researchQuality: "limited"
            });
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

  const httpServer = createServer(app);
  return httpServer;
}
