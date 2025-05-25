from flask import Blueprint, jsonify, request
from extensions import db
from sqlalchemy import text

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/revenue-summary', methods=['GET'])
def get_revenue_summary():
    """Get admin revenue summary dashboard data"""
    # Admin access is now handled by frontend routing
    
    try:
        # Execute the view query
        query = text("SELECT * FROM v_admin_revenue_summary")
        result = db.session.execute(query).first()
        
        if result:
            # Convert Row object to dictionary
            data = dict(result._mapping)
            
            # Convert Decimal values to float for JSON serialization
            for key, value in data.items():
                if value is not None and hasattr(value, 'is_integer'):
                    # This handles Decimal types
                    data[key] = float(value)
            
            return jsonify({
                'status': 'success',
                'data': data
            }), 200
        
        # Return empty data if no results
        return jsonify({
            'status': 'success',
            'data': {
                'revenue_today': 0,
                'revenue_this_week': 0,
                'revenue_this_month': 0,
                'revenue_total': 0,
                'tickets_today': 0,
                'tickets_this_week': 0,
                'tickets_this_month': 0,
                'tickets_total': 0,
                'avg_price_today': 0,
                'avg_price_this_week': 0,
                'avg_price_this_month': 0,
                'revenue_standard_seats': 0,
                'revenue_premium_seats': 0,
                'revenue_2d': 0,
                'revenue_3d': 0,
                'revenue_imax': 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': f'Failed to fetch revenue summary: {str(e)}'
        }), 500