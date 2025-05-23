from typing import List, Optional

from sqlalchemy import CheckConstraint, Column, DECIMAL, Date, DateTime, Enum, ForeignKeyConstraint, Index, Integer, SmallInteger, String, Table, Text, text
from sqlalchemy.dialects.mysql import ENUM
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
import datetime
import decimal

class Base(DeclarativeBase):
    pass


class Cinemas(Base):
    __tablename__ = 'cinemas'

    cinema_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100, 'utf8mb4_unicode_ci'))
    address: Mapped[Optional[str]] = mapped_column(String(120, 'utf8mb4_unicode_ci'))
    city: Mapped[Optional[str]] = mapped_column(String(60, 'utf8mb4_unicode_ci'))

    screens: Mapped[List['Screens']] = relationship('Screens', back_populates='cinema')


class Movies(Base):
    __tablename__ = 'movies'
    __table_args__ = (
        CheckConstraint('(`duration` > 0)', name='chk_movie_positive_duration'),
    )

    movie_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(150, 'utf8mb4_unicode_ci'))
    duration: Mapped[int] = mapped_column(Integer)
    rating: Mapped[str] = mapped_column(ENUM('G', 'PG', 'PG-13', 'R', 'NC-17'), server_default=text("'G'"))
    status: Mapped[str] = mapped_column(ENUM('open', 'closed'), server_default=text("'open'"))
    release_date: Mapped[Optional[datetime.date]] = mapped_column(Date)
    description: Mapped[Optional[str]] = mapped_column(Text(collation='utf8mb4_unicode_ci'))
    director: Mapped[Optional[str]] = mapped_column(String(100, 'utf8mb4_unicode_ci'))
    cast: Mapped[Optional[str]] = mapped_column(Text(collation='utf8mb4_unicode_ci'))
    genre: Mapped[Optional[str]] = mapped_column(String(50, 'utf8mb4_unicode_ci'))
    poster_url: Mapped[Optional[str]] = mapped_column(String(255, 'utf8mb4_unicode_ci'))

    showtimes: Mapped[List['Showtimes']] = relationship('Showtimes', back_populates='movie')


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        Index('uk_user_email', 'email', unique=True),
    )

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(120, 'utf8mb4_unicode_ci'))
    password_hash: Mapped[str] = mapped_column(String(255, 'utf8mb4_unicode_ci'))
    role: Mapped[str] = mapped_column(ENUM('admin', 'customer'), server_default=text("'customer'"))

    reservations: Mapped[List['Reservations']] = relationship('Reservations', back_populates='user')
    seat_locks: Mapped[List['SeatLocks']] = relationship('SeatLocks', back_populates='user')


t_v_available_seats = Table(
    'v_available_seats', Base.metadata,
    Column('showtime_id', Integer, server_default=text("'0'")),
    Column('seat_id', Integer, server_default=text("'0'")),
    Column('seat_label', String(10)),
    Column('seat_class', Enum('standard', 'premium'), server_default=text("'standard'")),
    Column('row_num', SmallInteger),
    Column('col_num', SmallInteger),
    Column('screen_id', Integer)
)


t_v_reservation_totals = Table(
    'v_reservation_totals', Base.metadata,
    Column('reservation_id', Integer, server_default=text("'0'")),
    Column('user_id', Integer),
    Column('showtime_id', Integer),
    Column('status', Enum('pending', 'confirmed', 'cancelled', 'expired'), server_default=text("'pending'")),
    Column('total_amount', DECIMAL(32, 2), server_default=text("'0.00'"))
)


class Screens(Base):
    __tablename__ = 'screens'
    __table_args__ = (
        ForeignKeyConstraint(['cinema_id'], ['cinemas.cinema_id'], ondelete='CASCADE', onupdate='CASCADE', name='fk_screen_cinema'),
        Index('uk_cinema_screen', 'cinema_id', 'name', unique=True)
    )

    screen_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cinema_id: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(String(50, 'utf8mb4_unicode_ci'))
    screen_format: Mapped[str] = mapped_column(ENUM('2D', '3D', 'IMAX'), server_default=text("'2D'"))

    cinema: Mapped['Cinemas'] = relationship('Cinemas', back_populates='screens')
    seats: Mapped[List['Seats']] = relationship('Seats', back_populates='screen')
    showtimes: Mapped[List['Showtimes']] = relationship('Showtimes', back_populates='screen')


class Seats(Base):
    __tablename__ = 'seats'
    __table_args__ = (
        CheckConstraint('((`row_num` > 0) and (`col_num` > 0))', name='chk_seat_positive_coords'),
        ForeignKeyConstraint(['screen_id'], ['screens.screen_id'], ondelete='CASCADE', onupdate='CASCADE', name='fk_seat_screen'),
        Index('uk_screen_seat', 'screen_id', 'seat_label', unique=True)
    )

    seat_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    screen_id: Mapped[int] = mapped_column(Integer)
    seat_class: Mapped[str] = mapped_column(ENUM('standard', 'premium'), server_default=text("'standard'"))
    seat_label: Mapped[str] = mapped_column(String(10, 'utf8mb4_unicode_ci'))
    row_num: Mapped[int] = mapped_column(SmallInteger)
    col_num: Mapped[int] = mapped_column(SmallInteger)

    screen: Mapped['Screens'] = relationship('Screens', back_populates='seats')
    seat_locks: Mapped[List['SeatLocks']] = relationship('SeatLocks', back_populates='seat')
    tickets: Mapped[List['Tickets']] = relationship('Tickets', back_populates='seat')


