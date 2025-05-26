SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE seat_locks;
TRUNCATE TABLE tickets;
TRUNCATE TABLE reservations;
TRUNCATE TABLE showtimes;
TRUNCATE TABLE seats;
TRUNCATE TABLE screens;
TRUNCATE TABLE movies;
TRUNCATE TABLE cinemas;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (email, password_hash, role) VALUES
('admin@moviebooking.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwlY7oGvF5U2k.QTu', 'admin'),
('john.doe@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwlY7oGvF5U2k.QTu', 'customer'),
('jane.smith@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwlY7oGvF5U2k.QTu', 'customer'),
('mike.wilson@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwlY7oGvF5U2k.QTu', 'customer'),
('sara.jones@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LwlY7oGvF5U2k.QTu', 'customer');

INSERT INTO cinemas (name, address, city) VALUES
('VinUni Cinema', '123 Nguyen Van Cu Street, Gia Lam District', 'Hanoi'),
('Downtown Multiplex', '456 Tran Hung Dao Street, Hoan Kiem District', 'Hanoi'),
('Galaxy Mall Cinema', '789 Pham Van Dong Street, Bac Tu Liem District', 'Hanoi');

INSERT INTO screens (cinema_id, name, screen_format) VALUES
(1, 'VinUni Screen 01', '2D'),
(1, 'VinUni Screen 02', '3D'),
(1, 'VinUni IMAX', 'IMAX'),
(2, 'Downtown Screen 01', '2D'),
(2, 'Downtown Screen 02', '3D'),
(3, 'Galaxy Screen 01', '2D'),
(3, 'Galaxy Screen 02', '2D');

-- Unified seat layout: 8 rows x 12 columns (96 seats total)
-- Rows A-E: Standard seats (60 seats)
-- Rows F-H: Premium seats (36 seats)

-- VinUni Screen 1
INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) VALUES
(1, 'standard', 'A1', 1, 1), (1, 'standard', 'A2', 1, 2), (1, 'standard', 'A3', 1, 3), (1, 'standard', 'A4', 1, 4),
(1, 'standard', 'A5', 1, 5), (1, 'standard', 'A6', 1, 6), (1, 'standard', 'A7', 1, 7), (1, 'standard', 'A8', 1, 8),
(1, 'standard', 'A9', 1, 9), (1, 'standard', 'A10', 1, 10), (1, 'standard', 'A11', 1, 11), (1, 'standard', 'A12', 1, 12),
(1, 'standard', 'B1', 2, 1), (1, 'standard', 'B2', 2, 2), (1, 'standard', 'B3', 2, 3), (1, 'standard', 'B4', 2, 4),
(1, 'standard', 'B5', 2, 5), (1, 'standard', 'B6', 2, 6), (1, 'standard', 'B7', 2, 7), (1, 'standard', 'B8', 2, 8),
(1, 'standard', 'B9', 2, 9), (1, 'standard', 'B10', 2, 10), (1, 'standard', 'B11', 2, 11), (1, 'standard', 'B12', 2, 12),
(1, 'standard', 'C1', 3, 1), (1, 'standard', 'C2', 3, 2), (1, 'standard', 'C3', 3, 3), (1, 'standard', 'C4', 3, 4),
(1, 'standard', 'C5', 3, 5), (1, 'standard', 'C6', 3, 6), (1, 'standard', 'C7', 3, 7), (1, 'standard', 'C8', 3, 8),
(1, 'standard', 'C9', 3, 9), (1, 'standard', 'C10', 3, 10), (1, 'standard', 'C11', 3, 11), (1, 'standard', 'C12', 3, 12),
(1, 'standard', 'D1', 4, 1), (1, 'standard', 'D2', 4, 2), (1, 'standard', 'D3', 4, 3), (1, 'standard', 'D4', 4, 4),
(1, 'standard', 'D5', 4, 5), (1, 'standard', 'D6', 4, 6), (1, 'standard', 'D7', 4, 7), (1, 'standard', 'D8', 4, 8),
(1, 'standard', 'D9', 4, 9), (1, 'standard', 'D10', 4, 10), (1, 'standard', 'D11', 4, 11), (1, 'standard', 'D12', 4, 12),
(1, 'standard', 'E1', 5, 1), (1, 'standard', 'E2', 5, 2), (1, 'standard', 'E3', 5, 3), (1, 'standard', 'E4', 5, 4),
(1, 'standard', 'E5', 5, 5), (1, 'standard', 'E6', 5, 6), (1, 'standard', 'E7', 5, 7), (1, 'standard', 'E8', 5, 8),
(1, 'standard', 'E9', 5, 9), (1, 'standard', 'E10', 5, 10), (1, 'standard', 'E11', 5, 11), (1, 'standard', 'E12', 5, 12),
(1, 'premium', 'F1', 6, 1), (1, 'premium', 'F2', 6, 2), (1, 'premium', 'F3', 6, 3), (1, 'premium', 'F4', 6, 4),
(1, 'premium', 'F5', 6, 5), (1, 'premium', 'F6', 6, 6), (1, 'premium', 'F7', 6, 7), (1, 'premium', 'F8', 6, 8),
(1, 'premium', 'F9', 6, 9), (1, 'premium', 'F10', 6, 10), (1, 'premium', 'F11', 6, 11), (1, 'premium', 'F12', 6, 12),
(1, 'premium', 'G1', 7, 1), (1, 'premium', 'G2', 7, 2), (1, 'premium', 'G3', 7, 3), (1, 'premium', 'G4', 7, 4),
(1, 'premium', 'G5', 7, 5), (1, 'premium', 'G6', 7, 6), (1, 'premium', 'G7', 7, 7), (1, 'premium', 'G8', 7, 8),
(1, 'premium', 'G9', 7, 9), (1, 'premium', 'G10', 7, 10), (1, 'premium', 'G11', 7, 11), (1, 'premium', 'G12', 7, 12),
(1, 'premium', 'H1', 8, 1), (1, 'premium', 'H2', 8, 2), (1, 'premium', 'H3', 8, 3), (1, 'premium', 'H4', 8, 4),
(1, 'premium', 'H5', 8, 5), (1, 'premium', 'H6', 8, 6), (1, 'premium', 'H7', 8, 7), (1, 'premium', 'H8', 8, 8),
(1, 'premium', 'H9', 8, 9), (1, 'premium', 'H10', 8, 10), (1, 'premium', 'H11', 8, 11), (1, 'premium', 'H12', 8, 12);

