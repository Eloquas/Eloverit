#!/usr/bin/env python3
"""
Eloquas AI - P2P Outbound Intelligence Platform
Main Flask application entry point
"""

import os
from datetime import datetime, timedelta
from flask import Flask, render_template, redirect, url_for, request, session, jsonify, flash
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
import json
import secrets

# Import our modules
from users import User, login_required, role_required, init_db
from scoring import calculate_trustscore, calculate_storyscore
from jobs_scraper import JobSignalScanner
from emailer import EmailEngine
from twilio_helper import SMSNotifier
from linkedin_auth import linkedin_auth

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(32))
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
Session(app)

# Initialize database
init_db()

# Initialize services
job_scanner = JobSignalScanner()
email_engine = EmailEngine()
sms_notifier = SMSNotifier()

@app.route('/')
def index():
    """Landing page - redirect to login or dashboard"""
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        email = request.form.get('email', '').lower()
        password = request.form.get('password')
        role = request.form.get('role', 'bdr')  # default to BDR
        company = request.form.get('company', '')
        
        # Validate inputs
        if not email or not password:
            flash('Email and password are required', 'error')
            return render_template('register.html')
        
        # Check if user exists
        user = User.get_by_email(email)
        if user:
            flash('Email already registered', 'error')
            return render_template('register.html')
        
        # Create new user
        try:
            new_user = User.create(
                email=email,
                password=password,
                role=role,
                company=company
            )
            
            # Log them in
            session['user_id'] = new_user.id
            session['user_email'] = new_user.email
            session['user_role'] = new_user.role
            session.permanent = True
            
            flash('Registration successful!', 'success')
            return redirect(url_for('dashboard'))
            
        except Exception as e:
            flash(f'Registration failed: {str(e)}', 'error')
            
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        email = request.form.get('email', '').lower()
        password = request.form.get('password')
        
        user = User.get_by_email(email)
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['user_email'] = user.email
            session['user_role'] = user.role
            session.permanent = True
            
            flash('Welcome back!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password', 'error')
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    """User logout"""
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

@app.route('/auth/linkedin')
def linkedin_login():
    """Initiate LinkedIn OAuth flow"""
    auth_url = linkedin_auth.get_authorization_url()
    if not linkedin_auth.client_id:
        flash('LinkedIn integration not configured. Please set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables.', 'error')
        return redirect(url_for('login'))
    return redirect(auth_url)

