# ProspectCopy & Eloquas AI - Dual Platform Repository

## Project Overview
This repository contains two complementary platforms:

1. **ProspectCopy:** A comprehensive business communication automation platform that leverages AI to generate personalized email and LinkedIn outreach content for sales and marketing professionals, with specialized focus on enterprise systems and QA automation.

2. **Eloquas AI:** A P2P outbound intelligence platform for AEs and BDRs in enterprise sales, featuring secure multi-user login, RBAC, proactive data agents, TrustScore/StoryScore systems, and automated job signal detection.

**Current State:** Both platforms operational - ProspectCopy with enhanced Avo Automation knowledge base and PostgreSQL database; Eloquas AI with Flask backend, user authentication, and signal detection system.

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
- ✅ **Mobile-First Responsive Design (January 2025):** Complete mobile optimization for Eloquas AI Flask platform
  - Responsive navigation with hamburger menu for screens ≤600px
  - Mobile card views replacing tables on small devices
  - Touch-friendly UI with 48x48px minimum touch targets
  - Stacked layouts for TrustBuild™/StoryBuild™ toggles and forms
  - Optimized for fast loading on 3G networks
  - LinkedIn OAuth integration preserved on mobile devices

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
✅ **TrustBuild™ and StoryBuild™ Enhancement Modes (January 2025):** Advanced email personalization
- TrustBuild™: Trust-based email anchoring using LinkedIn profiles and shared connections
  - Finds common ground: shared companies, schools, interests
  - Generates consultative, give-first email openings
  - Integrates with LinkedIn OAuth for enhanced personalization
  - Gracefully handles dummy LinkedIn credentials with mock profile generation
  - Fallback to "Soft Intro" when no trust anchors found
- StoryBuild™: Hero's Journey narrative email sequences
  - 6-7 step email cadence using storytelling framework
  - Steps: Hero Introduction, Challenge, Guide Appears, Fork in Road, Happy Path, Victory
  - Each email 100-125 words focused on transformation narrative
  - Executive outcome language: system stability, faster releases, lower OpEx
- Combined Mode: Merges trust anchoring with storytelling for maximum impact
- UI Implementation: Toggle switches in compose email interface
- Real-time sequence generation and preview
- Status indicators showing active modes and email step numbers
- Mobile-responsive design with stacked toggles for screens ≤600px
- Bug fixes: Corrected parameter handling in trust_story_builder.py and emailer.py

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

✅ **Real Company News Integration (January 2025):** Authentic news sources with actual links
- Implemented real news database with company-specific articles from trusted sources
- United Airlines: SAP S/4HANA migration, Salesforce CRM implementation, digital transformation
- General Electric: Microsoft Azure IoT partnership, Oracle Cloud ERP implementation
- JPMorgan Chase: AWS cloud migration, Dynamics 365 operations automation
- Default news: Forbes, Gartner Research, Computer Weekly for enterprise systems trends
- All articles include real URLs, publication dates, and relevant QA/enterprise signals
- Clickable headlines and source links that open in new tabs

✅ **Animated Company Insights Dashboard (January 2025):** Dynamic visualization with smooth transitions
- Created CompanyInsightsDashboard component with Framer Motion animations
- Overall metrics: Total companies, researched companies, high intent accounts, research coverage
- Company-specific metrics: Total contacts, Manager+ count, target coverage, research status
- Animated number transitions with spring physics
- Progress bars with smooth width animations
- Rotating live insights with 3-second intervals
- Card hover effects with scale transforms
- Gradient overlays and modern card designs matching Avo branding

## Eloquas AI Platform (January 2025)

✅ **Backend Infrastructure:** Complete Flask-based P2P outbound intelligence system
- Multi-user authentication with email/password login and session management
- Role-based access control (RBAC) with Admin, AE, and BDR roles
- Secure data isolation - users only see their own prospects and data
- JSON-based database storage simulating Replit DB functionality

✅ **Proactive Signal Engine:** Automated job board monitoring for intent signals
- Daily job scraper monitoring F1000 company career pages via RSS feeds
- Keyword matching for: SAP, Oracle, Dynamics 365, QA, Test Automation, Quality Engineering
- Signal scoring system (0-1) based on keyword relevance and match quality
- Deduplication using hash-based unique identifiers

✅ **TrustScore & StoryScore System:** AI-powered email quality scoring
- TrustScore (0-100): Composite of relationship (25%), intent freshness (25%), story quality (20%), deliverability (15%), engagement (15%)
- StoryScore (0-20): GPT-4o integration for emotional pull, personalization, and clarity assessment
- Real-time scoring API endpoints for instant feedback

✅ **Email Engine with Deliverability:** Advanced email composition and sending
- Spintax support for variation: {hello|hi|hey} syntax
- Built-in spam score checking with deliverability guardrails
- Email queue management with rate limiting (45-90 seconds between sends)
- Template library for QA and SAP signals with personalized variations

✅ **SMS Alerts via Twilio:** Daily signal digest notifications
- Automated daily SMS alerts for new job signals
- Company-grouped signal summaries
- Integration ready for Twilio API (environment variables supported)

✅ **User Interface:** Complete Jinja2 template system
- Registration and login flows
- Dashboard with stats grid, recent signals, and prospect management
- CSV upload for bulk prospect import
- Email composition interface with real-time TrustScore display
- Admin panel for user management
- Responsive design with modern CSS styling

## Technical Notes
- Uses database storage for persistence
- AI system validates Avo Automation representation in all content
- Supports CSV and Excel file uploads with flexible mapping
- Export functionality for campaign management
- Responsive design with dark mode support