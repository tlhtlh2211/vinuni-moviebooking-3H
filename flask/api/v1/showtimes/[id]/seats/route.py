from flask import Blueprint, request, jsonify
from models import Seats, SeatLocks, Showtimes, Tickets, Reservations
from extensions import db
from datetime import datetime, timedelta
from sqlalchemy import select

seats_bp = Blueprint('seats', __name__)

@seats_bp.route('/<int:showtime_id>/seats', methods=['GET'])
def get_seats(showtime_id):
    # First check if the showtime exists
    showtime = db.session.get(Showtimes, showtime_id)
    if not showtime:
        return jsonify({'error': 'Showtime not found'}), 404
    
    # Get all seats for the screen
    seats = db.session.execute(
        select(Seats).where(Seats.screen_id == showtime.screen_id)
    ).scalars().all()
    
    # Get all locked seats for this showtime
    current_time = datetime.utcnow()
    locks = db.session.execute(
        select(SeatLocks).where(
            SeatLocks.showtime_id == showtime_id,
            SeatLocks.expires_at > current_time
        )
    ).scalars().all()
    locked_seat_ids = {lock.seat_id for lock in locks}
    
    # Get all sold seats (tickets) for this showtime
    sold_seats = db.session.execute(
        select(Tickets).join(Reservations).where(
            Reservations.showtime_id == showtime_id,
            Reservations.status == 'confirmed'
        )
    ).scalars().all()
    sold_seat_ids = {ticket.seat_id for ticket in sold_seats}
    
    result = []
    for seat in seats:
        seat_dict = {
            'seat_id': seat.seat_id,
            'screen_id': seat.screen_id,
            'seat_class': seat.seat_class,
            'seat_label': seat.seat_label,
            'row_num': seat.row_num,
            'col_num': seat.col_num,
            'status': 'sold' if seat.seat_id in sold_seat_ids else 
                      'locked' if seat.seat_id in locked_seat_ids else 'available'
        }
        result.append(seat_dict)
    
    return jsonify(result)

@seats_bp.route('/<int:showtime_id>/seats/<int:seat_id>/lock', methods=['POST'])
def lock_seat(showtime_id, seat_id):
    # Check if showtime and seat exist
    showtime = db.session.get(Showtimes, showtime_id)
    if not showtime:
        return jsonify({'error': 'Showtime not found'}), 404
    
    seat = db.session.get(Seats, seat_id)
    if not seat:
        return jsonify({'error': 'Seat not found'}), 404
    
    # Check if seat belongs to the showtime's screen
    if seat.screen_id != showtime.screen_id:
        return jsonify({'error': 'Seat does not belong to the showtime screen'}), 400
    
    # Check if the seat is already sold
    sold = db.session.execute(
        select(Tickets).join(Reservations).where(
            Reservations.showtime_id == showtime_id,
            Tickets.seat_id == seat_id,
            Reservations.status == 'confirmed'
        )
    ).scalar_one_or_none()
    
    if sold:
        return jsonify({'error': 'Seat already sold'}), 400
    
    # Check if the seat is already locked by someone else
    current_time = datetime.utcnow()
    lock = db.session.execute(
        select(SeatLocks).where(
            SeatLocks.showtime_id == showtime_id,
            SeatLocks.seat_id == seat_id,
            SeatLocks.expires_at > current_time
        )
    ).scalar_one_or_none()
    
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
    lock = db.session.execute(
        select(SeatLocks).where(
            SeatLocks.showtime_id == showtime_id,
            SeatLocks.seat_id == seat_id,
            SeatLocks.user_id == user_id
        )
    ).scalar_one_or_none()
    
    if not lock:
        return jsonify({'error': 'No active lock found for this user'}), 404
    
    # Delete the lock
    db.session.delete(lock)
    db.session.commit()
    
    return jsonify({'message': 'Seat unlocked successfully'})
