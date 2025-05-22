from app import create_app
from models import User, Showtime, Seat, Screen
from extensions import db

app = create_app()

with app.app_context():
    # Check if user with ID 16 exists
    user = User.query.get(16)
    print(f"User with ID 16 exists: {user is not None}")
    if user:
        print(f"User email: {user.email}, Role: {user.role}")
    
    # Check if showtime with ID 1 exists
    showtime = Showtime.query.get(1)
    print(f"Showtime with ID 1 exists: {showtime is not None}")
    if showtime:
        print(f"Movie ID: {showtime.movie_id}, Screen ID: {showtime.screen_id}")
        
        # Check if the screen exists
        screen = Screen.query.get(showtime.screen_id)
        if screen:
            print(f"Screen exists - Name: {screen.name}, Format: {screen.screen_format}")
    
    # Check if seats 12 and 13 exist
    seat12 = Seat.query.get(12)
    seat13 = Seat.query.get(13)
    print(f"Seat with ID 12 exists: {seat12 is not None}")
    print(f"Seat with ID 13 exists: {seat13 is not None}")
    
    if seat12 and showtime:
        print(f"Seat 12 screen ID: {seat12.screen_id}, Showtime screen ID: {showtime.screen_id}")
        print(f"Seat 12 belongs to showtime's screen: {seat12.screen_id == showtime.screen_id}")
    
    if seat13 and showtime:
        print(f"Seat 13 screen ID: {seat13.screen_id}, Showtime screen ID: {showtime.screen_id}")
        print(f"Seat 13 belongs to showtime's screen: {seat13.screen_id == showtime.screen_id}")
    
    # List available showtimes for reference
    print("\nAvailable showtimes:")
    all_showtimes = Showtime.query.limit(5).all()
    for st in all_showtimes:
        print(f"ID: {st.showtime_id}, Movie ID: {st.movie_id}, Screen ID: {st.screen_id}, Start: {st.start_time}")
    
    print("\nAvailable users:")
    all_users = User.query.all()
    for u in all_users:
        print(f"ID: {u.user_id}, Email: {u.email}, Role: {u.role}") 