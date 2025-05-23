from flask import Blueprint, request, jsonify
from models import Users  # Changed from User to Users (DDL-first model)
from serializers import ModelSerializer
from extensions import db
from werkzeug.security import check_password_hash

login_bp = Blueprint('login', __name__)

@login_bp.route('/', methods=['POST'])
def login():
    """Customer login endpoint"""
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = Users.query.filter_by(email=data['email']).first()
    
    if not user or user.role != 'customer':
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if check_password_hash(user.password_hash, data['password']):
        return jsonify({
            'status': 'success',
            'data': ModelSerializer.serialize_users(user)
        }), 200
    
    return jsonify({'error': 'Invalid email or password'}), 401
