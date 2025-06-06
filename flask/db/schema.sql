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
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_seat_positive_coords CHECK (row_num > 0 AND col_num > 0)
);

-- 4. Movies
CREATE TABLE movies (
    movie_id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    duration INT NOT NULL, -- in minutes
    rating ENUM('G', 'PG', 'PG-13', 'R', 'NC-17') NOT NULL DEFAULT 'G',
    release_date DATE,
    scheduled_close_date DATE COMMENT 'Date when the movie should be automatically closed',
    status ENUM('open','closed') NOT NULL DEFAULT 'open',
    description TEXT,
    director VARCHAR(100),
    cast TEXT,
    genre VARCHAR(50),
    poster_url VARCHAR(255),
    PRIMARY KEY (movie_id),
    CONSTRAINT chk_movie_positive_duration CHECK (duration > 0)
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
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_showtime_end_after_start CHECK (end_time > start_time)
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
);

-- 8. Tickets
CREATE TABLE tickets (
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
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_lock_expiry_after_lock CHECK (expires_at > locked_at)
);

-- TRIGGER: Prevent overlapping showtimes on the same screen (INSERT)
-- Includes 15-minute buffer time between shows for cleaning and audience transition
DELIMITER //
CREATE TRIGGER trg_showtime_no_overlap 
BEFORE INSERT ON showtimes 
FOR EACH ROW 
BEGIN 
    DECLARE conflict_count INT DEFAULT 0;
    DECLARE conflict_movie VARCHAR(255);
    DECLARE buffer_minutes INT DEFAULT 15;
    
    -- Check for overlaps including buffer time
    SELECT COUNT(*) INTO conflict_count
    FROM showtimes s
    WHERE s.screen_id = NEW.screen_id
      AND (
          -- Direct overlap check
          (NEW.start_time < s.end_time AND NEW.end_time > s.start_time)
          OR
          -- Buffer time overlap check
          (NEW.start_time < DATE_ADD(s.end_time, INTERVAL buffer_minutes MINUTE) 
           AND DATE_ADD(NEW.end_time, INTERVAL buffer_minutes MINUTE) > s.start_time)
      );
    
    IF conflict_count > 0 THEN
        -- Get first conflicting movie for error message
        SELECT m.title INTO conflict_movie
        FROM showtimes s
        JOIN movies m ON m.movie_id = s.movie_id
        WHERE s.screen_id = NEW.screen_id
          AND (
              (NEW.start_time < s.end_time AND NEW.end_time > s.start_time)
              OR
              (NEW.start_time < DATE_ADD(s.end_time, INTERVAL buffer_minutes MINUTE) 
               AND DATE_ADD(NEW.end_time, INTERVAL buffer_minutes MINUTE) > s.start_time)
          )
        LIMIT 1;
        
        SET @error_msg = CONCAT('Schedule conflict with another movie');
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = @error_msg;
    END IF;
END//
DELIMITER ;

