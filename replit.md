# Eloverit.ai - Precision Sales Intent Engine

## Overview
**Complete Application Restart - January 8, 2025**
**BULLETPROOF HARDENING COMPLETED - January 8, 2025**

Eloverit.ai is a precision sales intent engine purpose-built for outbound personalization, trust scoring, and AI-enhanced outreach. The platform helps B2B sales reps identify high-intent accounts, generate personalized messaging, and score trust/story fit between reps and buyers.

**Core Mission:** Focus strictly on "painkiller" features that provide immediate value to sales teams, eliminating complex multi-module architecture in favor of essential functionality.

**ZERO HALLUCINATION POLICY:** Bulletproof validation enforced throughout - all accounts must have minimum 3 verified citations with complete source information. Any data without sufficient evidence is rejected automatically.

## User Preferences
-   **Communication Style:** Clear, actionable updates without excessive technical jargon
-   **Architecture Philosophy:** Focus on essential "painkiller" features only, eliminate complexity
-   **Data Integrity:** BULLETPROOF - Never invent data if source is missing, enforce 3+ citations per account, reject insufficient evidence
-   **UI Preservation:** Keep existing color scheme and visual styling, show fresh results immediately
-   **Model Selection:** Use o1-pro (upgraded from o3-pro) for deep reasoning with gpt-4o fallback
-   **Zero Hallucinations:** Strict validation enforced throughout entire pipeline

## System Architecture
**New Architecture - Post-Restart (January 8, 2025)**

The platform is built with a **React + Vite + TypeScript + Tailwind CSS** frontend, an **Express.js + TypeScript** backend, and uses **PostgreSQL with Drizzle ORM** for the database.

**Core Unified Modules (To Be Built):**
1. **Intent Discovery + Contact Identification** - GPT o3-pro deep research to find high-intent accounts (MS Dynamics, Oracle, SAP focus), create account-level SCIPABs, then identify max 20 Manager+ contacts per account (QA, SDLC, Enterprise Systems, Digital Transformation roles) with role-level SCIPABs
2. **Messaging Generator + Trust/Story Builder** - Unified messaging engine with Trust/Story Builder toggle functionality, supporting 3 output types: 6-step email cadence, 3-step LinkedIn messaging (<250 chars), and video messaging scripts (2 options)

**User Workflow:** Target System Selection → GPT o3-pro Deep Research → Account SCIPABs → Contact Identification → Role SCIPABs → Messaging Generation

**Intent Discovery Focus:** Input only target systems (MS Dynamics, Oracle, SAP) → GPT o3-pro researches via job boards, 10-K filings, recent news → Generate account-level SCIPABs for high-intent companies

**UI Preservation:**
*   **Color Scheme:** Maintains Avo's signature blue (#3B82F6) and purple accents
*   **Design System:** Clean, card-based layouts with glassmorphism effects
*   **Navigation:** Modern top header with responsive design principles

## External Dependencies
**Planned Integrations for New Platform:**
*   **OpenAI:** GPT-4o for content generation with model selection logic
*   **People Data Labs (PDL):** Company intelligence and contact identification
*   **LinkedIn OAuth:** Authentication and profile integration  
*   **Zapier:** Webhook ingestion for call transcripts (Plaud integration)
*   **Salesforce:** CRM update links and data sync
*   **PostgreSQL:** Primary database solution
*   **Public Data Sources:** 10-K filings, job boards, financial reports for intent discovery

## Recent Critical Improvements (January 8, 2025)

**BULLETPROOF HARDENING COMPLETED:**
1. **Model Upgrade**: Backend now uses `INTENT_MODEL` environment variable (defaults to o1-pro) instead of hardcoded gpt-4o
2. **Citation Enforcement**: Added strict validation requiring minimum 3 verified sources per account with complete source information
3. **Session Scoping**: Added UUID-based research sessions for complete data isolation between discovery runs
4. **Schema Validation**: Implemented comprehensive Zod schema validation with bulletproof data contracts
5. **Fresh Data Pipeline**: Frontend now uses discovery response results immediately with session-scoped queries
6. **Zero Hallucination Policy**: Comprehensive validation rejects accounts without sufficient evidence - no fake data can reach UI
7. **Quality Validation**: Added bulletproof validation methods checking citation quality, evidence strength, and domain availability
8. **Proper Error States**: Added explicit loading, error, and empty states instead of silent fallbacks
9. **Research Session Tracking**: Each discovery run creates isolated results with model tracking and quality metrics
10. **Database Schema Updates**: Added researchSessions and sessionLogs tables with proper relationships
11. **Diagnostic Routes**: Added /api/intent/_health and /api/intent/_echo for system debugging

