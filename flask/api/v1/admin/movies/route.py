from flask import Blueprint, jsonify, request
from extensions import db
from models import Movies, Showtimes, Screens, Cinemas
from serializers import ModelSerializer
from sqlalchemy import select, and_, or_, text
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
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        
        # Handle trigger errors specifically
        if 'Schedule conflict' in error_msg:
            return jsonify({
                'status': 'error', 
                'message': error_msg,
                'type': 'schedule_conflict'
            }), 409  # 409 Conflict
        elif 'Duplicate entry' in error_msg:
            return jsonify({'status': 'error', 'message': 'A movie with this title may already exist'}), 400
        else:
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


@movies_bp.route('/schedule/<int:cinema_id>/<date>', methods=['GET'])
def get_cinema_schedule(cinema_id, date):
    """Get occupied timeslots for a cinema on a specific date
    
    Returns a schedule grouped by screen showing all occupied timeslots
    with buffer periods for easier visualization in admin UI
    """
    # TODO: Add admin role check when authentication is implemented
    
    try:
        # Validate date format
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            return jsonify({
                'status': 'error', 
                'message': 'Invalid date format. Use YYYY-MM-DD'
            }), 400
        
        # Query the view for occupied timeslots
        result = db.session.execute(
            text("""
                SELECT 
                    screen_id,
                    screen_name,
                    movie_title,
                    TIME_FORMAT(start_time, '%H:%i') as start_time,
                    TIME_FORMAT(end_time, '%H:%i') as end_time,
                    TIME_FORMAT(buffer_start, '%H:%i') as buffer_start,
                    TIME_FORMAT(buffer_end, '%H:%i') as buffer_end,
                    start_hour,
                    start_minute,
                    movie_duration,
                    screen_format
                FROM v_occupied_timeslots 
                WHERE cinema_id = :cinema_id 
                AND show_date = :date
                ORDER BY screen_name, start_time
            """),
            {"cinema_id": cinema_id, "date": date}
        ).fetchall()
        
        # Group by screen for easy visualization
        schedule = {}
        for row in result:
            screen_name = row.screen_name
            if screen_name not in schedule:
                schedule[screen_name] = {
                    'screen_id': row.screen_id,
                    'screen_format': row.screen_format,
                    'timeslots': []
                }
            
            schedule[screen_name]['timeslots'].append({
                'movie_title': row.movie_title,
                'start_time': row.start_time,
                'end_time': row.end_time,
                'buffer_start': row.buffer_start,
                'buffer_end': row.buffer_end,
                'duration_minutes': row.movie_duration,
                'start_hour': row.start_hour,
                'start_minute': row.start_minute
            })
        
        # Also get list of all screens for this cinema (to show empty screens too)
        all_screens = db.session.execute(
            select(Screens).where(Screens.cinema_id == cinema_id).order_by(Screens.name)
        ).scalars().all()
        
        # Add empty screens to schedule
        for screen in all_screens:
            if screen.name not in schedule:
                schedule[screen.name] = {
                    'screen_id': screen.screen_id,
                    'screen_format': screen.screen_format,
                    'timeslots': []
                }
        
        return jsonify({
            'status': 'success',
            'data': {
                'cinema_id': cinema_id,
                'date': date,
                'schedule': schedule
            }
        }), 200
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500