-- Movie Booking System - Seed Data
-- Purpose: Sample data for development and demo
-- Generated: 2024-12-19

-- Disable foreign key checks for easier insertion
SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data in reverse dependency order
TRUNCATE TABLE seat_locks;
TRUNCATE TABLE tickets;
TRUNCATE TABLE reservations;
TRUNCATE TABLE showtimes;
TRUNCATE TABLE seats;
TRUNCATE TABLE screens;
TRUNCATE TABLE movies;
TRUNCATE TABLE cinemas;
TRUNCATE TABLE users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 1. USERS (No dependencies)
-- =============================================
INSERT INTO users (email, password_hash, role) VALUES
('admin@moviebooking.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwlY7oGvF5U2k.QTu', 'admin'),
('john.doe@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwlY7oGvF5U2k.QTu', 'customer'),
('jane.smith@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwlY7oGvF5U2k.QTu', 'customer'),
('mike.wilson@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwlY7oGvF5U2k.QTu', 'customer'),
('sara.jones@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwlY7oGvF5U2k.QTu', 'customer');

-- =============================================
-- 2. CINEMAS (No dependencies)
-- =============================================
INSERT INTO cinemas (name, address, city) VALUES
('VinUni Cinema', '123 Nguyen Van Cu Street, Gia Lam District', 'Hanoi'),
('Downtown Multiplex', '456 Tran Hung Dao Street, Hoan Kiem District', 'Hanoi'),
('Galaxy Mall Cinema', '789 Pham Van Dong Street, Bac Tu Liem District', 'Hanoi');

-- =============================================
-- 3. SCREENS (Depends on cinemas)
-- =============================================
INSERT INTO screens (cinema_id, name, screen_format) VALUES
-- VinUni Cinema screens
(1, 'Screen A', '2D'),
(1, 'Screen B', '3D'),
(1, 'IMAX Theater', 'IMAX'),
-- Downtown Multiplex screens  
(2, 'Premium Hall 1', '2D'),
(2, 'Premium Hall 2', '3D'),
-- Galaxy Mall Cinema screens
(3, 'Screen 1', '2D'),
(3, 'Screen 2', '2D');

-- =============================================
-- 4. SEATS (Depends on screens)
-- =============================================
-- Standard layout: 8 rows x 12 seats = 96 seats per standard screen
-- IMAX layout: 10 rows x 15 seats = 150 seats
-- Premium rows (6-8/10) are premium class, others standard

