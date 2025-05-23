from flask import Blueprint, request, jsonify
from models import Seats, SeatLocks, Showtimes, Tickets, Reservations  # Updated to DDL-first models
from serializers import ModelSerializer
from extensions import db
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

seats_bp = Blueprint('seats', __name__)

@seats_bp.route('/<int:showtime_id>/seats', methods=['GET'])
def get_seats(showtime_id):
    logger.info(f"GET request received for showtime_id: {showtime_id}")
    try:
        # First check if the showtime exists
        showtime = Showtimes.query.get_or_404(showtime_id)
        logger.debug(f"Showtime found: {showtime}")
        
        # Get all seats for the screen
        seats = Seats.query.filter_by(screen_id=showtime.screen_id).all()
        logger.debug(f"Found {len(seats)} seats for this showtime")
        
        # Get all locked seats for this showtime
        current_time = datetime.utcnow()
        locks = SeatLocks.query.filter(
            SeatLocks.showtime_id == showtime_id,
            SeatLocks.expires_at > current_time
        ).all()
        locked_seat_ids = {lock.seat_id for lock in locks}
        logger.debug(f"Found {len(locked_seat_ids)} locked seats")
        
        # Get all sold seats (tickets) for this showtime
        sold_seats = Tickets.query.join(Reservations).filter(
            Reservations.showtime_id == showtime_id,
            Reservations.status == 'confirmed'
        ).all()
        sold_seat_ids = {ticket.seat_id for ticket in sold_seats}
        logger.debug(f"Found {len(sold_seat_ids)} sold seats")
        
        result = []
        for seat in seats:
            seat_dict = ModelSerializer.serialize_seats(seat)
            seat_dict.update({
                'status': 'sold' if seat.seat_id in sold_seat_ids else 
                          'locked' if seat.seat_id in locked_seat_ids else 'available'
            })
            result.append(seat_dict)
        
        # Return in the format expected by the frontend
        response_data = {
            "data": result,
            "success": True
        }
        logger.info("Successfully retrieved seats data")
        return jsonify(response_data)
    except Exception as e:
        logger.error(f"Error retrieving seats: {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500

@seats_bp.route('/<int:showtime_id>/seats/<int:seat_id>/lock', methods=['POST'])
def lock_seat(showtime_id, seat_id):
    # Check if showtime and seat exist
    showtime = Showtimes.query.get_or_404(showtime_id)
    seat = Seats.query.get_or_404(seat_id)
    
    # Check if seat belongs to the showtime's screen
    if seat.screen_id != showtime.screen_id:
        return jsonify({'error': 'Seat does not belong to the showtime screen'}), 400
    
    # Check if the seat is already sold
    sold = Tickets.query.join(Reservations).filter(
        Reservations.showtime_id == showtime_id,
        Tickets.seat_id == seat_id,
        Reservations.status == 'confirmed'
    ).first()
    
    if sold:
        return jsonify({'error': 'Seat already sold'}), 400
    
    # Check if the seat is already locked by someone else
    current_time = datetime.utcnow()
    lock = SeatLocks.query.filter(
        SeatLocks.showtime_id == showtime_id,
        SeatLocks.seat_id == seat_id,
        SeatLocks.expires_at > current_time
    ).first()
    
    data = request.json
    user_id = data.get('user_id')
    
    if lock and lock.user_id != user_id:
        return jsonify({'error': 'Seat is locked by another user'}), 400
    
    # Create or update the lock
    expiry_time = current_time + timedelta(minutes=15)
    
    if lock:
        lock.expires_at = expiry_time
    else:
        lock = SeatLocks(
            showtime_id=showtime_id,
            seat_id=seat_id,
            user_id=user_id,
            locked_at=current_time,
            expires_at=expiry_time
        )
        db.session.add(lock)
    
    db.session.commit()
    
    return jsonify({'message': 'Seat locked successfully', 'expires_at': expiry_time.isoformat()})

@seats_bp.route('/<int:showtime_id>/seats/<int:seat_id>/unlock', methods=['POST'])
def unlock_seat(showtime_id, seat_id):
    data = request.json
    user_id = data.get('user_id')
    
    # Check if the lock exists and belongs to the user
    lock = SeatLocks.query.filter_by(
        showtime_id=showtime_id,
        seat_id=seat_id,
        user_id=user_id
    ).first()
    
    if not lock:
        return jsonify({'error': 'No active lock found for this user'}), 404
    
    # Delete the lock
    db.session.delete(lock)
    db.session.commit()
    
    return jsonify({'message': 'Seat unlocked successfully'})