-- TRIGGER: Prevent overlapping showtimes on the same screen (UPDATE)
-- Includes 15-minute buffer time between shows for cleaning and audience transition
DELIMITER //
CREATE TRIGGER trg_showtime_no_overlap_update 
BEFORE UPDATE ON showtimes 
FOR EACH ROW 
BEGIN 
    DECLARE conflict_count INT DEFAULT 0;
    DECLARE conflict_movie VARCHAR(255);
    DECLARE buffer_minutes INT DEFAULT 15;
    
    -- Only check if time or screen changed
    IF NEW.start_time != OLD.start_time 
       OR NEW.end_time != OLD.end_time 
       OR NEW.screen_id != OLD.screen_id THEN
       
        -- Check for overlaps including buffer time
        SELECT COUNT(*) INTO conflict_count
        FROM showtimes s
        WHERE s.screen_id = NEW.screen_id
          AND s.showtime_id != NEW.showtime_id  -- Exclude self
          AND (
              -- Direct overlap check
              (NEW.start_time < s.end_time AND NEW.end_time > s.start_time)
              OR
              -- Buffer time overlap check
              (NEW.start_time < DATE_ADD(s.end_time, INTERVAL buffer_minutes MINUTE) 
               AND DATE_ADD(NEW.end_time, INTERVAL buffer_minutes MINUTE) > s.start_time)
          );
        
        IF conflict_count > 0 THEN
            -- Get first conflicting movie for error message
            SELECT m.title INTO conflict_movie
            FROM showtimes s
            JOIN movies m ON m.movie_id = s.movie_id
            WHERE s.screen_id = NEW.screen_id
              AND s.showtime_id != NEW.showtime_id
              AND (
                  (NEW.start_time < s.end_time AND NEW.end_time > s.start_time)
                  OR
                  (NEW.start_time < DATE_ADD(s.end_time, INTERVAL buffer_minutes MINUTE) 
                   AND DATE_ADD(NEW.end_time, INTERVAL buffer_minutes MINUTE) > s.start_time)
              )
            LIMIT 1;
            
            SET @error_msg = CONCAT('Schedule conflict with another movie');
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = @error_msg;
        END IF;
    END IF;
END//
DELIMITER ;

-- TRIGGER: Set scheduled close date on movie insert
DELIMITER //
CREATE TRIGGER trg_movie_set_close_date_insert
BEFORE INSERT ON movies
FOR EACH ROW
BEGIN
    -- Set scheduled close date to 1 month after release date
    IF NEW.release_date IS NOT NULL THEN
        SET NEW.scheduled_close_date = DATE_ADD(NEW.release_date, INTERVAL 1 MONTH);
    END IF;
    
    -- If inserting with a past scheduled close date, auto-close the movie
    IF NEW.scheduled_close_date IS NOT NULL AND NEW.scheduled_close_date <= CURDATE() THEN
        SET NEW.status = 'closed';
    END IF;
END//
DELIMITER ;

-- TRIGGER: Update scheduled close date on movie update
DELIMITER //
CREATE TRIGGER trg_movie_set_close_date_update
BEFORE UPDATE ON movies
FOR EACH ROW
BEGIN
    -- Update scheduled close date if release date changes
    IF NEW.release_date != OLD.release_date OR (NEW.release_date IS NOT NULL AND OLD.release_date IS NULL) THEN
        SET NEW.scheduled_close_date = DATE_ADD(NEW.release_date, INTERVAL 1 MONTH);
    END IF;
    
    -- Auto-close if scheduled close date has passed
    IF NEW.scheduled_close_date IS NOT NULL 
       AND NEW.scheduled_close_date <= CURDATE()
       AND OLD.status = 'open' THEN
        SET NEW.status = 'closed';
    END IF;
END//
DELIMITER ;

-- PROCEDURE: Create a reservation
DELIMITER //

