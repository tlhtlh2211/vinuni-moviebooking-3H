"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Film, LogOut, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { type Movie, UserRole } from "@/types/database"

export default function MoviesPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [movies, setMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if admin
  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      router.push("/admin/dashboard")
    }
  }, [user, router])

  // Fetch movies
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch("/api/v1/movies")
        if (!response.ok) {
          throw new Error("Failed to fetch movies")
        }
        const data = await response.json()
        setMovies(data.data)
      } catch (error) {
        console.error("Error fetching movies:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMovies()
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleBookClick = (movieId: number) => {
    if (!user) {
      // Redirect to login if not logged in
      router.push(`/login?redirect=/movies/${movieId}`)
    } else {
      // Go to movie details page if logged in
      router.push(`/movies/${movieId}`)
    }
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
        <motion.div
          initial={{ rotate: 0, x: -100, opacity: 0 }}
          animate={{ rotate: 1, x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="bg-red-500 p-6 border-8 border-black mb-8"
        >
          <h2 className="text-4xl font-mono font-bold text-white">NOW SHOWING</h2>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="bg-black text-white p-8 border-8 border-yellow-400 font-mono text-xl">
              LOADING MOVIES...
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {movies.map((movie, index) => (
              <motion.div
                key={movie.movie_id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="bg-white border-8 border-black hover:bg-gray-100 transform transition-transform">
                  <div className="aspect-[2/3] bg-gray-200 border-b-8 border-black flex items-center justify-center overflow-hidden">
                    {movie.poster_url ? (
                      <img 
                        src={movie.poster_url} 
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-mono font-bold text-2xl">MOVIE {movie.movie_id}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-2xl font-mono font-bold mb-2">{movie.title}</h3>
                    <div className="flex justify-between">
                      <span className="bg-blue-500 text-white font-mono p-2">{movie.genre}</span>
                      <span className="bg-yellow-400 text-black font-mono p-2 font-bold">{movie.duration} MIN</span>
                    </div>
                    <Button
                      onClick={() => handleBookClick(movie.movie_id)}
                      className="w-full mt-4 bg-black text-white hover:bg-gray-800 font-mono border-4 border-black"
                    >
                      BOOK NOW
                    </Button>
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
