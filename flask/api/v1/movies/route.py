from flask import Blueprint, jsonify, request
from models import Movie
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
    return jsonify({
        'status': 'success',
        'data': movie.to_dict()
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
        status=data.get('status', 'open')
    )
    
    db.session.add(movie)
    db.session.commit()
    
    return jsonify(movie.to_dict()), 201