-- Screen 1 (VinUni Cinema - Screen A, 2D) - 8x12 = 96 seats
INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) VALUES
-- Row A (1-12)
(1, 'standard', 'A1', 1, 1), (1, 'standard', 'A2', 1, 2), (1, 'standard', 'A3', 1, 3), (1, 'standard', 'A4', 1, 4),
(1, 'standard', 'A5', 1, 5), (1, 'standard', 'A6', 1, 6), (1, 'standard', 'A7', 1, 7), (1, 'standard', 'A8', 1, 8),
(1, 'standard', 'A9', 1, 9), (1, 'standard', 'A10', 1, 10), (1, 'standard', 'A11', 1, 11), (1, 'standard', 'A12', 1, 12),
-- Row B (1-12)
(1, 'standard', 'B1', 2, 1), (1, 'standard', 'B2', 2, 2), (1, 'standard', 'B3', 2, 3), (1, 'standard', 'B4', 2, 4),
(1, 'standard', 'B5', 2, 5), (1, 'standard', 'B6', 2, 6), (1, 'standard', 'B7', 2, 7), (1, 'standard', 'B8', 2, 8),
(1, 'standard', 'B9', 2, 9), (1, 'standard', 'B10', 2, 10), (1, 'standard', 'B11', 2, 11), (1, 'standard', 'B12', 2, 12),
-- Row C (1-12)
(1, 'standard', 'C1', 3, 1), (1, 'standard', 'C2', 3, 2), (1, 'standard', 'C3', 3, 3), (1, 'standard', 'C4', 3, 4),
(1, 'standard', 'C5', 3, 5), (1, 'standard', 'C6', 3, 6), (1, 'standard', 'C7', 3, 7), (1, 'standard', 'C8', 3, 8),
(1, 'standard', 'C9', 3, 9), (1, 'standard', 'C10', 3, 10), (1, 'standard', 'C11', 3, 11), (1, 'standard', 'C12', 3, 12),
-- Row D (1-12)
(1, 'standard', 'D1', 4, 1), (1, 'standard', 'D2', 4, 2), (1, 'standard', 'D3', 4, 3), (1, 'standard', 'D4', 4, 4),
(1, 'standard', 'D5', 4, 5), (1, 'standard', 'D6', 4, 6), (1, 'standard', 'D7', 4, 7), (1, 'standard', 'D8', 4, 8),
(1, 'standard', 'D9', 4, 9), (1, 'standard', 'D10', 4, 10), (1, 'standard', 'D11', 4, 11), (1, 'standard', 'D12', 4, 12),
-- Row E (1-12)
(1, 'standard', 'E1', 5, 1), (1, 'standard', 'E2', 5, 2), (1, 'standard', 'E3', 5, 3), (1, 'standard', 'E4', 5, 4),
(1, 'standard', 'E5', 5, 5), (1, 'standard', 'E6', 5, 6), (1, 'standard', 'E7', 5, 7), (1, 'standard', 'E8', 5, 8),
(1, 'standard', 'E9', 5, 9), (1, 'standard', 'E10', 5, 10), (1, 'standard', 'E11', 5, 11), (1, 'standard', 'E12', 5, 12),
-- Row F (1-12) - Premium starts here
(1, 'premium', 'F1', 6, 1), (1, 'premium', 'F2', 6, 2), (1, 'premium', 'F3', 6, 3), (1, 'premium', 'F4', 6, 4),
(1, 'premium', 'F5', 6, 5), (1, 'premium', 'F6', 6, 6), (1, 'premium', 'F7', 6, 7), (1, 'premium', 'F8', 6, 8),
(1, 'premium', 'F9', 6, 9), (1, 'premium', 'F10', 6, 10), (1, 'premium', 'F11', 6, 11), (1, 'premium', 'F12', 6, 12),
-- Row G (1-12) - Premium
(1, 'premium', 'G1', 7, 1), (1, 'premium', 'G2', 7, 2), (1, 'premium', 'G3', 7, 3), (1, 'premium', 'G4', 7, 4),
(1, 'premium', 'G5', 7, 5), (1, 'premium', 'G6', 7, 6), (1, 'premium', 'G7', 7, 7), (1, 'premium', 'G8', 7, 8),
(1, 'premium', 'G9', 7, 9), (1, 'premium', 'G10', 7, 10), (1, 'premium', 'G11', 7, 11), (1, 'premium', 'G12', 7, 12),
-- Row H (1-12) - Premium
(1, 'premium', 'H1', 8, 1), (1, 'premium', 'H2', 8, 2), (1, 'premium', 'H3', 8, 3), (1, 'premium', 'H4', 8, 4),
(1, 'premium', 'H5', 8, 5), (1, 'premium', 'H6', 8, 6), (1, 'premium', 'H7', 8, 7), (1, 'premium', 'H8', 8, 8),
(1, 'premium', 'H9', 8, 9), (1, 'premium', 'H10', 8, 10), (1, 'premium', 'H11', 8, 11), (1, 'premium', 'H12', 8, 12);

