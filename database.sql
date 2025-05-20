-- 1. Cinemas
CREATE TABLE cinemas (
    cinema_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(120),
    city VARCHAR(60),
    PRIMARY KEY (cinema_id)
);

-- 2. Screens
CREATE TABLE screens (
    screen_id INT NOT NULL AUTO_INCREMENT,
    cinema_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    capacity SMALLINT NOT NULL,
    screen_format ENUM('2D', '3D', 'IMAX') NOT NULL DEFAULT '2D',
    PRIMARY KEY (screen_id),
    UNIQUE KEY uk_cinema_screen (cinema_id, name),
    CONSTRAINT fk_screen_cinema
        FOREIGN KEY (cinema_id) REFERENCES cinemas (cinema_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 3. Seats
CREATE TABLE seats (
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
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 4. Movies
CREATE TABLE movies (
    movie_id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    duration INT NOT NULL, -- in minutes
    rating ENUM('G', 'PG', 'PG-13', 'R', 'NC-17') NOT NULL DEFAULT 'G',
    release_date DATE,
    status ENUM('open','closed') NOT NULL DEFAULT 'open',
    PRIMARY KEY (movie_id)
);

-- 5. Showtimes
CREATE TABLE showtimes (
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
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 6. Users
CREATE TABLE users (
    user_id INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','customer') NOT NULL DEFAULT 'customer',
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_user_email (email)
);

-- 7. Reservations
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
);

-- 8. Tickets
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
);

-- 9. Seat locks (holds while a user is buying)
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
);

-- TRIGGER: Prevent overlapping showtimes on the same screen
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

-- TRIGGER: Prevent reducing screen capacity below current seat count
DELIMITER //
CREATE TRIGGER trg_screen_capacity_update
BEFORE UPDATE ON screens
FOR EACH ROW
BEGIN
    DECLARE seat_count INT;
    
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


-- PROCEDURE: Create a reservation
DELIMITER //

CREATE PROCEDURE sp_create_reservation (
    IN p_user_id INT,
    IN p_showtime_id INT,
    IN p_seat_ids JSON          -- e.g. '[12,15,16]'
)
BEGIN
    DECLARE v_reservation_id INT;
    DECLARE v_screen_id INT;
    DECLARE v_format ENUM('2D','3D','IMAX');
    DECLARE v_now DATETIME DEFAULT NOW();
    DECLARE v_cnt INT;

    /* roll back on any error */
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    /* --------- 1.  Get the screen + format and lock the showtime row */
    SELECT st.screen_id, sc.screen_format
      INTO v_screen_id, v_format
      FROM showtimes st
      JOIN screens   sc ON sc.screen_id = st.screen_id
     WHERE st.showtime_id = p_showtime_id
     FOR UPDATE;

    IF v_screen_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Showtime not found';
    END IF;

    /* --------- 2.  Validate the seat set */

    /* 2a – all seats belong to that screen */
    SELECT COUNT(*) INTO v_cnt
      FROM seats s
      JOIN JSON_TABLE(p_seat_ids, '$[*]' COLUMNS (seat_id INT PATH '$')) j
        ON j.seat_id = s.seat_id
     WHERE s.screen_id <> v_screen_id;
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'One or more seats do not belong to the showtime’s screen';
    END IF;

    /* 2b – none already sold */
    SELECT COUNT(*) INTO v_cnt
      FROM tickets t
      JOIN JSON_TABLE(p_seat_ids, '$[*]' COLUMNS (seat_id INT PATH '$')) j
        ON j.seat_id = t.seat_id
     WHERE t.showtime_id = p_showtime_id;
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'One or more seats already sold';
    END IF;

    /* 2c – none locked by **other** users and still valid */
    SELECT COUNT(*) INTO v_cnt
      FROM seat_locks l
      JOIN JSON_TABLE(p_seat_ids, '$[*]' COLUMNS (seat_id INT PATH '$')) j
        ON j.seat_id = l.seat_id
     WHERE l.showtime_id = p_showtime_id
       AND l.user_id <> p_user_id
       AND l.expires_at > v_now;
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Seat currently locked by another user';
    END IF;

    /* --------- 3.  Insert the reservation (15-minute expiry) */
    INSERT INTO reservations
          (user_id, showtime_id, status, total_amount, created_at, expires_at)
    VALUES (p_user_id, p_showtime_id, 'pending', 0.00, v_now,
            DATE_ADD(v_now, INTERVAL 15 MINUTE));

    SET v_reservation_id = LAST_INSERT_ID();

    /* --------- 4.  Insert tickets and calculate price inline */
    INSERT INTO tickets (reservation_id, showtime_id, seat_id, price)
    SELECT v_reservation_id,
           p_showtime_id,
           s.seat_id,
           /* base price by seat-class … */
           (CASE s.seat_class
                WHEN 'standard' THEN 8.00
                WHEN 'premium' THEN 16.00 END)
           *
           /* … times multiplier by screen format */
           (CASE v_format
                WHEN '2D' THEN 1.00
                WHEN '3D' THEN 1.25
                WHEN 'IMAX' THEN 1.50 END)  AS price
      FROM seats s
      JOIN JSON_TABLE(p_seat_ids, '$[*]' COLUMNS (seat_id INT PATH '$')) j
        ON j.seat_id = s.seat_id;

    /* --------- 5.  Update reservation total & set to confirmed */
    UPDATE reservations
       SET total_amount = (SELECT SUM(price)
                             FROM tickets
                            WHERE reservation_id = v_reservation_id),
           status = 'confirmed'
     WHERE reservation_id = v_reservation_id;

    /* --------- 6.  Remove the (now-used) locks of this user */
    DELETE FROM seat_locks
     WHERE user_id     = p_user_id
       AND showtime_id = p_showtime_id
       AND seat_id IN (SELECT seat_id
                         FROM JSON_TABLE(p_seat_ids,'$[*]' COLUMNS (seat_id INT PATH '$')));
    COMMIT;
END//
DELIMITER ;


-- PROCEDURE: Cancel a reservation
DELIMITER //

CREATE PROCEDURE sp_cancel_reservation (
    IN p_reservation_id INT
)
BEGIN
    DECLARE v_exists BOOL DEFAULT FALSE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    /* lock the row we intend to change */
    SELECT 1 INTO v_exists
      FROM reservations
     WHERE reservation_id = p_reservation_id
       AND status IN ('pending','confirmed')
     FOR UPDATE;

    IF v_exists IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Reservation not found or already finalised';
    END IF;

    /* 1. flip status */
    UPDATE reservations
       SET status = 'cancelled'
     WHERE reservation_id = p_reservation_id;

    /* 2. free the seats by deleting tickets */
    DELETE FROM tickets
     WHERE reservation_id = p_reservation_id;

    COMMIT;
END$$
DELIMITER ;


-- VIEW: Available seats
CREATE VIEW v_available_seats AS
SELECT
    sh.showtime_id,
    s.seat_id,
    s.seat_label,
    s.seat_class,
    s.row_num,
    s.col_num,
    s.screen_id
FROM showtimes sh
JOIN seats s ON s.screen_id = sh.screen_id

/* seats already sold */
LEFT JOIN tickets t
    ON  t.showtime_id = sh.showtime_id
    AND t.seat_id     = s.seat_id

/* seats currently locked by **any** user and not yet expired */
LEFT JOIN seat_locks l
    ON  l.showtime_id = sh.showtime_id
    AND l.seat_id     = s.seat_id
    AND l.expires_at  > NOW()

WHERE
    t.ticket_id IS NULL   -- not sold
AND l.seat_id   IS NULL;  -- not locked