-- VinUni Screen 2
INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) VALUES
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
(2, 'premium', 'F1', 6, 1), (2, 'premium', 'F2', 6, 2), (2, 'premium', 'F3', 6, 3), (2, 'premium', 'F4', 6, 4),
(2, 'premium', 'F5', 6, 5), (2, 'premium', 'F6', 6, 6), (2, 'premium', 'F7', 6, 7), (2, 'premium', 'F8', 6, 8),
(2, 'premium', 'F9', 6, 9), (2, 'premium', 'F10', 6, 10), (2, 'premium', 'F11', 6, 11), (2, 'premium', 'F12', 6, 12),
(2, 'premium', 'G1', 7, 1), (2, 'premium', 'G2', 7, 2), (2, 'premium', 'G3', 7, 3), (2, 'premium', 'G4', 7, 4),
(2, 'premium', 'G5', 7, 5), (2, 'premium', 'G6', 7, 6), (2, 'premium', 'G7', 7, 7), (2, 'premium', 'G8', 7, 8),
(2, 'premium', 'G9', 7, 9), (2, 'premium', 'G10', 7, 10), (2, 'premium', 'G11', 7, 11), (2, 'premium', 'G12', 7, 12),
(2, 'premium', 'H1', 8, 1), (2, 'premium', 'H2', 8, 2), (2, 'premium', 'H3', 8, 3), (2, 'premium', 'H4', 8, 4),
(2, 'premium', 'H5', 8, 5), (2, 'premium', 'H6', 8, 6), (2, 'premium', 'H7', 8, 7), (2, 'premium', 'H8', 8, 8),
(2, 'premium', 'H9', 8, 9), (2, 'premium', 'H10', 8, 10), (2, 'premium', 'H11', 8, 11), (2, 'premium', 'H12', 8, 12);

-- VinUni IMAX
INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) VALUES
(3, 'standard', 'A1', 1, 1), (3, 'standard', 'A2', 1, 2), (3, 'standard', 'A3', 1, 3), (3, 'standard', 'A4', 1, 4),
(3, 'standard', 'A5', 1, 5), (3, 'standard', 'A6', 1, 6), (3, 'standard', 'A7', 1, 7), (3, 'standard', 'A8', 1, 8),
(3, 'standard', 'A9', 1, 9), (3, 'standard', 'A10', 1, 10), (3, 'standard', 'A11', 1, 11), (3, 'standard', 'A12', 1, 12),
(3, 'standard', 'B1', 2, 1), (3, 'standard', 'B2', 2, 2), (3, 'standard', 'B3', 2, 3), (3, 'standard', 'B4', 2, 4),
(3, 'standard', 'B5', 2, 5), (3, 'standard', 'B6', 2, 6), (3, 'standard', 'B7', 2, 7), (3, 'standard', 'B8', 2, 8),
(3, 'standard', 'B9', 2, 9), (3, 'standard', 'B10', 2, 10), (3, 'standard', 'B11', 2, 11), (3, 'standard', 'B12', 2, 12),
(3, 'standard', 'C1', 3, 1), (3, 'standard', 'C2', 3, 2), (3, 'standard', 'C3', 3, 3), (3, 'standard', 'C4', 3, 4),
(3, 'standard', 'C5', 3, 5), (3, 'standard', 'C6', 3, 6), (3, 'standard', 'C7', 3, 7), (3, 'standard', 'C8', 3, 8),
(3, 'standard', 'C9', 3, 9), (3, 'standard', 'C10', 3, 10), (3, 'standard', 'C11', 3, 11), (3, 'standard', 'C12', 3, 12),
(3, 'standard', 'D1', 4, 1), (3, 'standard', 'D2', 4, 2), (3, 'standard', 'D3', 4, 3), (3, 'standard', 'D4', 4, 4),
(3, 'standard', 'D5', 4, 5), (3, 'standard', 'D6', 4, 6), (3, 'standard', 'D7', 4, 7), (3, 'standard', 'D8', 4, 8),
(3, 'standard', 'D9', 4, 9), (3, 'standard', 'D10', 4, 10), (3, 'standard', 'D11', 4, 11), (3, 'standard', 'D12', 4, 12),
(3, 'standard', 'E1', 5, 1), (3, 'standard', 'E2', 5, 2), (3, 'standard', 'E3', 5, 3), (3, 'standard', 'E4', 5, 4),
(3, 'standard', 'E5', 5, 5), (3, 'standard', 'E6', 5, 6), (3, 'standard', 'E7', 5, 7), (3, 'standard', 'E8', 5, 8),
(3, 'standard', 'E9', 5, 9), (3, 'standard', 'E10', 5, 10), (3, 'standard', 'E11', 5, 11), (3, 'standard', 'E12', 5, 12),
(3, 'premium', 'F1', 6, 1), (3, 'premium', 'F2', 6, 2), (3, 'premium', 'F3', 6, 3), (3, 'premium', 'F4', 6, 4),
(3, 'premium', 'F5', 6, 5), (3, 'premium', 'F6', 6, 6), (3, 'premium', 'F7', 6, 7), (3, 'premium', 'F8', 6, 8),
(3, 'premium', 'F9', 6, 9), (3, 'premium', 'F10', 6, 10), (3, 'premium', 'F11', 6, 11), (3, 'premium', 'F12', 6, 12),
(3, 'premium', 'G1', 7, 1), (3, 'premium', 'G2', 7, 2), (3, 'premium', 'G3', 7, 3), (3, 'premium', 'G4', 7, 4),
(3, 'premium', 'G5', 7, 5), (3, 'premium', 'G6', 7, 6), (3, 'premium', 'G7', 7, 7), (3, 'premium', 'G8', 7, 8),
(3, 'premium', 'G9', 7, 9), (3, 'premium', 'G10', 7, 10), (3, 'premium', 'G11', 7, 11), (3, 'premium', 'G12', 7, 12),
(3, 'premium', 'H1', 8, 1), (3, 'premium', 'H2', 8, 2), (3, 'premium', 'H3', 8, 3), (3, 'premium', 'H4', 8, 4),
(3, 'premium', 'H5', 8, 5), (3, 'premium', 'H6', 8, 6), (3, 'premium', 'H7', 8, 7), (3, 'premium', 'H8', 8, 8),
(3, 'premium', 'H9', 8, 9), (3, 'premium', 'H10', 8, 10), (3, 'premium', 'H11', 8, 11), (3, 'premium', 'H12', 8, 12);