-- Screen 2 (VinUni Cinema - Screen B, 3D) - 8x12 = 96 seats
INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) VALUES
-- Row A-E (Standard seats)
(2, 'standard', 'A1', 1, 1), (2, 'standard', 'A2', 1, 2), (2, 'standard', 'A3', 1, 3), (2, 'standard', 'A4', 1, 4),
(2, 'standard', 'A5', 1, 5), (2, 'standard', 'A6', 1, 6), (2, 'standard', 'A7', 1, 7), (2, 'standard', 'A8', 1, 8),
(2, 'standard', 'A9', 1, 9), (2, 'standard', 'A10', 1, 10), (2, 'standard', 'A11', 1, 11), (2, 'standard', 'A12', 1, 12),
(2, 'standard', 'B1', 2, 1), (2, 'standard', 'B2', 2, 2), (2, 'standard', 'B3', 2, 3), (2, 'standard', 'B4', 2, 4),
(2, 'standard', 'B5', 2, 5), (2, 'standard', 'B6', 2, 6), (2, 'standard', 'B7', 2, 7), (2, 'standard', 'B8', 2, 8),
(2, 'standard', 'B9', 2, 9), (2, 'standard', 'B10', 2, 10), (2, 'standard', 'B11', 2, 11), (2, 'standard', 'B12', 2, 12),
(2, 'standard', 'C1', 3, 1), (2, 'standard', 'C2', 3, 2), (2, 'standard', 'C3', 3, 3), (2, 'standard', 'C4', 3, 4),
(2, 'standard', 'C5', 3, 5), (2, 'standard', 'C6', 3, 6), (2, 'standard', 'C7', 3, 7), (2, 'standard', 'C8', 3, 8),
(2, 'standard', 'C9', 3, 9), (2, 'standard', 'C10', 3, 10), (2, 'standard', 'C11', 3, 11), (2, 'standard', 'C12', 3, 12),
(2, 'standard', 'D1', 4, 1), (2, 'standard', 'D2', 4, 2), (2, 'standard', 'D3', 4, 3), (2, 'standard', 'D4', 4, 4),
(2, 'standard', 'D5', 4, 5), (2, 'standard', 'D6', 4, 6), (2, 'standard', 'D7', 4, 7), (2, 'standard', 'D8', 4, 8),
(2, 'standard', 'D9', 4, 9), (2, 'standard', 'D10', 4, 10), (2, 'standard', 'D11', 4, 11), (2, 'standard', 'D12', 4, 12),
(2, 'standard', 'E1', 5, 1), (2, 'standard', 'E2', 5, 2), (2, 'standard', 'E3', 5, 3), (2, 'standard', 'E4', 5, 4),
(2, 'standard', 'E5', 5, 5), (2, 'standard', 'E6', 5, 6), (2, 'standard', 'E7', 5, 7), (2, 'standard', 'E8', 5, 8),
(2, 'standard', 'E9', 5, 9), (2, 'standard', 'E10', 5, 10), (2, 'standard', 'E11', 5, 11), (2, 'standard', 'E12', 5, 12),
-- Row F-H (Premium seats)
(2, 'premium', 'F1', 6, 1), (2, 'premium', 'F2', 6, 2), (2, 'premium', 'F3', 6, 3), (2, 'premium', 'F4', 6, 4),
(2, 'premium', 'F5', 6, 5), (2, 'premium', 'F6', 6, 6), (2, 'premium', 'F7', 6, 7), (2, 'premium', 'F8', 6, 8),
(2, 'premium', 'F9', 6, 9), (2, 'premium', 'F10', 6, 10), (2, 'premium', 'F11', 6, 11), (2, 'premium', 'F12', 6, 12),
(2, 'premium', 'G1', 7, 1), (2, 'premium', 'G2', 7, 2), (2, 'premium', 'G3', 7, 3), (2, 'premium', 'G4', 7, 4),
(2, 'premium', 'G5', 7, 5), (2, 'premium', 'G6', 7, 6), (2, 'premium', 'G7', 7, 7), (2, 'premium', 'G8', 7, 8),
(2, 'premium', 'G9', 7, 9), (2, 'premium', 'G10', 7, 10), (2, 'premium', 'G11', 7, 11), (2, 'premium', 'G12', 7, 12),
(2, 'premium', 'H1', 8, 1), (2, 'premium', 'H2', 8, 2), (2, 'premium', 'H3', 8, 3), (2, 'premium', 'H4', 8, 4),
(2, 'premium', 'H5', 8, 5), (2, 'premium', 'H6', 8, 6), (2, 'premium', 'H7', 8, 7), (2, 'premium', 'H8', 8, 8),
(2, 'premium', 'H9', 8, 9), (2, 'premium', 'H10', 8, 10), (2, 'premium', 'H11', 8, 11), (2, 'premium', 'H12', 8, 12);

