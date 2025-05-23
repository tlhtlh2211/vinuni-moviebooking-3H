"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Film, Plus, Edit, Trash2, LogOut, BarChart } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { UserRole } from "@/types/database"

export default function AdminDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

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

  // In a real app, you would fetch movies from an API or database
  const movies = [
    { id: 1, title: "Brutal Action", genre: "Action", time: "14:30", seats: 120, booked: 45 },
    { id: 2, title: "Raw Comedy", genre: "Comedy", time: "16:45", seats: 100, booked: 78 },
    { id: 3, title: "Concrete Drama", genre: "Drama", time: "19:00", seats: 120, booked: 32 },
    { id: 4, title: "Brutalist Horror", genre: "Horror", time: "21:15", seats: 80, booked: 65 },
  ]

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
            <div className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                <p className="font-mono text-lg">TOTAL MOVIES</p>
                <p className="font-mono font-bold text-4xl">4</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                <p className="font-mono text-lg">TOTAL BOOKINGS</p>
                <p className="font-mono font-bold text-4xl">220</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                <p className="font-mono text-lg">AVAILABLE SEATS</p>
                <p className="font-mono font-bold text-4xl">300</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-4 border-4 border-black">
                <p className="font-mono text-lg">OCCUPANCY</p>
                <p className="font-mono font-bold text-4xl">55%</p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-blue-500 p-6 border-8 border-black"
          >
            <h3 className="text-2xl font-mono font-bold mb-4 text-white">REVENUE CHART</h3>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white p-4 border-4 border-black h-48 flex items-center justify-center"
            >
              <BarChart className="h-32 w-32" />
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white border-8 border-black p-4"
        >
          <h3 className="text-2xl font-mono font-bold mb-4">MANAGE MOVIES</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border-4 border-black p-4 font-mono text-left">ID</th>
                  <th className="border-4 border-black p-4 font-mono text-left">TITLE</th>
                  <th className="border-4 border-black p-4 font-mono text-left">GENRE</th>
                  <th className="border-4 border-black p-4 font-mono text-left">TIME</th>
                  <th className="border-4 border-black p-4 font-mono text-left">SEATS</th>
                  <th className="border-4 border-black p-4 font-mono text-left">BOOKED</th>
                  <th className="border-4 border-black p-4 font-mono text-left">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie, index) => (
                  <motion.tr
                    key={movie.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    className="border-b-4 border-black hover:bg-gray-100"
                  >
                    <td className="border-4 border-black p-4 font-mono">{movie.id}</td>
                    <td className="border-4 border-black p-4 font-mono font-bold">{movie.title}</td>
                    <td className="border-4 border-black p-4 font-mono">{movie.genre}</td>
                    <td className="border-4 border-black p-4 font-mono">{movie.time}</td>
                    <td className="border-4 border-black p-4 font-mono">{movie.seats}</td>
                    <td className="border-4 border-black p-4 font-mono">{movie.booked}</td>
                    <td className="border-4 border-black p-4 font-mono">
                      <div className="flex gap-2">
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Button className="bg-blue-500 text-white hover:bg-blue-600 font-mono border-2 border-black p-2 h-auto">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <Button className="bg-red-500 text-white hover:bg-red-600 font-mono border-2 border-black p-2 h-auto">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
