from flask import Blueprint, jsonify, request
from extensions import db
from sqlalchemy import text
from .top_movies.route import top_movies_bp

analytics_bp = Blueprint('analytics', __name__)

# Register nested blueprint for top movies
analytics_bp.register_blueprint(top_movies_bp, url_prefix='/top-movies')

@analytics_bp.route('/revenue-summary', methods=['GET'])
def get_revenue_summary():
    """Get admin revenue summary from view"""
    # TODO: Add admin role check when authentication is implemented
    # For now, this endpoint is open but should be protected in production
    
    try:
        query = text("SELECT * FROM v_admin_revenue_summary")
        result = db.session.execute(query).first()
        
        if result:
            # Convert row to dictionary
            data = dict(result._mapping)
            
            # Convert Decimal values to float for JSON serialization
            for key, value in data.items():
                if hasattr(value, 'is_integer'):  # Check if it's a Decimal
                    data[key] = float(value)
            
            return jsonify({
                'status': 'success',
                'data': data
            }), 200
            
        return jsonify({
            'status': 'error',
            'message': 'No revenue data available'
        }), 404
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500