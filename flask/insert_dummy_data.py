from app import create_app
from extensions import db
from models import User, Movie, Cinema, Screen, Seat, Showtime, Reservation, Ticket, SeatLock
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
import random
import sqlalchemy as sa
from sqlalchemy import inspect, text

app = create_app()

def check_if_column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    with app.app_context():
        inspector = inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns(table_name)]
        return column_name in columns

def add_columns_if_not_exist():
    """Add missing columns to the movies table if they don't exist"""
    with app.app_context():
        # Check if the new columns exist
        columns_to_check = ['description', 'director', 'cast', 'genre', 'poster_url']
        columns_to_add = []
        
        for column in columns_to_check:
            if not check_if_column_exists('movies', column):
                columns_to_add.append(column)
        
        # If there are columns to add, add them
        if columns_to_add:
            print(f"Adding missing columns to movies table: {', '.join(columns_to_add)}")
            
            column_definitions = {
                'description': 'TEXT',
                'director': 'VARCHAR(100)',
                'cast': 'TEXT',
                'genre': 'VARCHAR(50)',
                'poster_url': 'VARCHAR(255)'
            }
            
            for column in columns_to_add:
                column_type = column_definitions[column]
                with db.engine.connect() as connection:
                    connection.execute(text(f"ALTER TABLE movies ADD COLUMN {column} {column_type}"))
            
            print("Columns added successfully")
        
        # Also check seat_class enum
        if check_if_column_exists('seats', 'seat_class'):
            # Check if 'vip' is in the enum
            with db.engine.connect() as connection:
                result = connection.execute(text("SHOW COLUMNS FROM seats WHERE Field = 'seat_class'"))
                column_info = result.fetchone()
                
                if column_info and "'vip'" not in column_info[1]:
                    print("Updating seat_class enum to include 'vip'")
                    connection.execute(text("ALTER TABLE seats MODIFY seat_class ENUM('standard', 'premium', 'vip') NOT NULL DEFAULT 'standard'"))
        
        # Check screen_format enum
        if check_if_column_exists('screens', 'screen_format'):
            with db.engine.connect() as connection:
                result = connection.execute(text("SHOW COLUMNS FROM screens WHERE Field = 'screen_format'"))
                column_info = result.fetchone()
                
                if column_info and "'standard'" not in column_info[1]:
                    print("Updating screen_format enum to new values")
                    connection.execute(text("ALTER TABLE screens MODIFY screen_format ENUM('standard', 'imax', '3d', '4dx') NOT NULL DEFAULT 'standard'"))

