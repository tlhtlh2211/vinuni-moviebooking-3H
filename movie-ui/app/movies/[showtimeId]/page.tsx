"use client"

import { useState, useEffect, useRef, useCallback, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Film, Clock, Calendar, ArrowLeft, User, Ticket, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import type { MovieWithShowtimes, SeatWithStatus } from "@/types/database"
import { SeatClass } from "@/types/database"
import { lockSeat, unlockSeat, unlockSeats } from "../../utils/seatHelpers"
import React from "react"
import Image from "next/image"

// Booking time limit in seconds (5 minutes)
const BOOKING_TIME_LIMIT = 5 * 60

export default function MovieDetailsPage({ params }: { params: Promise<{ showtimeId: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const [movie, setMovie] = useState<MovieWithShowtimes | null>(null)
  const [selectedShowtime, setSelectedShowtime] = useState<number | null>(null)
  const [seats, setSeats] = useState<SeatWithStatus[]>([])
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [step, setStep] = useState<"details" | "seats" | "confirmation">("details")
  const [isLoading, setIsLoading] = useState(true)
  const [bookingData, setBookingData] = useState<Record<string, any> | null>(null)
  const [seatLoading, setSeatLoading] = useState<{[key: number]: boolean}>({})
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(BOOKING_TIME_LIMIT)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Unwrap params Promise
  const unwrappedParams = use(params)

  // Auto unlock selected seats
  const unlockSelectedSeats = useCallback(async () => {
    if (!user || !selectedShowtime || selectedSeats.length === 0) return
    
    try {
      // Unlock all selected seats
      await unlockSeats(selectedShowtime, selectedSeats, user.user_id)
      
      // Reset the seat selection and UI
      setSelectedSeats([])
      setSeats(prevSeats => 
        prevSeats.map(seat => 
          selectedSeats.includes(seat.seat_id) ? { ...seat, is_locked: false } : seat
        )
      )
      
      // Show notification
      alert("Your booking session has expired. All selected seats have been released.")
    } catch (error) {
      console.error("Failed to unlock seats:", error)
    }
  }, [user, selectedShowtime, selectedSeats])

  // Start the timer when entering seat selection
  useEffect(() => {
    if (step === "seats" && !timerActive && user) {
      setTimeLeft(BOOKING_TIME_LIMIT)
      setTimerActive(true)
    } else if (step !== "seats") {
      setTimerActive(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [step, timerActive, user])

  // Countdown timer
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Stop timer and unlock seats
            setTimerActive(false)
            if (timerRef.current) clearInterval(timerRef.current)
            unlockSelectedSeats()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (timeLeft === 0) {
      setTimerActive(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [timerActive, timeLeft, unlockSelectedSeats])

  // Format time to MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Fetch movie data
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await fetch(`/api/v1/movies/${unwrappedParams.showtimeId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch movie")
        }
        const data = await response.json()
        
        // Add mock data for fields not available in the database
        const movieWithExtras = {
          ...data.data,
          description: data.data.description || "An exciting film that takes viewers on an unforgettable journey through a world of adventure and excitement.",
          director: data.data.director || "John Director",
          cast: data.data.cast || ["Actor One", "Actor Two", "Actor Three"],
          genre: data.data.genre || "Action",
          showtimes: data.data.showtimes || [
            {
              showtime_id: 1,
              movie_id: data.data.movie_id,
              screen_id: 1,
              start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString(),
              screen: {
                name: "Screen 1",
                screen_format: "IMAX"
              },
              cinema: {
                name: "Main Cinema"
              }
            },
            {
              showtime_id: 2,
              movie_id: data.data.movie_id,
              screen_id: 2,
              start_time: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
              end_time: new Date(Date.now() + 26 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString(),
              screen: {
                name: "Screen 2",
                screen_format: "3D"
              },
              cinema: {
                name: "Main Cinema"
              }
            }
          ]
        }
        
        setMovie(movieWithExtras)
      } catch (error) {
        console.error("Error fetching movie:", error)
        router.push("/movies")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMovie()
  }, [unwrappedParams.showtimeId, router])

  // Fetch seats when showtime is selected
  useEffect(() => {
    const fetchSeats = async () => {
      if (!selectedShowtime) return

      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/v1/showtimes/${selectedShowtime}/seats?t=${timestamp}`, {
          cache: 'no-store'
        })
        if (!response.ok) {
          throw new Error("Failed to fetch seats")
        }
        const data = await response.json()
        
        // Check if we got real data from the backend
        const seatsData = data.data || [];
        if (seatsData.length === 0) {
          // Generate mock seats if no data is returned
          // Generate a grid of 8x12 seats to match the database structure
          const mockSeats: SeatWithStatus[] = [];
          for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 12; col++) {
              const seatId = row * 12 + col + 1; // Match database structure: 12 columns per row
              mockSeats.push({
                seat_id: seatId,
                screen_id: 1,
                seat_class: row >= 5 ? SeatClass.PREMIUM : SeatClass.STANDARD, // F-H rows are premium
                seat_label: `${String.fromCharCode(65 + row)}${col + 1}`,
                row_num: row,
                col_num: col,
                is_locked: Math.random() < 0.1, // 10% chance of being locked
                is_booked: Math.random() < 0.2  // 20% chance of being booked
              });
            }
          }
          setSeats(mockSeats);
        } else {
          // Convert backend data format to frontend format
          const convertedSeats: SeatWithStatus[] = seatsData.map((seat: any) => ({
            seat_id: seat.seat_id,
            screen_id: seat.screen_id,
            seat_class: seat.seat_class,
            seat_label: seat.seat_label,
            row_num: seat.row_num,
            col_num: seat.col_num,
            is_locked: seat.status === 'locked',
            is_booked: seat.status === 'sold'
          }));
          setSeats(convertedSeats);
        }
      } catch (error) {
        console.error("Error fetching seats:", error)
        
        // Generate mock seats in case of error
        const mockSeats: SeatWithStatus[] = [];
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const seatId = row * 8 + col + 1;
            mockSeats.push({
              seat_id: seatId,
              screen_id: 1,
              seat_class: col < 2 ? SeatClass.STANDARD : SeatClass.PREMIUM,
              seat_label: `${String.fromCharCode(65 + row)}${col + 1}`,
              row_num: row,
              col_num: col,
              is_locked: Math.random() < 0.1, // 10% chance of being locked
              is_booked: Math.random() < 0.2  // 20% chance of being booked
            });
          }
        }
        setSeats(mockSeats);
      }
    }

    fetchSeats()
  }, [selectedShowtime])

  const toggleSeatSelection = async (seatId: number) => {
    if (selectedSeats.includes(seatId)) {
      // If seat is already selected, unlock it
      setSeatLoading(prev => ({ ...prev, [seatId]: true }))
      
      try {
        // Call unlock API
        const unlocked = await unlockSeat(selectedShowtime || 0, seatId, user?.user_id || 0)
        
        if (unlocked) {
          // Remove from selected seats
          setSelectedSeats(selectedSeats.filter((id) => id !== seatId))
          
          // Update the seat status in the UI to show it's available
          setSeats(prevSeats => 
            prevSeats.map(seat => 
              seat.seat_id === seatId ? { ...seat, is_locked: false } : seat
            )
          )
        } else {
          alert("Failed to unlock seat. Please try again.")
        }
      } catch (err) {
        console.error(`Failed to unlock seat ${seatId}`, err)
        alert("Error unlocking seat. Please try again.")
      } finally {
        setSeatLoading(prev => ({ ...prev, [seatId]: false }))
      }
      return
    }

    // Make sure user is logged in
    if (!user) {
      router.push(`/login?redirect=/movies/${unwrappedParams.showtimeId}`)
      return
    }

    // Start loading state for this seat
    setSeatLoading(prev => ({ ...prev, [seatId]: true }))
    
    try {
      // Try to lock the seat immediately
      const locked = await lockSeat(selectedShowtime || 0, seatId, user.user_id)
      
      if (locked) {
        // If successfully locked, add to selected seats
        setSelectedSeats([...selectedSeats, seatId])
        
        // Update the seat status in the UI to show it's locked
        setSeats(prevSeats => 
          prevSeats.map(seat => 
            seat.seat_id === seatId ? { ...seat, is_locked: true } : seat
          )
        )
      } else {
        // Show error (could be improved with a proper UI notification)
        alert(`Failed to lock seat. Please try another seat.`)
      }
    } catch (err) {
      console.error(`Failed to lock seat ${seatId}`, err)
      alert(`Error locking seat. Please try again.`)
    } finally {
      // Clear loading state for this seat
      setSeatLoading(prev => ({ ...prev, [seatId]: false }))
    }
  }

  const handleShowtimeSelect = (showtimeId: number) => {
    // Check if user is logged in before proceeding to seat selection
    if (!user) {
      router.push(`/login?redirect=/movies/${unwrappedParams.showtimeId}`)
      return
    }

    setSelectedShowtime(showtimeId)
    setStep("seats")
  }

  const handleBooking = async () => {
    if (!user) {
      router.push(`/login?redirect=/movies/${unwrappedParams.showtimeId}`)
      return
    }

    if (selectedSeats.length > 0 && user && selectedShowtime) {
      try {
        // Seats should already be locked at this point - just create the reservation
        const response = await fetch("/api/v1/reservations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.user_id,
            showtime_id: selectedShowtime,
            seats: selectedSeats,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create reservation")
        }

        const data = await response.json()
        
        // Update the bookingData state with a structure that matches what the UI expects
        // Use the actual status from the API response instead of hardcoding "confirmed"
        setBookingData({
          reservation: {
            reservation_id: data.reservation_id || "R-" + Math.floor(Math.random() * 10000),
            status: data.status, // Use actual status from API
            // Add other reservation fields...
          },
          tickets: data.tickets || selectedSeats.map(seatId => {
            const seat = seats.find(s => s.seat_id === seatId);
            const price = seat?.seat_class === SeatClass.PREMIUM ? 15 : 12;
            return {
              ticket_id: "T-" + seatId,
              seat_id: seatId,
              price
            };
          })
        })
        
        setStep("confirmation")
      } catch (error: any) {
        console.error("Error creating reservation:", error)
        // Show error to user
        alert(error.message || "Failed to create reservation. Please try again.")
      }
    } else {
      // Show error if no seats are selected
      alert("Please select at least one seat to continue.")
    }
  }

  const handleBackToDetails = async () => {
    // Unlock any selected seats before going back
    if (selectedSeats.length > 0 && user && selectedShowtime) {
      try {
        await unlockSeats(selectedShowtime, selectedSeats, user.user_id)
        console.log("Unlocked seats when going back:", selectedSeats)
      } catch (error) {
        console.error("Failed to unlock seats when going back:", error)
      }
    }
    
    setStep("details")
    setSelectedShowtime(null)
    setSelectedSeats([])
    setSeats([]) // Clear seats so they will be refetched when user comes back
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-black text-white p-8 border-8 border-yellow-400 font-mono text-xl">LOADING...</div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-red-500 text-white p-8 border-8 border-black font-mono text-xl">MOVIE NOT FOUND</div>
      </div>
    )
  }

  // Format duration to hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours > 0 ? `${hours}h ` : ""}${mins}m`
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
            {user ? (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-yellow-400 text-black p-2 border-4 border-black"
                >
                  <span className="font-mono font-bold">USER: {user.email.split("@")[0].toUpperCase()}</span>
                </motion.div>
                <Link href="/profile">
                  <Button
                    variant="outline"
                    className="bg-white text-black hover:bg-gray-100 font-mono border-4 border-black"
                  >
                    <User className="h-4 w-4 mr-2" />
                    MY TICKETS
                  </Button>
                </Link>
              </>
            ) : (
              <Link href={`/login?redirect=/movies/${unwrappedParams.showtimeId}`}>
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500 font-mono font-bold border-4 border-black">
                  LOGIN
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto p-8">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Button
            onClick={() => router.push("/movies")}
            variant="outline"
            className="bg-white text-black hover:bg-gray-100 font-mono border-4 border-black flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            BACK TO MOVIES
          </Button>
        </motion.div>

        {step === "details" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="md:col-span-1"
              >
                <div className="bg-gray-200 aspect-[2/3] border-8 border-black flex items-center justify-center relative overflow-hidden">
                  {movie.poster_url ? (
                    <Image 
                      src={movie.poster_url} 
                      alt={movie.title} 
                      className="w-full h-full object-cover"
                      width={400}
                      height={600}
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50"></div>
                      <span className="font-mono font-bold text-4xl z-10">MOVIE {movie.movie_id}</span>
                    </>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="md:col-span-2"
              >
                <div className="bg-white border-8 border-black p-6">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-red-500 p-4 border-4 border-black mb-6 inline-block"
                  >
                    <h2 className="text-3xl font-mono font-bold text-white">{movie.title}</h2>
                  </motion.div>

                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="bg-blue-500 text-white font-mono p-2 border-2 border-black flex items-center gap-2">
                      <span>{movie.genre}</span>
                    </div>
                    <div className="bg-yellow-400 text-black font-mono p-2 border-2 border-black flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(movie.duration)}</span>
                    </div>
                    <div className="bg-green-500 text-white font-mono p-2 border-2 border-black">
                      <span>RATING: {movie.rating}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-mono font-bold mb-2">SYNOPSIS</h3>
                    <p className="font-mono border-2 border-black p-4 bg-gray-100">{movie.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-mono font-bold mb-2">DIRECTOR</h3>
                      <div className="font-mono border-2 border-black p-4 bg-gray-100">{movie.director}</div>
                    </div>
                    <div>
                      <h3 className="text-xl font-mono font-bold mb-2">CAST</h3>
                      <div className="font-mono border-2 border-black p-4 bg-gray-100">
                        {movie.cast ? movie.cast.join(", ") : "Cast information not available"}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8"
            >
              <div className="bg-black p-4 border-4 border-yellow-400 mb-6">
                <h3 className="text-2xl font-mono font-bold text-white">SHOWTIMES</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {movie.showtimes && movie.showtimes.length > 0 ? (
                  movie.showtimes.map((showtime) => (
                    <motion.div
                      key={showtime.showtime_id}
                      whileHover={{ scale: 1.03, y: -5 }}
                      className="bg-white border-4 border-black p-4"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="bg-blue-500 text-white font-mono p-2 border-2 border-black flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(showtime.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="bg-yellow-400 text-black font-mono p-2 border-2 border-black flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(showtime.start_time).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="mb-4 font-mono">
                        <div className="font-bold">Screen: {showtime.screen?.name || "Screen information not available"}</div>
                        <div className="font-bold">Cinema: {showtime.cinema?.address || "Screen information not available"}</div>
                      </div>
                      <Button
                        onClick={() => handleShowtimeSelect(showtime.showtime_id)}
                        className="w-full bg-black text-white hover:bg-gray-800 font-mono border-2 border-black"
                      >
                        SELECT THIS SHOWTIME
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-3 bg-gray-100 p-4 border-4 border-black">
                    <p className="font-mono text-center">No showtimes available for this movie.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {step === "seats" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white border-8 border-black p-6">
              <div className="flex justify-between items-center mb-6">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: -1 }}
                  transition={{ duration: 0.5 }}
                  className="bg-blue-500 p-4 border-4 border-black"
                >
                  <h2 className="text-2xl font-mono font-bold text-white">SELECT YOUR SEATS</h2>
                </motion.div>
                <div className="font-mono text-xl">
                  <span className="font-bold">{movie.title}</span> -{" "}
                  {movie.showtimes?.find((s) => s.showtime_id === selectedShowtime)?.start_time &&
                    new Date(
                      movie.showtimes?.find((s) => s.showtime_id === selectedShowtime)?.start_time || "",
                    ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              
              {/* Booking Timer */}
              <div className={`mb-6 p-4 border-4 ${timeLeft < 60 ? 'border-red-500 bg-red-100' : 'border-yellow-400 bg-yellow-50'}`}>
                <div className="flex justify-between items-center">
                  <div className="font-mono flex items-center gap-2">
                    <Clock className={`h-5 w-5 ${timeLeft < 60 ? 'text-red-500' : 'text-black'}`} />
                    <span className="font-bold">BOOKING TIME REMAINING:</span>
                  </div>
                  <div className={`font-mono text-2xl font-bold ${timeLeft < 60 ? 'text-red-600' : timeLeft < 120 ? 'text-orange-500' : 'text-black'}`}>
                    {formatTime(timeLeft)}
                  </div>
                </div>
                {timeLeft < 60 && (
                  <div className="mt-2 text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Your reserved seats will be released when the timer ends!</span>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <div className="w-full bg-black p-2 text-center text-white font-mono mb-8">SCREEN</div>

                <div className="grid grid-cols-12 gap-4 max-w-4xl mx-auto mb-8">
                  {seats.map((seat) => (
                    <motion.div
                      key={seat.seat_id}
                      whileHover={!seat.is_locked && !seat.is_booked ? { scale: 1.1 } : {}}
                      whileTap={!seat.is_locked && !seat.is_booked ? { scale: 0.95 } : {}}
                      onClick={() => !seat.is_locked && !seat.is_booked && toggleSeatSelection(seat.seat_id)}
                      className={`aspect-square flex items-center justify-center border-4 ${
                        seatLoading[seat.seat_id]
                          ? "bg-blue-100 border-blue-300 animate-pulse"
                          : seat.is_booked || seat.is_locked
                            ? "bg-gray-300 border-gray-400 cursor-not-allowed"
                            : selectedSeats.includes(seat.seat_id)
                              ? "bg-green-500 border-black cursor-pointer"
                              : seat.seat_class === SeatClass.PREMIUM
                                ? "bg-yellow-200 border-black cursor-pointer hover:bg-yellow-100"
                                : "bg-white border-black cursor-pointer hover:bg-gray-100"
                      }`}
                    >
                      <span className="font-mono font-bold">
                        {seatLoading[seat.seat_id] ? "..." : seat.seat_label}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-center gap-4 mb-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white border-2 border-black"></div>
                    <span className="font-mono">Standard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-200 border-2 border-black"></div>
                    <span className="font-mono">Premium</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 border-2 border-black"></div>
                    <span className="font-mono">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-300 border-2 border-gray-400"></div>
                    <span className="font-mono">Unavailable</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-400 border-4 border-black p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div className="font-mono">
                    <div className="text-lg font-bold">SELECTED SEATS:</div>
                    <div>
                      {selectedSeats.length > 0
                        ? selectedSeats.map((id) => seats.find((s) => s.seat_id === id)?.seat_label).join(", ")
                        : "None selected"}
                    </div>
                  </div>
                  <div className="font-mono">
                    <div className="text-lg font-bold">TOTAL:</div>
                    <div className="text-2xl">
                      $
                      {selectedSeats
                        .reduce((total, seatId) => {
                          const seat = seats.find((s) => s.seat_id === seatId)
                          // Price based on seat class
                          const price = seat?.seat_class === SeatClass.PREMIUM ? 15 : 12
                          return total + (price || 0)
                        }, 0)
                        .toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleBackToDetails}
                  variant="outline"
                  className="bg-white text-black hover:bg-gray-100 font-mono border-4 border-black"
                >
                  BACK
                </Button>
                <Button
                  onClick={handleBooking}
                  disabled={selectedSeats.length === 0}
                  className={`flex-1 font-mono text-white border-4 border-black ${
                    selectedSeats.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  <Ticket className="mr-2 h-5 w-5" />
                  BOOK TICKETS
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "confirmation" && bookingData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white border-8 border-black p-6">
              <motion.div
                initial={{ rotate: 0, y: -20, opacity: 0 }}
                animate={{ rotate: 1, y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-green-500 p-6 border-4 border-black mb-8 text-center"
              >
                <h2 className="text-3xl font-mono font-bold text-white">BOOKING CONFIRMED!</h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white border-4 border-black p-4">
                  <h3 className="text-xl font-mono font-bold mb-4">MOVIE DETAILS</h3>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between border-b-2 border-black pb-2">
                      <span className="font-bold">TITLE:</span>
                      <span>{movie.title}</span>
                    </div>
                    <div className="flex justify-between border-b-2 border-black pb-2">
                      <span className="font-bold">DATE:</span>
                      <span>
                        {movie.showtimes?.find((s) => s.showtime_id === selectedShowtime)?.start_time &&
                          new Date(
                            movie.showtimes?.find((s) => s.showtime_id === selectedShowtime)?.start_time || "",
                          ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b-2 border-black pb-2">
                      <span className="font-bold">TIME:</span>
                      <span>
                        {movie.showtimes?.find((s) => s.showtime_id === selectedShowtime)?.start_time &&
                          new Date(
                            movie.showtimes?.find((s) => s.showtime_id === selectedShowtime)?.start_time || "",
                          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex justify-between border-b-2 border-black pb-2">
                      <span className="font-bold">DURATION:</span>
                      <span>{formatDuration(movie.duration)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-4 border-black p-4">
                  <h3 className="text-xl font-mono font-bold mb-4">BOOKING DETAILS</h3>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between border-b-2 border-black pb-2">
                      <span className="font-bold">RESERVATION ID:</span>
                      <span>{bookingData.reservation.reservation_id}</span>
                    </div>
                    <div className="flex justify-between border-b-2 border-black pb-2">
                      <span className="font-bold">STATUS:</span>
                      <span className="uppercase">{bookingData.reservation.status}</span>
                    </div>
                    <div className="flex justify-between border-b-2 border-black pb-2">
                      <span className="font-bold">SEATS:</span>
                      <span>
                        {selectedSeats.map((id) => seats.find((s) => s.seat_id === id)?.seat_label).join(", ")}
                      </span>
                    </div>
                    <div className="flex justify-between border-b-2 border-black pb-2">
                      <span className="font-bold">TICKETS:</span>
                      <span>{bookingData.tickets.length}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl">
                      <span>TOTAL:</span>
                      <span>
                        $
                        {bookingData.tickets.reduce((total: number, ticket: any) => total + ticket.price, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-400 border-4 border-black p-6 mb-8">
                <h3 className="text-xl font-mono font-bold mb-2 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  CUSTOMER INFORMATION
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                  <div>
                    <span className="font-bold">USER ID:</span> {user?.user_id}
                  </div>
                  <div>
                    <span className="font-bold">EMAIL:</span> {user?.email}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Link href="/profile">
                  <Button className="bg-blue-500 text-white hover:bg-blue-600 font-mono border-4 border-black">
                    VIEW MY TICKETS
                  </Button>
                </Link>
                <Link href="/movies">
                  <Button className="bg-black text-white hover:bg-gray-800 font-mono border-4 border-black">
                    BROWSE MORE MOVIES
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