-- Downtown Screen 1
INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) VALUES
(4, 'standard', 'A1', 1, 1), (4, 'standard', 'A2', 1, 2), (4, 'standard', 'A3', 1, 3), (4, 'standard', 'A4', 1, 4),
(4, 'standard', 'A5', 1, 5), (4, 'standard', 'A6', 1, 6), (4, 'standard', 'A7', 1, 7), (4, 'standard', 'A8', 1, 8),
(4, 'standard', 'A9', 1, 9), (4, 'standard', 'A10', 1, 10), (4, 'standard', 'A11', 1, 11), (4, 'standard', 'A12', 1, 12),
(4, 'standard', 'B1', 2, 1), (4, 'standard', 'B2', 2, 2), (4, 'standard', 'B3', 2, 3), (4, 'standard', 'B4', 2, 4),
(4, 'standard', 'B5', 2, 5), (4, 'standard', 'B6', 2, 6), (4, 'standard', 'B7', 2, 7), (4, 'standard', 'B8', 2, 8),
(4, 'standard', 'B9', 2, 9), (4, 'standard', 'B10', 2, 10), (4, 'standard', 'B11', 2, 11), (4, 'standard', 'B12', 2, 12),
(4, 'standard', 'C1', 3, 1), (4, 'standard', 'C2', 3, 2), (4, 'standard', 'C3', 3, 3), (4, 'standard', 'C4', 3, 4),
(4, 'standard', 'C5', 3, 5), (4, 'standard', 'C6', 3, 6), (4, 'standard', 'C7', 3, 7), (4, 'standard', 'C8', 3, 8),
(4, 'standard', 'C9', 3, 9), (4, 'standard', 'C10', 3, 10), (4, 'standard', 'C11', 3, 11), (4, 'standard', 'C12', 3, 12),
(4, 'standard', 'D1', 4, 1), (4, 'standard', 'D2', 4, 2), (4, 'standard', 'D3', 4, 3), (4, 'standard', 'D4', 4, 4),
(4, 'standard', 'D5', 4, 5), (4, 'standard', 'D6', 4, 6), (4, 'standard', 'D7', 4, 7), (4, 'standard', 'D8', 4, 8),
(4, 'standard', 'D9', 4, 9), (4, 'standard', 'D10', 4, 10), (4, 'standard', 'D11', 4, 11), (4, 'standard', 'D12', 4, 12),
(4, 'standard', 'E1', 5, 1), (4, 'standard', 'E2', 5, 2), (4, 'standard', 'E3', 5, 3), (4, 'standard', 'E4', 5, 4),
(4, 'standard', 'E5', 5, 5), (4, 'standard', 'E6', 5, 6), (4, 'standard', 'E7', 5, 7), (4, 'standard', 'E8', 5, 8),
(4, 'standard', 'E9', 5, 9), (4, 'standard', 'E10', 5, 10), (4, 'standard', 'E11', 5, 11), (4, 'standard', 'E12', 5, 12),
(4, 'premium', 'F1', 6, 1), (4, 'premium', 'F2', 6, 2), (4, 'premium', 'F3', 6, 3), (4, 'premium', 'F4', 6, 4),
(4, 'premium', 'F5', 6, 5), (4, 'premium', 'F6', 6, 6), (4, 'premium', 'F7', 6, 7), (4, 'premium', 'F8', 6, 8),
(4, 'premium', 'F9', 6, 9), (4, 'premium', 'F10', 6, 10), (4, 'premium', 'F11', 6, 11), (4, 'premium', 'F12', 6, 12),
(4, 'premium', 'G1', 7, 1), (4, 'premium', 'G2', 7, 2), (4, 'premium', 'G3', 7, 3), (4, 'premium', 'G4', 7, 4),
(4, 'premium', 'G5', 7, 5), (4, 'premium', 'G6', 7, 6), (4, 'premium', 'G7', 7, 7), (4, 'premium', 'G8', 7, 8),
(4, 'premium', 'G9', 7, 9), (4, 'premium', 'G10', 7, 10), (4, 'premium', 'G11', 7, 11), (4, 'premium', 'G12', 7, 12),
(4, 'premium', 'H1', 8, 1), (4, 'premium', 'H2', 8, 2), (4, 'premium', 'H3', 8, 3), (4, 'premium', 'H4', 8, 4),
(4, 'premium', 'H5', 8, 5), (4, 'premium', 'H6', 8, 6), (4, 'premium', 'H7', 8, 7), (4, 'premium', 'H8', 8, 8),
(4, 'premium', 'H9', 8, 9), (4, 'premium', 'H10', 8, 10), (4, 'premium', 'H11', 8, 11), (4, 'premium', 'H12', 8, 12);

