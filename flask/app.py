from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import db
# Import all DDL-first models to ensure they're registered
from models import Base, Users, Movies, Cinemas, Screens, Seats, Showtimes, Reservations, Tickets, SeatLocks
import os, sys
import pymysql

# Register PyMySQL as the MySQL driver
pymysql.install_as_MySQLdb()

# Add the current directory to the path so imports work properly
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for all routes
    CORS(app)
    
    # Initialize extensions with the app
    db.init_app(app)

    # Import and register blueprints
    from api.v1.auth.login.route import login_bp
    app.register_blueprint(login_bp, url_prefix='/api/v1/auth/login')
    
    from api.v1.auth.admin_login.route import admin_login_bp
    app.register_blueprint(admin_login_bp, url_prefix='/api/v1/auth/admin-login')

    from api.v1.movies.route import movies_bp
    app.register_blueprint(movies_bp, url_prefix='/api/v1/movies')
    
    from api.v1.showtimes.showtimeId.seats.route import seats_bp
    app.register_blueprint(seats_bp, url_prefix='/api/v1/showtimes')
    
    from api.v1.reservations.route import reservations_bp
    app.register_blueprint(reservations_bp, url_prefix='/api/v1/reservations')
    
    from api.v1.admin.analytics.route import analytics_bp
    app.register_blueprint(analytics_bp, url_prefix='/api/v1/admin/analytics')
    
    from api.v1.admin.movies.route import movies_bp as admin_movies_bp
    app.register_blueprint(admin_movies_bp, url_prefix='/api/v1/admin/movies')
    
    from api.v1.admin.showtimes.route import showtimes_bp as admin_showtimes_bp
    app.register_blueprint(admin_showtimes_bp, url_prefix='/api/v1/admin/showtimes')
    
    # DDL-first database initialization
    # Create database tables from DDL-generated models
    with app.app_context():
        Base.metadata.create_all(bind=db.engine)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
