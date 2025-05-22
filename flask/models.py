from extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('admin', 'customer'), nullable=False)

class Movie(db.Model):
    __tablename__ = 'movies'
    movie_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    rating = db.Column(db.Enum('G', 'PG', 'PG-13', 'R', 'NC-17'), nullable=False)
    release_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum('open', 'closed'), nullable=False, default='open')
    description = db.Column(db.Text, nullable=True)
    director = db.Column(db.String(100), nullable=True)
    cast = db.Column(db.Text, nullable=True)
    genre = db.Column(db.String(50), nullable=True)
    poster_url = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        cast_list = self.cast.split(',') if self.cast else []
        return {
            'movie_id': self.movie_id,
            'title': self.title,
            'duration': self.duration,
            'rating': self.rating,
            'release_date': self.release_date.isoformat(),
            'status': self.status,
            'description': self.description,
            'director': self.director,
            'cast': cast_list,
            'genre': self.genre,
            'poster_url': self.poster_url
        }

class Cinema(db.Model):
    __tablename__ = 'cinemas'
    cinema_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(120))
    city = db.Column(db.String(60))
    
    screens = db.relationship('Screen', backref='cinema', lazy=True)
    
    def to_dict(self):
        return {
            'cinema_id': self.cinema_id,
            'name': self.name,
            'address': self.address,
            'city': self.city
        }

class Screen(db.Model):
    __tablename__ = 'screens'
    screen_id = db.Column(db.Integer, primary_key=True)
    cinema_id = db.Column(db.Integer, db.ForeignKey('cinemas.cinema_id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    screen_format = db.Column(db.Enum('2D', '3D', 'IMAX'), nullable=False, default='2D')
    
    seats = db.relationship('Seat', backref='screen', lazy=True)
    showtimes = db.relationship('Showtime', backref='screen', lazy=True)
    
    def to_dict(self):
        return {
            'screen_id': self.screen_id,
            'cinema_id': self.cinema_id,
            'name': self.name,
            'screen_format': self.screen_format
        }

class Seat(db.Model):
    __tablename__ = 'seats'
    seat_id = db.Column(db.Integer, primary_key=True)
    screen_id = db.Column(db.Integer, db.ForeignKey('screens.screen_id'), nullable=False)
    seat_class = db.Column(db.Enum('standard', 'premium'), nullable=False, default='standard')
    seat_label = db.Column(db.String(10), nullable=False)
    row_num = db.Column(db.SmallInteger, nullable=False)
    col_num = db.Column(db.SmallInteger, nullable=False)
    
    def to_dict(self):
        return {
            'seat_id': self.seat_id,
            'screen_id': self.screen_id,
            'seat_class': self.seat_class,
            'seat_label': self.seat_label,
            'row_num': self.row_num,
            'col_num': self.col_num
        }

class Showtime(db.Model):
    __tablename__ = 'showtimes'
    showtime_id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movies.movie_id'), nullable=False)
    screen_id = db.Column(db.Integer, db.ForeignKey('screens.screen_id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    
    movie = db.relationship('Movie', backref='showtimes')
    reservations = db.relationship('Reservation', backref='showtime', lazy=True)
    seat_locks = db.relationship('SeatLock', backref='showtime', lazy=True)
    
    def to_dict(self):
        return {
            'showtime_id': self.showtime_id,
            'movie_id': self.movie_id,
            'screen_id': self.screen_id,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat(),
            'movie_title': self.movie.title if self.movie else None
        }

class Reservation(db.Model):
    __tablename__ = 'reservations'
    reservation_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    showtime_id = db.Column(db.Integer, db.ForeignKey('showtimes.showtime_id'), nullable=False)
    status = db.Column(db.Enum('pending', 'confirmed', 'cancelled', 'expired'), nullable=False, default='pending')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    user = db.relationship('User', backref='reservations')
    tickets = db.relationship('Ticket', backref='reservation', lazy=True)
    
    def to_dict(self):
        return {
            'reservation_id': self.reservation_id,
            'user_id': self.user_id,
            'showtime_id': self.showtime_id,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat()
        }

class Ticket(db.Model):
    __tablename__ = 'tickets'
    ticket_id = db.Column(db.Integer, primary_key=True)
    reservation_id = db.Column(db.Integer, db.ForeignKey('reservations.reservation_id'), nullable=False)
    seat_id = db.Column(db.Integer, db.ForeignKey('seats.seat_id'), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    issued_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    seat = db.relationship('Seat')
    
    def to_dict(self):
        return {
            'ticket_id': self.ticket_id,
            'reservation_id': self.reservation_id,
            'seat_id': self.seat_id,
            'seat_label': self.seat.seat_label if self.seat else None,
            'price': float(self.price),
            'issued_at': self.issued_at.isoformat()
        }

class SeatLock(db.Model):
    __tablename__ = 'seat_locks'
    showtime_id = db.Column(db.Integer, db.ForeignKey('showtimes.showtime_id'), primary_key=True)
    seat_id = db.Column(db.Integer, db.ForeignKey('seats.seat_id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    locked_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    
    seat = db.relationship('Seat')
    user = db.relationship('User')
    
    def to_dict(self):
        return {
            'showtime_id': self.showtime_id,
            'seat_id': self.seat_id,
            'user_id': self.user_id,
            'locked_at': self.locked_at.isoformat(),
            'expires_at': self.expires_at.isoformat()
        }
