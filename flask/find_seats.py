from app import create_app
from models import Showtimes, Seats  # Updated to DDL-first models
from extensions import db

app = create_app()

with app.app_context():
    showtime = Showtimes.query.first()
    if showtime:
        print(f"Showtime {showtime.showtime_id} for movie {showtime.movie_id}")
        print(f"Screen ID: {showtime.screen_id}")
        print(f"Start time: {showtime.start_time}")
        print(f"End time: {showtime.end_time}")
        
        # Find all seats for this screen
        seats = Seats.query.filter_by(screen_id=showtime.screen_id).all()
        print(f"\nFound {len(seats)} seats for this screen:")
        
        for seat in seats:
            print(f"  Seat {seat.seat_label}: Row {seat.row_num}, Col {seat.col_num}, Class: {seat.seat_class}")
    else:
        print("No showtimes found in the database.") 