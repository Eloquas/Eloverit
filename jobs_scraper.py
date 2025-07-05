"""
Job board monitoring and signal detection for Eloquas AI
"""

import os
import json
import hashlib
import feedparser
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import re
import time
import random

# Database paths
DB_PATH = os.path.join(os.path.dirname(__file__), 'db')
SIGNALS_DB = os.path.join(DB_PATH, 'signals.json')

# Target keywords for matching
TARGET_KEYWORDS = [
    'SAP', 'Oracle', 'Dynamics 365', 'D365', 'QA', 'Quality Assurance',
    'Test Automation', 'Quality Engineering', 'Quality Engineer',
    'Test Engineer', 'SDET', 'Testing', 'Salesforce', 'NetSuite',
    'ERP', 'CRM', 'Enterprise Systems'
]

# F1000 companies with career RSS feeds (mock list)
F1000_RSS_FEEDS = {
    'FIS': 'https://careers.fisglobal.com/us/en/rss',
    'Cisco': 'https://jobs.cisco.com/jobs/SearchJobs/?rss=1',
    'TCS': 'https://ibegin.tcs.com/iBegin/rss/jobs',
    'Accenture': 'https://www.accenture.com/us-en/careers/jobsearch/rss',
    'Deloitte': 'https://careers.deloitte.com/rss',
    # Add more as needed
}

