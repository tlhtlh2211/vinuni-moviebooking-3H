from app import create_app
from models import Showtime, Seat

app = create_app()

with app.app_context():
    # Choose a valid showtime ID
    showtime_id = 226
    showtime = Showtime.query.get(showtime_id)
    
    if not showtime:
        print(f"Showtime with ID {showtime_id} not found!")
        exit(1)
    
    print(f"Found showtime ID {showtime_id}")
    print(f"Movie ID: {showtime.movie_id}, Screen ID: {showtime.screen_id}")
    print(f"Start time: {showtime.start_time}")
    
    # Find seats for this showtime's screen
    screen_id = showtime.screen_id
    seats = Seat.query.filter_by(screen_id=screen_id).limit(10).all()
    
    print(f"\nFirst 10 valid seats for screen ID {screen_id}:")
    for seat in seats:
        print(f"Seat ID: {seat.seat_id}, Label: {seat.seat_label}, Class: {seat.seat_class}")
    
    print("\nExample valid request payload:")
    print(f"{{\"user_id\": 16, \"showtime_id\": {showtime_id}, \"seats\": [{seats[0].seat_id}, {seats[1].seat_id}]}}") 