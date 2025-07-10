"""
Email engine with spintax, deliverability checks, and queue management
"""

import os
import json
import random
import time
import re
import hashlib
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from trust_story_builder import trust_story_builder
from linkedin_auth import linkedin_auth

# Database paths
DB_PATH = os.path.join(os.path.dirname(__file__), 'db')
EMAIL_QUEUE_DB = os.path.join(DB_PATH, 'email_queue.json')
EMAIL_HISTORY_DB = os.path.join(DB_PATH, 'email_history.json')

# Email templates with spintax
EMAIL_TEMPLATES = {
    'qa_signal': {
        'subject': '{Noticed|Saw|Spotted} your {QA|quality} {hiring|team growth} at {company}',
        'body': """{Hi|Hello|Hey} {name},

{I noticed|I saw|Came across} your team at {company} is {hiring for|looking for|seeking} {QA roles|quality engineers|test automation experts}. 

{This caught my attention|This resonated with me|I was intrigued} because {we help|we work with|we partner with} {companies|organizations|teams} {modernize|transform|accelerate} their {QA processes|testing workflows|quality initiatives}.

{Our clients|Companies we work with|Teams using our platform} typically see {80% faster test execution|60% reduction in bug escapes|3x faster release cycles} within {90 days|3 months|the first quarter}.

{Would you be open to|Might you have time for|Could we schedule} a {brief|quick|short} {chat|conversation|call} to {explore|discuss|see} if we could {help|support|accelerate} your {QA transformation|quality goals|testing initiatives}?

{Best|Regards|Thanks},
{sender_name}
{signature_variation}"""
    },
    
    'sap_signal': {
        'subject': '{SAP|S/4HANA} {project|initiative} at {company}',
        'body': """{Hi|Hello} {name},

{I noticed|Saw that|Came across} {company}'s {SAP implementation|S/4HANA migration|ERP modernization} {project|initiative}.

{Having worked with|After helping|From our experience with} {similar companies|other enterprises|organizations in your industry}, we've {learned|discovered|found} that {testing|quality assurance|validation} can {make or break|determine the success of|be critical for} these {implementations|projects|transformations}.

{Our platform|Our solution|What we do} {automates|streamlines|accelerates} {SAP testing|ERP validation|system testing} - {reducing|cutting|decreasing} what typically takes {weeks|months} down to {days|hours}.

{Worth|Open to|Interested in} a {conversation|discussion|call} about your {testing strategy|QA approach|validation plans} for the {SAP project|implementation|migration}?

{Best|Regards|Cheers},
{sender_name}
{signature_variation}"""
    }
}

# Signature variations for spintax
SIGNATURE_VARIATIONS = [
    "\n\nP.S. {Happy to share|Can send over|Would love to share} {case studies|success stories|examples} from {similar companies|your industry|other {industry} companies}",
    "\n\n---\n{sender_title}\n{company_name}\n{phone}",
    "\n\n--\n{company_name} | {tagline}",
    ""
]