def create_dummy_data():
    # First, add any missing columns
    add_columns_if_not_exist()
    
    with app.app_context():
        # Clear existing data
        db.session.query(Ticket).delete()
        db.session.query(Reservation).delete()
        db.session.query(Showtime).delete()
        db.session.query(Seat).delete()
        db.session.query(Screen).delete()
        db.session.query(Cinema).delete()
        db.session.query(Movie).delete()
        db.session.query(User).delete()
        db.session.commit()
        
        # Create users
        users = [
            User(email='admin@example.com', password_hash=generate_password_hash('admin123'), role='admin'),
            User(email='customer1@example.com', password_hash=generate_password_hash('customer123'), role='customer'),
            User(email='customer2@example.com', password_hash=generate_password_hash('customer123'), role='customer')
        ]
        db.session.add_all(users)
        db.session.commit()
        print(f"Added {len(users)} users")
        
        # Create movies
        movies = [
            Movie(
                title='Avengers: Endgame', 
                duration=181, 
                rating='PG-13', 
                release_date=datetime(2019, 4, 26).date(), 
                status='open',
                description='After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos\' actions and restore balance to the universe.',
                director='Anthony Russo, Joe Russo',
                cast='Robert Downey Jr.,Chris Evans,Mark Ruffalo,Chris Hemsworth,Scarlett Johansson',
                genre='Action',
                poster_url='https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg'
            ),
            Movie(
                title='The Shawshank Redemption', 
                duration=142, 
                rating='R', 
                release_date=datetime(1994, 9, 23).date(), 
                status='open',
                description='Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
                director='Frank Darabont',
                cast='Tim Robbins,Morgan Freeman,Bob Gunton',
                genre='Drama',
                poster_url='https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'
            ),
            Movie(
                title='Toy Story 4', 
                duration=100, 
                rating='G', 
                release_date=datetime(2019, 6, 21).date(), 
                status='open',
                description='When a new toy called Forky joins Woody and the gang, a road trip alongside old and new friends reveals how big the world can be for a toy.',
                director='Josh Cooley',
                cast='Tom Hanks,Tim Allen,Annie Potts',
                genre='Animation',
                poster_url='https://image.tmdb.org/t/p/w500/w9kR8qbmQ01HwnvK4alvnQ2ca0L.jpg'
            ),
            Movie(
                title='Joker', 
                duration=122, 
                rating='R', 
                release_date=datetime(2019, 10, 4).date(), 
                status='open',
                description='In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime. This path brings him face-to-face with his alter-ego: the Joker.',
                director='Todd Phillips',
                cast='Joaquin Phoenix,Robert De Niro,Zazie Beetz',
                genre='Thriller',
                poster_url='https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg'
            ),
            Movie(
                title='Parasite', 
                duration=132, 
                rating='R', 
                release_date=datetime(2019, 11, 8).date(), 
                status='open',
                description='Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
                director='Bong Joon Ho',
                cast='Song Kang-ho,Lee Sun-kyun,Cho Yeo-jeong,Choi Woo-shik',
                genre='Thriller',
                poster_url='https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg'
            ),
            Movie(
                title='Spider-Man: Across the Spider-Verse', 
                duration=140, 
                rating='PG', 
                release_date=datetime(2023, 6, 2).date(), 
                status='open',
                description='After reuniting with Gwen Stacy, Miles Morales is catapulted across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
                director='Joaquim Dos Santos, Kemp Powers, Justin K. Thompson',
                cast='Shameik Moore,Hailee Steinfeld,Oscar Isaac',
                genre='Animation',
                poster_url='https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg'
            ),
            Movie(
                title='Oppenheimer', 
                duration=180, 
                rating='R', 
                release_date=datetime(2023, 7, 21).date(), 
                status='open',
                description='The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
                director='Christopher Nolan',
                cast='Cillian Murphy,Emily Blunt,Matt Damon',
                genre='Drama',
                poster_url='https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'
            )
        ]
        db.session.add_all(movies)
        db.session.commit()
        print(f"Added {len(movies)} movies")
        
        # Create cinemas
        cinemas = [
            Cinema(name='Vinuni Cinema', address='Vinhomes Ocean Park', city='Hanoi'),
            Cinema(name='Downtown Cinema', address='Central Square', city='Ho Chi Minh City'),
            Cinema(name='Lakeview Theatres', address='Lake View Road', city='Da Nang')
        ]
        db.session.add_all(cinemas)
        db.session.commit()
        print(f"Added {len(cinemas)} cinemas")
        
        # Create screens for each cinema
        screens = []
        for cinema in cinemas:
            for i in range(1, 4):  # 3 screens per cinema
                format_type = random.choice(['standard', 'imax', '3d', '4dx'])
                screens.append(Screen(cinema_id=cinema.cinema_id, name=f'Screen {i}', screen_format=format_type))
        
        db.session.add_all(screens)
        db.session.commit()
        print(f"Added {len(screens)} screens")
        
        # Create seats for each screen
        seats = []
        for screen in screens:
            rows = 5
            cols = 10
            for row in range(1, rows + 1):
                for col in range(1, cols + 1):
                    row_letter = chr(64 + row)  # A, B, C, etc.
                    # Assign seat classes based on row position
                    if row == 1:
                        seat_class = 'vip'
                    elif row <= 3:
                        seat_class = 'premium'
                    else:
                        seat_class = 'standard'
                    seat_label = f"{row_letter}{col}"
                    seats.append(Seat(
                        screen_id=screen.screen_id,
                        seat_class=seat_class,
                        seat_label=seat_label,
                        row_num=row,
                        col_num=col
                    ))
        
        db.session.add_all(seats)
        db.session.commit()
        print(f"Added {len(seats)} seats")
        
        # Create showtimes
        showtimes = []
        now = datetime.now()
        
        for movie in movies:
            for screen in screens:
                # Add 3 showtimes per movie per screen over the next 7 days
                for i in range(3):
                    day_offset = random.randint(0, 7)
                    hour = random.randint(10, 22)
                    minute = random.choice([0, 30])
                    
                    start_time = datetime(now.year, now.month, now.day, hour, minute, 0) + timedelta(days=day_offset)
                    # Calculate end_time based on movie duration
                    end_time = start_time + timedelta(minutes=movie.duration)
                    
                    # Check for overlapping showtimes
                    overlap = False
                    for st in showtimes:
                        if st.screen_id == screen.screen_id:
                            if (start_time >= st.start_time and start_time < st.end_time) or \
                               (end_time > st.start_time and end_time <= st.end_time) or \
                               (start_time <= st.start_time and end_time >= st.end_time):
                                overlap = True
                                break
                    
                    if not overlap:
                        showtimes.append(Showtime(
                            movie_id=movie.movie_id,
                            screen_id=screen.screen_id,
                            start_time=start_time,
                            end_time=end_time
                        ))
        
        db.session.add_all(showtimes)
        db.session.commit()
        print(f"Added {len(showtimes)} showtimes")
        
        # Create some reservations and tickets
        reservations = []
        tickets = []
        
        for i in range(10):  # Create 10 reservations
            user = random.choice(users[1:])  # Only customers can make reservations
            showtime = random.choice(showtimes)
            
            # Create reservation
            created_at = datetime.now() - timedelta(days=random.randint(1, 5))
            expires_at = created_at + timedelta(minutes=15)
            status = random.choice(['confirmed', 'cancelled', 'confirmed', 'confirmed'])  # Higher chance of confirmed
            
            reservation = Reservation(
                user_id=user.user_id,
                showtime_id=showtime.showtime_id,
                status=status,
                created_at=created_at,
                expires_at=expires_at
            )
            db.session.add(reservation)
            db.session.flush()  # Get the reservation ID without committing
            
            # Only create tickets for confirmed reservations
            if status == 'confirmed':
                # Get seats for this screen
                screen_seats = [s for s in seats if s.screen_id == showtime.screen_id]
                
                # Select 1-3 random seats
                num_seats = random.randint(1, 3)
                selected_seats = random.sample(screen_seats, min(num_seats, len(screen_seats)))
                
                for seat in selected_seats:
                    # Price based on seat class
                    if seat.seat_class == 'vip':
                        price = 200000
                    elif seat.seat_class == 'premium':
                        price = 150000
                    else:
                        price = 100000  # Standard seats
                    ticket = Ticket(
                        reservation_id=reservation.reservation_id,
                        seat_id=seat.seat_id,
                        price=price,
                        issued_at=created_at + timedelta(minutes=random.randint(1, 10))
                    )
                    tickets.append(ticket)
        
        db.session.add_all(tickets)
        db.session.commit()
        print(f"Added {len(reservations)} reservations and {len(tickets)} tickets")
        
        print("Dummy data creation completed successfully!")

if __name__ == "__main__":
    create_dummy_data() 