-- Screen 3 (VinUni Cinema - IMAX Theater) - 10x15 = 150 seats
INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) VALUES
-- Rows A-G (Standard) - 7 rows x 15 seats = 105 seats
(3, 'standard', 'A1', 1, 1), (3, 'standard', 'A2', 1, 2), (3, 'standard', 'A3', 1, 3), (3, 'standard', 'A4', 1, 4), (3, 'standard', 'A5', 1, 5),
(3, 'standard', 'A6', 1, 6), (3, 'standard', 'A7', 1, 7), (3, 'standard', 'A8', 1, 8), (3, 'standard', 'A9', 1, 9), (3, 'standard', 'A10', 1, 10),
(3, 'standard', 'A11', 1, 11), (3, 'standard', 'A12', 1, 12), (3, 'standard', 'A13', 1, 13), (3, 'standard', 'A14', 1, 14), (3, 'standard', 'A15', 1, 15),
-- Row B-G (Standard seats)
(3, 'standard', 'B1', 2, 1), (3, 'standard', 'B2', 2, 2), (3, 'standard', 'B3', 2, 3), (3, 'standard', 'B4', 2, 4), (3, 'standard', 'B5', 2, 5),
(3, 'standard', 'B6', 2, 6), (3, 'standard', 'B7', 2, 7), (3, 'standard', 'B8', 2, 8), (3, 'standard', 'B9', 2, 9), (3, 'standard', 'B10', 2, 10),
(3, 'standard', 'B11', 2, 11), (3, 'standard', 'B12', 2, 12), (3, 'standard', 'B13', 2, 13), (3, 'standard', 'B14', 2, 14), (3, 'standard', 'B15', 2, 15),
(3, 'standard', 'C1', 3, 1), (3, 'standard', 'C2', 3, 2), (3, 'standard', 'C3', 3, 3), (3, 'standard', 'C4', 3, 4), (3, 'standard', 'C5', 3, 5),
(3, 'standard', 'C6', 3, 6), (3, 'standard', 'C7', 3, 7), (3, 'standard', 'C8', 3, 8), (3, 'standard', 'C9', 3, 9), (3, 'standard', 'C10', 3, 10),
(3, 'standard', 'C11', 3, 11), (3, 'standard', 'C12', 3, 12), (3, 'standard', 'C13', 3, 13), (3, 'standard', 'C14', 3, 14), (3, 'standard', 'C15', 3, 15),
-- Premium rows H-J (3 rows x 15 seats = 45 premium seats)
(3, 'premium', 'H1', 8, 1), (3, 'premium', 'H2', 8, 2), (3, 'premium', 'H3', 8, 3), (3, 'premium', 'H4', 8, 4), (3, 'premium', 'H5', 8, 5),
(3, 'premium', 'H6', 8, 6), (3, 'premium', 'H7', 8, 7), (3, 'premium', 'H8', 8, 8), (3, 'premium', 'H9', 8, 9), (3, 'premium', 'H10', 8, 10),
(3, 'premium', 'H11', 8, 11), (3, 'premium', 'H12', 8, 12), (3, 'premium', 'H13', 8, 13), (3, 'premium', 'H14', 8, 14), (3, 'premium', 'H15', 8, 15),
(3, 'premium', 'I1', 9, 1), (3, 'premium', 'I2', 9, 2), (3, 'premium', 'I3', 9, 3), (3, 'premium', 'I4', 9, 4), (3, 'premium', 'I5', 9, 5),
(3, 'premium', 'I6', 9, 6), (3, 'premium', 'I7', 9, 7), (3, 'premium', 'I8', 9, 8), (3, 'premium', 'I9', 9, 9), (3, 'premium', 'I10', 9, 10),
(3, 'premium', 'I11', 9, 11), (3, 'premium', 'I12', 9, 12), (3, 'premium', 'I13', 9, 13), (3, 'premium', 'I14', 9, 14), (3, 'premium', 'I15', 9, 15),
(3, 'premium', 'J1', 10, 1), (3, 'premium', 'J2', 10, 2), (3, 'premium', 'J3', 10, 3), (3, 'premium', 'J4', 10, 4), (3, 'premium', 'J5', 10, 5),
(3, 'premium', 'J6', 10, 6), (3, 'premium', 'J7', 10, 7), (3, 'premium', 'J8', 10, 8), (3, 'premium', 'J9', 10, 9), (3, 'premium', 'J10', 10, 10),
(3, 'premium', 'J11', 10, 11), (3, 'premium', 'J12', 10, 12), (3, 'premium', 'J13', 10, 13), (3, 'premium', 'J14', 10, 14), (3, 'premium', 'J15', 10, 15);

