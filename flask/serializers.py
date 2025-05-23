from models import Users, Movies, Cinemas, Screens, Seats, Showtimes, Reservations, Tickets, SeatLocks
from decimal import Decimal
from datetime import datetime, date
from typing import Dict, List, Any, Optional

class ModelSerializer:
    """
    Serialization layer for DDL-first models.
    Keeps generated models clean and provides consistent JSON serialization.
    """
    
    @staticmethod
    def serialize_users(user: Users) -> Dict[str, Any]:
        """Serialize Users model to dictionary"""
        return {
            'user_id': user.user_id,
            'email': user.email,
            'role': user.role
        }
    
    @staticmethod
    def serialize_movies(movie: Movies) -> Dict[str, Any]:
        """Serialize Movies model to dictionary"""
        return {
            'movie_id': movie.movie_id,
            'title': movie.title,
            'duration': movie.duration,
            'rating': movie.rating,
            'release_date': movie.release_date.isoformat() if movie.release_date else None,
            'status': movie.status,
            'description': movie.description,
            'director': movie.director,
            'cast': movie.cast.split(',') if movie.cast else [],
            'genre': movie.genre,
            'poster_url': movie.poster_url
        }
    
    @staticmethod
    def serialize_cinemas(cinema: Cinemas) -> Dict[str, Any]:
        """Serialize Cinemas model to dictionary"""
        return {
            'cinema_id': cinema.cinema_id,
            'name': cinema.name,
            'address': cinema.address,
            'city': cinema.city
        }
    
    @staticmethod
    def serialize_screens(screen: Screens) -> Dict[str, Any]:
        """Serialize Screens model to dictionary"""
        return {
            'screen_id': screen.screen_id,
            'cinema_id': screen.cinema_id,
            'name': screen.name,
            'screen_format': screen.screen_format
        }
    
    @staticmethod
    def serialize_seats(seat: Seats) -> Dict[str, Any]:
        """Serialize Seats model to dictionary"""
        return {
            'seat_id': seat.seat_id,
            'screen_id': seat.screen_id,
            'seat_class': seat.seat_class,
            'seat_label': seat.seat_label,
            'row_num': seat.row_num,
            'col_num': seat.col_num
        }
    
    @staticmethod
    def serialize_showtimes(showtime: Showtimes) -> Dict[str, Any]:
        """Serialize Showtimes model to dictionary"""
        return {
            'showtime_id': showtime.showtime_id,
            'movie_id': showtime.movie_id,
            'screen_id': showtime.screen_id,
            'start_time': showtime.start_time.isoformat(),
            'end_time': showtime.end_time.isoformat(),
            'movie_title': showtime.movie.title if showtime.movie else None
        }
    
    @staticmethod
    def serialize_reservations(reservation: Reservations) -> Dict[str, Any]:
        """Serialize Reservations model to dictionary"""
        return {
            'reservation_id': reservation.reservation_id,
            'user_id': reservation.user_id,
            'showtime_id': reservation.showtime_id,
            'status': reservation.status,
            'created_at': reservation.created_at.isoformat(),
            'expires_at': reservation.expires_at.isoformat()
        }
    
    @staticmethod
    def serialize_tickets(ticket: Tickets) -> Dict[str, Any]:
        """Serialize Tickets model to dictionary"""
        return {
            'ticket_id': ticket.ticket_id,
            'reservation_id': ticket.reservation_id,
            'seat_id': ticket.seat_id,
            'seat_label': ticket.seat.seat_label if ticket.seat else None,
            'price': float(ticket.price),
            'issued_at': ticket.issued_at.isoformat()
        }
    
    @staticmethod
    def serialize_seat_locks(seat_lock: SeatLocks) -> Dict[str, Any]:
        """Serialize SeatLocks model to dictionary"""
        return {
            'showtime_id': seat_lock.showtime_id,
            'seat_id': seat_lock.seat_id,
            'user_id': seat_lock.user_id,
            'locked_at': seat_lock.locked_at.isoformat(),
            'expires_at': seat_lock.expires_at.isoformat()
        }
    
    @staticmethod
    def serialize_movies_list(movies: List[Movies]) -> List[Dict[str, Any]]:
        """Serialize a list of Movies"""
        return [ModelSerializer.serialize_movies(movie) for movie in movies]
    
    @staticmethod
    def serialize_seats_list(seats: List[Seats]) -> List[Dict[str, Any]]:
        """Serialize a list of Seats"""
        return [ModelSerializer.serialize_seats(seat) for seat in seats]
    
    @staticmethod
    def serialize_showtimes_list(showtimes: List[Showtimes]) -> List[Dict[str, Any]]:
        """Serialize a list of Showtimes"""
        return [ModelSerializer.serialize_showtimes(showtime) for showtime in showtimes]
    
    @staticmethod
    def serialize_reservations_list(reservations: List[Reservations]) -> List[Dict[str, Any]]:
        """Serialize a list of Reservations"""
        return [ModelSerializer.serialize_reservations(reservation) for reservation in reservations]
    
    @staticmethod
    def serialize_tickets_list(tickets: List[Tickets]) -> List[Dict[str, Any]]:
        """Serialize a list of Tickets"""
        return [ModelSerializer.serialize_tickets(ticket) for ticket in tickets] 