-- Downtown Screen 2
INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) VALUES
(5, 'standard', 'A1', 1, 1), (5, 'standard', 'A2', 1, 2), (5, 'standard', 'A3', 1, 3), (5, 'standard', 'A4', 1, 4),
(5, 'standard', 'A5', 1, 5), (5, 'standard', 'A6', 1, 6), (5, 'standard', 'A7', 1, 7), (5, 'standard', 'A8', 1, 8),
(5, 'standard', 'A9', 1, 9), (5, 'standard', 'A10', 1, 10), (5, 'standard', 'A11', 1, 11), (5, 'standard', 'A12', 1, 12),
(5, 'standard', 'B1', 2, 1), (5, 'standard', 'B2', 2, 2), (5, 'standard', 'B3', 2, 3), (5, 'standard', 'B4', 2, 4),
(5, 'standard', 'B5', 2, 5), (5, 'standard', 'B6', 2, 6), (5, 'standard', 'B7', 2, 7), (5, 'standard', 'B8', 2, 8),
(5, 'standard', 'B9', 2, 9), (5, 'standard', 'B10', 2, 10), (5, 'standard', 'B11', 2, 11), (5, 'standard', 'B12', 2, 12),
(5, 'standard', 'C1', 3, 1), (5, 'standard', 'C2', 3, 2), (5, 'standard', 'C3', 3, 3), (5, 'standard', 'C4', 3, 4),
(5, 'standard', 'C5', 3, 5), (5, 'standard', 'C6', 3, 6), (5, 'standard', 'C7', 3, 7), (5, 'standard', 'C8', 3, 8),
(5, 'standard', 'C9', 3, 9), (5, 'standard', 'C10', 3, 10), (5, 'standard', 'C11', 3, 11), (5, 'standard', 'C12', 3, 12),
(5, 'standard', 'D1', 4, 1), (5, 'standard', 'D2', 4, 2), (5, 'standard', 'D3', 4, 3), (5, 'standard', 'D4', 4, 4),
(5, 'standard', 'D5', 4, 5), (5, 'standard', 'D6', 4, 6), (5, 'standard', 'D7', 4, 7), (5, 'standard', 'D8', 4, 8),
(5, 'standard', 'D9', 4, 9), (5, 'standard', 'D10', 4, 10), (5, 'standard', 'D11', 4, 11), (5, 'standard', 'D12', 4, 12),
(5, 'standard', 'E1', 5, 1), (5, 'standard', 'E2', 5, 2), (5, 'standard', 'E3', 5, 3), (5, 'standard', 'E4', 5, 4),
(5, 'standard', 'E5', 5, 5), (5, 'standard', 'E6', 5, 6), (5, 'standard', 'E7', 5, 7), (5, 'standard', 'E8', 5, 8),
(5, 'standard', 'E9', 5, 9), (5, 'standard', 'E10', 5, 10), (5, 'standard', 'E11', 5, 11), (5, 'standard', 'E12', 5, 12),
(5, 'premium', 'F1', 6, 1), (5, 'premium', 'F2', 6, 2), (5, 'premium', 'F3', 6, 3), (5, 'premium', 'F4', 6, 4),
(5, 'premium', 'F5', 6, 5), (5, 'premium', 'F6', 6, 6), (5, 'premium', 'F7', 6, 7), (5, 'premium', 'F8', 6, 8),
(5, 'premium', 'F9', 6, 9), (5, 'premium', 'F10', 6, 10), (5, 'premium', 'F11', 6, 11), (5, 'premium', 'F12', 6, 12),
(5, 'premium', 'G1', 7, 1), (5, 'premium', 'G2', 7, 2), (5, 'premium', 'G3', 7, 3), (5, 'premium', 'G4', 7, 4),
(5, 'premium', 'G5', 7, 5), (5, 'premium', 'G6', 7, 6), (5, 'premium', 'G7', 7, 7), (5, 'premium', 'G8', 7, 8),
(5, 'premium', 'G9', 7, 9), (5, 'premium', 'G10', 7, 10), (5, 'premium', 'G11', 7, 11), (5, 'premium', 'G12', 7, 12),
(5, 'premium', 'H1', 8, 1), (5, 'premium', 'H2', 8, 2), (5, 'premium', 'H3', 8, 3), (5, 'premium', 'H4', 8, 4),
(5, 'premium', 'H5', 8, 5), (5, 'premium', 'H6', 8, 6), (5, 'premium', 'H7', 8, 7), (5, 'premium', 'H8', 8, 8),
(5, 'premium', 'H9', 8, 9), (5, 'premium', 'H10', 8, 10), (5, 'premium', 'H11', 8, 11), (5, 'premium', 'H12', 8, 12);

