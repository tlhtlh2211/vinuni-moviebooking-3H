from flask import Blueprint, jsonify, request
from models import Movies, Showtimes, Screens, Cinemas  # Updated to DDL-first models
from serializers import ModelSerializer
from extensions import db
from datetime import datetime
from sqlalchemy import select, text

movies_bp = Blueprint('movies', __name__)

@movies_bp.route('/', methods=['GET'])
def get_all_movies():
    """Get all movies"""
    movies = db.session.execute(select(Movies)).scalars().all()
    return jsonify({
        'status': 'success',
        'data': ModelSerializer.serialize_movies_list(movies)
    }), 200

@movies_bp.route('/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    """Get a specific movie by ID"""
    movie = db.session.get(Movies, movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404
        
    movie_dict = ModelSerializer.serialize_movies(movie)
    
    # Get active showtimes for this movie using the view
    showtimes_query = text("""
        SELECT 
            showtime_id,
            movie_id,
            screen_id,
            start_time,
            end_time,
            screen_name,
            screen_format,
            cinema_id,
            cinema_name,
            cinema_address,
            cinema_city
        FROM v_active_showtimes_details
        WHERE movie_id = :movie_id
        ORDER BY start_time
    """)
    
    showtimes_result = db.session.execute(showtimes_query, {'movie_id': movie_id})
    showtimes_list = []
    
    for row in showtimes_result:
        showtime_dict = {
            'showtime_id': row.showtime_id,
            'movie_id': row.movie_id,
            'screen_id': row.screen_id,
            'start_time': row.start_time.isoformat(),
            'end_time': row.end_time.isoformat(),
            'movie_title': movie.title,
            'screen': {
                'screen_id': row.screen_id,
                'cinema_id': row.cinema_id,
                'name': row.screen_name,
                'screen_format': row.screen_format
            },
            'cinema': {
                'cinema_id': row.cinema_id,
                'name': row.cinema_name,
                'address': row.cinema_address,
                'city': row.cinema_city
            }
        }
        showtimes_list.append(showtime_dict)
    
    movie_dict['showtimes'] = showtimes_list
    
    return jsonify({
        'status': 'success',
        'data': movie_dict
    }), 200

@movies_bp.route('/<int:movie_id>/showtimes', methods=['GET'])
def get_movie_showtimes(movie_id):
    """Get all showtimes for a specific movie"""
    # Check if movie exists
    movie = db.session.get(Movies, movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404
    
    # Get active showtimes for this movie using the view
    showtimes_query = text("""
        SELECT 
            showtime_id,
            movie_id,
            screen_id,
            start_time,
            end_time,
            screen_name,
            screen_format,
            cinema_id,
            cinema_name,
            cinema_address,
            cinema_city
        FROM v_active_showtimes_details
        WHERE movie_id = :movie_id
        ORDER BY start_time
    """)
    
    showtimes_result = db.session.execute(showtimes_query, {'movie_id': movie_id})
    showtimes_list = []
    
    for row in showtimes_result:
        showtime_dict = {
            'showtime_id': row.showtime_id,
            'movie_id': row.movie_id,
            'screen_id': row.screen_id,
            'start_time': row.start_time.isoformat(),
            'end_time': row.end_time.isoformat(),
            'movie_title': movie.title,
            'screen': {
                'screen_id': row.screen_id,
                'cinema_id': row.cinema_id,
                'name': row.screen_name,
                'screen_format': row.screen_format
            },
            'cinema': {
                'cinema_id': row.cinema_id,
                'name': row.cinema_name,
                'address': row.cinema_address,
                'city': row.cinema_city
            }
        }
        showtimes_list.append(showtime_dict)
    
    return jsonify({
        'status': 'success',
        'data': showtimes_list
    }), 200

@movies_bp.route('/', methods=['POST'])
def create_movie():
    data = request.json
    
    # Validate required fields
    required_fields = ['title', 'duration', 'rating', 'release_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Parse date if it's a string
    release_date = data['release_date']
    if isinstance(release_date, str):
        try:
            release_date = datetime.strptime(release_date, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    movie = Movies(
        title=data['title'],
        duration=data['duration'],
        rating=data['rating'],
        release_date=release_date,
        status=data.get('status', 'open'),
        description=data.get('description'),
        director=data.get('director'),
        cast=data.get('cast'),
        genre=data.get('genre'),
        poster_url=data.get('poster_url')
    )
    
    db.session.add(movie)
    db.session.commit()
    
    return jsonify(ModelSerializer.serialize_movies(movie)), 201