CREATE PROCEDURE sp_create_reservation (
    IN p_user_id INT,
    IN p_showtime_id INT,
    IN p_seat_ids JSON
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

    /* --------- 1. Get the screen + format and lock the showtime row */
    SELECT st.screen_id, sc.screen_format
      INTO v_screen_id, v_format
      FROM showtimes st
      JOIN screens sc ON sc.screen_id = st.screen_id
     WHERE st.showtime_id = p_showtime_id
     FOR UPDATE;

    IF v_screen_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Showtime not found';
    END IF;

    /* Lock the specific seats we're trying to reserve */
    SELECT s.seat_id
      FROM seats s
      WHERE s.seat_id IN (
          SELECT seat_id FROM JSON_TABLE(p_seat_ids, '$[*]' COLUMNS (seat_id INT PATH '$')) AS jt
      )
      AND s.screen_id = v_screen_id
      ORDER BY s.seat_id  -- Consistent order to prevent deadlocks
      FOR UPDATE;

    /* --------- 2. Validate the seat set */

    /* 2a – all seats belong to that screen */
    SELECT COUNT(*) INTO v_cnt
      FROM seats s
      JOIN JSON_TABLE(p_seat_ids, '$[*]' COLUMNS (seat_id INT PATH '$')) j1
        ON j1.seat_id = s.seat_id
     WHERE s.screen_id <> v_screen_id;
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'One or more seats do not belong to the showtime screen';
    END IF;

    /* 2b – none already sold */
    SELECT COUNT(*) INTO v_cnt
      FROM tickets t
      JOIN reservations r ON r.reservation_id = t.reservation_id
      JOIN JSON_TABLE(p_seat_ids, '$[*]' COLUMNS (seat_id INT PATH '$')) j2
        ON j2.seat_id = t.seat_id
     WHERE r.showtime_id = p_showtime_id;
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'One or more seats already sold';
    END IF;

    /* 2c – none locked by **other** users and still valid */
    SELECT COUNT(*) INTO v_cnt
      FROM seat_locks l
      JOIN JSON_TABLE(p_seat_ids, '$[*]' COLUMNS (seat_id INT PATH '$')) j3
        ON j3.seat_id = l.seat_id
     WHERE l.showtime_id = p_showtime_id
       AND l.user_id <> p_user_id
       AND l.expires_at > v_now;
    IF v_cnt > 0 THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Seat currently locked by another user';
    END IF;

    /* --------- 3. Insert the reservation (15-minute expiry) */
    INSERT INTO reservations
          (user_id, showtime_id, status, created_at, expires_at)
    VALUES (p_user_id, p_showtime_id, 'pending', v_now,
            DATE_ADD(v_now, INTERVAL 15 MINUTE));

    SET v_reservation_id = LAST_INSERT_ID();

    /* --------- 4. Insert tickets and calculate price inline */
    INSERT INTO tickets (reservation_id, seat_id, price)
    SELECT v_reservation_id,
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
                WHEN 'IMAX' THEN 1.50 END) AS price
      FROM seats s
      JOIN JSON_TABLE(p_seat_ids, '$[*]' COLUMNS (seat_id INT PATH '$')) j4
        ON j4.seat_id = s.seat_id;

    /* --------- 5. Update reservation total & set to confirmed */
    UPDATE reservations
       SET status = 'confirmed'
     WHERE reservation_id = v_reservation_id;

    /* --------- 6. Remove the (now-used) locks of this user */
    DELETE FROM seat_locks
     WHERE user_id = p_user_id
       AND showtime_id = p_showtime_id
       AND seat_id IN (SELECT seat_id
                         FROM JSON_TABLE(p_seat_ids,'$[*]' COLUMNS (seat_id INT PATH '$')) AS j5);

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
    DECLARE v_user_id INT;
    DECLARE v_showtime_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    /* lock the row we intend to change */
    SELECT user_id, showtime_id INTO v_user_id, v_showtime_id
      FROM reservations
     WHERE reservation_id = p_reservation_id
       AND status IN ('pending','confirmed')
     FOR UPDATE;

    IF v_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
          SET MESSAGE_TEXT = 'Reservation not found or already finalised';
    END IF;

    /* 1. flip status and reset total amount */
    UPDATE reservations
       SET status = 'cancelled'
     WHERE reservation_id = p_reservation_id;

    /* 2. free the seats by deleting tickets */
    DELETE FROM tickets
     WHERE reservation_id = p_reservation_id;

    /* 3. remove any seat locks for this user and showtime */
    DELETE FROM seat_locks
     WHERE user_id = v_user_id
       AND showtime_id = v_showtime_id;

    COMMIT;
END//
DELIMITER ;


-- VIEW: Available seats
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

/* seats already sold */
LEFT JOIN tickets AS t
       JOIN reservations AS r ON r.reservation_id = t.reservation_id
       ON r.showtime_id = sh.showtime_id
       AND t.seat_id = s.seat_id

