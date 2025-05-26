#!/usr/bin/env python3
"""Add the hardcoded test users to the database"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from extensions import db
from models import Users
from werkzeug.security import generate_password_hash
from flask import Flask
from config import Config

# Create Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)

with app.app_context():
    # Check if users already exist
    user_exists = db.session.query(Users).filter_by(email='user@example.com').first()
    admin_exists = db.session.query(Users).filter_by(email='admin@example.com').first()
    
    if not user_exists:
        user = Users(
            email='user@example.com',
            password_hash=generate_password_hash('password123'),
            role='customer'
        )
        db.session.add(user)
        print('Created user@example.com')
    else:
        print('user@example.com already exists')
    
    if not admin_exists:
        admin = Users(
            email='admin@example.com',
            password_hash=generate_password_hash('admin123'),
            role='admin'
        )
        db.session.add(admin)
        print('Created admin@example.com')
    else:
        print('admin@example.com already exists')
    
    db.session.commit()
    print('Test users ready!')