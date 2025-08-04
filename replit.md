# ProspectCopy & Eloverit.ai - Dual Platform Repository

## Overview
This repository hosts two AI-powered platforms:
1.  **ProspectCopy:** An AI-driven business communication automation platform focused on generating personalized email and LinkedIn outreach content for sales and marketing professionals, with a specialized emphasis on enterprise systems and QA automation.
2.  **Eloverit.ai:** A P2P outbound intelligence platform designed for Account Executives (AEs) and Business Development Representatives (BDRs) in enterprise sales. It features secure multi-user login, Role-Based Access Control (RBAC), LinkedIn SSO, proactive data agents, TrustScore/StoryScore systems, and automated job signal detection.

The project aims to provide production-ready solutions for outbound sales, enhanced QA automation content, and robust content generation with professional fallback mechanisms. Key capabilities include generating personalized email cadences and LinkedIn campaigns, and providing advanced account research and intent discovery. The business vision is to empower sales and marketing professionals with highly relevant and personalized outreach at scale, leveraging AI for efficiency and effectiveness in enterprise sales motions.

## User Preferences
-   **Communication Style:** Clear, actionable updates without excessive technical jargon
-   **Focus Areas:** Enterprise systems (D365, SAP, Oracle, ERP, CRM), QA automation, brand awareness campaigns
-   **Content Strategy:** 6-email cadence starting with brand awareness, ending with strong CTA
-   **Target Roles:** Manager+ level positions in QA, CRM, ERP, D365, SAP, Oracle, enterprise systems

## System Architecture
The platform is built with a **React + Vite + TypeScript + Tailwind CSS** frontend, an **Express.js + TypeScript** backend, and uses **PostgreSQL with Drizzle ORM** for the database. **OpenAI GPT-4o** is integrated for AI content generation, with **Wouter** for client-side navigation and **TanStack Query** for server state management.

Core architectural decisions and features include:
*   **AI-Powered Content Generation:** Utilizes advanced AI models (GPT-4o, o3-Pro) for generating personalized email and LinkedIn messages, SCIPAB frameworks, and analyzing sales call transcripts. It incorporates TrustBuilder and StoryBuilder toggle logic for dynamic content generation, focusing on credibility and relatable scenarios.
*   **Modular Architecture:** The system employs a modular design for its outreach engine, allowing for flexible message structuring and campaign sequencing (e.g., 6-email cadences, multi-post LinkedIn campaigns).
*   **Intent Discovery & Account Research:** Features sophisticated engines for identifying high-intent Fortune 1000 accounts, leveraging multi-platform search, semantic analysis, and job opening intelligence. This includes a comprehensive Account Research Lookup Engine with enhanced filtering (industry, company size, revenue, location, system type, intent) and **Enhanced Account Research Engine (O3-Pro Intelligence)** with five core capabilities:
    1. Recent initiatives research around applications, SDLC, new platforms, and key named applications
    2. Current tech stack discovery from job postings targeting MS Dynamics, D365, Oracle PeopleSoft, Salesforce, SAP, QA tools, and SDLC platforms
    3. Hiring activity analysis scanning job boards for Software Delivery, QA, and enterprise systems roles
    4. Business initiatives research from investor reports and business journals
    5. SCIPAB framework generation aligned to QA improvements and Avo's value proposition from business perspective
*   **SCIPAB Analysis Framework:** Integrates an advanced SCIPAB (Situation, Complication, Implication, Position, Ask, Benefit) generator with real-time intent discovery and role-based messaging, providing structured consultative sales frameworks.
*   **Data Integrity & Deduplication:** Implements robust systems to ensure data integrity by eliminating simulated data and preventing duplicate leads and research generation through a comprehensive deduplication system with a 7-day cache.
*   **User Experience (UX) & Interface:** Features a professional, mobile-first responsive design with a modern top header navigation (transitioned from a left sidebar), grouped dropdowns, and a clean, card-based interface. It incorporates Avo Automation's design system with signature colors, gradients, and subtle animations (Framer Motion) for an enhanced user experience. Glassmorphism effects and modern styling are used throughout.
*   **Workflow Orchestration:** Designed as an IQ 200 AI orchestrator system, enabling a one-click account processing pipeline from upload to email generation and ABM usage. It incorporates a RAG (Retrieval-Augmented Generation) intelligence system for crowdsourced organizational intelligence.
*   **Onboarding Experience:** Features a personalized, AI-driven 5-step onboarding flow that adapts to user roles, goals, and preferences, providing tailored feature recommendations.
*   **Gamified Achievement System:** Includes a comprehensive achievement system with bronze/silver/gold/platinum tiers, real-time tracking, and team leaderboards to enhance engagement.
*   **Backend Infrastructure (Eloverit.ai):** Flask-based with multi-user authentication, RBAC, secure data isolation, and JSON-based database storage. Includes a Proactive Signal Engine for job board monitoring, and an Email Engine with deliverability features (spintax, spam score checking, rate limiting).
*   **UI/UX Decisions:**
    *   **Color Scheme:** Uses Avo's signature blue (#3B82F6) and purple accents, with professional gradient backgrounds and soft shadows.
    *   **Templates:** Modern enterprise SaaS template integration with glassmorphism effects, modern sidebar navigation, and card-based layouts with hover animations.
    *   **Design Approaches:** Focus on clean, modern spacing, typography, and intuitive navigation. Implement responsive design principles for optimal viewing across devices, including mobile card views and touch-friendly UI elements.

## External Dependencies
The project integrates with several key external services and APIs:
*   **OpenAI:** Utilizes GPT-4o for AI content generation, SCIPAB framework generation, and sales call assessment (GPT-4.5 Turbo).
*   **People Data Labs (PDL):** Integrated for authentic company intelligence, data enrichment, job postings, technology stacks, and hiring patterns, contributing to SCIPAB analysis and company detail modals.
*   **Twilio:** Integration ready for SMS alerts for daily signal digest notifications.
*   **LinkedIn:** Prepared for OAuth integration for publishing LinkedIn posts and utilizing shared connections for TrustBuild™ emails.
*   **PostgreSQL:** Used as the primary database solution.
*   **F1000 (Fortune 1000):** Leveraged for intent discovery, focusing on high-intent companies.
*   **Various Web Sources:** Utilizes job boards, company websites, press releases, industry publications, and SEC filings for comprehensive research and intent discovery.
*   **Specific Company News Sources:** Integrated with real news databases to pull company-specific articles from sources like Forbes, Gartner Research, Computer Weekly for authentic news related to enterprise systems.