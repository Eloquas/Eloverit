# How to Access Eloquas AI Email Composition Interface

## Overview
This repository contains two applications:
1. **ProspectCopy** - The React/TypeScript app (currently displayed)
2. **Eloquas AI** - The Flask app with TrustBuild™ and StoryBuild™ features

## Accessing Eloquas AI

### Option 1: Direct Flask Application
To run and access the Eloquas AI Flask application:

```bash
# Run the Flask app
python main.py
```

Then navigate to: `http://localhost:5001/`

### Option 2: Access Email Composition Interface
Once the Flask app is running:

1. **Register/Login**
   - Go to `http://localhost:5001/register` to create an account
   - Or `http://localhost:5001/login` if you already have one
   - Use any email/password for testing

2. **Upload Prospects**
   - From the dashboard, click "Upload Prospects"
   - Upload a CSV file with prospect data
   - Or manually add prospects

3. **Compose Email with TrustBuild™ and StoryBuild™**
   - From the dashboard, click on any prospect's "Compose Email" button
   - You'll see the email composition interface with:
     - **TrustBuild™ toggle** - Enables trust-based anchoring
     - **StoryBuild™ toggle** - Enables Hero's Journey sequences
     - TrustScore display
     - StoryScore calculator
     - Email preview and sequence viewer

## Features in Email Composition Interface

### TrustBuild™ Mode
- Finds shared connections (companies, schools, interests)
- Generates consultative, give-first email openings
- Works with LinkedIn integration or mock data

### StoryBuild™ Mode
- Generates 6-7 step email sequences
- Hero's Journey narrative structure
- Each email 100-125 words
- Executive outcome language

### Combined Mode
- Enable both toggles for maximum personalization
- Merges trust anchoring with storytelling
- Type-2 communication (memorable + emotionally encoded)

## Sample Test Data
For testing, you can use this sample prospect CSV:
```csv
name,email,title,company
John Smith,john@techcorp.com,VP Engineering,TechCorp
Jane Doe,jane@acme.com,Director QA,Acme Corp
Sarah Johnson,sarah@enterprise.com,QA Manager,Enterprise Inc
```

## Troubleshooting
- If port 5001 is in use, the Flask app may use a different port
- Check terminal output for the actual port number
- Ensure you have all Python dependencies installed