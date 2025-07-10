"""
LinkedIn OAuth integration for Eloquas AI
Handles authentication and profile data extraction for trust scoring
"""

import os
import json
import requests
from urllib.parse import urlencode
from flask import redirect, request, session
from datetime import datetime
import hashlib

class LinkedInAuth:
    """Manages LinkedIn OAuth flow and profile data extraction"""
    
    def __init__(self):
        self.client_id = os.environ.get('LINKEDIN_CLIENT_ID', '')
        self.client_secret = os.environ.get('LINKEDIN_CLIENT_SECRET', '')
        self.redirect_uri = os.environ.get('LINKEDIN_REDIRECT_URI', 'http://localhost:5001/auth/linkedin/callback')
        self.scope = 'r_liteprofile r_emailaddress w_member_social'
        self.auth_base_url = 'https://www.linkedin.com/oauth/v2/authorization'
        self.token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
        self.profile_url = 'https://api.linkedin.com/v2/me'
        self.email_url = 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))'
        
        # LinkedIn profile data storage
        self.profiles_db = 'db/linkedin_profiles.json'
        self._init_profiles_db()
    
    def _init_profiles_db(self):
        """Initialize LinkedIn profiles database"""
        os.makedirs('db', exist_ok=True)
        if not os.path.exists(self.profiles_db):
            with open(self.profiles_db, 'w') as f:
                json.dump({}, f)
    
    def _load_profiles(self):
        """Load LinkedIn profiles from database"""
        try:
            with open(self.profiles_db, 'r') as f:
                return json.load(f)
        except:
            return {}
    
    def _save_profiles(self, profiles):
        """Save LinkedIn profiles to database"""
        with open(self.profiles_db, 'w') as f:
            json.dump(profiles, f, indent=2)
    
    def get_authorization_url(self):
        """Generate LinkedIn OAuth authorization URL"""
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': self.scope,
            'state': hashlib.md5(os.urandom(32)).hexdigest()
        }
        session['linkedin_state'] = params['state']
        return f"{self.auth_base_url}?{urlencode(params)}"
    
    def handle_callback(self, code, state):
        """Handle LinkedIn OAuth callback and exchange code for token"""
        # Verify state to prevent CSRF
        if state != session.get('linkedin_state'):
            return None, "Invalid state parameter"
        
        # Exchange code for access token
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        try:
            response = requests.post(self.token_url, data=token_data)
            if response.status_code == 200:
                token_info = response.json()
                access_token = token_info['access_token']
                
                # Get profile data
                profile_data = self._fetch_profile_data(access_token)
                if profile_data:
                    # Store profile data
                    self._store_profile(profile_data)
                    return profile_data, None
                else:
                    return None, "Failed to fetch profile data"
            else:
                return None, f"Token exchange failed: {response.text}"
        except Exception as e:
            return None, str(e)
    
    def _fetch_profile_data(self, access_token):
        """Fetch LinkedIn profile data using access token"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'X-Restli-Protocol-Version': '2.0.0'
        }
        
        try:
            # Get basic profile
            profile_response = requests.get(self.profile_url, headers=headers)
            if profile_response.status_code != 200:
                return None
            
            profile = profile_response.json()
            
            # Get email
            email_response = requests.get(self.email_url, headers=headers)
            email = None
            if email_response.status_code == 200:
                email_data = email_response.json()
                if email_data.get('elements'):
                    email = email_data['elements'][0]['handle~']['emailAddress']
            
            # Extract and format profile data
            linkedin_data = {
                'id': profile.get('id'),
                'email': email,
                'firstName': profile.get('firstName', {}).get('localized', {}).get('en_US', ''),
                'lastName': profile.get('lastName', {}).get('localized', {}).get('en_US', ''),
                'headline': profile.get('headline', {}).get('localized', {}).get('en_US', ''),
                'profilePicture': self._extract_profile_picture(profile),
                'access_token': access_token,
                'fetched_at': datetime.now().isoformat()
            }
            
            return linkedin_data
            
        except Exception as e:
            print(f"Error fetching LinkedIn profile: {e}")
            return None
    
    def _extract_profile_picture(self, profile):
        """Extract profile picture URL from LinkedIn profile data"""
        try:
            picture_data = profile.get('profilePicture', {})
            display_image = picture_data.get('displayImage~', {})
            elements = display_image.get('elements', [])
            if elements:
                # Get the largest image
                largest = max(elements, key=lambda x: x.get('data', {}).get('com.linkedin.digitalmedia.mediaartifact.StillImage', {}).get('storageSize', {}).get('width', 0))
                identifiers = largest.get('identifiers', [])
                if identifiers:
                    return identifiers[0].get('identifier')
        except:
            pass
        return None
    
    def _store_profile(self, profile_data):
        """Store LinkedIn profile data for user"""
        profiles = self._load_profiles()
        user_id = session.get('user_id')
        if user_id:
            profiles[user_id] = profile_data
            self._save_profiles(profiles)
    
    def get_user_profile(self, user_id):
        """Get stored LinkedIn profile for user"""
        profiles = self._load_profiles()
        return profiles.get(user_id)
    
    def extract_trust_signals(self, profile_data):
        """Extract trust signals from LinkedIn profile for scoring"""
        if not profile_data:
            return {
                'has_profile': False,
                'completeness': 0,
                'headline_quality': 0,
                'professional_photo': False,
                'network_strength': 0
            }
        
        signals = {
            'has_profile': True,
            'completeness': 0,
            'headline_quality': 0,
            'professional_photo': bool(profile_data.get('profilePicture')),
            'network_strength': 0  # Would need additional API calls
        }
        
        # Calculate profile completeness
        completeness_score = 0
        if profile_data.get('firstName'):
            completeness_score += 20
        if profile_data.get('lastName'):
            completeness_score += 20
        if profile_data.get('email'):
            completeness_score += 20
        if profile_data.get('headline'):
            completeness_score += 20
        if profile_data.get('profilePicture'):
            completeness_score += 20
        
        signals['completeness'] = completeness_score
        
        # Assess headline quality
        headline = profile_data.get('headline', '')
        if headline:
            # Basic quality scoring
            if len(headline) > 20:
                signals['headline_quality'] += 30
            if any(keyword in headline.lower() for keyword in ['executive', 'director', 'manager', 'vp', 'president', 'chief']):
                signals['headline_quality'] += 40
            if any(keyword in headline.lower() for keyword in ['sap', 'oracle', 'dynamics', 'salesforce', 'qa', 'quality']):
                signals['headline_quality'] += 30
        
        return signals
    
    def calculate_linkedin_trust_score(self, profile_data):
        """Calculate LinkedIn-based trust score component (0-100)"""
        signals = self.extract_trust_signals(profile_data)
        
        # Weight the signals
        score = 0
        score += signals['completeness'] * 0.3  # 30% weight
        score += signals['headline_quality'] * 0.3  # 30% weight
        score += (100 if signals['professional_photo'] else 0) * 0.2  # 20% weight
        score += signals['network_strength'] * 0.2  # 20% weight
        
        return min(100, max(0, int(score)))

# Global instance
linkedin_auth = LinkedInAuth()