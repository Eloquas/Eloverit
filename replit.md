# Eloverit.ai - Precision Sales Intent Engine

## Overview
**Complete Application Restart - January 8, 2025**

Eloverit.ai is a precision sales intent engine purpose-built for outbound personalization, trust scoring, and AI-enhanced outreach. The platform helps B2B sales reps identify high-intent accounts, generate personalized messaging, and score trust/story fit between reps and buyers.

**Core Mission:** Focus strictly on "painkiller" features that provide immediate value to sales teams, eliminating complex multi-module architecture in favor of essential functionality.

## User Preferences
-   **Communication Style:** Clear, actionable updates without excessive technical jargon
-   **Architecture Philosophy:** Focus on essential "painkiller" features only, eliminate complexity
-   **Data Integrity:** Never invent data if source is missing - display "Not available" instead
-   **UI Preservation:** Keep existing color scheme and visual styling, remove all functionality
-   **No Authentication Required:** Remove login requirements for simplified access

## System Architecture
**New Architecture - Post-Restart (January 8, 2025)**

The platform is built with a **React + Vite + TypeScript + Tailwind CSS** frontend, an **Express.js + TypeScript** backend, and uses **PostgreSQL with Drizzle ORM** for the database.

**Core Functional Modules (To Be Built):**
1. **Account Upload & Parsing** - CSV/manual entry with PDL autofill
2. **Intent Discovery Agent** - Scan 10-Ks, job boards, tech usage databases  
3. **Contact Identification** - PDL API integration with role categorization
4. **Messaging Generator** - SCIPAB frameworks, email sequences, LinkedIn DMs
5. **Trust/Story Builder** - GPT model selection with hallucination prevention
6. **Call Reflection Engine** - Transcript processing for action items
7. **Rep Dashboard** - Account tracking and meeting outcomes
8. **Slide Deck Builder** - Template-based presentation generation

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

**Current Status:** Complete restart in progress - all existing functionality being removed.