/* seats currently locked by **any** user and not yet expired */
LEFT JOIN seat_locks AS l
       ON l.showtime_id = sh.showtime_id
       AND l.seat_id = s.seat_id
       AND l.expires_at > NOW()

WHERE
      t.ticket_id IS NULL -- not sold
  AND l.seat_id IS NULL; -- not locked

-- VIEW: Active showtimes with details
-- This view returns showtimes that haven't ended yet for open movies
-- Includes all necessary joins to minimize backend queries
CREATE OR REPLACE VIEW v_active_showtimes_details AS
SELECT 
    s.showtime_id,
    s.movie_id,
    s.screen_id,
    s.start_time,
    s.end_time,
    m.title AS movie_title,
    m.duration AS movie_duration,
    m.rating AS movie_rating,
    m.description AS movie_description,
    m.director AS movie_director,
    m.cast AS movie_cast,
    m.genre AS movie_genre,
    m.poster_url AS movie_poster_url,
    m.release_date AS movie_release_date,
    sc.name AS screen_name,
    sc.screen_format,
    c.cinema_id,
    c.name AS cinema_name,
    c.address AS cinema_address,
    c.city AS cinema_city
FROM showtimes s
JOIN movies m ON m.movie_id = s.movie_id
JOIN screens sc ON sc.screen_id = s.screen_id
JOIN cinemas c ON c.cinema_id = sc.cinema_id
WHERE s.end_time > NOW()
  AND m.status = 'open'
ORDER BY s.start_time;

-- VIEW: Admin revenue summary
-- Single-row dashboard summary with key revenue metrics across time periods and categories
CREATE OR REPLACE VIEW v_admin_revenue_summary AS
SELECT 
    -- Time-based revenue metrics
    SUM(CASE WHEN DATE(t.issued_at) = CURDATE() THEN t.price ELSE 0 END) AS revenue_today,
    SUM(CASE WHEN t.issued_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN t.price ELSE 0 END) AS revenue_this_week,
    SUM(CASE WHEN t.issued_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN t.price ELSE 0 END) AS revenue_this_month,
    SUM(t.price) AS revenue_total,
    
    -- Ticket volume metrics  
    COUNT(CASE WHEN DATE(t.issued_at) = CURDATE() THEN 1 END) AS tickets_today,
    COUNT(CASE WHEN t.issued_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) AS tickets_this_week,
    COUNT(CASE WHEN t.issued_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) AS tickets_this_month,
    COUNT(t.ticket_id) AS tickets_total,
    
    -- Average pricing metrics
    COALESCE(AVG(CASE WHEN DATE(t.issued_at) = CURDATE() THEN t.price END), 0) AS avg_price_today,
    COALESCE(AVG(CASE WHEN t.issued_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN t.price END), 0) AS avg_price_this_week,
    COALESCE(AVG(CASE WHEN t.issued_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN t.price END), 0) AS avg_price_this_month,
    
    -- Revenue by seat class
    SUM(CASE WHEN s.seat_class = 'standard' THEN t.price ELSE 0 END) AS revenue_standard_seats,
    SUM(CASE WHEN s.seat_class = 'premium' THEN t.price ELSE 0 END) AS revenue_premium_seats,
    
    -- Revenue by screen format
    SUM(CASE WHEN sc.screen_format = '2D' THEN t.price ELSE 0 END) AS revenue_2d,
    SUM(CASE WHEN sc.screen_format = '3D' THEN t.price ELSE 0 END) AS revenue_3d,
    SUM(CASE WHEN sc.screen_format = 'IMAX' THEN t.price ELSE 0 END) AS revenue_imax
    
FROM tickets t
JOIN reservations r ON r.reservation_id = t.reservation_id AND r.status = 'confirmed'
JOIN seats s ON s.seat_id = t.seat_id
JOIN showtimes st ON st.showtime_id = r.showtime_id  
JOIN screens sc ON sc.screen_id = st.screen_id;

