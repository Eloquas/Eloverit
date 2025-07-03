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
- Enhanced badge styling with light blue backgrounds for better readability

✅ **Data Validation (January 2025):** PDL Integration for authentic company insights
- People Data Labs API integration for real company data
- Authentic job postings, technology stacks, and hiring patterns
- Industry classification and company size verification
- Replaces generic knowledge base with verified information
- PDL data validation indicators in UI
- Enhanced system detection (Salesforce CRM, SAP ERP, Oracle Database, etc.)
- Industry-specific initiatives (e.g., airline operational efficiency)

✅ **Company Detail Modal (January 2025):** Complete prospect and content management
- Clickable company names show detailed SCIPAB research overview
- Company-level initiatives, systems, and pain points from PDL data
- Contact-level persona insights based on role, seniority, and industry
- Tree structure for generated email cadences under each contact
- Expandable email sequences showing all 6 generated emails
- Role-based care priorities and pain point analysis

✅ **Avo Automation Design System (January 2025):** Professional enterprise UI overhaul
- Implemented Avo's signature blue (#3B82F6) and purple accent colors
- Professional gradient backgrounds and soft shadows throughout
- Enhanced header with gradient logo icon and pill-shaped navigation
- Avo-inspired card hover effects with subtle transforms and shadows
- Color-coded badges system (blue, green, purple) matching Avo's palette
- Clean, modern spacing and typography following enterprise design standards

✅ **Modern Enterprise SaaS Template Integration (January 2025):** Contemporary dashboard layout
- Glassmorphism effects with backdrop blur and translucent elements
- Modern sidebar navigation with active state indicators and pill-shaped buttons
- Sophisticated header with enhanced search bar and pill-styled action buttons
- Card-based layout with hover animations and scale transforms
- Contemporary color palette with gradient text effects
- Professional shadow system with elevated and soft variations
- Smooth scrolling and custom scrollbar styling matching brand colors

✅ **Data Source Citations & Validation (January 2025):** Enhanced authenticity indicators
- Source citation links added to all research sections (LinkedIn, G2, Glassdoor, Indeed)
- PDL verification badges showing data comes from People Data Labs API
- Data quality score indicator (4/5 stars) with visual representation
- External link icons for easy access to source websites
- Timestamp showing when research was last updated
- Explicit messaging about minimal AI inference
- Clickable source bubbles that open in new tabs for verification

✅ **SCIPAB Brief Integration (January 2025):** Concise QA automation alignment POV
- Added comprehensive SCIPAB brief section in company detail modal
- Each SCIPAB element (Situation, Complication, Implication, Position, Ask, Benefit) limited to 3 sentences
- Dynamic content pulls from actual PDL data (job postings, systems in use, initiatives)
- Focuses specifically on Avo QA automation value proposition
- Uses company-specific data points for personalization (hiring patterns, tech stack)
- Highlights key metrics: 80% testing time reduction, 60% faster releases, 40% fewer bugs
- Professional purple/blue gradient design matching Avo branding

✅ **Company Changes Scanner & Intent Score (January 2025):** Forward-thinking account intelligence
- Recent Changes Scanner highlights QA automation signals: active hiring, testing initiatives, CRM needs
- Real-time analysis of job postings, initiatives, and pain points for QA relevance
- QA Automation Intent Score (0-100) with visual heat map showing account readiness
- Scoring factors: QA hiring activity (40%), testing initiatives (30%), enterprise systems (20%), quality challenges (10%)
- Color-coded indicators: High Intent (75+, green), Medium Intent (50-74, amber), Low Intent (<50, gray)
- Recent Company News section with mock data structure ready for news API integration
- Visual progress bars showing contribution of each factor to overall intent score

## Technical Notes
- Uses database storage for persistence
- AI system validates Avo Automation representation in all content
- Supports CSV and Excel file uploads with flexible mapping
- Export functionality for campaign management
- Responsive design with dark mode support