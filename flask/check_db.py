from app import create_app
from models import Users, Showtimes, Seats, Screens  # Updated to DDL-first models
from extensions import db
from sqlalchemy import select

app = create_app()

with app.app_context():
    users = db.session.execute(select(Users)).scalars().all()
    print(f"Users: {len(users)}")
    for user in users:
        print(f"  {user.user_id}: {user.email} ({user.role})")
    
    showtimes = db.session.execute(select(Showtimes)).scalars().all()
    print(f"\nShowtimes: {len(showtimes)}")
    for showtime in showtimes:
        print(f"  {showtime.showtime_id}: {showtime.start_time}")
    
    # Check screens and seats
    screens = db.session.execute(select(Screens)).scalars().all()
    print(f"\nScreens: {len(screens)}")
    for screen in screens:
        seats = db.session.execute(select(Seats).where(Seats.screen_id == screen.screen_id)).scalars().all()
        print(f"  Screen {screen.screen_id}: {len(seats)} seats") 