class JobSignalScanner:
    """Scans job boards and creates signals for matching positions"""
    
    def __init__(self):
        os.makedirs(DB_PATH, exist_ok=True)
        self._init_signals_db()
    
    def _init_signals_db(self):
        """Initialize signals database"""
        if not os.path.exists(SIGNALS_DB):
            with open(SIGNALS_DB, 'w') as f:
                json.dump({}, f)
    
    def _load_signals(self):
        """Load signals from database"""
        try:
            with open(SIGNALS_DB, 'r') as f:
                return json.load(f)
        except:
            return {}
    
    def _save_signals(self, signals):
        """Save signals to database"""
        with open(SIGNALS_DB, 'w') as f:
            json.dump(signals, f, indent=2)
    
    def scan_all_sources(self):
        """Main scanning function - runs daily via cron"""
        print(f"Starting job signal scan at {datetime.now()}")
        
        new_signals = []
        
        # Scan RSS feeds
        for company, feed_url in F1000_RSS_FEEDS.items():
            try:
                signals = self._scan_rss_feed(company, feed_url)
                new_signals.extend(signals)
                time.sleep(random.uniform(2, 5))  # Rate limiting
            except Exception as e:
                print(f"Error scanning {company}: {e}")
        
        # Scan additional sources via Google Custom Search
        additional_companies = ['JPMorgan Chase', 'Wells Fargo', 'United Airlines']
        for company in additional_companies:
            try:
                signals = self._scan_google_jobs(company)
                new_signals.extend(signals)
                time.sleep(random.uniform(3, 7))  # Rate limiting
            except Exception as e:
                print(f"Error scanning {company} via Google: {e}")
        
        # Save all new signals
        self._store_signals(new_signals)
        
        print(f"Scan complete. Found {len(new_signals)} new signals.")
        return new_signals
    
    def _scan_rss_feed(self, company, feed_url):
        """Scan RSS feed for matching jobs"""
        signals = []
        
        try:
            feed = feedparser.parse(feed_url)
            
            for entry in feed.entries[:20]:  # Limit to recent 20
                title = entry.get('title', '')
                link = entry.get('link', '')
                description = entry.get('description', '')
                published = entry.get('published_parsed', None)
                
                # Check for keyword matches
                match_score, keywords = self._calculate_match_score(
                    title + ' ' + description
                )
                
                if match_score > 0.5:
                    signal = {
                        'company': company,
                        'title': title,
                        'url': link,
                        'keywords': keywords,
                        'match_score': match_score,
                        'timestamp': datetime.now().isoformat(),
                        'source': 'rss',
                        'description_snippet': description[:200]
                    }
                    signals.append(signal)
        
        except Exception as e:
            print(f"RSS feed error for {company}: {e}")
        
        return signals
    
    def _scan_google_jobs(self, company):
        """Fallback: Use Google to find job postings"""
        signals = []
        
        # Mock implementation - in production would use Google Custom Search API
        # For now, generate realistic mock data
        mock_jobs = [
            {
                'title': f'Senior QA Engineer - {company}',
                'url': f'https://careers.{company.lower().replace(" ", "")}.com/job/qa-engineer-123',
                'keywords': ['QA', 'Test Automation'],
                'match_score': 0.85
            },
            {
                'title': f'SAP Technical Lead - {company}',
                'url': f'https://careers.{company.lower().replace(" ", "")}.com/job/sap-lead-456',
                'keywords': ['SAP', 'Enterprise Systems'],
                'match_score': 0.90
            }
        ]
        
        # Randomly include some jobs (simulate real search variability)
        if random.random() > 0.3:
            for job in mock_jobs[:random.randint(0, 2)]:
                signal = {
                    'company': company,
                    'title': job['title'],
                    'url': job['url'],
                    'keywords': job['keywords'],
                    'match_score': job['match_score'],
                    'timestamp': datetime.now().isoformat(),
                    'source': 'google',
                    'description_snippet': f'Seeking experienced professional for {job["keywords"][0]} role...'
                }
                signals.append(signal)
        
        return signals
    
    def _calculate_match_score(self, text):
        """Calculate relevance score and extract matching keywords"""
        text_lower = text.lower()
        matched_keywords = []
        
        for keyword in TARGET_KEYWORDS:
            if keyword.lower() in text_lower:
                matched_keywords.append(keyword)
        
        # Calculate score based on matches
        if not matched_keywords:
            return 0, []
        
        # Base score on number of matches
        score = min(len(matched_keywords) * 0.25, 1.0)
        
        # Bonus for specific high-value keywords
        high_value = ['QA', 'Quality Engineer', 'Test Automation', 'SAP', 'Oracle', 'Dynamics 365']
        for hv in high_value:
            if hv in matched_keywords:
                score = min(score + 0.15, 1.0)
        
        return round(score, 2), matched_keywords
    
    def _store_signals(self, new_signals):
        """Store signals with deduplication"""
        signals_db = self._load_signals()
        
        for signal in new_signals:
            # Create unique hash for deduplication
            signal_hash = hashlib.md5(
                f"{signal['company']}{signal['title']}{signal['url']}".encode()
            ).hexdigest()
            
            signal['id'] = signal_hash[:8]
            
            # Store by company for easier retrieval
            company = signal['company']
            if company not in signals_db:
                signals_db[company] = []
            
            # Check for duplicates
            existing_ids = [s['id'] for s in signals_db[company]]
            if signal['id'] not in existing_ids:
                signals_db[company].append(signal)
        
        self._save_signals(signals_db)
    
    def get_user_signals(self, user_id, limit=10):
        """Get signals relevant to a user's prospects"""
        from users import User
        
        # Get user's prospects
        prospects = User.get_prospects(user_id)
        companies = list(set([p['company'] for p in prospects]))
        
        # Get signals for those companies
        signals_db = self._load_signals()
        user_signals = []
        
        for company in companies:
            if company in signals_db:
                company_signals = signals_db[company]
                # Sort by timestamp (newest first)
                company_signals.sort(
                    key=lambda x: x.get('timestamp', ''), 
                    reverse=True
                )
                user_signals.extend(company_signals[:5])  # Max 5 per company
        
        # Sort all by timestamp and limit
        user_signals.sort(
            key=lambda x: x.get('timestamp', ''), 
            reverse=True
        )
        
        return user_signals[:limit]
    
    def get_company_signals(self, company, limit=5):
        """Get signals for a specific company"""
        signals_db = self._load_signals()
        
        if company in signals_db:
            signals = signals_db[company]
            # Sort by timestamp (newest first)
            signals.sort(
                key=lambda x: x.get('timestamp', ''), 
                reverse=True
            )
            return signals[:limit]
        
        return []
    
    def get_all_signals(self, limit=100):
        """Get all signals across system (admin view)"""
        signals_db = self._load_signals()
        all_signals = []
        
        for company, signals in signals_db.items():
            all_signals.extend(signals)
        
        # Sort by timestamp
        all_signals.sort(
            key=lambda x: x.get('timestamp', ''), 
            reverse=True
        )
        
        return all_signals[:limit]
    
    def get_signal_stats(self):
        """Get statistics about signals"""
        signals_db = self._load_signals()
        
        total_signals = 0
        companies_with_signals = 0
        keyword_counts = {}
        
        for company, signals in signals_db.items():
            if signals:
                companies_with_signals += 1
                total_signals += len(signals)
                
                for signal in signals:
                    for keyword in signal.get('keywords', []):
                        keyword_counts[keyword] = keyword_counts.get(keyword, 0) + 1
        
        return {
            'total_signals': total_signals,
            'companies_with_signals': companies_with_signals,
            'top_keywords': sorted(
                keyword_counts.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:10]
        }

# Cron job function
def run_daily_scan():
    """Function to be called by cron scheduler"""
    scanner = JobSignalScanner()
    scanner.scan_all_sources()