-- Galaxy Screen 1
INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) VALUES
(6, 'standard', 'A1', 1, 1), (6, 'standard', 'A2', 1, 2), (6, 'standard', 'A3', 1, 3), (6, 'standard', 'A4', 1, 4),
(6, 'standard', 'A5', 1, 5), (6, 'standard', 'A6', 1, 6), (6, 'standard', 'A7', 1, 7), (6, 'standard', 'A8', 1, 8),
(6, 'standard', 'A9', 1, 9), (6, 'standard', 'A10', 1, 10), (6, 'standard', 'A11', 1, 11), (6, 'standard', 'A12', 1, 12),
(6, 'standard', 'B1', 2, 1), (6, 'standard', 'B2', 2, 2), (6, 'standard', 'B3', 2, 3), (6, 'standard', 'B4', 2, 4),
(6, 'standard', 'B5', 2, 5), (6, 'standard', 'B6', 2, 6), (6, 'standard', 'B7', 2, 7), (6, 'standard', 'B8', 2, 8),
(6, 'standard', 'B9', 2, 9), (6, 'standard', 'B10', 2, 10), (6, 'standard', 'B11', 2, 11), (6, 'standard', 'B12', 2, 12),
(6, 'standard', 'C1', 3, 1), (6, 'standard', 'C2', 3, 2), (6, 'standard', 'C3', 3, 3), (6, 'standard', 'C4', 3, 4),
(6, 'standard', 'C5', 3, 5), (6, 'standard', 'C6', 3, 6), (6, 'standard', 'C7', 3, 7), (6, 'standard', 'C8', 3, 8),
(6, 'standard', 'C9', 3, 9), (6, 'standard', 'C10', 3, 10), (6, 'standard', 'C11', 3, 11), (6, 'standard', 'C12', 3, 12),
(6, 'standard', 'D1', 4, 1), (6, 'standard', 'D2', 4, 2), (6, 'standard', 'D3', 4, 3), (6, 'standard', 'D4', 4, 4),
(6, 'standard', 'D5', 4, 5), (6, 'standard', 'D6', 4, 6), (6, 'standard', 'D7', 4, 7), (6, 'standard', 'D8', 4, 8),
(6, 'standard', 'D9', 4, 9), (6, 'standard', 'D10', 4, 10), (6, 'standard', 'D11', 4, 11), (6, 'standard', 'D12', 4, 12),
(6, 'standard', 'E1', 5, 1), (6, 'standard', 'E2', 5, 2), (6, 'standard', 'E3', 5, 3), (6, 'standard', 'E4', 5, 4),
(6, 'standard', 'E5', 5, 5), (6, 'standard', 'E6', 5, 6), (6, 'standard', 'E7', 5, 7), (6, 'standard', 'E8', 5, 8),
(6, 'standard', 'E9', 5, 9), (6, 'standard', 'E10', 5, 10), (6, 'standard', 'E11', 5, 11), (6, 'standard', 'E12', 5, 12),
(6, 'premium', 'F1', 6, 1), (6, 'premium', 'F2', 6, 2), (6, 'premium', 'F3', 6, 3), (6, 'premium', 'F4', 6, 4),
(6, 'premium', 'F5', 6, 5), (6, 'premium', 'F6', 6, 6), (6, 'premium', 'F7', 6, 7), (6, 'premium', 'F8', 6, 8),
(6, 'premium', 'F9', 6, 9), (6, 'premium', 'F10', 6, 10), (6, 'premium', 'F11', 6, 11), (6, 'premium', 'F12', 6, 12),
(6, 'premium', 'G1', 7, 1), (6, 'premium', 'G2', 7, 2), (6, 'premium', 'G3', 7, 3), (6, 'premium', 'G4', 7, 4),
(6, 'premium', 'G5', 7, 5), (6, 'premium', 'G6', 7, 6), (6, 'premium', 'G7', 7, 7), (6, 'premium', 'G8', 7, 8),
(6, 'premium', 'G9', 7, 9), (6, 'premium', 'G10', 7, 10), (6, 'premium', 'G11', 7, 11), (6, 'premium', 'G12', 7, 12),
(6, 'premium', 'H1', 8, 1), (6, 'premium', 'H2', 8, 2), (6, 'premium', 'H3', 8, 3), (6, 'premium', 'H4', 8, 4),
(6, 'premium', 'H5', 8, 5), (6, 'premium', 'H6', 8, 6), (6, 'premium', 'H7', 8, 7), (6, 'premium', 'H8', 8, 8),
(6, 'premium', 'H9', 8, 9), (6, 'premium', 'H10', 8, 10), (6, 'premium', 'H11', 8, 11), (6, 'premium', 'H12', 8, 12);

