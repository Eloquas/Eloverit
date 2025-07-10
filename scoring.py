"""
TrustScore and StoryScore calculation engine for Eloquas AI
"""

import os
import random
import hashlib
from datetime import datetime, timedelta
import openai
import json
from linkedin_auth import linkedin_auth

# Initialize OpenAI
openai.api_key = os.environ.get('OPENAI_API_KEY')

def calculate_trustscore(prospect, user_id, signal=None):
    """
    Calculate composite TrustScore (0-100)
    
    Formula: 100 * (0.25*relationship + 0.25*intent_freshness + 
                    0.20*story + 0.15*deliverability + 0.15*engagement)
    """
    
    # 1. Relationship Score (0-1)
    relationship_score = calculate_relationship_score(prospect, user_id)
    
    # 2. Intent Freshness Score (0-1)
    intent_score = calculate_intent_freshness(signal)
    
    # 3. Story Quality Score (0-1)
    story_score = calculate_story_quality(prospect, signal)
    
    # 4. Deliverability Score (0-1)
    deliverability_score = calculate_deliverability(prospect)
    
    # 5. Engagement Score (0-1) - Mock for now
    engagement_score = random.uniform(0.3, 0.9)
    
    # Calculate weighted composite
    trustscore = 100 * (
        0.25 * relationship_score +
        0.25 * intent_score +
        0.20 * story_score +
        0.15 * deliverability_score +
        0.15 * engagement_score
    )
    
    return round(trustscore, 1)

def calculate_relationship_score(prospect, user_id):
    """
    Calculate relationship strength based on:
    - LinkedIn profile completeness and quality
    - Shared connections (mocked)
    - Same school/company history
    - Previous interactions
    """
    score = 0.3  # Base score
    
    # Get LinkedIn profile data if available
    linkedin_profile = linkedin_auth.get_user_profile(user_id)
    if linkedin_profile:
        # Add LinkedIn trust score component (25% of relationship score)
        linkedin_score = linkedin_auth.calculate_linkedin_trust_score(linkedin_profile) / 100
        score += linkedin_score * 0.25
        
        # Check if prospect has similar headline keywords
        prospect_title = prospect.get('title', '').lower()
        user_headline = linkedin_profile.get('headline', '').lower()
        
        # Check for industry/role alignment
        common_keywords = ['sap', 'oracle', 'dynamics', 'erp', 'crm', 'quality', 'qa', 'director', 'manager', 'vp']
        prospect_keywords = sum(1 for kw in common_keywords if kw in prospect_title)
        user_keywords = sum(1 for kw in common_keywords if kw in user_headline)
        
        if prospect_keywords > 0 and user_keywords > 0:
            score += 0.15  # Bonus for industry alignment
    
    # Mock: Check for shared connections
    shared_connections = random.randint(0, 5)
    if shared_connections > 0:
        score += 0.1 * min(shared_connections, 3)
    
    # Check for same company (in title/company field)
    if 'alumni' in prospect.get('title', '').lower():
        score += 0.2
    
    # Mock: Previous successful interactions
    if random.random() > 0.7:  # 30% chance of previous interaction
        score += 0.2
    
    return min(score, 1.0)

def calculate_intent_freshness(signal):
    """
    Calculate how fresh/relevant the intent signal is
    """
    if not signal:
        return 0.2  # No signal = low intent
    
    # Parse signal timestamp
    try:
        signal_time = datetime.fromisoformat(signal.get('timestamp', ''))
        days_old = (datetime.now() - signal_time).days
        
        # Scoring based on age
        if days_old <= 1:
            return 1.0  # Today/yesterday = perfect
        elif days_old <= 3:
            return 0.9
        elif days_old <= 7:
            return 0.7
        elif days_old <= 14:
            return 0.5
        elif days_old <= 30:
            return 0.3
        else:
            return 0.1
    except:
        return 0.3  # Default if parsing fails

def calculate_story_quality(prospect, signal):
    """
    Calculate story quality based on relevance and personalization potential
    """
    score = 0.5  # Base score
    
    if signal:
        # High match score from signal = better story
        match_score = signal.get('match_score', 0.5)
        score = 0.3 + (0.7 * match_score)
    
    # Bonus for specific roles
    title = prospect.get('title', '').lower()
    if any(keyword in title for keyword in ['director', 'vp', 'head of', 'manager']):
        score += 0.1
    
    return min(score, 1.0)

def calculate_deliverability(prospect):
    """
    Calculate email deliverability likelihood
    """
    email = prospect.get('email', '')
    domain = email.split('@')[1] if '@' in email else ''
    
    # Start with high score
    score = 0.9
    
    # Penalize free email providers
    free_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    if domain in free_domains:
        score -= 0.3
    
    # Penalize catch-all patterns
    local_part = email.split('@')[0] if '@' in email else ''
    if any(pattern in local_part for pattern in ['info', 'contact', 'admin', 'sales']):
        score -= 0.2
    
    return max(score, 0.1)

def calculate_storyscore(email_body):
    """
    Use GPT-4o to score email quality (0-20)
    Based on emotional pull, personalization, and clarity
    """
    if not openai.api_key:
        # Fallback scoring if no API key
        return mock_storyscore(email_body)
    
    try:
        prompt = f"""
        You are an expert sales email evaluator. Score this email from 0-20 based on:
        
        1. Emotional Pull (0-7): Does it create urgency or tap into pain points?
        2. Personalization (0-7): Is it specific to the recipient vs generic?
        3. Clarity & CTA (0-6): Is the ask clear and actionable?
        
        Email:
        {email_body}
        
        Return ONLY a JSON object with this format:
        {{
            "emotional_pull": 5,
            "personalization": 6,
            "clarity_cta": 4,
            "total_score": 15,
            "feedback": "Brief explanation of score"
        }}
        """
        
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a sales email expert. Provide scoring in JSON format only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200
        )
        
        # Parse response
        result = json.loads(response.choices[0].message.content)
        return result.get('total_score', 10)
        
    except Exception as e:
        print(f"OpenAI error: {e}")
        return mock_storyscore(email_body)

def mock_storyscore(email_body):
    """
    Fallback story scoring without AI
    """
    score = 10  # Base score
    
    # Check for personalization indicators
    if any(indicator in email_body.lower() for indicator in ['noticed', 'saw your', 'your team', 'your company']):
        score += 2
    
    # Check for value props
    if any(value in email_body.lower() for value in ['reduce', 'improve', 'increase', 'save', 'accelerate']):
        score += 2
    
    # Check for clear CTA
    if any(cta in email_body.lower() for cta in ['chat', 'connect', 'discuss', 'meeting', 'call']):
        score += 1
    
    # Length penalty
    word_count = len(email_body.split())
    if word_count > 150:
        score -= 2
    elif word_count < 50:
        score -= 1
    
    # Specific keywords bonus
    if any(keyword in email_body.lower() for keyword in ['sap', 'oracle', 'dynamics', 'qa', 'automation']):
        score += 1
    
    return min(max(score, 0), 20)

def get_trust_components(prospect, user_id, signal=None):
    """
    Get detailed breakdown of trust score components
    """
    return {
        'relationship': calculate_relationship_score(prospect, user_id),
        'intent_freshness': calculate_intent_freshness(signal),
        'story_quality': calculate_story_quality(prospect, signal),
        'deliverability': calculate_deliverability(prospect),
        'engagement': random.uniform(0.3, 0.9),  # Mock
        'total': calculate_trustscore(prospect, user_id, signal)
    }