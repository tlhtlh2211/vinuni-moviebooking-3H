from flask import Blueprint, jsonify, request
from extensions import db
from sqlalchemy import text

top_movies_bp = Blueprint('top_movies', __name__)

@top_movies_bp.route('/', methods=['GET'])
def get_top_movies():
    """Get top performing movies with various sorting options"""
    limit = request.args.get('limit', 10, type=int)
    sort_by = request.args.get('sort_by', 'composite_score')
    genre = request.args.get('genre')
    
    # Validate sort_by parameter
    valid_sorts = {
        'composite_score': 'composite_performance_score DESC',
        'revenue': 'total_revenue DESC',
        'occupancy': 'avg_occupancy_rate_percent DESC',
        'volume': 'total_tickets_sold DESC'
    }
    
    sort_column = valid_sorts.get(sort_by, 'composite_performance_score DESC')
    
    query = f"""
    SELECT 
        movie_id,
        title,
        genre,
        director,
        rating,
        poster_url,
        total_showtimes,
        total_tickets_sold,
        total_revenue,
        avg_revenue_per_showtime,
        avg_ticket_price,
        avg_occupancy_rate_percent,
        revenue_efficiency,
        composite_performance_score,
        revenue_rank_score,
        occupancy_rank_score,
        volume_rank_score,
        ROW_NUMBER() OVER (ORDER BY {sort_column}) AS rank_position
    FROM v_top_performing_movies
    WHERE 1=1
    """
    
    params = {'limit': limit}
    
    if genre:
        query += " AND genre = :genre"
        params['genre'] = genre
    
    query += f" ORDER BY {sort_column} LIMIT :limit"
    
    try:
        result = db.session.execute(text(query), params)
        movies = []
        for row in result:
            movie_data = dict(row._mapping)
            # Convert Decimal types to float for JSON serialization
            for key in ['total_revenue', 'avg_revenue_per_showtime', 'avg_ticket_price', 
                       'avg_occupancy_rate_percent', 'revenue_efficiency', 
                       'composite_performance_score', 'revenue_rank_score',
                       'occupancy_rank_score', 'volume_rank_score']:
                if key in movie_data and movie_data[key] is not None:
                    movie_data[key] = float(movie_data[key])
            movies.append(movie_data)
        
        return jsonify({
            'status': 'success',
            'data': movies
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@top_movies_bp.route('/genres', methods=['GET'])
def get_genres():
    """Get list of unique genres for filtering"""
    try:
        query = """
        SELECT DISTINCT genre 
        FROM movies 
        WHERE genre IS NOT NULL AND status = 'open'
        ORDER BY genre
        """
        result = db.session.execute(text(query))
        genres = [row.genre for row in result]
        
        return jsonify({
            'status': 'success',
            'data': genres
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500