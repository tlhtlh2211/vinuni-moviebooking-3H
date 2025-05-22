"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Film, Ticket, Star, Clock, User } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import type { Movie } from "@/types/database"

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    setIsLoaded(true)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Fetch movies from API
  useEffect(() => {
    const fetchMovies = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/v1/movies")

        if (!response.ok) {
          throw new Error("Failed to fetch movies")
        }

        const data = await response.json()

        // Get the latest movies (up to 4)
        const latestMovies = Array.isArray(data) ? data.slice(0, 4) : data.data?.slice(0, 4) || []

        setFeaturedMovies(latestMovies)
      } catch (err) {
        console.error("Error fetching movies:", err)
        setError(err instanceof Error ? err.message : "Failed to load movies")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMovies()
  }, [])

  // Calculate subtle movement based on mouse position
  const calcMovement = (factor = 1) => {
    if (!isLoaded) return { x: 0, y: 0 }
    const x = ((mousePosition.x - window.innerWidth / 2) / 50) * factor
    const y = ((mousePosition.y - window.innerHeight / 2) / 50) * factor
    return { x, y }
  }

  const handleMyTicketsClick = () => {
    if (user) {
      router.push("/profile")
    } else {
      router.push("/login?redirect=/profile")
    }
  }

  // Format duration to hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours > 0 ? `${hours}h ` : ""}${mins}m`
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Brutalist Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-black text-white p-4 border-b-8 border-yellow-400 sticky top-0 z-50"
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-8 w-8" />
            <motion.h1
              initial={{ letterSpacing: "0px" }}
              animate={{ letterSpacing: "2px" }}
              transition={{ duration: 1 }}
              className="text-2xl font-mono font-bold tracking-tighter"
            >
              BRUTAL CINEMA
            </motion.h1>
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <div className="bg-yellow-400 text-black p-2 border-4 border-black">
                <span className="font-mono font-bold">{user.email.split("@")[0].toUpperCase()}</span>
              </div>
              <Link href="/profile">
                <Button className="bg-white text-black hover:bg-gray-100 font-mono border-4 border-black">
                  <User className="h-4 w-4 mr-2" />
                  MY TICKETS
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/login">
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500 font-mono font-bold border-4 border-black transition-transform hover:translate-y-[-4px]">
                LOGIN
              </Button>
            </Link>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <div className="flex-1 container mx-auto grid md:grid-cols-2 gap-8 p-8 pt-16">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ rotate: 0, x: -100, opacity: 0 }}
            animate={{ rotate: 1, x: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
            style={{ transformOrigin: "center" }}
            className="bg-red-500 p-8 border-8 border-black mb-8 relative"
          >
            <motion.div
              animate={calcMovement(-1)}
              transition={{ type: "spring", stiffness: 150 }}
              className="absolute -top-4 -right-4 bg-yellow-400 p-2 border-4 border-black transform rotate-12"
            >
              <span className="font-mono font-bold text-black">NOW SHOWING</span>
            </motion.div>
            <h2 className="text-5xl font-mono font-bold mb-4 text-white">BOOK YOUR MOVIE TICKETS NOW</h2>
            <p className="text-xl font-mono text-white">Raw. Unfiltered. Cinema.</p>
          </motion.div>

          <div className="flex gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/movies">
                <Button className="bg-black text-white hover:bg-gray-800 font-mono text-xl p-8 border-4 border-black">
                  BROWSE MOVIES
                </Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleMyTicketsClick}
                variant="outline"
                className="bg-white text-black hover:bg-gray-100 font-mono text-xl p-8 border-4 border-black"
              >
                <Ticket className="mr-2 h-5 w-5" />
                MY TICKETS
              </Button>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ rotate: 0, x: 100, opacity: 0 }}
          animate={{ rotate: -2, x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex items-center justify-center"
        >
          <div className="bg-blue-500 p-4 border-8 border-black w-full max-w-md">
            <div className="bg-white border-4 border-black p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="bg-black text-white p-4 border-4 border-yellow-400 font-mono">LOADING MOVIES...</div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-64">
                  <div className="bg-red-500 text-white p-4 border-4 border-black font-mono">{error}</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {featuredMovies.length > 0 ? (
                    featuredMovies.map((movie, i) => (
                      <motion.div
                        key={movie.movie_id}
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        animate={calcMovement(0.5)}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="aspect-[2/3] bg-gray-200 border-4 border-black relative overflow-hidden"
                      >
                        <Link href={`/movies/${movie.movie_id}`}>
                          <div className="w-full h-full flex items-center justify-center font-mono font-bold">
                            {movie.poster_url ? (
                              <img 
                                src={movie.poster_url} 
                                alt={movie.title}
                                className="w-full h-full object-cover absolute inset-0"
                              />
                            ) : (
                              <span className="z-10">MOVIE {movie.movie_id}</span>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="font-mono font-bold text-white text-sm">{movie.title}</p>
                              <div className="flex justify-between mt-1">
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 text-yellow-400 mr-1" />
                                  <span className="text-white text-xs">{movie.rating}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 text-white mr-1" />
                                  <span className="text-white text-xs">{formatDuration(movie.duration)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-2 flex justify-center items-center h-64">
                      <div className="bg-yellow-400 text-black p-4 border-4 border-black font-mono">
                        NO MOVIES AVAILABLE
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Featured Section */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="container mx-auto p-8"
      >
        <div className="bg-black p-6 border-8 border-yellow-400 transform -rotate-1 mb-8">
          <h2 className="text-4xl font-mono font-bold text-white">FEATURED SCREENINGS</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredMovies.length > 0 ? (
            featuredMovies.slice(0, 3).map((movie, i) => (
              <motion.div
                key={movie.movie_id}
                whileHover={{ scale: 1.03, y: -10 }}
                className="bg-white border-8 border-black group"
              >
                <div className="aspect-video bg-gray-200 border-b-8 border-black relative overflow-hidden">
                  {movie.poster_url ? (
                    <img 
                      src={movie.poster_url} 
                      alt={movie.title}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-50 group-hover:opacity-70 transition-opacity"></div>
                  <div className="w-full h-full flex items-center justify-center font-mono font-bold text-white z-10 relative">
                    {!movie.poster_url && movie.title}
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-0 right-0 flex justify-center"
                  >
                    <Link href={`/movies/${movie.movie_id}`}>
                      <Button className="bg-red-500 text-white border-4 border-black font-mono">
                        <Ticket className="mr-2 h-4 w-4" /> BOOK NOW
                      </Button>
                    </Link>
                  </motion.div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-mono font-bold">{movie.title}</h3>
                  <p className="font-mono mt-2 line-clamp-2">
                    {movie.description || "Experience cinema like never before with our special brutalist screenings."}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="bg-yellow-400 text-black font-mono p-2 font-bold">{movie.rating}</span>
                    <span className="bg-blue-500 text-white font-mono p-2">{formatDuration(movie.duration)}</span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="bg-white border-8 border-black animate-pulse">
                  <div className="aspect-video bg-gray-200 border-b-8 border-black"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 mb-2"></div>
                    <div className="h-4 bg-gray-200 mb-4"></div>
                    <div className="h-4 bg-gray-200"></div>
                  </div>
                </div>
              ))
          ) : (
            <div className="col-span-3 flex justify-center items-center h-64">
              <div className="bg-yellow-400 text-black p-4 border-4 border-black font-mono">
                NO FEATURED SCREENINGS AVAILABLE
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-black text-white p-8 border-t-8 border-red-500 mt-16"
      >
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Film className="h-8 w-8" />
              <h2 className="text-2xl font-mono font-bold">BRUTAL CINEMA</h2>
            </div>
            <div className="font-mono">&copy; {new Date().getFullYear()} BRUTAL CINEMA. ALL RIGHTS RESERVED.</div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
