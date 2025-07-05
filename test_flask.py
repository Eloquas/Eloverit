#!/usr/bin/env python3
"""Test Flask installation"""

try:
    from flask import Flask
    print("✓ Flask imported successfully")
    
    app = Flask(__name__)
    
    @app.route('/')
    def hello():
        return "Flask is working!"
    
    print("✓ Flask app created")
    print("Flask test passed!")
    
except Exception as e:
    print(f"Error: {e}")
    import sys
    sys.exit(1)