-- Galaxy Screen 2
INSERT INTO seats (screen_id, seat_class, seat_label, row_num, col_num) VALUES
(7, 'standard', 'A1', 1, 1), (7, 'standard', 'A2', 1, 2), (7, 'standard', 'A3', 1, 3), (7, 'standard', 'A4', 1, 4),
(7, 'standard', 'A5', 1, 5), (7, 'standard', 'A6', 1, 6), (7, 'standard', 'A7', 1, 7), (7, 'standard', 'A8', 1, 8),
(7, 'standard', 'A9', 1, 9), (7, 'standard', 'A10', 1, 10), (7, 'standard', 'A11', 1, 11), (7, 'standard', 'A12', 1, 12),
(7, 'standard', 'B1', 2, 1), (7, 'standard', 'B2', 2, 2), (7, 'standard', 'B3', 2, 3), (7, 'standard', 'B4', 2, 4),
(7, 'standard', 'B5', 2, 5), (7, 'standard', 'B6', 2, 6), (7, 'standard', 'B7', 2, 7), (7, 'standard', 'B8', 2, 8),
(7, 'standard', 'B9', 2, 9), (7, 'standard', 'B10', 2, 10), (7, 'standard', 'B11', 2, 11), (7, 'standard', 'B12', 2, 12),
(7, 'standard', 'C1', 3, 1), (7, 'standard', 'C2', 3, 2), (7, 'standard', 'C3', 3, 3), (7, 'standard', 'C4', 3, 4),
(7, 'standard', 'C5', 3, 5), (7, 'standard', 'C6', 3, 6), (7, 'standard', 'C7', 3, 7), (7, 'standard', 'C8', 3, 8),
(7, 'standard', 'C9', 3, 9), (7, 'standard', 'C10', 3, 10), (7, 'standard', 'C11', 3, 11), (7, 'standard', 'C12', 3, 12),
(7, 'standard', 'D1', 4, 1), (7, 'standard', 'D2', 4, 2), (7, 'standard', 'D3', 4, 3), (7, 'standard', 'D4', 4, 4),
(7, 'standard', 'D5', 4, 5), (7, 'standard', 'D6', 4, 6), (7, 'standard', 'D7', 4, 7), (7, 'standard', 'D8', 4, 8),
(7, 'standard', 'D9', 4, 9), (7, 'standard', 'D10', 4, 10), (7, 'standard', 'D11', 4, 11), (7, 'standard', 'D12', 4, 12),
(7, 'standard', 'E1', 5, 1), (7, 'standard', 'E2', 5, 2), (7, 'standard', 'E3', 5, 3), (7, 'standard', 'E4', 5, 4),
(7, 'standard', 'E5', 5, 5), (7, 'standard', 'E6', 5, 6), (7, 'standard', 'E7', 5, 7), (7, 'standard', 'E8', 5, 8),
(7, 'standard', 'E9', 5, 9), (7, 'standard', 'E10', 5, 10), (7, 'standard', 'E11', 5, 11), (7, 'standard', 'E12', 5, 12),
(7, 'premium', 'F1', 6, 1), (7, 'premium', 'F2', 6, 2), (7, 'premium', 'F3', 6, 3), (7, 'premium', 'F4', 6, 4),
(7, 'premium', 'F5', 6, 5), (7, 'premium', 'F6', 6, 6), (7, 'premium', 'F7', 6, 7), (7, 'premium', 'F8', 6, 8),
(7, 'premium', 'F9', 6, 9), (7, 'premium', 'F10', 6, 10), (7, 'premium', 'F11', 6, 11), (7, 'premium', 'F12', 6, 12),
(7, 'premium', 'G1', 7, 1), (7, 'premium', 'G2', 7, 2), (7, 'premium', 'G3', 7, 3), (7, 'premium', 'G4', 7, 4),
(7, 'premium', 'G5', 7, 5), (7, 'premium', 'G6', 7, 6), (7, 'premium', 'G7', 7, 7), (7, 'premium', 'G8', 7, 8),
(7, 'premium', 'G9', 7, 9), (7, 'premium', 'G10', 7, 10), (7, 'premium', 'G11', 7, 11), (7, 'premium', 'G12', 7, 12),
(7, 'premium', 'H1', 8, 1), (7, 'premium', 'H2', 8, 2), (7, 'premium', 'H3', 8, 3), (7, 'premium', 'H4', 8, 4),
(7, 'premium', 'H5', 8, 5), (7, 'premium', 'H6', 8, 6), (7, 'premium', 'H7', 8, 7), (7, 'premium', 'H8', 8, 8),
(7, 'premium', 'H9', 8, 9), (7, 'premium', 'H10', 8, 10), (7, 'premium', 'H11', 8, 11), (7, 'premium', 'H12', 8, 12);

-- Insert movies (scheduled_close_date will be set automatically by trigger)
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

INSERT INTO showtimes (movie_id, screen_id, start_time, end_time) VALUES
-- May 24, 2025 (Saturday)
(1, 3, '2025-05-24 10:00:00', '2025-05-24 13:12:00'),
(1, 3, '2025-05-24 14:00:00', '2025-05-24 17:12:00'),
(1, 3, '2025-05-24 18:00:00', '2025-05-24 21:12:00'),
(2, 1, '2025-05-24 11:00:00', '2025-05-24 13:21:00'),
(2, 1, '2025-05-24 15:00:00', '2025-05-24 17:21:00'),
(2, 1, '2025-05-24 19:30:00', '2025-05-24 21:51:00'),
(3, 2, '2025-05-24 12:00:00', '2025-05-24 14:20:00'),
(3, 2, '2025-05-24 16:30:00', '2025-05-24 18:50:00'),
(3, 2, '2025-05-24 21:00:00', '2025-05-24 23:20:00'),
(4, 4, '2025-05-24 13:00:00', '2025-05-24 15:56:00'),
(4, 4, '2025-05-24 17:00:00', '2025-05-24 19:56:00'),
(5, 5, '2025-05-24 14:30:00', '2025-05-24 16:58:00'),
(5, 5, '2025-05-24 20:00:00', '2025-05-24 22:28:00'),
(6, 1, '2025-05-24 22:00:00', '2025-05-25 00:45:00'),