-- VIEW: Top performing movies
-- Movie leaderboard with performance metrics and composite scoring
CREATE OR REPLACE VIEW v_top_performing_movies AS
SELECT 
    m.movie_id,
    m.title,
    m.genre,
    m.director,
    m.rating,
    m.release_date,
    m.status,
    m.poster_url,
    
    -- Volume metrics
    COALESCE(perf.total_showtimes, 0) AS total_showtimes,
    COALESCE(perf.total_tickets_sold, 0) AS total_tickets_sold,
    
    -- Revenue metrics
    COALESCE(perf.total_revenue, 0.00) AS total_revenue,
    COALESCE(perf.avg_revenue_per_showtime, 0.00) AS avg_revenue_per_showtime,
    COALESCE(perf.avg_ticket_price, 0.00) AS avg_ticket_price,
    
    -- Performance metrics
    ROUND(COALESCE(perf.avg_occupancy_rate, 0), 2) AS avg_occupancy_rate_percent,
    ROUND(COALESCE(perf.total_revenue, 0) / NULLIF(perf.total_showtimes, 0), 2) AS revenue_efficiency,
    
    -- Ranking scores (normalized 0-100)
    ROUND(
        (0.4 * COALESCE(perf.revenue_rank, 0)) + 
        (0.3 * COALESCE(perf.occupancy_rank, 0)) + 
        (0.3 * COALESCE(perf.volume_rank, 0)), 2
    ) AS composite_performance_score,
    
    -- Individual ranking components for transparency
    ROUND(COALESCE(perf.revenue_rank, 0), 2) AS revenue_rank_score,
    ROUND(COALESCE(perf.occupancy_rank, 0), 2) AS occupancy_rank_score,
    ROUND(COALESCE(perf.volume_rank, 0), 2) AS volume_rank_score

FROM movies m
LEFT JOIN (
    SELECT 
        st.movie_id,
        COUNT(DISTINCT st.showtime_id) AS total_showtimes,
        COUNT(t.ticket_id) AS total_tickets_sold,
        SUM(t.price) AS total_revenue,
        AVG(t.price) AS avg_ticket_price,
        SUM(t.price) / COUNT(DISTINCT st.showtime_id) AS avg_revenue_per_showtime,
        (COUNT(t.ticket_id) / (COUNT(DISTINCT st.showtime_id) * 96.0)) * 100 AS avg_occupancy_rate,
        
        -- Ranking components (higher is better)
        PERCENT_RANK() OVER (ORDER BY SUM(t.price)) * 100 AS revenue_rank,
        PERCENT_RANK() OVER (ORDER BY (COUNT(t.ticket_id) / (COUNT(DISTINCT st.showtime_id) * 96.0))) * 100 AS occupancy_rank,
        PERCENT_RANK() OVER (ORDER BY COUNT(t.ticket_id)) * 100 AS volume_rank
        
    FROM showtimes st
    LEFT JOIN reservations r ON r.showtime_id = st.showtime_id AND r.status = 'confirmed'  
    LEFT JOIN tickets t ON t.reservation_id = r.reservation_id
    WHERE st.start_time >= DATE_SUB(NOW(), INTERVAL 90 DAY)  -- Last 90 days
    GROUP BY st.movie_id
) perf ON perf.movie_id = m.movie_id

ORDER BY composite_performance_score DESC, total_revenue DESC;