**Current Status:** ✅ BULLETPROOF SYSTEM FULLY OPERATIONAL ✅

**Live System Verification (January 8, 2025):**
- **Database:** PostgreSQL schema with session_logs table, citations enforcement, session scoping active
- **API Endpoints:** `/api/intent/_health` and `/api/intent/_echo` diagnostic routes operational  
- **Model Configuration:** INTENT_MODEL environment variable supporting o1-pro (default) with gpt-4o fallback
- **Frontend Integration:** React components using fresh data pipeline with health endpoint monitoring
- **Schema Validation:** Bulletproof Zod validation requiring minimum 3 verified citations per account
- **Session Isolation:** UUID-based research sessions preventing data contamination between discovery runs
- **Zero LSP Errors:** All type mismatches resolved, complete schema alignment achieved

**System Ready For:** Intent discovery, contact identification, messaging generation with verified data only.

**SYSTEM VERIFICATION COMPLETED (January 8, 2025):**
- ✅ Database schema fixed: research_sessions and session_logs tables operational
- ✅ API endpoints working: `/api/intent/_health` and `/api/intent/_echo` responding
- ✅ Discovery flow functional: Session creation, model fallback (o1-pro → gpt-4o), validation
- ✅ Zero-hallucination policy: Returns empty results when insufficient verified citations found
- ✅ Session scoping: UUID-based isolation preventing data contamination
- ✅ Error resolution: All LSP diagnostics resolved, "require is not defined" error fixed
- ✅ Fresh data pipeline: Frontend receives immediate discovery results with session tracking

**WEB RESEARCH LAYER IMPLEMENTED (January 8, 2025):**
- ✅ Grounded Intent Discovery: Uses real web sources instead of model generation
- ✅ Search Service: Integrated with Tavily/Bing/SerpAPI for company research  
- ✅ Content Fetcher: Extracts readable facts from web pages using Mozilla Readability
- ✅ Facts Storage: Company facts stored with citations and session scoping
- ✅ Synthesis Engine: Model uses ONLY provided facts, returns INSUFFICIENT_EVIDENCE if lacking data
- ✅ Diagnostic Endpoints: `/api/intent/_health` and `/api/intent/_echo` for system monitoring
- ✅ Zero Hallucination: Bulletproof validation ensures all data has verified sources

**LIVE WEB RESEARCH OPERATIONAL (January 8, 2025):**
- ✅ Search API Key Configured: Real web research now active
- ✅ Content Fetching Optimized: Enhanced error handling for blocked domains and large content
- ✅ First Successful Account Discovery: Nestlé S.A. discovered with authentic web-sourced data
- ✅ Production-Ready Pipeline: Intent discovery processing real company signals from web sources
- ✅ Zero Hallucination Enforced: All data comes from verified web sources with citations

**COMPLETE PIPELINE OPERATIONAL (January 8, 2025):**
- ✅ **Module 1: Intent Discovery + Contact Identification** - FULLY OPERATIONAL
  - ✅ Tavily Search API: Real web research discovering authentic companies
  - ✅ People Data Labs API: Manager+ level contact identification active
  - ✅ Unified API endpoints: `/api/discover-intent` → `/api/identify-contacts`
  - ✅ Zero hallucination: All data verified from web sources with citations
  - ✅ Session scoping: Complete data isolation between discovery runs

**PRODUCTION-READY ENDPOINTS:**
- `/api/discover-intent` - Find high-intent accounts via web research
- `/api/identify-contacts` - Find Manager+ contacts at discovered accounts  
- `/api/accounts/:id/contacts` - Retrieve contacts for specific accounts
- `/api/intent/_health` & `/api/pdl/_test` - System health monitoring

**Current Status:** Complete Intent Discovery + Contact Identification unified module operational with authentic data sources.

**Next Steps:** Build Module 2 (Messaging Generator + Trust/Story Builder) for complete sales intelligence platform.