@app.route('/auth/linkedin/callback')
def linkedin_callback():
    """Handle LinkedIn OAuth callback"""
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    
    if error:
        flash(f'LinkedIn authentication failed: {error}', 'error')
        return redirect(url_for('login'))
    
    if not code:
        flash('LinkedIn authentication failed: No authorization code received', 'error')
        return redirect(url_for('login'))
    
    # Exchange code for access token and get profile
    profile_data, error = linkedin_auth.handle_callback(code, state)
    
    if error:
        flash(f'LinkedIn authentication error: {error}', 'error')
        return redirect(url_for('login'))
    
    if profile_data:
        # Check if user exists with this LinkedIn email
        email = profile_data.get('email')
        if email:
            user = User.get_by_email(email)
            if not user:
                # Create new user from LinkedIn profile
                user = User.create(
                    email=email,
                    password=generate_password_hash(secrets.token_hex(16)),  # Random password since they'll use LinkedIn
                    role='bdr',
                    company=''
                )
                user = User.get_by_email(email)
            
            if user:
                # Log them in
                session['user_id'] = user.id
                session['user_email'] = user.email
                session['user_role'] = user.role
                session['linkedin_profile'] = profile_data
                User.update_last_login(user.email)
                
                flash(f'Successfully logged in via LinkedIn as {profile_data.get("firstName")} {profile_data.get("lastName")}', 'success')
                return redirect(url_for('dashboard'))
        
        flash('Could not retrieve email from LinkedIn profile', 'error')
    else:
        flash('Failed to retrieve LinkedIn profile', 'error')
    
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard - shows signals, prospects, and scores"""
    user_id = session.get('user_id')
    
    # Get user's prospects
    prospects = User.get_prospects(user_id)
    
    # Get recent signals
    signals = job_scanner.get_user_signals(user_id, limit=10)
    
    # Calculate average trust score
    avg_trustscore = 0
    if prospects:
        scores = []
        for prospect in prospects[:5]:  # Sample first 5
            score = calculate_trustscore(prospect, user_id, signals[0] if signals else None)
            scores.append(score)
        avg_trustscore = sum(scores) / len(scores) if scores else 0
    
    # Get email queue status
    email_queue = email_engine.get_queue_status(user_id)
    
    return render_template('dashboard.html',
                         prospects=prospects,
                         signals=signals,
                         avg_trustscore=avg_trustscore,
                         email_queue=email_queue)

@app.route('/upload-prospects', methods=['GET', 'POST'])
@login_required
def upload_prospects():
    """Upload CSV of prospects"""
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file uploaded', 'error')
            return redirect(request.url)
            
        file = request.files['file']
        if file.filename == '':
            flash('No file selected', 'error')
            return redirect(request.url)
            
        if file and file.filename.endswith('.csv'):
            try:
                # Process CSV
                import pandas as pd
                df = pd.read_csv(file)
                
                # Validate required columns
                required_cols = ['name', 'email', 'title', 'company']
                if not all(col in df.columns for col in required_cols):
                    flash(f'CSV must contain columns: {", ".join(required_cols)}', 'error')
                    return redirect(request.url)
                
                # Add prospects
                user_id = session.get('user_id')
                added = 0
                duplicates = 0
                
                for _, row in df.iterrows():
                    prospect = {
                        'name': row['name'],
                        'email': row['email'],
                        'title': row['title'],
                        'company': row['company'],
                        'domain': row.get('domain', '')
                    }
                    
                    if User.add_prospect(user_id, prospect):
                        added += 1
                    else:
                        duplicates += 1
                
                flash(f'Added {added} prospects ({duplicates} duplicates skipped)', 'success')
                return redirect(url_for('dashboard'))
                
            except Exception as e:
                flash(f'Error processing file: {str(e)}', 'error')
        else:
            flash('Please upload a CSV file', 'error')
            
    return render_template('upload_prospects.html')

@app.route('/signals')
@login_required
def signals():
    """View all job signals"""
    user_id = session.get('user_id')
    all_signals = job_scanner.get_user_signals(user_id, limit=50)
    
    # Group by company
    by_company = {}
    for signal in all_signals:
        company = signal.get('company', 'Unknown')
        if company not in by_company:
            by_company[company] = []
        by_company[company].append(signal)
    
    return render_template('signals.html', signals_by_company=by_company)

@app.route('/compose-email/<prospect_id>')
@login_required
def compose_email(prospect_id):
    """Email composition with TrustScore and StoryScore"""
    user_id = session.get('user_id')
    
    # Get prospect
    prospects = User.get_prospects(user_id)
    prospect = next((p for p in prospects if p['id'] == prospect_id), None)
    
    if not prospect:
        flash('Prospect not found', 'error')
        return redirect(url_for('dashboard'))
    
    # Get latest signal for this company
    signals = job_scanner.get_company_signals(prospect['company'])
    latest_signal = signals[0] if signals else None
    
    # Calculate trust score
    trustscore = calculate_trustscore(prospect, user_id, latest_signal)
    
    # Get trust score components including LinkedIn data
    from scoring import get_trust_components
    trust_components = get_trust_components(prospect, user_id, latest_signal)
    
    # Check if user has LinkedIn connected
    linkedin_profile = linkedin_auth.get_user_profile(user_id)
    linkedin_trust_score = None
    if linkedin_profile:
        linkedin_trust_score = linkedin_auth.calculate_linkedin_trust_score(linkedin_profile)
    
    # Get enhancement mode settings from query params or session
    trustbuild = request.args.get('trustbuild', 'false').lower() == 'true'
    storybuild = request.args.get('storybuild', 'false').lower() == 'true'
    
    # Generate email template or sequence
    email_sequence = None
    if trustbuild or storybuild:
        email_sequence = email_engine.generate_template(
            prospect, latest_signal, trustbuild, storybuild, user_id
        )
        # For single template mode, extract first email
        email_template = email_sequence[0] if email_sequence else None
    else:
        email_template = email_engine.generate_template(prospect, latest_signal)
    
    return render_template('compose_email.html',
                         prospect=prospect,
                         signal=latest_signal,
                         trustscore=trustscore,
                         trust_components=trust_components,
                         linkedin_profile=linkedin_profile,
                         linkedin_trust_score=linkedin_trust_score,
                         email_template=email_template,
                         trustbuild=trustbuild,
                         storybuild=storybuild,
                         email_sequence=email_sequence)

@app.route('/send-email', methods=['POST'])
@login_required
def send_email():
    """Queue email for sending"""
    user_id = session.get('user_id')
    prospect_id = request.form.get('prospect_id')
    subject = request.form.get('subject')
    body = request.form.get('body')
    
    # Calculate story score
    storyscore = calculate_storyscore(body)
    
    # Check deliverability
    spam_score = email_engine.check_spam_score(subject, body)
    
    if spam_score > 5:
        flash(f'Email blocked - spam score too high ({spam_score})', 'error')
        return jsonify({'success': False, 'error': 'Spam score too high'})
    
    # Queue email
    email_id = email_engine.queue_email(
        user_id=user_id,
        prospect_id=prospect_id,
        subject=subject,
        body=body,
        storyscore=storyscore
    )
    
    flash('Email queued for sending', 'success')
    return jsonify({'success': True, 'email_id': email_id})

@app.route('/admin/users')
@login_required
@role_required('admin')
def admin_users():
    """Admin view - manage users"""
    all_users = User.get_all_users()
    return render_template('admin_users.html', users=all_users)

@app.route('/admin/signals')
@login_required
@role_required('admin')
def admin_signals():
    """Admin view - all signals across system"""
    all_signals = job_scanner.get_all_signals(limit=100)
    return render_template('admin_signals.html', signals=all_signals)

@app.route('/api/trustscore/<prospect_id>')
@login_required
def api_trustscore(prospect_id):
    """API endpoint for real-time trust score calculation"""
    user_id = session.get('user_id')
    prospects = User.get_prospects(user_id)
    prospect = next((p for p in prospects if p['id'] == prospect_id), None)
    
    if not prospect:
        return jsonify({'error': 'Prospect not found'}), 404
    
    signals = job_scanner.get_company_signals(prospect['company'])
    latest_signal = signals[0] if signals else None
    
    score = calculate_trustscore(prospect, user_id, latest_signal)
    
    return jsonify({
        'prospect_id': prospect_id,
        'trustscore': score,
        'signal': latest_signal,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/storyscore', methods=['POST'])
@login_required
def api_storyscore():
    """API endpoint for story score calculation"""
    body = request.json.get('body', '')
    score = calculate_storyscore(body)
    
    return jsonify({
        'storyscore': score,
        'max_score': 20,
        'percentage': (score / 20) * 100
    })

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500

if __name__ == '__main__':
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)