-- VIEW: Occupied timeslots for scheduling visualization
-- Shows all showtimes with buffer periods for admin scheduling interface
CREATE OR REPLACE VIEW v_occupied_timeslots AS
SELECT 
    s.showtime_id,
    s.screen_id,
    sc.name AS screen_name,
    sc.cinema_id,
    c.name AS cinema_name,
    c.city AS cinema_city,
    s.start_time,
    s.end_time,
    -- Add 15-minute buffer for cleaning/transition
    DATE_SUB(s.start_time, INTERVAL 15 MINUTE) AS buffer_start,
    DATE_ADD(s.end_time, INTERVAL 15 MINUTE) AS buffer_end,
    DATE(s.start_time) AS show_date,
    TIME(s.start_time) AS show_time,
    m.movie_id,
    m.title AS movie_title,
    m.duration AS movie_duration,
    m.status AS movie_status,
    sc.screen_format,
    -- Helper columns for scheduling UI
    HOUR(s.start_time) AS start_hour,
    MINUTE(s.start_time) AS start_minute,
    HOUR(s.end_time) AS end_hour,
    MINUTE(s.end_time) AS end_minute
FROM showtimes s
JOIN screens sc ON sc.screen_id = s.screen_id
JOIN cinemas c ON c.cinema_id = sc.cinema_id  
JOIN movies m ON m.movie_id = s.movie_id
WHERE s.start_time >= DATE_SUB(NOW(), INTERVAL 1 DAY)  -- Include recent past for context
ORDER BY s.screen_id, s.start_time;

-- 1. TIME-BASED QUERY INDEXES (Critical for finding active/upcoming content)
-- ---------------------------------------------------------------------

-- Showtimes: Finding active/upcoming shows
CREATE INDEX idx_showtimes_start_time ON showtimes(start_time);
CREATE INDEX idx_showtimes_end_time ON showtimes(end_time);

-- Showtimes: Movie schedule queries (e.g., "all showtimes for movie X")
CREATE INDEX idx_showtimes_movie_start ON showtimes(movie_id, start_time);

-- Showtimes: Screen availability checks for scheduling
CREATE INDEX idx_showtimes_screen_end ON showtimes(screen_id, end_time);

-- Reservations: Time-based analytics and expiry management
CREATE INDEX idx_reservations_created_at ON reservations(created_at);
CREATE INDEX idx_reservations_expires_at ON reservations(expires_at);

-- Seat locks: Cleanup of expired locks
CREATE INDEX idx_seat_locks_expires_at ON seat_locks(expires_at);

-- 2. ANALYTICS AND REPORTING INDEXES (For admin dashboards)
-- ---------------------------------------------------------------------

-- Tickets: Revenue analytics by time period  
CREATE INDEX idx_tickets_issued_at ON tickets(issued_at);

-- Movies: Auto-closing and date-based filtering
CREATE INDEX idx_movies_scheduled_close_date ON movies(scheduled_close_date);
CREATE INDEX idx_movies_release_date ON movies(release_date);

-- Movies: Status filtering for active content
CREATE INDEX idx_movies_status_release ON movies(status, release_date);

-- 3. BOOKING FLOW OPTIMIZATION INDEXES
-- ---------------------------------------------------------------------

-- Reservations: User's booking history and active reservations
CREATE INDEX idx_reservations_user_status ON reservations(user_id, status);

-- Reservations: Showtime seat availability checks
CREATE INDEX idx_reservations_showtime_status ON reservations(showtime_id, status);

-- Reservations: General status filtering
CREATE INDEX idx_reservations_status ON reservations(status);

-- Tickets: Efficient seat availability verification
CREATE INDEX idx_tickets_seat_reservation ON tickets(seat_id, reservation_id);

-- Seat locks: Finding user's current locks
CREATE INDEX idx_seat_locks_user_id ON seat_locks(user_id);

-- 4. CONTENT FILTERING AND SEARCH INDEXES
-- ---------------------------------------------------------------------

-- Movies: Genre-based filtering
CREATE INDEX idx_movies_genre ON movies(genre);

-- Seats: Class-based queries and pricing
CREATE INDEX idx_seats_seat_class ON seats(seat_class);

-- Seats: Efficient seat layout queries
CREATE INDEX idx_seats_screen_position ON seats(screen_id, row_num, col_num);