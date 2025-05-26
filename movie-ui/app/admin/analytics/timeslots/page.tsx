"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Film, LogOut, Calendar, Trash2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { motion } from "framer-motion"
import { UserRole } from "@/types/database"
import { ScheduleGrid } from "@/components/admin/ScheduleGrid"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Cinema {
  cinema_id: number
  name: string
  city: string
  screens: Array<{
    screen_id: number
    name: string
    format: string
  }>
}

interface ShowtimeDetails {
  showtime_id: number
  movie_title: string
  screen_name: string
  start_time: string
  end_time: string
  cinema_name: string
}

export default function AdminTimeslotsAnalytics() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedShowtime, setSelectedShowtime] = useState<ShowtimeDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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

  // Fetch cinemas
  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const response = await fetch('/api/v1/admin/movies/cinemas-screens')
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'success') {
            setCinemas(data.data)
            // Select first cinema by default
            if (data.data.length > 0 && !selectedCinemaId) {
              setSelectedCinemaId(data.data[0].cinema_id)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching cinemas:', error)
      }
    }

    if (user && user.role === UserRole.ADMIN) {
      fetchCinemas()
    }
  }, [user])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleTimeSlotClick = async (_screenId: number, timeslot: any) => {
    if (!timeslot?.showtime_id) {
      console.error('No showtime_id found in timeslot data!')
      alert('Error: Unable to fetch showtime details. Missing showtime ID.')
      return
    }
    
    // Fetch additional showtime details
    try {
      const response = await fetch(`/api/v1/admin/showtimes/${timeslot.showtime_id}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.status === 'success') {
          setSelectedShowtime({
            showtime_id: data.data.showtime_id,
            movie_title: data.data.movie_title,
            screen_name: data.data.screen_name,
            start_time: timeslot.start_time,
            end_time: timeslot.end_time,
            cinema_name: data.data.cinema_name
          })
          setDeleteModalOpen(true)
        } else {
          alert(`Error: ${data.message || 'Failed to fetch showtime details'}`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(`Error: ${errorData.message || 'Failed to fetch showtime details'}`)
      }
    } catch (error) {
      console.error('Error fetching showtime details:', error)
      alert('Error: Failed to connect to server.')
    }
  }

  const handleDeleteShowtime = async () => {
    if (!selectedShowtime) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/v1/admin/showtimes/${selectedShowtime.showtime_id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Close modal and refresh schedule
        setDeleteModalOpen(false)
        setSelectedShowtime(null)
        // Trigger a refresh of the schedule grid
        setRefreshKey(prev => prev + 1) 
      } else {
        const data = await response.json()
        alert(data.message || 'Failed to delete showtime')
      }
    } catch (error) {
      console.error('Error deleting showtime:', error)
      alert('Failed to delete showtime')
    } finally {
      setIsDeleting(false)
    }
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
          className="bg-purple-500 p-6 border-8 border-black mb-8"
        >
          <h2 className="text-4xl font-mono font-bold text-white">TIMESLOT MANAGEMENT</h2>
          <p className="font-mono mt-2 text-white">VIEW AND DELETE SHOWTIMES ACROSS ALL SCREENS</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-100 border-4 border-black p-4 mb-6"
        >
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="font-mono font-bold text-sm block mb-2">CINEMA</label>
              <select
                value={selectedCinemaId || ''}
                onChange={(e) => setSelectedCinemaId(Number(e.target.value))}
                className="w-full p-2 font-mono border-4 border-black bg-white"
              >
                {cinemas.map((cinema) => (
                  <option key={cinema.cinema_id} value={cinema.cinema_id}>
                    {cinema.name.toUpperCase()} - {cinema.city.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="font-mono font-bold text-sm block mb-2">DATE</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 font-mono border-4 border-black bg-white"
              />
            </div>
          </div>
        </motion.div>

        {/* Schedule Grid */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white border-8 border-black p-6"
        >
          {selectedCinemaId && (
            <ScheduleGrid
              key={`${selectedCinemaId}-${selectedDate}-${refreshKey}`}
              cinemaId={selectedCinemaId}
              date={selectedDate}
              onTimeSlotClick={handleTimeSlotClick}
            />
          )}
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 bg-yellow-400 border-4 border-black p-4"
        >
          <h3 className="font-mono font-bold text-lg mb-2">INSTRUCTIONS</h3>
          <ul className="font-mono text-sm list-disc list-inside space-y-1">
            <li>CLICK ON ANY SHOWTIME TO VIEW DETAILS AND DELETE</li>
            <li>YELLOW ZONES INDICATE 15-MINUTE BUFFER PERIODS</li>
            <li>DELETED SHOWTIMES CANNOT BE RECOVERED</li>
            <li>CUSTOMERS WITH EXISTING BOOKINGS WILL BE AFFECTED</li>
          </ul>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="border-8 border-black bg-white font-mono">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              DELETE SHOWTIME?
            </DialogTitle>
          </DialogHeader>
          
          {selectedShowtime && (
            <div className="space-y-4">
              <div className="bg-red-100 border-4 border-red-500 p-4">
                <p className="font-bold mb-2">WARNING: THIS ACTION CANNOT BE UNDONE!</p>
                <p className="text-sm">All existing reservations for this showtime will be cancelled.</p>
              </div>
              
              <div className="bg-gray-100 border-4 border-black p-4 space-y-2">
                <p><span className="font-bold">MOVIE:</span> {selectedShowtime.movie_title}</p>
                <p><span className="font-bold">CINEMA:</span> {selectedShowtime.cinema_name}</p>
                <p><span className="font-bold">SCREEN:</span> {selectedShowtime.screen_name}</p>
                <p><span className="font-bold">TIME:</span> {selectedShowtime.start_time} - {selectedShowtime.end_time}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              onClick={() => setDeleteModalOpen(false)}
              className="font-mono border-4 border-black bg-white text-black hover:bg-gray-100"
              disabled={isDeleting}
            >
              CANCEL
            </Button>
            <Button
              onClick={handleDeleteShowtime}
              className="font-mono border-4 border-black bg-red-500 text-white hover:bg-red-600"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'DELETING...' : 'DELETE SHOWTIME'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}