-- May 25, 2025 (Sunday)
(1, 3, '2025-05-25 11:00:00', '2025-05-25 14:12:00'),
(1, 3, '2025-05-25 15:00:00', '2025-05-25 18:12:00'),
(1, 3, '2025-05-25 19:00:00', '2025-05-25 22:12:00'),
(2, 1, '2025-05-25 10:30:00', '2025-05-25 12:51:00'),
(2, 1, '2025-05-25 14:00:00', '2025-05-25 16:21:00'),
(2, 1, '2025-05-25 18:30:00', '2025-05-25 20:51:00'),
(3, 2, '2025-05-25 13:00:00', '2025-05-25 15:20:00'),
(3, 2, '2025-05-25 17:30:00', '2025-05-25 19:50:00'),
(3, 2, '2025-05-25 21:30:00', '2025-05-25 23:50:00'),
(4, 4, '2025-05-25 12:00:00', '2025-05-25 14:56:00'),
(4, 4, '2025-05-25 16:00:00', '2025-05-25 18:56:00'),
(4, 4, '2025-05-25 20:00:00', '2025-05-25 22:56:00'),
(5, 5, '2025-05-25 11:30:00', '2025-05-25 13:58:00'),
(5, 5, '2025-05-25 15:30:00', '2025-05-25 17:58:00'),
(6, 6, '2025-05-25 19:30:00', '2025-05-25 22:15:00'),

-- May 26, 2025 (Monday)
(1, 1, '2025-05-26 10:00:00', '2025-05-26 13:12:00'),
(1, 1, '2025-05-26 14:00:00', '2025-05-26 17:12:00'),
(1, 1, '2025-05-26 18:00:00', '2025-05-26 21:12:00'),
(2, 2, '2025-05-26 11:00:00', '2025-05-26 13:21:00'),
(2, 2, '2025-05-26 15:00:00', '2025-05-26 17:21:00'),
(2, 2, '2025-05-26 19:30:00', '2025-05-26 21:51:00'),
(3, 3, '2025-05-26 12:00:00', '2025-05-26 14:20:00'),
(3, 3, '2025-05-26 16:30:00', '2025-05-26 18:50:00'),
(3, 3, '2025-05-26 21:00:00', '2025-05-26 23:20:00'),
(4, 4, '2025-05-26 13:00:00', '2025-05-26 15:56:00'),
(4, 4, '2025-05-26 17:00:00', '2025-05-26 19:56:00'),
(5, 5, '2025-05-26 14:30:00', '2025-05-26 16:58:00'),
(5, 5, '2025-05-26 20:00:00', '2025-05-26 22:28:00'),
(6, 1, '2025-05-26 22:00:00', '2025-05-27 00:45:00'),

-- May 27, 2025 (Tuesday)
(1, 3, '2025-05-27 11:00:00', '2025-05-27 14:12:00'),
(1, 3, '2025-05-27 15:00:00', '2025-05-27 18:12:00'),
(1, 3, '2025-05-27 19:00:00', '2025-05-27 22:12:00'),
(2, 1, '2025-05-27 10:30:00', '2025-05-27 12:51:00'),
(2, 1, '2025-05-27 14:00:00', '2025-05-27 16:21:00'),
(2, 1, '2025-05-27 18:30:00', '2025-05-27 20:51:00'),
(3, 2, '2025-05-27 13:00:00', '2025-05-27 15:20:00'),
(3, 2, '2025-05-27 17:30:00', '2025-05-27 19:50:00'),
(3, 2, '2025-05-27 21:30:00', '2025-05-27 23:50:00'),
(4, 4, '2025-05-27 12:00:00', '2025-05-27 14:56:00'),
(4, 4, '2025-05-27 16:00:00', '2025-05-27 18:56:00'),
(4, 4, '2025-05-27 20:00:00', '2025-05-27 22:56:00'),
(5, 5, '2025-05-27 11:30:00', '2025-05-27 13:58:00'),
(5, 5, '2025-05-27 15:30:00', '2025-05-27 17:58:00'),
(6, 6, '2025-05-27 19:30:00', '2025-05-27 22:15:00'),

-- May 28, 2025 (Wednesday)
(1, 1, '2025-05-28 10:00:00', '2025-05-28 13:12:00'),
(1, 1, '2025-05-28 14:30:00', '2025-05-28 17:42:00'),
(1, 1, '2025-05-28 19:00:00', '2025-05-28 22:12:00'),
(2, 2, '2025-05-28 11:30:00', '2025-05-28 13:51:00'),
(2, 2, '2025-05-28 15:30:00', '2025-05-28 17:51:00'),
(2, 2, '2025-05-28 20:00:00', '2025-05-28 22:21:00'),
(3, 3, '2025-05-28 12:30:00', '2025-05-28 14:50:00'),
(3, 3, '2025-05-28 17:00:00', '2025-05-28 19:20:00'),
(3, 3, '2025-05-28 21:30:00', '2025-05-28 23:50:00'),
(4, 4, '2025-05-28 13:30:00', '2025-05-28 16:26:00'),
(4, 4, '2025-05-28 18:00:00', '2025-05-28 20:56:00'),
(5, 5, '2025-05-28 10:30:00', '2025-05-28 12:58:00'),
(5, 5, '2025-05-28 16:00:00', '2025-05-28 18:28:00'),
(6, 7, '2025-05-28 14:00:00', '2025-05-28 16:45:00'),
(6, 7, '2025-05-28 22:00:00', '2025-05-29 00:45:00'),