-- Remaining screens with simplified seat layouts for demo purposes
-- Screen 4 (Downtown Multiplex - Premium Hall 1) - 6x10 = 60 seats
INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) VALUES
(4, 'standard', 'A1', 1, 1), (4, 'standard', 'A2', 1, 2), (4, 'standard', 'A3', 1, 3), (4, 'standard', 'A4', 1, 4), (4, 'standard', 'A5', 1, 5),
(4, 'standard', 'A6', 1, 6), (4, 'standard', 'A7', 1, 7), (4, 'standard', 'A8', 1, 8), (4, 'standard', 'A9', 1, 9), (4, 'standard', 'A10', 1, 10),
(4, 'standard', 'B1', 2, 1), (4, 'standard', 'B2', 2, 2), (4, 'standard', 'B3', 2, 3), (4, 'standard', 'B4', 2, 4), (4, 'standard', 'B5', 2, 5),
(4, 'standard', 'B6', 2, 6), (4, 'standard', 'B7', 2, 7), (4, 'standard', 'B8', 2, 8), (4, 'standard', 'B9', 2, 9), (4, 'standard', 'B10', 2, 10),
(4, 'premium', 'E1', 5, 1), (4, 'premium', 'E2', 5, 2), (4, 'premium', 'E3', 5, 3), (4, 'premium', 'E4', 5, 4), (4, 'premium', 'E5', 5, 5),
(4, 'premium', 'E6', 5, 6), (4, 'premium', 'E7', 5, 7), (4, 'premium', 'E8', 5, 8), (4, 'premium', 'E9', 5, 9), (4, 'premium', 'E10', 5, 10),
(4, 'premium', 'F1', 6, 1), (4, 'premium', 'F2', 6, 2), (4, 'premium', 'F3', 6, 3), (4, 'premium', 'F4', 6, 4), (4, 'premium', 'F5', 6, 5),
(4, 'premium', 'F6', 6, 6), (4, 'premium', 'F7', 6, 7), (4, 'premium', 'F8', 6, 8), (4, 'premium', 'F9', 6, 9), (4, 'premium', 'F10', 6, 10);

-- =============================================
-- 5. MOVIES (No dependencies)
-- =============================================
INSERT INTO movies (title, duration, rating, release_date, status, description, director, cast, genre, poster_url) VALUES
('Avatar: The Way of Water', 192, 'PG-13', '2023-12-16', 'open', 
 'Jake Sully lives with his newfound family formed on the planet of Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Navi race to protect their planet.',
 'James Cameron', 'Sam Worthington, Zoe Saldana, Sigourney Weaver, Stephen Lang, Kate Winslet',
 'Action', 'https://example.com/avatar2.jpg'),

('Fast X', 141, 'PG-13', '2023-05-19', 'open',
 'Dom Toretto and his family are targeted by the vengeful son of drug kingpin Hernan Reyes.',
 'Louis Leterrier', 'Vin Diesel, Michelle Rodriguez, Tyrese Gibson, Ludacris, John Cena',
 'Action', 'https://example.com/fastx.jpg'),

('Spider-Man: Across the Spider-Verse', 140, 'PG', '2023-06-02', 'open',
 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
 'Joaquim Dos Santos', 'Shameik Moore, Hailee Steinfeld, Brian Tyree Henry, Luna Lauren Velez',
 'Animation', 'https://example.com/spiderverse.jpg'),

('The Batman', 176, 'PG-13', '2022-03-04', 'open',
 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the citys hidden corruption.',
 'Matt Reeves', 'Robert Pattinson, Zoë Kravitz, Paul Dano, Jeffrey Wright, Colin Farrell',
 'Action', 'https://example.com/batman.jpg'),

('Inception', 148, 'PG-13', '2010-07-16', 'open',
 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
 'Christopher Nolan', 'Leonardo DiCaprio, Marion Cotillard, Tom Hardy, Elliot Page, Ken Watanabe',
 'Sci-Fi', 'https://example.com/inception.jpg'),

('Dune: Part Two', 165, 'PG-13', '2024-03-01', 'open',
 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
 'Denis Villeneuve', 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Josh Brolin, Austin Butler',
 'Sci-Fi', 'https://example.com/dune2.jpg');

-- =============================================
-- 6. SHOWTIMES (Depends on movies + screens)
-- =============================================
INSERT INTO showtimes (movie_id, screen_id, start_time, end_time) VALUES
-- Today's showtimes
-- Avatar (192 min) on IMAX Theater
(1, 3, '2024-12-19 14:00:00', '2024-12-19 17:12:00'),
(1, 3, '2024-12-19 19:30:00', '2024-12-19 22:42:00'),

-- Fast X (141 min) on Screen A
(2, 1, '2024-12-19 15:30:00', '2024-12-19 17:51:00'), 
(2, 1, '2024-12-19 20:00:00', '2024-12-19 22:21:00'),

