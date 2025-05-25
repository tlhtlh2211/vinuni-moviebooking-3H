"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Film, Plus, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { UserRole } from "@/types/database"

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
  const [revenueData, setRevenueData] = useState<RevenueSummary | null>(null)
  const [revenueLoading, setRevenueLoading] = useState(false)
  const [revenueError, setRevenueError] = useState<string | null>(null)

  // Redirect if not logged in or not an admin
  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.role !== UserRole.ADMIN) {
      router.push("/movies")
    } else {
      setIsLoading(false)
      // Fetch revenue data when user is confirmed as admin
      fetchRevenueData()
    }
  }, [user, router])

  const fetchRevenueData = async () => {
    if (!user) return
    
    setRevenueLoading(true)
    setRevenueError(null)
    
    try {
      const response = await fetch(`/api/v1/admin/analytics/revenue-summary?user_id=${user.user_id}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch revenue data')
      }
      
      if (data.status === 'success') {
        setRevenueData(data.data)
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      setRevenueError(error instanceof Error ? error.message : 'Failed to load revenue data')
    } finally {
      setRevenueLoading(false)
    }
  }



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
            whileHover={{ scale: 1.05 }}
          >
            <Button className="bg-green-500 text-white hover:bg-green-600 font-mono text-xl p-6 border-4 border-black flex items-center gap-2">
              <Plus className="h-6 w-6" />
              ADD NEW MOVIE
            </Button>
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
            {revenueLoading ? (
              <div className="bg-white p-8 border-4 border-black text-center">
                <p className="font-mono text-xl">LOADING REVENUE DATA...</p>
              </div>
            ) : revenueError ? (
              <div className="bg-red-500 p-4 border-4 border-black text-white">
                <p className="font-mono">ERROR: {revenueError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                  <p className="font-mono text-lg">TODAY'S REVENUE</p>
                  <p className="font-mono font-bold text-4xl">${revenueData ? Number(revenueData.revenue_today).toFixed(2) : '0.00'}</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                  <p className="font-mono text-lg">WEEK REVENUE</p>
                  <p className="font-mono font-bold text-4xl">${revenueData ? Number(revenueData.revenue_this_week).toFixed(2) : '0.00'}</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                  <p className="font-mono text-lg">TOTAL TICKETS</p>
                  <p className="font-mono font-bold text-4xl">{revenueData?.tickets_total || 0}</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                  <p className="font-mono text-lg">AVG PRICE</p>
                  <p className="font-mono font-bold text-4xl">${revenueData ? Number(revenueData.avg_price_this_month).toFixed(2) : '0.00'}</p>
                </motion.div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-blue-500 p-6 border-8 border-black"
          >
            <h3 className="text-2xl font-mono font-bold mb-4 text-white">REVENUE BY FORMAT</h3>
            {revenueLoading ? (
              <div className="bg-white p-8 border-4 border-black text-center h-48 flex items-center justify-center">
                <p className="font-mono text-xl">LOADING...</p>
              </div>
            ) : (
              <div className="bg-white p-4 border-4 border-black">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-100 border-2 border-black">
                    <span className="font-mono font-bold">2D REVENUE:</span>
                    <span className="font-mono font-bold text-xl">${revenueData ? Number(revenueData.revenue_2d).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-100 border-2 border-black">
                    <span className="font-mono font-bold">3D REVENUE:</span>
                    <span className="font-mono font-bold text-xl">${revenueData ? Number(revenueData.revenue_3d).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-100 border-2 border-black">
                    <span className="font-mono font-bold">IMAX REVENUE:</span>
                    <span className="font-mono font-bold text-xl">${revenueData ? Number(revenueData.revenue_imax).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="border-t-4 border-black pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-lg">TOTAL:</span>
                      <span className="font-mono font-bold text-2xl">${revenueData ? Number(revenueData.revenue_total).toFixed(2) : '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>


      </div>
    </div>
  )
}