-- May 29, 2025 (Thursday)
(1, 3, '2025-05-29 11:30:00', '2025-05-29 14:42:00'),
(1, 3, '2025-05-29 16:00:00', '2025-05-29 19:12:00'),
(1, 3, '2025-05-29 20:30:00', '2025-05-29 23:42:00'),
(2, 1, '2025-05-29 10:00:00', '2025-05-29 12:21:00'),
(2, 1, '2025-05-29 13:30:00', '2025-05-29 15:51:00'),
(2, 1, '2025-05-29 17:30:00', '2025-05-29 19:51:00'),
(3, 2, '2025-05-29 12:00:00', '2025-05-29 14:20:00'),
(3, 2, '2025-05-29 16:30:00', '2025-05-29 18:50:00'),
(3, 2, '2025-05-29 21:00:00', '2025-05-29 23:20:00'),
(4, 4, '2025-05-29 14:00:00', '2025-05-29 16:56:00'),
(4, 4, '2025-05-29 18:30:00', '2025-05-29 21:26:00'),
(5, 5, '2025-05-29 11:00:00', '2025-05-29 13:28:00'),
(5, 5, '2025-05-29 15:00:00', '2025-05-29 17:28:00'),
(5, 5, '2025-05-29 19:30:00', '2025-05-29 21:58:00'),
(6, 6, '2025-05-29 22:30:00', '2025-05-30 01:15:00'),

-- May 30, 2025 (Friday)
(1, 1, '2025-05-30 10:30:00', '2025-05-30 13:42:00'),
(1, 1, '2025-05-30 15:00:00', '2025-05-30 18:12:00'),
(1, 1, '2025-05-30 19:30:00', '2025-05-30 22:42:00'),
(2, 2, '2025-05-30 11:00:00', '2025-05-30 13:21:00'),
(2, 2, '2025-05-30 14:30:00', '2025-05-30 16:51:00'),
(2, 2, '2025-05-30 18:00:00', '2025-05-30 20:21:00'),
(2, 2, '2025-05-30 21:30:00', '2025-05-30 23:51:00'),
(3, 3, '2025-05-30 12:00:00', '2025-05-30 14:20:00'),
(3, 3, '2025-05-30 16:00:00', '2025-05-30 18:20:00'),
(3, 3, '2025-05-30 20:00:00', '2025-05-30 22:20:00'),
(4, 4, '2025-05-30 13:00:00', '2025-05-30 15:56:00'),
(4, 4, '2025-05-30 17:00:00', '2025-05-30 19:56:00'),
(4, 4, '2025-05-30 21:00:00', '2025-05-30 23:56:00'),
(5, 5, '2025-05-30 10:00:00', '2025-05-30 12:28:00'),
(5, 5, '2025-05-30 14:00:00', '2025-05-30 16:28:00'),
(5, 5, '2025-05-30 18:30:00', '2025-05-30 20:58:00'),
(6, 7, '2025-05-30 22:00:00', '2025-05-31 00:45:00'),

-- May 31, 2025 (Saturday)
(1, 3, '2025-05-31 10:00:00', '2025-05-31 13:12:00'),
(1, 3, '2025-05-31 14:00:00', '2025-05-31 17:12:00'),
(1, 3, '2025-05-31 18:00:00', '2025-05-31 21:12:00'),
(1, 3, '2025-05-31 22:00:00', '2025-06-01 01:12:00'),
(2, 1, '2025-05-31 10:30:00', '2025-05-31 12:51:00'),
(2, 1, '2025-05-31 13:30:00', '2025-05-31 15:51:00'),
(2, 1, '2025-05-31 16:30:00', '2025-05-31 18:51:00'),
(2, 1, '2025-05-31 19:30:00', '2025-05-31 21:51:00'),
(2, 1, '2025-05-31 22:30:00', '2025-06-01 00:51:00'),
(3, 2, '2025-05-31 11:00:00', '2025-05-31 13:20:00'),
(3, 2, '2025-05-31 14:30:00', '2025-05-31 16:50:00'),
(3, 2, '2025-05-31 17:30:00', '2025-05-31 19:50:00'),
(3, 2, '2025-05-31 20:30:00', '2025-05-31 22:50:00'),
(4, 4, '2025-05-31 12:00:00', '2025-05-31 14:56:00'),
(4, 4, '2025-05-31 15:30:00', '2025-05-31 18:26:00'),
(4, 4, '2025-05-31 19:00:00', '2025-05-31 21:56:00'),
(5, 5, '2025-05-31 11:30:00', '2025-05-31 13:58:00'),
(5, 5, '2025-05-31 15:00:00', '2025-05-31 17:28:00'),
(5, 5, '2025-05-31 18:30:00', '2025-05-31 20:58:00'),
(5, 5, '2025-05-31 21:30:00', '2025-05-31 23:58:00'),
(6, 6, '2025-05-31 10:00:00', '2025-05-31 12:45:00'),
(6, 6, '2025-05-31 14:00:00', '2025-05-31 16:45:00'),
(6, 6, '2025-05-31 17:30:00', '2025-05-31 20:15:00'),
(6, 6, '2025-05-31 21:00:00', '2025-05-31 23:45:00');
