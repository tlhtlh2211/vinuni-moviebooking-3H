"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Film, LogOut, User, Calendar, Clock, MapPin, Monitor } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { type Movie, type Showtime, UserRole } from "@/types/database"

interface MovieWithShowtimes extends Movie {
  showtimes: Array<Showtime & {
    screen: {
      screen_id: number
      name: string
      screen_format: string
    }
    cinema: {
      cinema_id: number
      name: string
      address: string
      city: string
    }
  }>
}

export default function MovieDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, logout } = useAuth()
  const movieId = params.movieId as string

  const [movie, setMovie] = useState<MovieWithShowtimes | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCinema, setSelectedCinema] = useState<string>("all")
  const [selectedFormat, setSelectedFormat] = useState<string>("all")

  // Redirect if admin
  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      router.push("/admin/dashboard")
    }
  }, [user, router])

  // Fetch movie with showtimes
  useEffect(() => {
    const fetchMovieWithShowtimes = async () => {
      try {
        const response = await fetch(`/api/v1/movies/${movieId}?include_showtimes=true`)
        if (!response.ok) {
          throw new Error("Failed to fetch movie")
        }
        const data = await response.json()
        console.log("Movie data received:", data)
        // Extract movie from data wrapper and ensure showtimes is always an array
        const movieData = data.data || data
        setMovie({
          ...movieData,
          showtimes: movieData.showtimes || []
        })
      } catch (error) {
        console.error("Error fetching movie:", error)
        router.push("/movies")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMovieWithShowtimes()
  }, [movieId, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Get unique cinemas and formats from showtimes
  const cinemas = movie?.showtimes && movie.showtimes.length > 0
    ? Array.from(new Set(movie.showtimes.map(st => st.cinema.cinema_id)))
        .map(id => {
          const cinema = movie?.showtimes?.find(st => st.cinema.cinema_id === id)?.cinema
          return cinema ? { id: cinema.cinema_id.toString(), name: cinema.name } : null
        })
        .filter(Boolean) as { id: string; name: string }[]
    : []

  const formats = movie?.showtimes && movie.showtimes.length > 0
    ? Array.from(new Set(movie.showtimes.map(st => st.screen.screen_format)))
        .filter(format => format !== null && format !== undefined)
        .map(format => ({ value: format, label: format }))
    : []

  // Filter showtimes based on selection
  const filteredShowtimes = movie?.showtimes?.filter(showtime => {
    const cinemaMatch = selectedCinema === "all" || showtime.cinema.cinema_id.toString() === selectedCinema
    const formatMatch = selectedFormat === "all" || showtime.screen.screen_format === selectedFormat
    return cinemaMatch && formatMatch
  }) || []

  // Group showtimes by date
  const groupedShowtimes = filteredShowtimes.reduce((acc, showtime) => {
    const date = new Date(showtime.start_time).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(showtime)
    return acc
  }, {} as Record<string, typeof filteredShowtimes>)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-black text-white p-8 border-8 border-yellow-400 font-mono text-xl">
          LOADING MOVIE...
        </div>
      </div>
    )
  }

  if (!movie) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-black text-white p-4 border-b-8 border-yellow-400"
      >
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/movies" className="flex items-center gap-2">
            <Film className="h-8 w-8" />
            <h1 className="text-2xl font-mono font-bold tracking-tighter">BRUTAL CINEMA</h1>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="bg-yellow-400 text-black p-2 border-4 border-black">
                  <span className="font-mono font-bold">USER: {user.email.split("@")[0].toUpperCase()}</span>
                </div>
                <Link href="/profile">
                  <Button
                    variant="outline"
                    className="bg-white text-black hover:bg-gray-100 font-mono border-4 border-black"
                  >
                    <User className="h-4 w-4 mr-2" />
                    MY TICKETS
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="bg-white text-black hover:bg-gray-100 font-mono border-4 border-black"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  LOGOUT
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button className="bg-yellow-400 text-black hover:bg-yellow-500 font-mono font-bold border-4 border-black">
                  LOGIN
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto p-8">
        {/* Movie Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="bg-gray-200 border-8 border-black aspect-[2/3] flex items-center justify-center relative">
                {movie?.poster_url ? (
                  <Image 
                    src={movie.poster_url} 
                    alt={movie?.title || "Movie poster"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="font-mono font-bold text-2xl">NO POSTER</span>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <h1 className="text-5xl font-mono font-bold mb-4 bg-yellow-400 p-4 border-8 border-black inline-block">
                {movie?.title || "Loading..."}
              </h1>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <span className="bg-blue-500 text-white font-mono p-3 border-4 border-black">{movie?.genre || "N/A"}</span>
                  <span className="bg-red-500 text-white font-mono p-3 border-4 border-black">{movie?.rating || "N/A"}</span>
                  <span className="bg-green-500 text-white font-mono p-3 border-4 border-black">{movie?.duration || "0"} MIN</span>
                </div>
                {movie?.description && (
                  <div className="bg-gray-100 p-4 border-4 border-black">
                    <p className="font-mono">{movie.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {movie?.director && (
                    <div className="bg-purple-500 text-white p-3 border-4 border-black">
                      <span className="font-mono font-bold">DIRECTOR: {movie.director}</span>
                    </div>
                  )}
                  {movie?.cast && movie.cast.length > 0 && (
                    <div className="bg-orange-500 text-white p-3 border-4 border-black">
                      <span className="font-mono font-bold">CAST: {movie.cast.slice(0, 3).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-black text-white p-6 border-8 border-yellow-400 mb-8"
        >
          <h2 className="text-2xl font-mono font-bold mb-4">FILTER SHOWTIMES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono font-bold mb-2 block">
                <MapPin className="inline h-4 w-4 mr-2" />
                CINEMA
              </label>
              <Select value={selectedCinema} onValueChange={setSelectedCinema}>
                <SelectTrigger className="bg-white text-black border-4 border-yellow-400 font-mono">
                  <SelectValue placeholder="Select cinema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-mono">ALL CINEMAS</SelectItem>
                  {cinemas.map(cinema => (
                    <SelectItem key={cinema.id} value={cinema.id} className="font-mono">
                      {cinema.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-mono font-bold mb-2 block">
                <Monitor className="inline h-4 w-4 mr-2" />
                SCREEN FORMAT
              </label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="bg-white text-black border-4 border-yellow-400 font-mono">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-mono">ALL FORMATS</SelectItem>
                  {formats.map((format, index) => (
                    <SelectItem key={`format-${format.value}-${index}`} value={format.value} className="font-mono">
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Showtimes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {Object.keys(groupedShowtimes).length === 0 ? (
            <div className="bg-gray-100 p-8 border-8 border-black text-center">
              <p className="font-mono text-xl">NO SHOWTIMES AVAILABLE FOR SELECTED FILTERS</p>
            </div>
          ) : (
            Object.entries(groupedShowtimes).map(([date, showtimes]) => (
              <div key={date} className="mb-8">
                <h3 className="text-2xl font-mono font-bold mb-4 bg-red-500 text-white p-3 border-4 border-black inline-block">
                  <Calendar className="inline h-5 w-5 mr-2" />
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {showtimes.map(showtime => (
                    <motion.div
                      key={showtime.showtime_id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => router.push(`/movies/${movieId}/${showtime.showtime_id}`)}
                        className="w-full h-auto flex-col bg-white border-4 border-black hover:bg-yellow-400 hover:border-yellow-600 p-4 font-mono text-black"
                      >
                        <Clock className="h-8 w-8 mb-2 text-black" />
                        <span className="text-xl font-bold text-black">
                          {new Date(showtime.start_time).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                        {(selectedCinema === "all" || selectedFormat === "all") && (
                          <div className="mt-2 text-xs">
                            {selectedCinema === "all" && (
                              <span className="block">{showtime.cinema.name}</span>
                            )}
                            {selectedFormat === "all" && (
                              <span className="block">{showtime.screen.screen_format}</span>
                            )}
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  )
}