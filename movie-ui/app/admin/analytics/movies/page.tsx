"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Film, LogOut, Trophy, TrendingUp, Users, DollarSign, ArrowUpDown } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { UserRole } from "@/types/database"

interface TopMovie {
  movie_id: number
  title: string
  genre: string
  director: string
  rating: string
  poster_url: string | null
  total_showtimes: number
  total_tickets_sold: number
  total_revenue: number
  avg_revenue_per_showtime: number
  avg_ticket_price: number
  avg_occupancy_rate_percent: number
  revenue_efficiency: number
  composite_performance_score: number
  revenue_rank_score: number
  occupancy_rank_score: number
  volume_rank_score: number
  rank_position: number
}

type SortOption = 'composite_score' | 'revenue' | 'occupancy' | 'volume'

export default function AdminMoviesAnalytics() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [movies, setMovies] = useState<TopMovie[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('composite_score')
  const [isLoadingMovies, setIsLoadingMovies] = useState(true)

  // Redirect if not logged in or not an admin
  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.role !== UserRole.ADMIN) {
      router.push("/movies")
    } else {
      setIsLoading(false)
    }
  }, [user, router])

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/v1/admin/analytics/top-movies/genres')
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'success') {
            setGenres(data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching genres:', error)
      }
    }

    if (user && user.role === UserRole.ADMIN) {
      fetchGenres()
    }
  }, [user])

  // Fetch top movies
  useEffect(() => {
    const fetchTopMovies = async () => {
      try {
        setIsLoadingMovies(true)
        const params = new URLSearchParams({
          limit: '10',
          sort_by: sortBy
        })
        if (selectedGenre) {
          params.append('genre', selectedGenre)
        }

        const response = await fetch(`/api/v1/admin/analytics/top-movies?${params}`)
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'success') {
            setMovies(data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching top movies:', error)
      } finally {
        setIsLoadingMovies(false)
      }
    }

    if (user && user.role === UserRole.ADMIN) {
      fetchTopMovies()
    }
  }, [user, sortBy, selectedGenre])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getRankIcon = (position: number) => {
    if (position === 1) return "🥇"
    if (position === 2) return "🥈"
    if (position === 3) return "🥉"
    return position.toString()
  }

  const sortOptions: { value: SortOption; label: string; icon: JSX.Element }[] = [
    { value: 'composite_score', label: 'OVERALL PERFORMANCE', icon: <Trophy className="h-4 w-4" /> },
    { value: 'revenue', label: 'REVENUE', icon: <DollarSign className="h-4 w-4" /> },
    { value: 'occupancy', label: 'OCCUPANCY RATE', icon: <Users className="h-4 w-4" /> },
    { value: 'volume', label: 'TICKETS SOLD', icon: <TrendingUp className="h-4 w-4" /> },
  ]

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="bg-black text-white p-8 border-8 border-red-500 font-mono text-xl">LOADING...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Brutalist Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-black text-white p-4 border-b-8 border-red-500"
      >
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Film className="h-8 w-8" />
            <h1 className="text-2xl font-mono font-bold tracking-tighter">BRUTAL CINEMA ADMIN</h1>
          </Link>
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-red-500 text-white p-2 border-4 border-white"
            >
              <span className="font-mono font-bold">ADMIN: {user.email.split("@")[0].toUpperCase()}</span>
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
        <motion.div
          initial={{ rotate: 0, x: -100, opacity: 0 }}
          animate={{ rotate: 1, x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="bg-yellow-400 p-6 border-8 border-black mb-8"
        >
          <h2 className="text-4xl font-mono font-bold">TOP PERFORMING MOVIES</h2>
          <p className="font-mono mt-2">LEADERBOARD BASED ON 90-DAY PERFORMANCE</p>
        </motion.div>

        {/* Sort Options */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-gray-100 border-4 border-black p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="font-mono font-bold text-lg">SORT BY:</span>
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`font-mono border-4 flex items-center gap-2 ${
                    sortBy === option.value
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-gray-200'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>

            {/* Genre Filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-mono font-bold text-lg">FILTER BY GENRE:</span>
              <Button
                onClick={() => setSelectedGenre(null)}
                className={`font-mono border-2 ${
                  !selectedGenre
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black hover:bg-gray-200'
                }`}
              >
                ALL
              </Button>
              {genres.map((genre) => (
                <Button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`font-mono border-2 ${
                    selectedGenre === genre
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-gray-200'
                  }`}
                >
                  {genre.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Movies Leaderboard */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white border-8 border-black"
        >
          {isLoadingMovies ? (
            <div className="p-20 text-center">
              <p className="font-mono text-2xl">LOADING LEADERBOARD...</p>
            </div>
          ) : movies.length === 0 ? (
            <div className="p-20 text-center">
              <p className="font-mono text-2xl">NO MOVIES FOUND</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border-4 border-black p-4 font-mono text-left">RANK</th>
                    <th className="border-4 border-black p-4 font-mono text-left">MOVIE</th>
                    <th className="border-4 border-black p-4 font-mono text-left">GENRE</th>
                    <th className="border-4 border-black p-4 font-mono text-center">SHOWTIMES</th>
                    <th className="border-4 border-black p-4 font-mono text-center">TICKETS</th>
                    <th className="border-4 border-black p-4 font-mono text-right">REVENUE</th>
                    <th className="border-4 border-black p-4 font-mono text-center">OCCUPANCY</th>
                    <th className="border-4 border-black p-4 font-mono text-center">SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map((movie, index) => (
                    <motion.tr
                      key={movie.movie_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className={`border-b-4 border-black hover:bg-gray-50 ${
                        movie.rank_position <= 3 ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="border-4 border-black p-4 font-mono text-center">
                        <span className="text-2xl">{getRankIcon(movie.rank_position)}</span>
                      </td>
                      <td className="border-4 border-black p-4">
                        <div>
                          <p className="font-mono font-bold text-lg">{movie.title}</p>
                          <p className="font-mono text-sm text-gray-600">DIR: {movie.director}</p>
                          <p className="font-mono text-sm text-gray-600">RATING: {movie.rating}</p>
                        </div>
                      </td>
                      <td className="border-4 border-black p-4 font-mono">{movie.genre}</td>
                      <td className="border-4 border-black p-4 font-mono text-center">{movie.total_showtimes}</td>
                      <td className="border-4 border-black p-4 font-mono text-center">
                        <div>
                          <p className="font-bold">{movie.total_tickets_sold}</p>
                          <p className="text-sm text-gray-600">AVG ${movie.avg_ticket_price.toFixed(2)}</p>
                        </div>
                      </td>
                      <td className="border-4 border-black p-4 font-mono text-right">
                        <div>
                          <p className="font-bold text-lg">${movie.total_revenue.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">${movie.avg_revenue_per_showtime.toFixed(2)}/show</p>
                        </div>
                      </td>
                      <td className="border-4 border-black p-4 font-mono text-center">
                        <div className={`font-bold text-lg ${
                          movie.avg_occupancy_rate_percent >= 75 ? 'text-green-600' :
                          movie.avg_occupancy_rate_percent >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {movie.avg_occupancy_rate_percent.toFixed(1)}%
                        </div>
                      </td>
                      <td className="border-4 border-black p-4">
                        <div className="text-center">
                          <div className="font-mono font-bold text-xl mb-2">
                            {movie.composite_performance_score.toFixed(1)}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono">REV:</span>
                              <div className="bg-gray-200 h-2 flex-1 relative">
                                <div 
                                  className="bg-red-500 h-full"
                                  style={{ width: `${movie.revenue_rank_score}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono">OCC:</span>
                              <div className="bg-gray-200 h-2 flex-1 relative">
                                <div 
                                  className="bg-blue-500 h-full"
                                  style={{ width: `${movie.occupancy_rank_score}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono">VOL:</span>
                              <div className="bg-gray-200 h-2 flex-1 relative">
                                <div 
                                  className="bg-green-500 h-full"
                                  style={{ width: `${movie.volume_rank_score}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 bg-gray-100 border-4 border-black p-4"
        >
          <h3 className="font-mono font-bold text-lg mb-2">SCORING METHODOLOGY</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-sm">
            <div>
              <span className="font-bold">REVENUE SCORE (40%):</span> Based on total revenue compared to other movies
            </div>
            <div>
              <span className="font-bold">OCCUPANCY SCORE (30%):</span> Based on average seat occupancy rate
            </div>
            <div>
              <span className="font-bold">VOLUME SCORE (30%):</span> Based on total tickets sold
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}