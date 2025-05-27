from flask import Blueprint, jsonify, request
from models import Movies, Showtimes  # Updated to DDL-first model
from serializers import ModelSerializer
from extensions import db
from datetime import datetime

movie_detail_bp = Blueprint('movie_detail_bp', __name__)

@movie_detail_bp.route('/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    movie = db.session.get(Movies, movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404
    
    # Get the include_showtimes parameter
    include_showtimes = request.args.get('include_showtimes', 'false').lower() == 'true'
    
    movie_data = ModelSerializer.serialize_movies(movie)
    
    if include_showtimes:
        # Get all future showtimes for this movie with eager loading
        from sqlalchemy.orm import joinedload
        showtimes = db.session.query(Showtimes).options(
            joinedload(Showtimes.screen).joinedload('cinema')
        ).filter(
            Showtimes.movie_id == movie_id,
            Showtimes.start_time >= datetime.now()
        ).order_by(Showtimes.start_time).all()
        
        # Serialize showtimes with screen and cinema information
        showtimes_data = []
        for showtime in showtimes:
            showtime_data = ModelSerializer.serialize_showtimes(showtime)
            # Add screen information with eager-loaded data
            if hasattr(showtime, 'screen') and showtime.screen:
                showtime_data['screen'] = ModelSerializer.serialize_screens(showtime.screen)
                # Override screen_format with format for frontend compatibility
                showtime_data['screen']['format'] = showtime_data['screen'].pop('screen_format', None)
            # Add cinema information
            if hasattr(showtime.screen, 'cinema') and showtime.screen.cinema:
                showtime_data['cinema'] = ModelSerializer.serialize_cinemas(showtime.screen.cinema)
            showtimes_data.append(showtime_data)
        
        movie_data['showtimes'] = showtimes_data
    
    return jsonify(movie_data)

@movie_detail_bp.route('/<int:movie_id>', methods=['PUT'])
def update_movie(movie_id):
    movie = db.session.get(Movies, movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404
        
    data = request.json
    
    if 'title' in data:
        movie.title = data['title']
    if 'duration' in data:
        movie.duration = data['duration']
    if 'rating' in data:
        movie.rating = data['rating']
    if 'release_date' in data:
        movie.release_date = data['release_date']
    if 'status' in data:
        movie.status = data['status']
        
    db.session.commit()
    return jsonify(ModelSerializer.serialize_movies(movie))

@movie_detail_bp.route('/<int:movie_id>', methods=['DELETE'])
def delete_movie(movie_id):
    movie = db.session.get(Movies, movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404
        
    db.session.delete(movie)
    db.session.commit()
    return jsonify({'message': 'Movie deleted successfully'}) 