class Showtimes(Base):
    __tablename__ = 'showtimes'
    __table_args__ = (
        CheckConstraint('(`end_time` > `start_time`)', name='chk_showtime_end_after_start'),
        ForeignKeyConstraint(['movie_id'], ['movies.movie_id'], ondelete='CASCADE', onupdate='CASCADE', name='fk_showtime_movie'),
        ForeignKeyConstraint(['screen_id'], ['screens.screen_id'], ondelete='CASCADE', onupdate='CASCADE', name='fk_showtime_screen'),
        Index('fk_showtime_movie', 'movie_id'),
        Index('uk_screen_start', 'screen_id', 'start_time', unique=True)
    )

    showtime_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    movie_id: Mapped[int] = mapped_column(Integer)
    screen_id: Mapped[int] = mapped_column(Integer)
    start_time: Mapped[datetime.datetime] = mapped_column(DateTime)
    end_time: Mapped[datetime.datetime] = mapped_column(DateTime)

    movie: Mapped['Movies'] = relationship('Movies', back_populates='showtimes')
    screen: Mapped['Screens'] = relationship('Screens', back_populates='showtimes')
    reservations: Mapped[List['Reservations']] = relationship('Reservations', back_populates='showtime')
    seat_locks: Mapped[List['SeatLocks']] = relationship('SeatLocks', back_populates='showtime')


class Reservations(Base):
    __tablename__ = 'reservations'
    __table_args__ = (
        CheckConstraint('(`expires_at` > `created_at`)', name='chk_reservation_expiry_after_creation'),
        ForeignKeyConstraint(['showtime_id'], ['showtimes.showtime_id'], ondelete='CASCADE', onupdate='CASCADE', name='fk_res_showtime'),
        ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE', onupdate='CASCADE', name='fk_res_user'),
        Index('fk_res_showtime', 'showtime_id'),
        Index('fk_res_user', 'user_id')
    )

    reservation_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer)
    showtime_id: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(ENUM('pending', 'confirmed', 'cancelled', 'expired'), server_default=text("'pending'"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('CURRENT_TIMESTAMP'))
    expires_at: Mapped[datetime.datetime] = mapped_column(DateTime)

    showtime: Mapped['Showtimes'] = relationship('Showtimes', back_populates='reservations')
    user: Mapped['Users'] = relationship('Users', back_populates='reservations')
    tickets: Mapped[List['Tickets']] = relationship('Tickets', back_populates='reservation')


class SeatLocks(Base):
    __tablename__ = 'seat_locks'
    __table_args__ = (
        CheckConstraint('(`expires_at` > `locked_at`)', name='chk_lock_expiry_after_lock'),
        ForeignKeyConstraint(['seat_id'], ['seats.seat_id'], ondelete='CASCADE', onupdate='CASCADE', name='fk_lock_seat'),
        ForeignKeyConstraint(['showtime_id'], ['showtimes.showtime_id'], ondelete='CASCADE', onupdate='CASCADE', name='fk_lock_showtime'),
        ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE', onupdate='CASCADE', name='fk_lock_user'),
        Index('fk_lock_seat', 'seat_id'),
        Index('fk_lock_user', 'user_id')
    )

    showtime_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seat_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer)
    locked_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('CURRENT_TIMESTAMP'))
    expires_at: Mapped[datetime.datetime] = mapped_column(DateTime)

    seat: Mapped['Seats'] = relationship('Seats', back_populates='seat_locks')
    showtime: Mapped['Showtimes'] = relationship('Showtimes', back_populates='seat_locks')
    user: Mapped['Users'] = relationship('Users', back_populates='seat_locks')


class Tickets(Base):
    __tablename__ = 'tickets'
    __table_args__ = (
        CheckConstraint('(`price` > 0)', name='chk_ticket_positive_price'),
        ForeignKeyConstraint(['reservation_id'], ['reservations.reservation_id'], ondelete='CASCADE', onupdate='CASCADE', name='fk_ticket_reservation'),
        ForeignKeyConstraint(['seat_id'], ['seats.seat_id'], ondelete='CASCADE', onupdate='CASCADE', name='fk_ticket_seat'),
        Index('fk_ticket_reservation', 'reservation_id'),
        Index('fk_ticket_seat', 'seat_id')
    )

    ticket_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reservation_id: Mapped[int] = mapped_column(Integer)
    seat_id: Mapped[int] = mapped_column(Integer)
    price: Mapped[decimal.Decimal] = mapped_column(DECIMAL(10, 2))
    issued_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=text('CURRENT_TIMESTAMP'))

    reservation: Mapped['Reservations'] = relationship('Reservations', back_populates='tickets')
    seat: Mapped['Seats'] = relationship('Seats', back_populates='tickets')