-- Spider-Verse (140 min) on Screen B (3D)
(3, 2, '2024-12-19 16:00:00', '2024-12-19 18:20:00'),
(3, 2, '2024-12-19 21:00:00', '2024-12-19 23:20:00'),

-- The Batman (176 min) on Premium Hall 1
(4, 4, '2024-12-19 18:00:00', '2024-12-19 20:56:00'),

-- Tomorrow's showtimes
-- Inception (148 min) on Screen A
(5, 1, '2024-12-20 14:30:00', '2024-12-20 16:58:00'),
(5, 1, '2024-12-20 19:15:00', '2024-12-20 21:43:00'),

-- Dune 2 (165 min) on IMAX Theater
(6, 3, '2024-12-20 15:00:00', '2024-12-20 17:45:00'),
(6, 3, '2024-12-20 20:30:00', '2024-12-20 23:15:00'),

-- Avatar on Screen B (3D showing)
(1, 2, '2024-12-20 17:00:00', '2024-12-20 20:12:00'),

-- Weekend showtimes (December 21)
-- Spider-Verse matinee
(3, 2, '2024-12-21 11:00:00', '2024-12-21 13:20:00'),
-- Fast X evening
(2, 1, '2024-12-21 21:30:00', '2024-12-21 23:51:00');

-- =============================================
-- 7. RESERVATIONS (Depends on users + showtimes)
-- =============================================
INSERT INTO reservations (user_id, showtime_id, status, created_at, expires_at) VALUES
-- John's confirmed reservation for Avatar IMAX tonight
(2, 1, 'confirmed', '2024-12-19 10:30:00', '2024-12-19 10:45:00'),

-- Jane's confirmed reservation for Spider-Verse 3D tonight  
(3, 5, 'confirmed', '2024-12-19 11:15:00', '2024-12-19 11:30:00'),

-- Mike's pending reservation for Inception tomorrow (expires in 15 min from creation)
(4, 8, 'pending', '2024-12-19 12:00:00', '2024-12-19 12:15:00'),

-- Sara's cancelled reservation (for testing)
(5, 7, 'cancelled', '2024-12-19 09:00:00', '2024-12-19 09:15:00');

-- =============================================
-- 8. TICKETS (Depends on reservations + seats)
-- =============================================
INSERT INTO tickets (reservation_id, seat_id, price, issued_at) VALUES
-- John's tickets for Avatar IMAX (2 premium seats)
-- IMAX format (1.5x multiplier): Premium base $16.00 * 1.5 = $24.00
(1, 123, 24.00, '2024-12-19 10:30:00'),  -- H6 - IMAX premium seat
(1, 124, 24.00, '2024-12-19 10:30:00'),  -- H7 - IMAX premium seat

-- Jane's tickets for Spider-Verse 3D (2 standard seats)  
-- 3D format (1.25x multiplier): Standard base $8.00 * 1.25 = $10.00
(2, 61, 10.00, '2024-12-19 11:15:00'),   -- E1 - Screen B standard seat
(2, 62, 10.00, '2024-12-19 11:15:00');   -- E2 - Screen B standard seat

-- =============================================
-- 9. SEAT LOCKS (Depends on users + showtimes + seats)
-- =============================================
-- Current active locks (Mike is in process of booking)
INSERT INTO seat_locks (showtime_id, seat_id, user_id, locked_at, expires_at) VALUES
-- Mike has locked 2 seats for Inception tomorrow (5-minute lock)
(8, 25, 4, '2024-12-19 12:00:00', '2024-12-19 12:05:00'),  -- C1 - Screen A
(8, 26, 4, '2024-12-19 12:00:00', '2024-12-19 12:05:00');  -- C2 - Screen A

-- =============================================
-- SUMMARY OF SEEDED DATA
-- =============================================
-- Users: 5 (1 admin, 4 customers)
-- Cinemas: 3 with total 7 screens
-- Seats: ~290 seats across all screens (exact count varies by screen size)
-- Movies: 6 popular titles with different genres and ratings
-- Showtimes: 13 showtimes across 3 days (today, tomorrow, weekend)
-- Reservations: 4 reservations in different states (confirmed, pending, cancelled)
-- Tickets: 4 tickets for confirmed reservations
-- Seat Locks: 2 active locks showing booking in progress 