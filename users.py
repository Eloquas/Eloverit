"""
User management, authentication, and RBAC for Eloquas AI
"""

import os
import json
import hashlib
from datetime import datetime
from functools import wraps
from flask import session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

# Simulate Replit DB with JSON files
DB_PATH = os.path.join(os.path.dirname(__file__), 'db')
os.makedirs(DB_PATH, exist_ok=True)

USERS_DB = os.path.join(DB_PATH, 'users.json')
PROSPECTS_DB = os.path.join(DB_PATH, 'prospects.json')

def init_db():
    """Initialize database files if they don't exist"""
    if not os.path.exists(USERS_DB):
        with open(USERS_DB, 'w') as f:
            json.dump({}, f)
    
    if not os.path.exists(PROSPECTS_DB):
        with open(PROSPECTS_DB, 'w') as f:
            json.dump({}, f)

def load_db(db_file):
    """Load data from JSON database file"""
    try:
        with open(db_file, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_db(db_file, data):
    """Save data to JSON database file"""
    with open(db_file, 'w') as f:
        json.dump(data, f, indent=2)

class User:
    """User model with authentication and data management"""
    
    def __init__(self, user_data):
        self.id = user_data.get('id')
        self.email = user_data.get('email')
        self.password_hash = user_data.get('password_hash')
        self.role = user_data.get('role', 'bdr')  # admin, ae, bdr
        self.company = user_data.get('company', '')
        self.created_at = user_data.get('created_at')
        self.last_login = user_data.get('last_login')
        self.is_active = user_data.get('is_active', True)
        
    def check_password(self, password):
        """Verify password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary for storage"""
        return {
            'id': self.id,
            'email': self.email,
            'password_hash': self.password_hash,
            'role': self.role,
            'company': self.company,
            'created_at': self.created_at,
            'last_login': self.last_login,
            'is_active': self.is_active
        }
    
    @staticmethod
    def create(email, password, role='bdr', company=''):
        """Create a new user"""
        users = load_db(USERS_DB)
        
        # Check if email already exists
        if email in users:
            raise ValueError('Email already registered')
        
        # Create user ID
        user_id = hashlib.md5(email.encode()).hexdigest()[:8]
        
        # Create user object
        user_data = {
            'id': user_id,
            'email': email,
            'password_hash': generate_password_hash(password),
            'role': role,
            'company': company,
            'created_at': datetime.now().isoformat(),
            'last_login': None,
            'is_active': True
        }
        
        # Save to database
        users[email] = user_data
        save_db(USERS_DB, users)
        
        return User(user_data)
    
    @staticmethod
    def get_by_email(email):
        """Get user by email"""
        users = load_db(USERS_DB)
        if email in users:
            return User(users[email])
        return None
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        users = load_db(USERS_DB)
        for email, user_data in users.items():
            if user_data.get('id') == user_id:
                return User(user_data)
        return None
    
    @staticmethod
    def update_last_login(email):
        """Update user's last login timestamp"""
        users = load_db(USERS_DB)
        if email in users:
            users[email]['last_login'] = datetime.now().isoformat()
            save_db(USERS_DB, users)
    
    @staticmethod
    def get_all_users():
        """Get all users (admin only)"""
        users = load_db(USERS_DB)
        return [User(data) for data in users.values()]
    
    @staticmethod
    def get_prospects(user_id):
        """Get prospects for a specific user"""
        prospects = load_db(PROSPECTS_DB)
        user_prospects = prospects.get(user_id, [])
        return user_prospects
    
    @staticmethod
    def add_prospect(user_id, prospect_data):
        """Add a prospect for a user"""
        prospects = load_db(PROSPECTS_DB)
        
        if user_id not in prospects:
            prospects[user_id] = []
        
        # Check for duplicates by email
        existing_emails = [p['email'] for p in prospects[user_id]]
        if prospect_data['email'] in existing_emails:
            return False  # Duplicate
        
        # Add prospect with ID
        prospect_data['id'] = hashlib.md5(
            f"{user_id}{prospect_data['email']}".encode()
        ).hexdigest()[:8]
        prospect_data['added_at'] = datetime.now().isoformat()
        prospect_data['user_id'] = user_id
        
        prospects[user_id].append(prospect_data)
        save_db(PROSPECTS_DB, prospects)
        
        return True
    
    @staticmethod
    def get_prospect_by_id(user_id, prospect_id):
        """Get a specific prospect"""
        prospects = User.get_prospects(user_id)
        for prospect in prospects:
            if prospect.get('id') == prospect_id:
                return prospect
        return None
    
    @staticmethod
    def delete_prospect(user_id, prospect_id):
        """Delete a prospect"""
        prospects = load_db(PROSPECTS_DB)
        if user_id in prospects:
            prospects[user_id] = [
                p for p in prospects[user_id] 
                if p.get('id') != prospect_id
            ]
            save_db(PROSPECTS_DB, prospects)
            return True
        return False

# Decorators for authentication and authorization
def login_required(f):
    """Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(role):
    """Decorator to require specific role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_role' not in session:
                flash('Access denied', 'error')
                return redirect(url_for('dashboard'))
            
            user_role = session.get('user_role')
            
            # Admin can access everything
            if user_role == 'admin':
                return f(*args, **kwargs)
            
            # Check specific role
            if user_role != role:
                flash('Access denied - insufficient privileges', 'error')
                return redirect(url_for('dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def owns_resource(resource_type):
    """Decorator to ensure user owns the resource"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = session.get('user_id')
            
            if resource_type == 'prospect':
                prospect_id = kwargs.get('prospect_id')
                prospect = User.get_prospect_by_id(user_id, prospect_id)
                if not prospect:
                    flash('Resource not found', 'error')
                    return redirect(url_for('dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator