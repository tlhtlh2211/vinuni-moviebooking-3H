from flask import Blueprint, jsonify, request
from models import Movie, Showtime, Screen, Cinema
from extensions import db
from datetime import datetime

movies_bp = Blueprint('movies', __name__)

@movies_bp.route('/', methods=['GET'])
def get_all_movies():
    """Get all movies"""
    movies = Movie.query.all()
    return jsonify({
        'status': 'success',
        'data': [movie.to_dict() for movie in movies]
    }), 200

@movies_bp.route('/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    """Get a specific movie by ID"""
    movie = Movie.query.get_or_404(movie_id)
    movie_dict = movie.to_dict()
    
    # Get showtimes for this movie
    showtimes = Showtime.query.filter_by(movie_id=movie_id).all()
    showtimes_list = []
    
    for showtime in showtimes:
        showtime_dict = showtime.to_dict()
        
        # Get screen details
        screen = Screen.query.get(showtime.screen_id)
        if screen:
            showtime_dict['screen'] = {
                'screen_id': screen.screen_id,
                'name': screen.name,
                'screen_format': screen.screen_format
            }
            
            # Get cinema details
            cinema = Cinema.query.get(screen.cinema_id)
            if cinema:
                showtime_dict['cinema'] = {
                    'cinema_id': cinema.cinema_id,
                    'name': cinema.name,
                    'address': cinema.address,
                    'city': cinema.city
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
    movie = Movie.query.get_or_404(movie_id)
    
    # Get showtimes for this movie
    showtimes = Showtime.query.filter_by(movie_id=movie_id).all()
    showtimes_list = []
    
    for showtime in showtimes:
        showtime_dict = showtime.to_dict()
        
        # Get screen details
        screen = Screen.query.get(showtime.screen_id)
        if screen:
            showtime_dict['screen'] = {
                'screen_id': screen.screen_id,
                'name': screen.name,
                'screen_format': screen.screen_format
            }
            
            # Get cinema details
            cinema = Cinema.query.get(screen.cinema_id)
            if cinema:
                showtime_dict['cinema'] = {
                    'cinema_id': cinema.cinema_id,
                    'name': cinema.name,
                    'address': cinema.address,
                    'city': cinema.city
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
    
    movie = Movie(
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
    
    return jsonify(movie.to_dict()), 201
