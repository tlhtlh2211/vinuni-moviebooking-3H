from flask import Blueprint, request, jsonify
from models import Reservations, Tickets, SeatLocks, Seats, Showtimes  # Updated to DDL-first models
from serializers import ModelSerializer
from extensions import db
from datetime import datetime, timedelta

reservations_bp = Blueprint('reservations', __name__)

@reservations_bp.route('/', methods=['GET'])
def get_reservations():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    reservations = Reservations.query.filter_by(user_id=user_id).all()
    result = []
    
    for reservation in reservations:
        res_dict = ModelSerializer.serialize_reservations(reservation)
        # Get tickets for this reservation
        tickets = Tickets.query.filter_by(reservation_id=reservation.reservation_id).all()
        res_dict['tickets'] = ModelSerializer.serialize_tickets_list(tickets)
        # Get showtime details
        showtime = Showtimes.query.get(reservation.showtime_id)
        if showtime:
            res_dict['showtime'] = ModelSerializer.serialize_showtimes(showtime)
        result.append(res_dict)
    
    return jsonify(result)

@reservations_bp.route('/', methods=['POST'])
def create_reservation():
    data = request.json
    
    # Validate required fields
    required_fields = ['user_id', 'showtime_id', 'seats']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    user_id = data['user_id']
    showtime_id = data['showtime_id']
    seat_ids = data['seats']
    
    # Verify showtime exists
    showtime = Showtimes.query.get_or_404(showtime_id)
    
    # Check if all seats are locked by this user
    current_time = datetime.utcnow()
    for seat_id in seat_ids:
        lock = SeatLocks.query.filter_by(
            showtime_id=showtime_id,
            seat_id=seat_id,
            user_id=user_id
        ).first()
        
        if not lock or lock.expires_at <= current_time:
            return jsonify({'error': f'Seat {seat_id} is not locked by this user or lock has expired'}), 400
    
    # Create reservation
    expires_at = current_time + timedelta(minutes=30)
    
    reservation = Reservations(
        user_id=user_id,
        showtime_id=showtime_id,
        status='pending',
        created_at=current_time,
        expires_at=expires_at
    )
    
    db.session.add(reservation)
    db.session.flush()  # Get the reservation ID without committing
    
    # Create tickets for each seat
    tickets = []
    for seat_id in seat_ids:
        # Get seat details to determine price
        seat = Seats.query.get(seat_id)
        
        # Calculate price based on seat class
        base_price = 10.00  # Standard price
        if seat.seat_class == 'premium':
            base_price = 15.00
            
        ticket = Tickets(
            reservation_id=reservation.reservation_id,
            seat_id=seat_id,
            price=base_price,
            issued_at=current_time
        )
        
        db.session.add(ticket)
        tickets.append(ticket)
    
    # Remove the locks as they're now part of a reservation
    for seat_id in seat_ids:
        lock = SeatLocks.query.filter_by(
            showtime_id=showtime_id,
            seat_id=seat_id,
            user_id=user_id
        ).first()
        
        if lock:
            db.session.delete(lock)
    
    db.session.commit()
    
    # Prepare response
    result = ModelSerializer.serialize_reservations(reservation)
    result['tickets'] = ModelSerializer.serialize_tickets_list(tickets)
    
    return jsonify(result), 201

@reservations_bp.route('/<int:reservation_id>/confirm', methods=['POST'])
def confirm_reservation(reservation_id):
    reservation = Reservations.query.get_or_404(reservation_id)
    
    # Check if reservation is still valid
    current_time = datetime.utcnow()
    if reservation.expires_at <= current_time:
        return jsonify({'error': 'Reservation has expired'}), 400
    
    if reservation.status != 'pending':
        return jsonify({'error': f'Reservation is already {reservation.status}'}), 400
    
    # Update status to confirmed
    reservation.status = 'confirmed'
    db.session.commit()
    
    return jsonify({'message': 'Reservation confirmed successfully', 'reservation': ModelSerializer.serialize_reservations(reservation)})

@reservations_bp.route('/<int:reservation_id>/cancel', methods=['POST'])
def cancel_reservation(reservation_id):
    reservation = Reservations.query.get_or_404(reservation_id)
    
    if reservation.status == 'cancelled':
        return jsonify({'error': 'Reservation is already cancelled'}), 400
    
    # Update status to cancelled
    reservation.status = 'cancelled'
    db.session.commit()
    
    return jsonify({'message': 'Reservation cancelled successfully', 'reservation': ModelSerializer.serialize_reservations(reservation)})