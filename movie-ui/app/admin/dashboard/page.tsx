"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Film, LogOut, Trophy, Calendar } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { UserRole } from "@/types/database"
import { AddMovieModal } from "@/components/admin/AddMovieModal"

interface RevenueSummary {
  revenue_today: number
  revenue_this_week: number
  revenue_this_month: number
  revenue_total: number
  tickets_today: number
  tickets_this_week: number
  tickets_this_month: number
  tickets_total: number
  avg_price_today: number
  avg_price_this_week: number
  avg_price_this_month: number
  revenue_standard_seats: number
  revenue_premium_seats: number
  revenue_2d: number
  revenue_3d: number
  revenue_imax: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null)
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true)

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

  // Fetch revenue summary data
  useEffect(() => {
    const fetchRevenueSummary = async () => {
      try {
        setIsLoadingRevenue(true)
        const response = await fetch('/api/v1/admin/analytics/revenue-summary')
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'success') {
            setRevenueSummary(data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching revenue summary:', error)
      } finally {
        setIsLoadingRevenue(false)
      }
    }

    if (user && user.role === UserRole.ADMIN) {
      fetchRevenueSummary()
    }
  }, [user])


  const handleLogout = () => {
    logout()
    router.push("/")
  }

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
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-8 w-8" />
            <h1 className="text-2xl font-mono font-bold tracking-tighter">BRUTAL CINEMA</h1>
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
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ rotate: 0, x: -100, opacity: 0 }}
            animate={{ rotate: 1, x: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="bg-red-500 p-6 border-8 border-black"
          >
            <h2 className="text-4xl font-mono font-bold text-white">ADMIN DASHBOARD</h2>
          </motion.div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AddMovieModal onSuccess={() => {
              // Optionally refresh data or show success message
              console.log("Movie added successfully!")
            }} />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-yellow-400 p-6 border-8 border-black"
          >
            <h3 className="text-2xl font-mono font-bold mb-4">QUICK STATS</h3>
            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                <p className="font-mono text-lg">REVENUE TODAY</p>
                <p className="font-mono font-bold text-4xl">
                  {isLoadingRevenue ? "..." : `$${Number(revenueSummary?.revenue_today || 0).toFixed(2)}`}
                </p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                <p className="font-mono text-lg">TOTAL REVENUE</p>
                <p className="font-mono font-bold text-4xl">
                  {isLoadingRevenue ? "..." : `$${Number(revenueSummary?.revenue_total || 0).toFixed(2)}`}
                </p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                <p className="font-mono text-lg">TICKETS TODAY</p>
                <p className="font-mono font-bold text-4xl">
                  {isLoadingRevenue ? "..." : revenueSummary?.tickets_today || 0}
                </p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                <p className="font-mono text-lg">TOTAL TICKETS</p>
                <p className="font-mono font-bold text-4xl">
                  {isLoadingRevenue ? "..." : revenueSummary?.tickets_total || 0}
                </p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-blue-500 p-6 border-8 border-black"
          >
            <h3 className="text-2xl font-mono font-bold mb-4 text-white">REVENUE BREAKDOWN</h3>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white p-4 border-4 border-black"
            >
              {isLoadingRevenue ? (
                <div className="h-48 flex items-center justify-center">
                  <p className="font-mono text-xl">LOADING...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold">2D REVENUE:</span>
                    <span className="font-mono text-xl">${Number(revenueSummary?.revenue_2d || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold">3D REVENUE:</span>
                    <span className="font-mono text-xl">${Number(revenueSummary?.revenue_3d || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold">IMAX REVENUE:</span>
                    <span className="font-mono text-xl">${Number(revenueSummary?.revenue_imax || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t-4 border-black pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold">STANDARD SEATS:</span>
                      <span className="font-mono">${Number(revenueSummary?.revenue_standard_seats || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold">PREMIUM SEATS:</span>
                      <span className="font-mono">${Number(revenueSummary?.revenue_premium_seats || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Analytics Links */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-purple-500 p-6 border-8 border-black mb-8"
        >
          <h3 className="text-2xl font-mono font-bold mb-4 text-white">ANALYTICS & REPORTS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/analytics/movies">
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                className="bg-white p-4 border-4 border-black cursor-pointer hover:bg-gray-100"
              >
                <Trophy className="h-8 w-8 mb-2" />
                <p className="font-mono font-bold text-lg">TOP PERFORMING MOVIES</p>
                <p className="font-mono text-sm">View movie leaderboard and performance metrics</p>
              </motion.div>
            </Link>
            <Link href="/admin/analytics/timeslots">
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                className="bg-white p-4 border-4 border-black cursor-pointer hover:bg-gray-100"
              >
                <Calendar className="h-8 w-8 mb-2" />
                <p className="font-mono font-bold text-lg">TIMESLOT MANAGEMENT</p>
                <p className="font-mono text-sm">View and delete showtimes across all screens</p>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
