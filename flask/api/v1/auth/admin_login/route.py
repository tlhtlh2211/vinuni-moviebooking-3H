from flask import Blueprint, request, jsonify
from models import User
from extensions import db
from werkzeug.security import check_password_hash

admin_login_bp = Blueprint('admin_login', __name__)

@admin_login_bp.route('/', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if check_password_hash(user.password_hash, data['password']):
        return jsonify({
            'status': 'success',
            'data': {
                'user_id': user.user_id,
                'email': user.email,
                'role': user.role
            }
        }), 200
    
    return jsonify({'error': 'Invalid email or password'}), 401