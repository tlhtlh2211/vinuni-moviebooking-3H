from flask import Blueprint, jsonify, request
from models import Movie, db

movie_detail_bp = Blueprint('movie_detail_bp', __name__)

@movie_detail_bp.route('/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    return jsonify(movie.to_dict())

@movie_detail_bp.route('/<int:movie_id>', methods=['PUT'])
def update_movie(movie_id):
    movie = Movie.query.get_or_404(movie_id)
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
    return jsonify(movie.to_dict())

@movie_detail_bp.route('/<int:movie_id>', methods=['DELETE'])
def delete_movie(movie_id):
    movie = Movie.query.get_or_404(movie_id)
    db.session.delete(movie)
    db.session.commit()
    return jsonify({'message': 'Movie deleted successfully'}) 