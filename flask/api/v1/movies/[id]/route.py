from flask import Blueprint, jsonify, request
from models import Movies  # Updated to DDL-first model
from serializers import ModelSerializer
from extensions import db

movie_detail_bp = Blueprint('movie_detail_bp', __name__)

@movie_detail_bp.route('/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    movie = db.session.get(Movies, movie_id)
    if not movie:
        return jsonify({'error': 'Movie not found'}), 404
    return jsonify(ModelSerializer.serialize_movies(movie))

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