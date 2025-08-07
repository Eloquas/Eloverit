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

**Current Status:** Complete restart in progress - all existing functionality being removed.