class EmailEngine:
    """Manages email composition, deliverability, and sending"""
    
    def __init__(self):
        os.makedirs(DB_PATH, exist_ok=True)
        self._init_databases()
        self.smtp_config = {
            'host': os.environ.get('SMTP_HOST', 'smtp.gmail.com'),
            'port': int(os.environ.get('SMTP_PORT', 587)),
            'user': os.environ.get('SMTP_USER', ''),
            'password': os.environ.get('SMTP_PASSWORD', '')
        }
    
    def _init_databases(self):
        """Initialize email databases"""
        for db_file in [EMAIL_QUEUE_DB, EMAIL_HISTORY_DB]:
            if not os.path.exists(db_file):
                with open(db_file, 'w') as f:
                    json.dump({}, f)
    
    def _load_db(self, db_file):
        """Load database"""
        try:
            with open(db_file, 'r') as f:
                return json.load(f)
        except:
            return {}
    
    def _save_db(self, db_file, data):
        """Save database"""
        with open(db_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def process_spintax(self, text, variables=None):
        """Process spintax syntax {option1|option2|option3}"""
        if variables:
            # Replace variables first
            for key, value in variables.items():
                text = text.replace(f'{{{key}}}', str(value))
        
        # Process spintax
        def replace_spintax(match):
            options = match.group(1).split('|')
            return random.choice(options)
        
        # Keep processing until no more spintax
        while '{' in text and '|' in text and '}' in text:
            text = re.sub(r'\{([^{}]+\|[^{}]+)\}', replace_spintax, text)
        
        return text
    
    def generate_template(self, prospect, signal=None, trustbuild=False, storybuild=False, user_id=None):
        """Generate email template based on prospect and signal with optional TrustBuild/StoryBuild modes"""
        
        # If enhanced modes are enabled, use trust_story_builder
        if trustbuild or storybuild:
            return self._generate_enhanced_sequence(prospect, signal, trustbuild, storybuild, user_id)
        
        # Otherwise use original template logic
        # Select template based on signal
        if signal and any(kw in ['QA', 'Quality', 'Test'] for kw in signal.get('keywords', [])):
            template_key = 'qa_signal'
        elif signal and any(kw in ['SAP', 'Oracle', 'Dynamics'] for kw in signal.get('keywords', [])):
            template_key = 'sap_signal'
        else:
            template_key = 'qa_signal'  # Default
        
        template = EMAIL_TEMPLATES.get(template_key, EMAIL_TEMPLATES['qa_signal'])
        
        # Prepare variables
        variables = {
            'name': prospect.get('name', 'there'),
            'company': prospect.get('company', 'your company'),
            'sender_name': 'Alex',  # Would come from user profile
            'sender_title': 'Senior Account Executive',
            'company_name': 'Eloquas AI',
            'phone': '(555) 123-4567',
            'tagline': 'Intelligent Sales Automation',
            'industry': self._guess_industry(prospect.get('company', ''))
        }
        
        # Add signature variation
        variables['signature_variation'] = self.process_spintax(
            random.choice(SIGNATURE_VARIATIONS), 
            variables
        )
        
        # Process templates
        subject = self.process_spintax(template['subject'], variables)
        body = self.process_spintax(template['body'], variables)
        
        return {
            'subject': subject,
            'body': body,
            'template_used': template_key
        }
    
    def _generate_enhanced_sequence(self, prospect, signal, trustbuild, storybuild, user_id):
        """Generate enhanced email sequence with TrustBuild and/or StoryBuild"""
        
        # Get LinkedIn profiles if available
        rep_profile = linkedin_auth.get_user_profile(user_id) if user_id else None
        prospect_profile = None  # Would need prospect's LinkedIn data
        
        if trustbuild and storybuild:
            # Combined mode
            sequence = trust_story_builder.generate_combined_sequence(
                prospect, rep_profile, prospect_profile, signal
            )
            return sequence  # Returns full sequence
            
        elif storybuild:
            # StoryBuild only
            sequence = trust_story_builder.generate_storybuild_sequence(prospect, signal)
            return sequence  # Returns full sequence
            
        elif trustbuild:
            # TrustBuild only
            anchors = trust_story_builder.find_trust_anchors(rep_profile, prospect_profile)
            email = trust_story_builder.generate_trustbuild_email(prospect, anchors, signal)
            return [email]  # Return as single-item list for consistency
        
        return []
    
    def _guess_industry(self, company_name):
        """Guess industry from company name"""
        company_lower = company_name.lower()
        
        if any(term in company_lower for term in ['bank', 'financial', 'capital']):
            return 'financial services'
        elif any(term in company_lower for term in ['tech', 'software', 'systems']):
            return 'technology'
        elif any(term in company_lower for term in ['health', 'medical', 'pharma']):
            return 'healthcare'
        else:
            return 'your industry'
    
    def check_spam_score(self, subject, body):
        """Check spam score of email (mock implementation)"""
        score = 0
        
        # Subject line checks
        subject_lower = subject.lower()
        if len(subject) > 100:
            score += 2
        if subject.isupper():
            score += 3
        if any(spam_word in subject_lower for spam_word in ['free', 'guarantee', 'urgent']):
            score += 2
        
        # Body checks
        body_lower = body.lower()
        
        # Excessive capitalization
        caps_ratio = sum(1 for c in body if c.isupper()) / len(body)
        if caps_ratio > 0.3:
            score += 2
        
        # Spam phrases
        spam_phrases = ['click here', 'act now', 'limited time', 'risk free']
        for phrase in spam_phrases:
            if phrase in body_lower:
                score += 1.5
        
        # Too many links
        link_count = body_lower.count('http')
        if link_count > 3:
            score += 2
        
        # Suspicious patterns
        if body_lower.count('!') > 3:
            score += 1
        if body_lower.count('$') > 2:
            score += 2
        
        # Bonus for good practices
        if 'unsubscribe' in body_lower:
            score -= 1
        if len(body.split()) > 50 and len(body.split()) < 300:
            score -= 0.5
        
        return max(0, score)
    
    def queue_email(self, user_id, prospect_id, subject, body, storyscore=10):
        """Add email to queue for sending"""
        queue = self._load_db(EMAIL_QUEUE_DB)
        
        if user_id not in queue:
            queue[user_id] = []
        
        email_id = hashlib.md5(
            f"{user_id}{prospect_id}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:8]
        
        email_entry = {
            'id': email_id,
            'prospect_id': prospect_id,
            'subject': subject,
            'body': body,
            'storyscore': storyscore,
            'queued_at': datetime.now().isoformat(),
            'status': 'queued',
            'attempts': 0,
            'scheduled_for': (datetime.now() + timedelta(minutes=random.randint(5, 30))).isoformat()
        }
        
        queue[user_id].append(email_entry)
        self._save_db(EMAIL_QUEUE_DB, queue)
        
        return email_id
    
    def process_queue(self):
        """Process email queue - called by cron"""
        queue = self._load_db(EMAIL_QUEUE_DB)
        history = self._load_db(EMAIL_HISTORY_DB)
        
        emails_sent = 0
        current_time = datetime.now()
        
        for user_id, user_queue in queue.items():
            # Process emails scheduled for sending
            for email in user_queue:
                if email['status'] != 'queued':
                    continue
                
                scheduled_time = datetime.fromisoformat(email['scheduled_for'])
                if scheduled_time <= current_time:
                    # Send email
                    success = self._send_email(user_id, email)
                    
                    if success:
                        email['status'] = 'sent'
                        email['sent_at'] = current_time.isoformat()
                        emails_sent += 1
                        
                        # Move to history
                        if user_id not in history:
                            history[user_id] = []
                        history[user_id].append(email)
                        
                        # Rate limiting
                        time.sleep(random.uniform(45, 90))
                    else:
                        email['attempts'] += 1
                        if email['attempts'] >= 3:
                            email['status'] = 'failed'
                        else:
                            # Reschedule
                            email['scheduled_for'] = (
                                current_time + timedelta(hours=1)
                            ).isoformat()
        
        # Clean up sent emails from queue
        for user_id in queue:
            queue[user_id] = [
                e for e in queue[user_id] 
                if e['status'] not in ['sent', 'failed']
            ]
        
        self._save_db(EMAIL_QUEUE_DB, queue)
        self._save_db(EMAIL_HISTORY_DB, history)
        
        return emails_sent
    
    def _send_email(self, user_id, email_data):
        """Actually send email via SMTP"""
        # In production, would use real SMTP
        # For now, mock sending
        
        if not self.smtp_config['user']:
            # Mock send
            print(f"[MOCK] Sending email to prospect {email_data['prospect_id']}")
            print(f"Subject: {email_data['subject']}")
            print(f"Score: {email_data['storyscore']}")
            return True
        
        try:
            # Real SMTP sending
            msg = MIMEMultipart()
            msg['Subject'] = email_data['subject']
            msg['From'] = self.smtp_config['user']
            # Would need to look up prospect email
            msg['To'] = 'prospect@example.com'  # Placeholder
            
            msg.attach(MIMEText(email_data['body'], 'plain'))
            
            with smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port']) as server:
                server.starttls()
                server.login(self.smtp_config['user'], self.smtp_config['password'])
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"SMTP error: {e}")
            return False
    
    def get_queue_status(self, user_id):
        """Get queue status for user"""
        queue = self._load_db(EMAIL_QUEUE_DB)
        user_queue = queue.get(user_id, [])
        
        queued = sum(1 for e in user_queue if e['status'] == 'queued')
        failed = sum(1 for e in user_queue if e['status'] == 'failed')
        
        # Get history stats
        history = self._load_db(EMAIL_HISTORY_DB)
        user_history = history.get(user_id, [])
        sent_today = sum(
            1 for e in user_history 
            if e.get('sent_at') and 
            datetime.fromisoformat(e['sent_at']).date() == datetime.now().date()
        )
        
        return {
            'queued': queued,
            'failed': failed,
            'sent_today': sent_today,
            'total_sent': len(user_history)
        }

# Cron job function
def process_email_queue():
    """Function to be called by cron scheduler"""
    engine = EmailEngine()
    count = engine.process_queue()
    print(f"Processed {count} emails at {datetime.now()}")