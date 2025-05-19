-- 1. Cinemas
CREATE TABLE cinemas (
    cinema_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(120),
    city VARCHAR(60),
    PRIMARY KEY (cinema_id)
)

-- 2. Screens
CREATE TABLE screens (
    screen_id INT NOT NULL AUTO_INCREMENT,
    cinema_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    capacity SMALLINT,
    format VARCHAR(50),
    PRIMARY KEY (screen_id),
    UNIQUE KEY uk_cinema_screen (cinema_id, name),
    CONSTRAINT fk_screen_cinema
        FOREIGN KEY (cinema_id) REFERENCES cinemas (cinema_id)
        ON UPDATE CASCADE ON DELETE CASCADE
)

-- 3. Seat classes
CREATE TABLE seat_classes (
    class_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    description VARCHAR(100),
    PRIMARY KEY (class_id),
    UNIQUE KEY uq_seat_class_name (name)
)

-- 4. Seats
CREATE TABLE seats (
    seat_id INT NOT NULL AUTO_INCREMENT,
    screen_id INT NOT NULL,
    class_id INT NOT NULL,
    seat_label VARCHAR(10) NOT NULL,
    row_num SMALLINT,
    col_num SMALLINT,
    PRIMARY KEY (seat_id),
    UNIQUE KEY uk_screen_seat (screen_id, seat_label),
    CONSTRAINT fk_seat_screen
        FOREIGN KEY (screen_id) REFERENCES screens (screen_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_seat_class
        FOREIGN KEY (class_id) REFERENCES seat_classes (class_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
)

-- 5. Movies
CREATE TABLE movies (
    movie_id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    duration INT NOT NULL, -- in minutes
    rating VARCHAR(10),
    release_date DATE,
    status ENUM('announced','presale','open','closed') NOT NULL DEFAULT 'announced',
    PRIMARY KEY (movie_id)
)

-- 6. Showtimes
CREATE TABLE showtimes (
    showtime_id INT NOT NULL AUTO_INCREMENT,
    movie_id INT NOT NULL,
    screen_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    language VARCHAR(20) NOT NULL DEFAULT 'Original',
    PRIMARY KEY (showtime_id),
    UNIQUE KEY uk_screen_start (screen_id, start_time),
    CONSTRAINT fk_showtime_movie
        FOREIGN KEY (movie_id) REFERENCES movies (movie_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_showtime_screen
        FOREIGN KEY (screen_id) REFERENCES screens (screen_id)
        ON UPDATE CASCADE ON DELETE CASCADE
)

-- 7. Users
CREATE TABLE users (
    user_id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','customer') NOT NULL DEFAULT 'customer',
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_email (email)
)

-- 8. Reservations
CREATE TABLE reservations (
    reservation_id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    status ENUM('pending','confirmed','cancelled','expired') NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    PRIMARY KEY (reservation_id),
    CONSTRAINT fk_res_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_res_showtime
        FOREIGN KEY (showtime_id) REFERENCES showtimes (showtime_id)
        ON UPDATE CASCADE ON DELETE CASCADE
)

-- 9. Tickets
CREATE TABLE tickets (
    ticket_id INT NOT NULL AUTO_INCREMENT,
    reservation_id INT NOT NULL,
    showtime_id INT NOT NULL,
    seat_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ticket_id),
    UNIQUE KEY uk_showtime_seat (showtime_id, seat_id),
    CONSTRAINT fk_ticket_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ticket_showtime
        FOREIGN KEY (showtime_id) REFERENCES showtimes (showtime_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ticket_seat
        FOREIGN KEY (seat_id) REFERENCES seats (seat_id)
        ON UPDATE CASCADE ON DELETE CASCADE
)

-- 10. Seat locks (holds while a user is buying)
CREATE TABLE seat_locks (
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
        ON UPDATE CASCADE ON DELETE CASCADE
)

-- 11. Payments
CREATE TABLE payments (
    payment_id INT NOT NULL AUTO_INCREMENT,
    reservation_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('initiated','captured','failed') NOT NULL DEFAULT 'initiated',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    CONSTRAINT fk_pay_reservation
        FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id)
        ON UPDATE CASCADE ON DELETE CASCADE
)


-- Trigger to prevent overlapping showtimes on the same screen
DELIMITER //
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
END//
DELIMITER ;

-- Trigger to prevent reducing screen capacity below current seat count
DELIMITER //
CREATE TRIGGER trg_screen_capacity_update
BEFORE UPDATE ON screens
FOR EACH ROW
BEGIN
    DECLARE seat_count INT;
    
    -- Only check if capacity is being reduced
    IF NEW.capacity < OLD.capacity THEN
        -- Get the current seat count for this screen
        SELECT COUNT(*) INTO seat_count
        FROM seats
        WHERE screen_id = NEW.screen_id;
        
        -- Check if new capacity is less than current seat count
        IF NEW.capacity < seat_count THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot reduce capacity below current seat count';
        END IF;
    END IF;
END//
DELIMITER ;
