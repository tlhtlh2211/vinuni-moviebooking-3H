from app import create_app
from models import Users, Showtimes, Seats, Screens  # Updated to DDL-first models
from extensions import db

app = create_app()

with app.app_context():
    users = Users.query.all()
    print(f"Users: {len(users)}")
    for user in users:
        print(f"  {user.user_id}: {user.email} ({user.role})")
    
    showtimes = Showtimes.query.all()
    print(f"\nShowtimes: {len(showtimes)}")
    for showtime in showtimes:
        print(f"  {showtime.showtime_id}: {showtime.start_time}")
    
    # Check screens and seats
    screens = Screens.query.all()
    print(f"\nScreens: {len(screens)}")
    for screen in screens:
        seats = Seats.query.filter_by(screen_id=screen.screen_id).all()
        print(f"  Screen {screen.screen_id}: {len(seats)} seats") 