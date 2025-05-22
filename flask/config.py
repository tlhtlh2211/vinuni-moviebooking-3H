import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # Format: mysql+pymysql://username:password@host:port/database_name
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:%40Tranlehai2003@localhost/movie_booking'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'vinuni-movie-booking-secret-key'