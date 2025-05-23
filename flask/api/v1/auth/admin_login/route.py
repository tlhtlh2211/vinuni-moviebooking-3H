from flask import Blueprint, request, jsonify
from models import Users  # Changed from User to Users (DDL-first model)
from serializers import ModelSerializer
from extensions import db
from werkzeug.security import check_password_hash
from sqlalchemy import select

admin_login_bp = Blueprint('admin_login', __name__)

@admin_login_bp.route('/', methods=['POST'])
def admin_login():
    """Admin login endpoint"""
    data = request.json
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = db.session.execute(
        select(Users).where(Users.email == data['email'])
    ).scalar_one_or_none()
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Invalid admin credentials'}), 401
    
    if check_password_hash(user.password_hash, data['password']):
        return jsonify({
            'status': 'success',
            'data': ModelSerializer.serialize_users(user)
        }), 200
    
    return jsonify({'error': 'Invalid admin credentials'}), 401