"use client"

import { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScheduleGrid } from './ScheduleGrid'

interface Cinema {
  cinema_id: number
  name: string
  city: string
  screens: Screen[]
}

interface Screen {
  screen_id: number
  name: string
  format: '2D' | '3D' | 'IMAX'
}

interface ShowtimeEntry {
  date: string
  times: string[]
}

interface ShowtimeConflict {
  screen_id: number
  requested_time: string
  conflicting_movie: string
  conflict_start: string
  conflict_end: string
}

interface AddMovieModalProps {
  onSuccess?: () => void
}

export function AddMovieModal({ onSuccess }: AddMovieModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [conflicts, setConflicts] = useState<ShowtimeConflict[]>([])
  
  // Step 1: Movie data
  const [movieData, setMovieData] = useState({
    title: '',
    duration: '',
    rating: 'PG-13' as 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17',
    release_date: new Date().toISOString().split('T')[0],
    status: 'open' as 'open' | 'closed',
    description: '',
    director: '',
    cast: '',
    genre: '',
    poster_url: '',
  })
  
  // Step 2: Showtime data
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [selectedCinema, setSelectedCinema] = useState<string>('')
  const [selectedScreens, setSelectedScreens] = useState<number[]>([])
  const [showtimeEntries, setShowtimeEntries] = useState<ShowtimeEntry[]>([
    { date: '', times: [''] }
  ])
  
  // Fetch cinemas and screens when modal opens
  useEffect(() => {
    if (open) {
      fetchCinemasAndScreens()
    }
  }, [open])
  
  const fetchCinemasAndScreens = async () => {
    try {
      const response = await fetch('/api/v1/admin/movies/cinemas-screens')
      const data = await response.json()
      if (data.status === 'success') {
        setCinemas(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch cinemas:', error)
    }
  }
  
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!movieData.title) newErrors.title = 'Title is required'
    if (!movieData.duration || parseInt(movieData.duration) < 1) {
      newErrors.duration = 'Valid duration is required'
    }
    if (!movieData.release_date) newErrors.release_date = 'Release date is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = async () => {
    if (!validateStep1()) return
    
    // Check for conflicts if there are showtimes to validate
    if (selectedScreens.length > 0 && showtimeEntries.some(e => e.date && e.times.length > 0)) {
      await checkConflicts()
    }
    
    setStep(2)
  }
  
  const checkConflicts = async () => {
    const showtimes = []
    
    for (const screen_id of selectedScreens) {
      for (const entry of showtimeEntries) {
        if (entry.date) {
          for (const time of entry.times) {
            if (time) {
              showtimes.push({
                screen_id,
                start_time: `${entry.date}T${time}:00`
              })
            }
          }
        }
      }
    }
    
    if (showtimes.length === 0) return
    
    try {
      const response = await fetch('/api/v1/admin/movies/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: parseInt(movieData.duration),
          showtimes
        })
      })
      
      const data = await response.json()
      if (data.has_conflicts) {
        setConflicts(data.conflicts)
      } else {
        setConflicts([])
      }
    } catch (error) {
      console.error('Failed to check conflicts:', error)
    }
  }
  
  const handleSubmit = async (skipShowtimes = false) => {
    setIsSubmitting(true)
    setErrors({})
    
    const payload: any = {
      movie: {
        ...movieData,
        duration: parseInt(movieData.duration)
      }
    }
    
    // Add showtimes if not skipping
    if (!skipShowtimes && selectedScreens.length > 0) {
      const showtimes = []
      
      for (const screen_id of selectedScreens) {
        for (const entry of showtimeEntries) {
          if (entry.date) {
            for (const time of entry.times) {
              if (time) {
                showtimes.push({
                  screen_id,
                  start_time: `${entry.date}T${time}:00`
                })
              }
            }
          }
        }
      }
      
      if (showtimes.length > 0) {
        payload.showtimes = showtimes
      }
    }
    
    try {
      const response = await fetch('/api/v1/admin/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        handleClose()
        onSuccess?.()
      } else {
        // Check if it's a schedule conflict error
        if (data.type === 'schedule_conflict') {
          setErrors({ submit: data.message })
          // Re-check conflicts to show updated UI
          await checkConflicts()
        } else {
          setErrors({ submit: data.message || 'Failed to create movie' })
        }
      }
    } catch (error) {
      setErrors({ submit: 'Failed to create movie' })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleClose = () => {
    setOpen(false)
    setStep(1)
    setErrors({})
    setConflicts([])
    setMovieData({
      title: '',
      duration: '',
      rating: 'PG-13',
      release_date: new Date().toISOString().split('T')[0],
      status: 'open',
      description: '',
      director: '',
      cast: '',
      genre: '',
      poster_url: '',
    })
    setSelectedCinema('')
    setSelectedScreens([])
    setShowtimeEntries([{ date: '', times: [''] }])
  }
  
  const addTimeSlot = (entryIndex: number) => {
    const newEntries = [...showtimeEntries]
    newEntries[entryIndex].times.push('')
    setShowtimeEntries(newEntries)
  }
  
  const removeTimeSlot = (entryIndex: number, timeIndex: number) => {
    const newEntries = [...showtimeEntries]
    newEntries[entryIndex].times.splice(timeIndex, 1)
    setShowtimeEntries(newEntries)
  }
  
  const addDateEntry = () => {
    setShowtimeEntries([...showtimeEntries, { date: '', times: [''] }])
  }
  
  const removeDateEntry = (index: number) => {
    const newEntries = [...showtimeEntries]
    newEntries.splice(index, 1)
    setShowtimeEntries(newEntries)
  }
  
  const updateTime = (entryIndex: number, timeIndex: number, value: string) => {
    const newEntries = [...showtimeEntries]
    newEntries[entryIndex].times[timeIndex] = value
    setShowtimeEntries(newEntries)
  }
  
  const currentCinema = cinemas.find(c => c.cinema_id.toString() === selectedCinema)
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add New Movie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Add New Movie' : `Schedule Showtimes for "${movieData.title}"`}
          </DialogTitle>
          <DialogDescription>
            Step {step} of 2 {step === 2 && '(Optional)'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${step * 50}%` }}
          />
        </div>
        
        {step === 1 ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={movieData.title}
                  onChange={(e) => setMovieData({ ...movieData, title: e.target.value })}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={movieData.duration}
                  onChange={(e) => setMovieData({ ...movieData, duration: e.target.value })}
                  className={errors.duration ? 'border-red-500' : ''}
                />
                {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating *</Label>
                <Select
                  value={movieData.rating}
                  onValueChange={(value: any) => setMovieData({ ...movieData, rating: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G">G</SelectItem>
                    <SelectItem value="PG">PG</SelectItem>
                    <SelectItem value="PG-13">PG-13</SelectItem>
                    <SelectItem value="R">R</SelectItem>
                    <SelectItem value="NC-17">NC-17</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="release_date">Release Date *</Label>
                <Input
                  id="release_date"
                  type="date"
                  value={movieData.release_date}
                  onChange={(e) => setMovieData({ ...movieData, release_date: e.target.value })}
                  className={errors.release_date ? 'border-red-500' : ''}
                />
                {errors.release_date && <p className="text-sm text-red-500">{errors.release_date}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  value={movieData.genre}
                  onChange={(e) => setMovieData({ ...movieData, genre: e.target.value })}
                  placeholder="e.g., Action, Drama, Comedy"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="director">Director</Label>
                <Input
                  id="director"
                  value={movieData.director}
                  onChange={(e) => setMovieData({ ...movieData, director: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cast">Cast</Label>
              <Textarea
                id="cast"
                value={movieData.cast}
                onChange={(e) => setMovieData({ ...movieData, cast: e.target.value })}
                placeholder="Main cast members"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={movieData.description}
                onChange={(e) => setMovieData({ ...movieData, description: e.target.value })}
                placeholder="Movie synopsis"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="poster_url">Poster URL</Label>
              <Input
                id="poster_url"
                type="url"
                value={movieData.poster_url}
                onChange={(e) => setMovieData({ ...movieData, poster_url: e.target.value })}
                placeholder="https://example.com/poster.jpg"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={movieData.status === 'open'}
                onCheckedChange={(checked) => 
                  setMovieData({ ...movieData, status: checked ? 'open' : 'closed' })
                }
              />
              <Label htmlFor="status">Movie is open for booking</Label>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Cinema</Label>
              <Select value={selectedCinema} onValueChange={setSelectedCinema}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a cinema" />
                </SelectTrigger>
                <SelectContent>
                  {cinemas.map((cinema) => (
                    <SelectItem key={cinema.cinema_id} value={cinema.cinema_id.toString()}>
                      {cinema.name} - {cinema.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {currentCinema && (
              <div className="space-y-2">
                <Label>Select Screens</Label>
                <div className="space-y-2">
                  {currentCinema.screens.map((screen) => (
                    <div key={screen.screen_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`screen-${screen.screen_id}`}
                        checked={selectedScreens.includes(screen.screen_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedScreens([...selectedScreens, screen.screen_id])
                          } else {
                            setSelectedScreens(selectedScreens.filter(id => id !== screen.screen_id))
                          }
                        }}
                      />
                      <Label htmlFor={`screen-${screen.screen_id}`} className="cursor-pointer">
                        {screen.name} ({screen.format})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedScreens.length > 0 && (
              <div className="space-y-4">
                <Label>Schedule Showtimes</Label>
                
                {/* Show visual schedule for the first selected date */}
                {selectedCinema && showtimeEntries[0]?.date && (
                  <div className="mb-4">
                    <ScheduleGrid 
                      cinemaId={parseInt(selectedCinema)} 
                      date={showtimeEntries[0].date}
                    />
                  </div>
                )}
                
                {showtimeEntries.map((entry, entryIndex) => (
                  <div key={entryIndex} className="border p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <Input
                        type="date"
                        value={entry.date}
                        onChange={(e) => {
                          const newEntries = [...showtimeEntries]
                          newEntries[entryIndex].date = e.target.value
                          setShowtimeEntries(newEntries)
                        }}
                        className="flex-1"
                      />
                      {showtimeEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDateEntry(entryIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Time Slots</Label>
                      {entry.times.map((time, timeIndex) => (
                        <div key={timeIndex} className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => updateTime(entryIndex, timeIndex, e.target.value)}
                            className="flex-1"
                          />
                          {entry.times.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTimeSlot(entryIndex, timeIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(entryIndex)}
                      >
                        Add Time Slot
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDateEntry}
                >
                  Add Another Date
                </Button>
              </div>
            )}
            
            {conflicts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-semibold">Scheduling Conflicts Detected</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {conflicts.map((conflict, index) => (
                    <li key={index}>
                      {new Date(conflict.requested_time).toLocaleString()} conflicts with "{conflict.conflicting_movie}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}
        
        <DialogFooter>
          {step === 1 ? (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="button" onClick={() => handleSubmit(true)} disabled={isSubmitting}>
                Save & Close
              </Button>
              <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                Next
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleSubmit(true)} disabled={isSubmitting}>
                Skip
              </Button>
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                Back
              </Button>
              <Button 
                type="button" 
                onClick={() => handleSubmit(false)} 
                disabled={isSubmitting || conflicts.length > 0}
              >
                {isSubmitting ? 'Creating...' : 'Add Movie & Showtimes'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}