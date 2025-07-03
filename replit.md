# ProspectCopy - AI-Powered Business Communication Automation

## Project Overview
A comprehensive business communication automation platform that leverages AI to generate personalized email and LinkedIn outreach content for sales and marketing professionals, with specialized focus on enterprise systems and QA automation.

**Current State:** Enhanced with Avo Automation knowledge base, PostgreSQL database, advanced tone selection, and comprehensive content management system.

## User Preferences
- **Communication Style:** Clear, actionable updates without excessive technical jargon
- **Focus Areas:** Enterprise systems (D365, SAP, Oracle, ERP, CRM), QA automation, brand awareness campaigns
- **Content Strategy:** 6-email cadence starting with brand awareness, ending with strong CTA
- **Target Roles:** Manager+ level positions in QA, CRM, ERP, D365, SAP, Oracle, enterprise systems

## Recent Changes (Last Updated: January 2025)
- ✅ **Enhanced AI System:** Integrated comprehensive Avo Automation knowledge base with specific QA metrics (80% testing time reduction, 60% faster releases, 40% fewer bugs)
- ✅ **Advanced Tone Selection:** 10 AI-powered tone options with prospect-based recommendations
- ✅ **Loading Indicators:** Fixed UX with proper loading states and progress notifications
- ✅ **Content Management:** Added dedicated page for viewing, searching, and exporting all generated content
- ✅ **Database Integration:** PostgreSQL with proper schema for prospects and generated content
- ✅ **Enterprise Systems Targeting:** Job title categorization (QA, CRM, ERP, D365, SAP, Oracle) with manager+ level focus
- ✅ **Account Research System:** AI-powered research for job postings, initiatives, and system migrations
- ✅ **Email Cadence Management:** 6-email brand awareness sequences with system-specific messaging
- ✅ **Enhanced Navigation:** Proper routing for Account Research and Email Cadences pages
- ✅ **ICP Alignment:** Strong support, non-line item pricing, 30% cost advantage, AI-enabled, ease of use messaging

## Project Architecture
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **AI Integration:** OpenAI GPT-4o for content generation
- **Routing:** Wouter for client-side navigation
- **State Management:** TanStack Query for server state

## Key Features
1. **Prospect Management:** Upload and manage prospect lists with flexible field mapping
2. **AI Content Generation:** Personalized email and LinkedIn messages with company-specific knowledge
3. **Tone Intelligence:** Smart tone recommendations based on prospect roles and industries
4. **Content Library:** Comprehensive view, search, and export capabilities
5. **Brand Awareness Focus:** Specialized for enterprise systems audience with educational content approach

## Latest Implementation (January 2025)
✅ **5-Step SCIPAB Research Flow:** Complete implementation of consultative sales framework
- Step 1: Account-level research for SDLC, testing, QA, SAP, D365, Oracle initiatives  
- Step 2: Role analysis targeting Manager+ in QA, Business Systems, Enterprise Systems
- Step 3: SCIPAB framework (Situation, Complication, Implication, Position, Ask, Benefit)
- Step 4: 6-email cadence generation (soft CTAs → strong CTAs → breakup)
- Step 5: Scaling across contacts within same company before new accounts

✅ **Team-Friendly Interface:** Simple dashboard with SCIPAB generator for easy team usage

✅ **UI Improvements (Latest):** Clean, card-based interface with account grouping
- Account tree structure grouping contacts by company
- Manager+ role highlighting and targeting
- Short, human-like emails (3 paragraphs max)
- Simplified header navigation
- Card-based SCIPAB generator with progress tracking

## Technical Notes
- Uses database storage for persistence
- AI system validates Avo Automation representation in all content
- Supports CSV and Excel file uploads with flexible mapping
- Export functionality for campaign management
- Responsive design with dark mode support