export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export enum ReservationStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

export enum SeatClass {
  STANDARD = "standard",
  PREMIUM = "premium",
}

export enum ScreenFormat {
  _2D = "2D",
  _3D = "3D",
  IMAX = "IMAX",
}

export enum MovieRating {
  G = "G",
  PG = "PG",
  PG13 = "PG-13",
  R = "R",
  NC17 = "NC-17",
}

export enum MovieStatus {
  COMING_SOON = "coming_soon",
  NOW_SHOWING = "now_showing",
  ARCHIVED = "archived",
}

// Database table interfaces
export interface User {
  user_id: number
  email: string
  password_hash: string
  role: UserRole
}

export interface Reservation {
  reservation_id: number
  user_id: number
  showtime_id: number
  status: ReservationStatus
  created_at: string
  expires_at: string
}

export interface Ticket {
  ticket_id: number
  reservation_id: number
  seat_id: number
  price: number
  issued_at: string
}

export interface SeatLock {
  showtime_id: number
  seat_id: number
  user_id: number
  locked_at: string
  expires_at: string
}

export interface Seat {
  seat_id: number
  screen_id: number
  seat_class: SeatClass
  seat_label: string
  row_num: number
  col_num: number
}

export interface Showtime {
  showtime_id: number
  movie_id: number
  screen_id: number
  start_time: string
  end_time: string
}

export interface Screen {
  screen_id: number
  cinema_id: number
  name: string
  screen_format: ScreenFormat
}

export interface Cinema {
  cinema_id: number
  name: string
  address: string
  city: string
}

export interface Movie {
  movie_id: number
  title: string
  duration: number
  rating: MovieRating
  release_date: string
  status: MovieStatus
  // Additional fields not in DB but needed for UI
  description?: string
  director?: string
  cast?: string[]
  poster_url?: string
  genre?: string
}

// Extended types for UI
export interface ShowtimeWithDetails extends Showtime {
  screen?: Screen
  cinema?: Cinema
}

export interface MovieWithShowtimes extends Movie {
  showtimes?: ShowtimeWithDetails[]
}

export interface SeatWithStatus extends Seat {
  is_locked: boolean
  is_booked: boolean
}
