from flask import Blueprint, jsonify, request
from extensions import db
from models import Movies, Showtimes, Screens, Cinemas
from serializers import ModelSerializer
from sqlalchemy import select, and_, or_
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

movies_bp = Blueprint('admin_movies', __name__)

@movies_bp.route('/', methods=['POST'])
def create_movie():
    """Create a new movie with optional showtimes"""
    # TODO: Add admin role check when authentication is implemented
    # For now, this endpoint is open but should be protected in production
    
    try:
        data = request.json
        
        # Validate required movie fields
        movie_data = data.get('movie', {})
        if not movie_data.get('title'):
            return jsonify({'status': 'error', 'message': 'Movie title is required'}), 400
        if not movie_data.get('duration') or movie_data['duration'] < 1:
            return jsonify({'status': 'error', 'message': 'Valid duration is required'}), 400
        if not movie_data.get('rating'):
            return jsonify({'status': 'error', 'message': 'Rating is required'}), 400
        if not movie_data.get('release_date'):
            return jsonify({'status': 'error', 'message': 'Release date is required'}), 400
        
        # Start transaction
        with db.session.begin():
            # Create movie
            movie = Movies(
                title=movie_data['title'],
                duration=movie_data['duration'],
                rating=movie_data['rating'],
                release_date=movie_data['release_date'],
                status=movie_data.get('status', 'open'),
                description=movie_data.get('description'),
                director=movie_data.get('director'),
                cast=movie_data.get('cast'),
                genre=movie_data.get('genre'),
                poster_url=movie_data.get('poster_url')
            )
            db.session.add(movie)
            db.session.flush()  # Get movie_id without committing
            
            created_showtimes = []
            
            # Process showtimes if provided
            showtimes_data = data.get('showtimes', [])
            if showtimes_data:
                # Validate showtimes for conflicts
                for showtime in showtimes_data:
                    screen_id = showtime.get('screen_id')
                    start_time = datetime.fromisoformat(showtime.get('start_time'))
                    end_time = start_time + timedelta(minutes=movie.duration)
                    
                    # Check for conflicts
                    conflict = db.session.execute(
                        select(Showtimes).where(
                            and_(
                                Showtimes.screen_id == screen_id,
                                or_(
                                    and_(
                                        Showtimes.start_time < end_time,
                                        Showtimes.end_time > start_time
                                    )
                                )
                            )
                        )
                    ).first()
                    
                    if conflict:
                        return jsonify({
                            'status': 'error',
                            'message': f'Showtime conflicts with existing booking on screen {screen_id}'
                        }), 400
                    
                    # Create showtime
                    new_showtime = Showtimes(
                        movie_id=movie.movie_id,
                        screen_id=screen_id,
                        start_time=start_time,
                        end_time=end_time
                    )
                    db.session.add(new_showtime)
                    created_showtimes.append(new_showtime)
        
        # If we get here, everything succeeded
        response_data = {
            'status': 'success',
            'data': {
                'movie': ModelSerializer.serialize_movies(movie),
                'showtimes_created': len(created_showtimes)
            }
        }
        
        if created_showtimes:
            response_data['message'] = f'Movie "{movie.title}" created with {len(created_showtimes)} showtimes'
        else:
            response_data['message'] = f'Movie "{movie.title}" created successfully'
        
        return jsonify(response_data), 201
        
    except IntegrityError as e:
        db.session.rollback()
        if 'Duplicate entry' in str(e):
            return jsonify({'status': 'error', 'message': 'A movie with this title may already exist'}), 400
        return jsonify({'status': 'error', 'message': 'Database integrity error'}), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500


@movies_bp.route('/check-conflicts', methods=['POST'])
def check_showtime_conflicts():
    """Check if proposed showtimes would conflict with existing ones"""
    # TODO: Add admin role check when authentication is implemented
    
    try:
        data = request.json
        duration = data.get('duration')
        showtimes = data.get('showtimes', [])
        
        if not duration or not showtimes:
            return jsonify({'status': 'error', 'message': 'Duration and showtimes required'}), 400
        
        conflicts = []
        
        for showtime in showtimes:
            screen_id = showtime.get('screen_id')
            start_time = datetime.fromisoformat(showtime.get('start_time'))
            end_time = start_time + timedelta(minutes=duration)
            
            # Find conflicts
            existing = db.session.execute(
                select(Showtimes, Movies).join(Movies).where(
                    and_(
                        Showtimes.screen_id == screen_id,
                        or_(
                            and_(
                                Showtimes.start_time < end_time,
                                Showtimes.end_time > start_time
                            )
                        )
                    )
                )
            ).all()
            
            if existing:
                for st, movie in existing:
                    conflicts.append({
                        'screen_id': screen_id,
                        'requested_time': start_time.isoformat(),
                        'conflicting_movie': movie.title,
                        'conflict_start': st.start_time.isoformat(),
                        'conflict_end': st.end_time.isoformat()
                    })
        
        return jsonify({
            'status': 'success',
            'has_conflicts': len(conflicts) > 0,
            'conflicts': conflicts
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@movies_bp.route('/cinemas-screens', methods=['GET'])
def get_cinemas_and_screens():
    """Get all cinemas with their screens for showtime scheduling"""
    # TODO: Add admin role check when authentication is implemented
    
    try:
        # Get all cinemas with their screens
        cinemas = db.session.execute(
            select(Cinemas).order_by(Cinemas.name)
        ).scalars().all()
        
        result = []
        for cinema in cinemas:
            screens = db.session.execute(
                select(Screens).where(Screens.cinema_id == cinema.cinema_id).order_by(Screens.name)
            ).scalars().all()
            
            result.append({
                'cinema_id': cinema.cinema_id,
                'name': cinema.name,
                'city': cinema.city,
                'screens': [
                    {
                        'screen_id': screen.screen_id,
                        'name': screen.name,
                        'format': screen.screen_format
                    } for screen in screens
                ]
            })
        
        return jsonify({
            'status': 'success',
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500