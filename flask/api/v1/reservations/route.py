from flask import Blueprint, request, jsonify
from models import Reservations, Tickets, SeatLocks, Seats, Showtimes  # Updated to DDL-first models
from serializers import ModelSerializer
from extensions import db
from datetime import datetime, timedelta
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload

reservations_bp = Blueprint('reservations', __name__)

@reservations_bp.route('/', methods=['GET'])
def get_reservations():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    reservations = db.session.execute(
        select(Reservations).where(Reservations.user_id == user_id)
    ).scalars().all()
    result = []
    
    for reservation in reservations:
        res_dict = ModelSerializer.serialize_reservations(reservation)
        # Get tickets for this reservation with seat relationship loaded
        tickets = db.session.execute(
            select(Tickets)
            .options(selectinload(Tickets.seat))
            .where(Tickets.reservation_id == reservation.reservation_id)
        ).scalars().all()
        res_dict['tickets'] = ModelSerializer.serialize_tickets_list(tickets)
        # Get showtime details
        showtime = db.session.get(Showtimes, reservation.showtime_id)
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
    showtime = db.session.get(Showtimes, showtime_id)
    if not showtime:
        return jsonify({'error': 'Showtime not found'}), 404
    
    try:
        # Use the stored procedure to create the reservation
        # This will handle validation, create reservation, tickets, and set status to confirmed
        import json
        seat_ids_json = json.dumps(seat_ids)
        
        # Call the stored procedure
        db.session.execute(
            text("CALL sp_create_reservation(:user_id, :showtime_id, :seat_ids)"),
            {
                'user_id': user_id,
                'showtime_id': showtime_id,
                'seat_ids': seat_ids_json
            }
        )
        db.session.commit()
        
        # Get the created reservation (it will be the most recent one for this user/showtime)
        reservation = db.session.execute(
            select(Reservations).where(
                Reservations.user_id == user_id,
                Reservations.showtime_id == showtime_id
            ).order_by(Reservations.created_at.desc())
        ).scalars().first()
        
        if not reservation:
            return jsonify({'error': 'Failed to retrieve created reservation'}), 500
        
        # Get tickets for this reservation with seat relationship loaded
        tickets = db.session.execute(
            select(Tickets)
            .options(selectinload(Tickets.seat))
            .where(Tickets.reservation_id == reservation.reservation_id)
        ).scalars().all()
        
        # Prepare response
        result = ModelSerializer.serialize_reservations(reservation)
        result['tickets'] = ModelSerializer.serialize_tickets_list(tickets)
        
        return jsonify(result), 201
        
    except Exception as e:
        db.session.rollback()
        error_msg = str(e)
        if 'One or more seats already sold' in error_msg:
            return jsonify({'error': 'One or more seats are already sold'}), 400
        elif 'Seat currently locked by another user' in error_msg:
            return jsonify({'error': 'One or more seats are locked by another user'}), 400
        elif 'Seat is not locked by this user' in error_msg:
            return jsonify({'error': 'Seats must be locked before creating reservation'}), 400
        else:
            return jsonify({'error': f'Failed to create reservation: {error_msg}'}), 500

@reservations_bp.route('/<int:reservation_id>/confirm', methods=['POST'])
def confirm_reservation(reservation_id):
    reservation = db.session.get(Reservations, reservation_id)
    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404
    
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
    reservation = db.session.get(Reservations, reservation_id)
    if not reservation:
        return jsonify({'error': 'Reservation not found'}), 404
    
    if reservation.status == 'cancelled':
        return jsonify({'error': 'Reservation is already cancelled'}), 400
    
    try:
        # Use stored procedure for proper cleanup
        db.session.execute(
            text("CALL sp_cancel_reservation(:reservation_id)"),
            {'reservation_id': reservation_id}
        )
        db.session.commit()
        
        # Refresh the reservation object to get updated status
        db.session.refresh(reservation)
        
        return jsonify({
            'message': 'Reservation cancelled successfully', 
            'reservation': ModelSerializer.serialize_reservations(reservation)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400