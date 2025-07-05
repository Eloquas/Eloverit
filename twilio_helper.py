"""
Twilio SMS integration for daily signal alerts
"""

import os
import json
from datetime import datetime, timedelta
from twilio.rest import Client
from jobs_scraper import JobSignalScanner
from users import User

# Twilio configuration
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')

# Database for SMS history
DB_PATH = os.path.join(os.path.dirname(__file__), 'db')
SMS_HISTORY_DB = os.path.join(DB_PATH, 'sms_history.json')

class SMSNotifier:
    """Manages SMS notifications for signal alerts"""
    
    def __init__(self):
        os.makedirs(DB_PATH, exist_ok=True)
        self._init_sms_db()
        
        # Initialize Twilio client if credentials available
        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
            self.client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        else:
            self.client = None
    
    def _init_sms_db(self):
        """Initialize SMS history database"""
        if not os.path.exists(SMS_HISTORY_DB):
            with open(SMS_HISTORY_DB, 'w') as f:
                json.dump({}, f)
    
    def _load_history(self):
        """Load SMS history"""
        try:
            with open(SMS_HISTORY_DB, 'r') as f:
                return json.load(f)
        except:
            return {}
    
    def _save_history(self, history):
        """Save SMS history"""
        with open(SMS_HISTORY_DB, 'w') as f:
            json.dump(history, f, indent=2)
    
    def send_daily_digest(self):
        """Send daily signal digest to all active users"""
        print(f"Starting SMS digest at {datetime.now()}")
        
        # Get all users
        users = User.get_all_users()
        scanner = JobSignalScanner()
        history = self._load_history()
        
        sent_count = 0
        
        for user in users:
            if not user.is_active:
                continue
            
            # Check if already sent today
            user_history = history.get(user.id, [])
            today = datetime.now().date().isoformat()
            
            if any(h['date'] == today for h in user_history):
                print(f"Already sent to {user.email} today")
                continue
            
            # Get user's signals from last 24 hours
            signals = scanner.get_user_signals(user.id, limit=20)
            recent_signals = [
                s for s in signals 
                if self._is_recent(s.get('timestamp'))
            ]
            
            if recent_signals:
                # Send SMS
                success = self._send_sms(user, recent_signals)
                
                if success:
                    # Record in history
                    if user.id not in history:
                        history[user.id] = []
                    
                    history[user.id].append({
                        'date': today,
                        'sent_at': datetime.now().isoformat(),
                        'signal_count': len(recent_signals)
                    })
                    
                    sent_count += 1
        
        self._save_history(history)
        print(f"Sent {sent_count} SMS digests")
        return sent_count
    
    def _is_recent(self, timestamp):
        """Check if signal is from last 24 hours"""
        if not timestamp:
            return False
        
        try:
            signal_time = datetime.fromisoformat(timestamp)
            return (datetime.now() - signal_time) < timedelta(hours=24)
        except:
            return False
    
    def _send_sms(self, user, signals):
        """Send SMS to user with signal summary"""
        # Format message
        message = self._format_message(signals)
        
        # Get user's phone (would be in user profile)
        # For demo, using mock number
        phone = self._get_user_phone(user)
        
        if not phone:
            print(f"No phone number for {user.email}")
            return False
        
        if self.client:
            try:
                # Send real SMS
                message = self.client.messages.create(
                    body=message,
                    from_=TWILIO_PHONE_NUMBER,
                    to=phone
                )
                print(f"Sent SMS to {user.email}: {message.sid}")
                return True
                
            except Exception as e:
                print(f"Twilio error for {user.email}: {e}")
                return False
        else:
            # Mock send
            print(f"[MOCK SMS] To: {phone}")
            print(f"Message: {message}")
            return True
    
    def _format_message(self, signals):
        """Format signals into SMS message"""
        # Group by company
        by_company = {}
        for signal in signals[:5]:  # Limit to 5 for SMS
            company = signal.get('company', 'Unknown')
            if company not in by_company:
                by_company[company] = []
            by_company[company].append(signal.get('title', ''))
        
        # Build message
        lines = [f"⚡ {len(signals)} new signals for your accounts:"]
        
        for company, titles in list(by_company.items())[:3]:  # Top 3 companies
            title = titles[0].split('-')[0].strip()  # Clean title
            lines.append(f"- {company}: {title}")
        
        if len(by_company) > 3:
            lines.append(f"+ {len(by_company) - 3} more companies")
        
        lines.append(f"\nView more: app.eloquas.ai/signals")
        
        return '\n'.join(lines)
    
    def _get_user_phone(self, user):
        """Get user's phone number"""
        # In production, would come from user profile
        # For demo, return mock number based on role
        if user.role == 'admin':
            return '+15551234567'
        elif user.role == 'ae':
            return '+15557654321'
        else:
            return '+15559876543'
    
    def send_test_sms(self, user_id, phone):
        """Send test SMS to verify setup"""
        message = "Welcome to Eloquas AI! Your daily signal alerts are now active. Reply STOP to unsubscribe."
        
        if self.client:
            try:
                message = self.client.messages.create(
                    body=message,
                    from_=TWILIO_PHONE_NUMBER,
                    to=phone
                )
                return {'success': True, 'sid': message.sid}
            except Exception as e:
                return {'success': False, 'error': str(e)}
        else:
            return {
                'success': False, 
                'error': 'Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN'
            }

# Cron job function
def send_daily_sms_digest():
    """Function to be called by cron scheduler"""
    notifier = SMSNotifier()
    notifier.send_daily_digest()