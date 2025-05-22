"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Film, LogOut, Calendar, Clock, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import type { Reservation, Ticket as TicketType } from "@/types/database"
import { ReservationStatus } from "@/types/database"
// Import QRCodeSVG which is the correct export from qrcode.react
import { QRCodeSVG } from "qrcode.react"

// Extended type for UI display
type BookingWithDetails = {
  reservation: Reservation
  tickets: TicketType[]
  movie: {
    title: string
    showtime: string
    date: string
    screen: string
    cinema: string
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/profile")
    }
  }, [user, router])

  // Fetch user bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return

      try {
        // Fetch reservations from the API
        const response = await fetch(`/api/v1/reservations?user_id=${user.user_id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch reservations');
        }
        
        const reservationsData = await response.json();
        
        // Transform the API response to match our UI format
        const bookingsWithDetails: BookingWithDetails[] = reservationsData.map((reservation: any) => {
          // Get the movie title from the showtime
          const showtime = reservation.showtime || {};
          const movieTitle = showtime.movie_title || 'Unknown Movie';
          
          // Format the dates
          const startTime = showtime.start_time ? new Date(showtime.start_time) : new Date();
          
          return {
            reservation: {
              reservation_id: reservation.reservation_id,
              user_id: reservation.user_id,
              showtime_id: reservation.showtime_id,
              status: reservation.status as ReservationStatus,
              created_at: reservation.created_at,
              expires_at: reservation.expires_at,
            },
            tickets: reservation.tickets || [],
            movie: {
              title: movieTitle,
              showtime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              date: startTime.toLocaleDateString(),
              screen: `Screen ${showtime.screen_id || '?'}`,
              cinema: 'Brutal Cinema',
            }
          };
        });
        
        setBookings(bookingsWithDetails);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        // If API fails, fallback to mock data for demonstration
        const mockBookings: BookingWithDetails[] = [
          {
            reservation: {
              reservation_id: 1,
              user_id: user.user_id,
              showtime_id: 1,
              status: ReservationStatus.CONFIRMED,
              created_at: "2025-05-15T14:30:00",
              expires_at: "2025-05-20T14:30:00",
            },
            tickets: [
              {
                ticket_id: 1,
                reservation_id: 1,
                seat_id: 12,
                price: 12.0,
                issued_at: "2025-05-15T14:30:00",
              },
              {
                ticket_id: 2,
                reservation_id: 1,
                seat_id: 13,
                price: 12.0,
                issued_at: "2025-05-15T14:30:00",
              },
            ],
            movie: {
              title: "BRUTAL ACTION",
              showtime: "14:30",
              date: "2025-05-20",
              screen: "Screen 1",
              cinema: "Brutal Cineplex",
            },
          },
          {
            reservation: {
              reservation_id: 2,
              user_id: user.user_id,
              showtime_id: 3,
              status: ReservationStatus.CONFIRMED,
              created_at: "2025-05-16T10:15:00",
              expires_at: "2025-05-22T19:00:00",
            },
            tickets: [
              {
                ticket_id: 3,
                reservation_id: 2,
                seat_id: 25,
                price: 15.0,
                issued_at: "2025-05-16T10:15:00",
              },
            ],
            movie: {
              title: "CONCRETE DRAMA",
              showtime: "19:00",
              date: "2025-05-22",
              screen: "Screen 2 (IMAX)",
              cinema: "Brutal Cineplex",
            },
          },
        ];
        setBookings(mockBookings);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookings();
  }, [user])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!user) {
    return null // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Brutalist Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-black text-white p-4 border-b-8 border-yellow-400"
      >
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-8 w-8" />
            <h1 className="text-2xl font-mono font-bold tracking-tighter">BRUTAL CINEMA</h1>
          </Link>
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-yellow-400 text-black p-2 border-4 border-black"
            >
              <span className="font-mono font-bold">USER: {user.email.split("@")[0].toUpperCase()}</span>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white text-black hover:bg-gray-100 font-mono border-4 border-black"
              >
                <LogOut className="h-4 w-4 mr-2" />
                LOGOUT
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
            <Button
              onClick={() => router.push("/movies")}
              variant="outline"
              className="bg-white text-black hover:bg-gray-100 font-mono border-4 border-black flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              BROWSE MOVIES
            </Button>
          </motion.div>

          <motion.div
            initial={{ rotate: 0, x: -100, opacity: 0 }}
            animate={{ rotate: 1, x: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="bg-blue-500 p-6 border-8 border-black"
          >
            <h2 className="text-4xl font-mono font-bold text-white">MY TICKETS</h2>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="bg-black text-white p-8 border-8 border-yellow-400 font-mono text-xl">
              LOADING TICKETS...
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white border-8 border-black p-8 text-center">
            <h3 className="text-2xl font-mono font-bold mb-4">NO TICKETS FOUND</h3>
            <p className="font-mono mb-6">You haven't booked any movie tickets yet.</p>
            <Link href="/movies">
              <Button className="bg-black text-white hover:bg-gray-800 font-mono border-4 border-black">
                BROWSE MOVIES
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {bookings.map((booking) => (
              <motion.div
                key={booking.reservation.reservation_id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white border-8 border-black overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {/* Movie Info */}
                  <div className="md:col-span-2 p-6 border-r-0 md:border-r-8 border-black">
                    <div className="flex justify-between items-start mb-4">
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: -1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-red-500 p-3 border-4 border-black inline-block"
                      >
                        <h3 className="text-2xl font-mono font-bold text-white">{booking.movie.title}</h3>
                      </motion.div>
                      <div className="bg-green-500 text-white p-2 border-4 border-black font-mono font-bold">
                        {booking.reservation.status.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <span className="font-mono">{booking.movie.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        <span className="font-mono">{booking.movie.showtime}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="font-mono font-bold">CINEMA:</div>
                      <div className="font-mono">{booking.movie.cinema}</div>
                    </div>

                    <div className="mb-4">
                      <div className="font-mono font-bold">SCREEN:</div>
                      <div className="font-mono">{booking.movie.screen}</div>
                    </div>

                    <div className="mb-4">
                      <div className="font-mono font-bold">SEATS:</div>
                      <div className="font-mono">
                        {booking.tickets.map((ticket) => `A${ticket.seat_id}`).join(", ")}
                      </div>
                    </div>

                    <div className="bg-yellow-400 p-4 border-4 border-black">
                      <div className="flex justify-between">
                        <div className="font-mono">
                          <div className="font-bold">TICKETS:</div>
                          <div>{booking.tickets.length}</div>
                        </div>
                        <div className="font-mono">
                          <div className="font-bold">TOTAL:</div>
                          <div className="text-xl">
                            ${booking.tickets.reduce((sum, ticket) => sum + ticket.price, 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-6 flex flex-col items-center justify-center">
                    <div className="bg-white p-4 border-4 border-black mb-4">
                      <QRCodeSVG
                        value={`BRUTAL-CINEMA-TICKET-${booking.reservation.reservation_id}`}
                        size={150}
                        level="H"
                        includeMargin={true}
                        className="mx-auto"
                      />
                    </div>
                    <div className="font-mono text-center">
                      <div className="font-bold">RESERVATION ID:</div>
                      <div>{booking.reservation.reservation_id}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
