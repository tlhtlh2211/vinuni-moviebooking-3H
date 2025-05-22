import pymysql
import os
import sys
from config import Config
from datetime import datetime, timedelta

def create_database():
    # Extract connection parameters from config URI
    connection_string = Config.SQLALCHEMY_DATABASE_URI
    
    # Parse the connection string manually
    connection_string = connection_string.replace('mysql+pymysql://', '')
    
    # Find the username and password
    at_pos = connection_string.rfind('@')
    credentials = connection_string[:at_pos]
    host_port_db = connection_string[at_pos+1:]
    
    # Extract username and password
    colon_pos = credentials.find(':')
    if colon_pos != -1:
        username = credentials[:colon_pos]
        password = credentials[colon_pos+1:]
    else:
        username = credentials
        password = ''
    
    # Extract host, port, and database
    slash_pos = host_port_db.find('/')
    if slash_pos != -1:
        host_port = host_port_db[:slash_pos]
        database = host_port_db[slash_pos+1:]
    else:
        host_port = host_port_db
        database = 'movie_booking'
    
    # Extract host and port
    colon_pos = host_port.find(':')
    if colon_pos != -1:
        host = host_port[:colon_pos]
        port = int(host_port[colon_pos+1:])
    else:
        host = host_port
        port = 3306
    
    print(f"Connecting to MySQL at {host}:{port} with user {username}")
    
    try:
        # Connect to MySQL without specifying a database
        connection = pymysql.connect(
            host=host,
            user=username,
            password=password,
            port=port
        )
        
        with connection.cursor() as cursor:
            # Create database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database}")
            print(f"Database '{database}' created or already exists")
            
            # Switch to the database
            cursor.execute(f"USE {database}")
            
            # Drop all tables first if they exist (to avoid foreign key issues)
            drop_tables(cursor, connection)
            
            # Create tables directly
            create_tables(cursor, connection)
            print("Tables created successfully")
            
            # Insert sample data
            insert_sample_data(connection, cursor)
        
        connection.close()
        print("Database setup completed")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def drop_tables(cursor, connection):
    # Drop in reverse order of creation to avoid foreign key constraints
    try:
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        connection.commit()
        
        # Drop views
        cursor.execute("DROP VIEW IF EXISTS v_available_seats")
        cursor.execute("DROP VIEW IF EXISTS v_reservation_totals")
        
        # Drop triggers
        cursor.execute("DROP TRIGGER IF EXISTS trg_showtime_no_overlap")
        cursor.execute("DROP TRIGGER IF EXISTS trg_showtime_no_overlap_update")
        
        # Drop tables
        tables = [
            "seat_locks", "tickets", "reservations", "showtimes", 
            "users", "seats", "screens", "movies", "cinemas"
        ]
        
        for table in tables:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
            connection.commit()
        
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        connection.commit()
        print("Dropped existing tables")
    except Exception as e:
        print(f"Warning: Error dropping tables: {e}")

