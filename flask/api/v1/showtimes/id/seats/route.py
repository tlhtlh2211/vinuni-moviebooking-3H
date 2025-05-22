from flask import Blueprint, request, jsonify
from models import Seat, SeatLock, Showtime, Ticket, Reservation
from extensions import db
from datetime import datetime, timedelta

seats_bp = Blueprint('seats', __name__)

@seats_bp.route('/<int:showtime_id>/seats', methods=['GET'])
def get_seats(showtime_id):
    # First check if the showtime exists
    showtime = Showtime.query.get_or_404(showtime_id)
    
    # Get all seats for the screen
    seats = Seat.query.join(Showtime).filter(Showtime.screen_id == Seat.screen_id, 
                                            Showtime.showtime_id == showtime_id).all()
    
    # Get all locked seats for this showtime
    current_time = datetime.utcnow()
    locks = SeatLock.query.filter(
        SeatLock.showtime_id == showtime_id,
        SeatLock.expires_at > current_time
    ).all()
    locked_seat_ids = {lock.seat_id for lock in locks}
    
    # Get all sold seats (tickets) for this showtime
    sold_seats = Ticket.query.join(Reservation).filter(
        Reservation.showtime_id == showtime_id,
        Reservation.status == 'confirmed'
    ).all()
    sold_seat_ids = {ticket.seat_id for ticket in sold_seats}
    
    result = []
    for seat in seats:
        seat_dict = seat.to_dict()
        seat_dict.update({
            'status': 'sold' if seat.seat_id in sold_seat_ids else 
                      'locked' if seat.seat_id in locked_seat_ids else 'available'
        })
        result.append(seat_dict)
    
    return jsonify(result)

@seats_bp.route('/<int:showtime_id>/seats/<int:seat_id>/lock', methods=['POST'])
def lock_seat(showtime_id, seat_id):
    # Check if showtime and seat exist
    showtime = Showtime.query.get_or_404(showtime_id)
    seat = Seat.query.get_or_404(seat_id)
    
    # Check if seat belongs to the showtime's screen
    if seat.screen_id != showtime.screen_id:
        return jsonify({'error': 'Seat does not belong to the showtime screen'}), 400
    
    # Check if the seat is already sold
    sold = Ticket.query.join(Reservation).filter(
        Reservation.showtime_id == showtime_id,
        Ticket.seat_id == seat_id,
        Reservation.status == 'confirmed'
    ).first()
    
    if sold:
        return jsonify({'error': 'Seat already sold'}), 400
    
    # Check if the seat is already locked by someone else
    current_time = datetime.utcnow()
    lock = SeatLock.query.filter(
        SeatLock.showtime_id == showtime_id,
        SeatLock.seat_id == seat_id,
        SeatLock.expires_at > current_time
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
        lock = SeatLock(
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
    lock = SeatLock.query.filter_by(
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
