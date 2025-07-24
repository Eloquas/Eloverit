# Research Engine Files Location Guide

## Core Research Engine Files

### Intent Discovery & O1 Pro Engine
- **`server/o1-pro-intent-engine.ts`** - O1 Pro-level intent discovery engine operating at IQ 200+ level
- **`server/intent-discovery-engine.ts`** - Legacy intent signal processing engine
- **`server/api/o1-pro-intent-discovery.ts`** - O1 Pro API endpoints for F1000 Intent Discovery

### Research Engines
- **`server/hybrid-research.ts`** - Multi-source data integration (PDL + AI + Web scraping)
- **`server/platform-research.ts`** - Legacy platform research engine
- **`server/platform-intelligence.ts`** - Platform-specific analysis and technology detection
- **`server/contact-research-engine.ts`** - Contact-level research and role analysis
- **`server/research-insights.ts`** - Research analytics and insights generation

### Discovery & Analysis
- **`server/platform-discovery.ts`** - F1000 Intent Discovery system for high-intent accounts
- **`server/scipab-framework.ts`** - SCIPAB framework generation for consultative sales

### Database & Storage
- **`server/storage.ts`** - Data persistence layer with all CRUD operations
- **`shared/schema.ts`** - Database schema definitions and table structures

## Current Issues Fixed

### Database Schema Issues
✅ **FIXED:** `key_metrics_hypothesis` column missing - Added to account_research table
✅ **FIXED:** `business_priorities` column missing - Added to account_research table
✅ **FIXED:** Column name mismatch in storage queries

### Research Functionality
✅ **Platform Discovery:** Working - generates Fortune 1000 account discovery
✅ **O1 Pro Intent Engine:** Working - advanced platform-specific research  
✅ **Hybrid Research:** Working - multi-source data integration
✅ **Account Research Generation:** Fixed - should now work end-to-end

## Testing Commands

### Test Account Research Generation
```bash
curl -X POST "http://localhost:5000/api/account-research/generate" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"companyName": "Microsoft", "platform": "enterprise_systems"}'
```

### Test F1000 Intent Discovery  
```bash
curl -X POST "http://localhost:5000/api/intent-discovery/search" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"companies": ["Microsoft"], "platforms": ["dynamics"], "fortuneRanking": "fortune-500"}'
```

### Test Platform Discovery
```bash
curl -X POST "http://localhost:5000/api/account-research/platform-discovery" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"platform": "dynamics", "fortuneRanking": "fortune-1000"}'
```

## UI Pages

### Frontend Research Pages
- **`client/src/pages/enhanced-account-research.tsx`** - Main account research interface
- **`client/src/pages/contact-research.tsx`** - Contact-level research page
- **`client/src/pages/platform-discovery.tsx`** - F1000 Intent Discovery UI
- **`client/src/pages/intent-discovery.tsx`** - Intent discovery interface

## Authentication
Demo account: `demo@eloquas.ai` / `demo123`