def create_tables(cursor, connection):
    # Create cinemas table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cinemas (
        cinema_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        address VARCHAR(120),
        city VARCHAR(60),
        PRIMARY KEY (cinema_id)
    )
    """)
    connection.commit()
    
    # Create screens table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS screens (
        screen_id INT NOT NULL AUTO_INCREMENT,
        cinema_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        screen_format ENUM('2D', '3D', 'IMAX') NOT NULL DEFAULT '2D',
        PRIMARY KEY (screen_id),
        UNIQUE KEY uk_cinema_screen (cinema_id, name),
        CONSTRAINT fk_screen_cinema
            FOREIGN KEY (cinema_id) REFERENCES cinemas (cinema_id)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
    """)
    connection.commit()
    
    # Create seats table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS seats (
        seat_id INT NOT NULL AUTO_INCREMENT,
        screen_id INT NOT NULL,
        seat_class ENUM('standard', 'premium') NOT NULL DEFAULT 'standard',
        seat_label VARCHAR(10) NOT NULL,
        row_num SMALLINT NOT NULL,
        col_num SMALLINT NOT NULL,
        PRIMARY KEY (seat_id),
        UNIQUE KEY uk_screen_seat (screen_id, seat_label),
        CONSTRAINT fk_seat_screen
            FOREIGN KEY (screen_id) REFERENCES screens (screen_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT chk_seat_positive_coords CHECK (row_num > 0 AND col_num > 0)
    )
    """)
    connection.commit()
    
    # Create movies table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS movies (
        movie_id INT NOT NULL AUTO_INCREMENT,
        title VARCHAR(150) NOT NULL,
        duration INT NOT NULL,
        rating ENUM('G', 'PG', 'PG-13', 'R', 'NC-17') NOT NULL DEFAULT 'G',
        release_date DATE,
        status ENUM('open','closed') NOT NULL DEFAULT 'open',
        description TEXT,
        director VARCHAR(100),
        cast TEXT,
        genre VARCHAR(50),
        poster_url VARCHAR(255),
        PRIMARY KEY (movie_id),
        CONSTRAINT chk_movie_positive_duration CHECK (duration > 0)
    )
    """)
    connection.commit()
    
    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id INT NOT NULL AUTO_INCREMENT,
        email VARCHAR(120) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','customer') NOT NULL DEFAULT 'customer',
        PRIMARY KEY (user_id),
        UNIQUE KEY uk_user_email (email)
    )
    """)
    connection.commit()
    
    # Create showtimes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS showtimes (
        showtime_id INT NOT NULL AUTO_INCREMENT,
        movie_id INT NOT NULL,
        screen_id INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        PRIMARY KEY (showtime_id),
        UNIQUE KEY uk_screen_start (screen_id, start_time),
        CONSTRAINT fk_showtime_movie
            FOREIGN KEY (movie_id) REFERENCES movies (movie_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_showtime_screen
            FOREIGN KEY (screen_id) REFERENCES screens (screen_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT chk_showtime_end_after_start CHECK (end_time > start_time)
    )
    """)
    connection.commit()
    
    # Create reservations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reservations (
        reservation_id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        showtime_id INT NOT NULL,
        status ENUM('pending','confirmed','cancelled','expired') NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        PRIMARY KEY (reservation_id),
        CONSTRAINT fk_res_user
            FOREIGN KEY (user_id) REFERENCES users (user_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_res_showtime
            FOREIGN KEY (showtime_id) REFERENCES showtimes (showtime_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT chk_reservation_expiry_after_creation CHECK (expires_at > created_at)
    )
    """)
    connection.commit()
    
    # Create tickets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        ticket_id INT NOT NULL AUTO_INCREMENT,
        reservation_id INT NOT NULL,
        seat_id INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (ticket_id),
        CONSTRAINT fk_ticket_reservation
            FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_ticket_seat
            FOREIGN KEY (seat_id) REFERENCES seats (seat_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT chk_ticket_positive_price CHECK (price > 0)
    )
    """)
    connection.commit()
    
    # Create seat_locks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS seat_locks (
        showtime_id INT NOT NULL,
        seat_id INT NOT NULL,
        user_id INT NOT NULL,
        locked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        PRIMARY KEY (showtime_id, seat_id),
        CONSTRAINT fk_lock_showtime
            FOREIGN KEY (showtime_id) REFERENCES showtimes (showtime_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_lock_seat
            FOREIGN KEY (seat_id) REFERENCES seats (seat_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_lock_user
            FOREIGN KEY (user_id) REFERENCES users (user_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT chk_lock_expiry_after_lock CHECK (expires_at > locked_at)
    )
    """)
    connection.commit()
    
    # Create views
    try:
        # Available seats view
        cursor.execute("""
        CREATE OR REPLACE VIEW v_available_seats AS
        SELECT DISTINCT
            sh.showtime_id,
            s.seat_id,
            s.seat_label,
            s.seat_class,
            s.row_num,
            s.col_num,
            s.screen_id
        FROM showtimes AS sh
        JOIN seats AS s ON s.screen_id = sh.screen_id
        LEFT JOIN tickets AS t
               JOIN reservations AS r ON r.reservation_id = t.reservation_id
               ON r.showtime_id = sh.showtime_id
               AND t.seat_id = s.seat_id
        LEFT JOIN seat_locks AS l
               ON l.showtime_id = sh.showtime_id
               AND l.seat_id = s.seat_id
               AND l.expires_at > NOW()
        WHERE
              t.ticket_id IS NULL
          AND l.seat_id IS NULL
        """)
        connection.commit()
        
        # Reservation totals view
        cursor.execute("""
        CREATE OR REPLACE VIEW v_reservation_totals AS
        SELECT 
            r.reservation_id,
            r.user_id,
            r.showtime_id,
            r.status,
            COALESCE(SUM(t.price), 0.00) AS total_amount
        FROM 
            reservations r
        LEFT JOIN 
            tickets t ON r.reservation_id = t.reservation_id
        GROUP BY 
            r.reservation_id, r.user_id, r.showtime_id, r.status
        """)
        connection.commit()
    except Exception as e:
        print(f"Warning: Could not create views: {e}")

def insert_sample_data(connection, cursor):
    try:
        # Insert sample cinemas
        cursor.execute("""
        INSERT INTO cinemas (name, address, city) VALUES 
        ('VinUni Cinema', '123 Thang Long Boulevard', 'Hanoi'),
        ('Royal City Cinema', '72A Nguyen Trai', 'Hanoi'),
        ('Times City Cinema', '458 Minh Khai', 'Hanoi')
        """)
        connection.commit()
        
        # Insert sample screens
        cursor.execute("""
        INSERT INTO screens (cinema_id, name, screen_format) VALUES 
        (1, 'Screen 1', '2D'),
        (1, 'Screen 2', '3D'),
        (1, 'Screen 3', 'IMAX'),
        (2, 'Screen 1', '2D'),
        (2, 'Screen 2', '3D'),
        (3, 'Screen 1', 'IMAX')
        """)
        connection.commit()
        
        # Insert sample seats (simplified - 10 seats per screen)
        for screen_id in range(1, 7):
            for row in range(1, 3):  # 2 rows
                for col in range(1, 6):  # 5 columns per row
                    seat_label = f"{chr(64+row)}{col}"  # A1, A2, B1, B2, etc.
                    seat_class = 'premium' if row == 1 else 'standard'
                    cursor.execute("""
                    INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) 
                    VALUES (%s, %s, %s, %s, %s)
                    """, (screen_id, seat_class, seat_label, row, col))
        connection.commit()
        
        # Insert sample movies
        cursor.execute("""
        INSERT INTO movies (title, duration, rating, release_date, status, description, director, cast, genre, poster_url) VALUES 
        ('The Avengers', 143, 'PG-13', '2012-05-04', 'open', 'Earth\'s mightiest heroes must come together and learn to fight as a team.', 'Joss Whedon', 'Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth', 'Action'),
        ('Inception', 148, 'PG-13', '2010-07-16', 'open', 'A thief who steals corporate secrets through dream-sharing technology.', 'Christopher Nolan', 'Leonardo DiCaprio, Marion Cotillard, Tom Hardy', 'Sci-Fi'),
        ('The Dark Knight', 152, 'PG-13', '2008-07-18', 'open', 'When the menace known as the Joker wreaks havoc on Gotham.', 'Christopher Nolan', 'Christian Bale, Heath Ledger, Aaron Eckhart', 'Action'),
        ('Parasite', 132, 'R', '2019-05-30', 'open', 'A poor family schemes to become employed by a wealthy family.', 'Bong Joon-ho', 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong', 'Thriller'),
        ('Toy Story 4', 100, 'G', '2019-06-21', 'open', 'Woody and the gang welcome a new toy called Forky.', 'Josh Cooley', 'Tom Hanks, Tim Allen, Annie Potts', 'Animation')
        """)
        connection.commit()
        
        # Insert sample users
        from werkzeug.security import generate_password_hash
        
        admin_password = generate_password_hash('admin123')
        user_password = generate_password_hash('user123')
        
        cursor.execute("""
        INSERT INTO users (email, password_hash, role) VALUES 
        ('admin@example.com', %s, 'admin'),
        ('user@example.com', %s, 'customer')
        """, (admin_password, user_password))
        connection.commit()
        
        # Temporarily disable the trigger for inserting showtimes
        cursor.execute("DROP TRIGGER IF EXISTS trg_showtime_no_overlap")
        connection.commit()
        
        # Insert sample showtimes (today and tomorrow)
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)
        
        # We'll just insert a few showtimes for each movie/screen combination
        # 1 movie per screen, different times to ensure no overlapping
        screens = [1, 2, 3, 4, 5, 6]
        movies = [1, 2, 3, 4, 5]
        
        # Get movie durations
        cursor.execute("SELECT movie_id, duration FROM movies")
        movie_durations = {row[0]: row[1] for row in cursor.fetchall()}
        
        for i, screen_id in enumerate(screens):
            # Assign a movie to this screen (cycling through movies)
            movie_id = movies[i % len(movies)]
            duration = movie_durations[movie_id]
            
            # Morning showing
            start_time = datetime.combine(today, datetime.strptime(f"1{i}:00", "%H:%M").time())
            end_time = start_time + timedelta(minutes=duration)
            
            cursor.execute("""
            INSERT INTO showtimes (movie_id, screen_id, start_time, end_time) 
            VALUES (%s, %s, %s, %s)
            """, (movie_id, screen_id, start_time, end_time))
            
            # Afternoon showing
            start_time = datetime.combine(today, datetime.strptime(f"1{i}:00", "%H:%M").time()) + timedelta(hours=6)
            end_time = start_time + timedelta(minutes=duration)
            
            cursor.execute("""
            INSERT INTO showtimes (movie_id, screen_id, start_time, end_time) 
            VALUES (%s, %s, %s, %s)
            """, (movie_id, screen_id, start_time, end_time))
            
            # Tomorrow showing
            start_time = datetime.combine(tomorrow, datetime.strptime(f"1{i}:00", "%H:%M").time())
            end_time = start_time + timedelta(minutes=duration)
            
            cursor.execute("""
            INSERT INTO showtimes (movie_id, screen_id, start_time, end_time) 
            VALUES (%s, %s, %s, %s)
            """, (movie_id, screen_id, start_time, end_time))
        
        connection.commit()
        
        # Recreate the trigger
        cursor.execute("""
        CREATE TRIGGER trg_showtime_no_overlap 
        BEFORE INSERT ON showtimes 
        FOR EACH ROW 
        BEGIN 
            IF EXISTS (
                SELECT 1 
                FROM showtimes s
                WHERE s.screen_id = NEW.screen_id 
                AND NEW.start_time < s.end_time 
                AND NEW.end_time > s.start_time
            ) THEN 
                SIGNAL SQLSTATE '45000' 
                SET MESSAGE_TEXT='Overlapping showtime'; 
            END IF; 
        END
        """)
        connection.commit()
        
        # Insert sample reservation and tickets
        cursor.execute("""
        INSERT INTO reservations (user_id, showtime_id, status, expires_at) 
        VALUES (2, 1, 'confirmed', DATE_ADD(NOW(), INTERVAL 1 DAY))
        """)
        
        reservation_id = cursor.lastrowid
        
        # Add tickets for the first two seats
        cursor.execute("""
        INSERT INTO tickets (reservation_id, seat_id, price) 
        VALUES (%s, 1, 15.00), (%s, 2, 15.00)
        """, (reservation_id, reservation_id))
        
        connection.commit()
        print("Sample data inserted successfully")
        
    except Exception as e:
        connection.rollback()
        print(f"Error inserting sample data: {e}")
        raise

if __name__ == "__main__":
    create_database() 