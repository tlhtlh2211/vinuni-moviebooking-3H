from flask import Blueprint, jsonify, request
from extensions import db
from models import Showtimes, Movies, Screens, Cinemas, Reservations
from serializers import ModelSerializer
from sqlalchemy import select, and_, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from datetime import datetime

showtimes_bp = Blueprint('admin_showtimes', __name__)

@showtimes_bp.route('/<int:showtime_id>', methods=['DELETE'])
def delete_showtime(showtime_id):
    """Delete a showtime and all related data
    
    This will cascade delete:
    - All reservations for this showtime
    - All tickets associated with those reservations
    - All seat locks for this showtime
    """
    # TODO: Add admin role check when authentication is implemented
    
    try:
        # Start transaction
        with db.session.begin():
            # Find the showtime first
            showtime = db.session.get(Showtimes, showtime_id)
            
            if not showtime:
                return jsonify({
                    'status': 'error',
                    'message': 'Showtime not found'
                }), 404
            
            # Get showtime details for response before deletion
            showtime_data = {
                'showtime_id': showtime.showtime_id,
                'movie_id': showtime.movie_id,
                'screen_id': showtime.screen_id,
                'start_time': showtime.start_time.isoformat(),
                'end_time': showtime.end_time.isoformat()
            }
            
            # Get count of affected reservations for warning
            reservation_count = db.session.execute(
                select(db.func.count(Reservations.reservation_id))
                .where(Reservations.showtime_id == showtime_id)
            ).scalar()
            
            # Delete the showtime - cascades will handle related data
            db.session.delete(showtime)
            
        # If we get here, deletion was successful
        response_data = {
            'status': 'success',
            'message': f'Showtime deleted successfully',
            'data': {
                'deleted_showtime': showtime_data,
                'affected_reservations': reservation_count
            }
        }
        
        if reservation_count > 0:
            response_data['warning'] = f'{reservation_count} reservations were cancelled'
            
        return jsonify(response_data), 200
        
    except IntegrityError as e:
        db.session.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        return jsonify({
            'status': 'error',
            'message': 'Cannot delete showtime due to database constraints',
            'details': error_msg
        }), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete showtime',
            'details': str(e)
        }), 500


@showtimes_bp.route('/<int:showtime_id>', methods=['GET'])
def get_showtime_details(showtime_id):
    """Get detailed information about a showtime
    
    Returns showtime details including movie and screen information
    """
    # TODO: Add admin role check when authentication is implemented
    
    try:
        # Query showtime with related data
        result = db.session.execute(
            select(
                Showtimes,
                Movies.title.label('movie_title'),
                Movies.duration.label('movie_duration'),
                Screens.name.label('screen_name'),
                Screens.screen_format,
                Cinemas.name.label('cinema_name'),
                Cinemas.cinema_id
            )
            .join(Movies, Movies.movie_id == Showtimes.movie_id)
            .join(Screens, Screens.screen_id == Showtimes.screen_id)
            .join(Cinemas, Cinemas.cinema_id == Screens.cinema_id)
            .where(Showtimes.showtime_id == showtime_id)
        ).first()
        
        if not result:
            return jsonify({
                'status': 'error',
                'message': 'Showtime not found'
            }), 404
        
        showtime = result[0]
        
        # Get reservation count
        reservation_count = db.session.execute(
            select(db.func.count(Reservations.reservation_id))
            .where(
                and_(
                    Reservations.showtime_id == showtime_id,
                    Reservations.status == 'confirmed'
                )
            )
        ).scalar()
        
        return jsonify({
            'status': 'success',
            'data': {
                'showtime_id': showtime.showtime_id,
                'movie_id': showtime.movie_id,
                'movie_title': result.movie_title,
                'movie_duration': result.movie_duration,
                'screen_id': showtime.screen_id,
                'screen_name': result.screen_name,
                'screen_format': result.screen_format,
                'cinema_id': result.cinema_id,
                'cinema_name': result.cinema_name,
                'start_time': showtime.start_time.isoformat(),
                'end_time': showtime.end_time.isoformat(),
                'confirmed_reservations': reservation_count
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch showtime details',
            'details': str(e)
        }), 500