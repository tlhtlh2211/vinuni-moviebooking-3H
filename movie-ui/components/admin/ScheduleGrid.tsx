"use client"

import { useState, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'

interface Timeslot {
  showtime_id: number
  movie_title: string
  start_time: string
  end_time: string
  buffer_start: string
  buffer_end: string
  duration_minutes: number
  start_hour: number
  start_minute: number
}

interface ScreenSchedule {
  screen_id: number
  screen_format: '2D' | '3D' | 'IMAX'
  timeslots: Timeslot[]
}

interface ScheduleData {
  [screenName: string]: ScreenSchedule
}

interface ScheduleGridProps {
  cinemaId: number
  date: string
  onTimeSlotClick?: (screenId: number, timeslot: Timeslot) => void
}

export function ScheduleGrid({ cinemaId, date, onTimeSlotClick }: ScheduleGridProps) {
  const [schedule, setSchedule] = useState<ScheduleData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Operating hours: 24-hour display (0:01 AM to 23:59 PM)
  const START_HOUR = 0
  const END_HOUR = 24
  const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

  useEffect(() => {
    fetchSchedule()
  }, [cinemaId, date])

  const fetchSchedule = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/v1/admin/movies/schedule/${cinemaId}/${date}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        setSchedule(data.data.schedule)
      } else {
        setError(data.message || 'Failed to fetch schedule')
      }
    } catch (err) {
      setError('Failed to fetch schedule')
    } finally {
      setLoading(false)
    }
  }

  const getTimePosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return ((hours - START_HOUR) * 60 + minutes) / (60 * (END_HOUR - START_HOUR)) * 100
  }

  const getDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    const duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes)
    return duration / (60 * (END_HOUR - START_HOUR)) * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading schedule...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <Calendar className="h-4 w-4" />
        <span>24-Hour Schedule for {date}</span>
      </div>

      {/* Time header */}
      <div className="relative mb-2">
        <div className="flex h-8 items-end">
          {HOURS.map(hour => (
            <div
              key={hour}
              className={`flex-1 border-l border-gray-300 px-0.5 text-xs text-gray-500 text-center ${
                hour % 3 === 0 ? 'font-semibold' : 'font-normal opacity-75'
              }`}
            >
              {hour % 3 === 0 ? hour.toString().padStart(2, '0') + ':00' : ''}
            </div>
          ))}
          <div className="flex-1 border-l border-gray-300"></div>
        </div>
      </div>

      {/* Screen rows */}
      <div className="space-y-2">
        {Object.entries(schedule).map(([screenName, screenData]) => (
          <div key={screenName} className="relative">
            {/* Screen label */}
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">{screenName}</span>
              <span className="text-xs text-gray-500">{screenData.screen_format}</span>
            </div>

            {/* Timeline */}
            <div className="relative h-20 rounded border border-gray-300 bg-gray-50">
              {/* Hour grid lines */}
              {HOURS.map((hour, index) => (
                <div
                  key={hour}
                  className={`absolute top-0 h-full border-l ${
                    hour % 3 === 0 ? 'border-gray-300' : 'border-gray-200'
                  }`}
                  style={{ left: `${(index / HOURS.length) * 100}%` }}
                />
              ))}

              {/* Timeslots */}
              {screenData.timeslots.map((slot, index) => {
                const left = getTimePosition(slot.start_time)
                const width = getDuration(slot.start_time, slot.end_time)
                const bufferLeft = getTimePosition(slot.buffer_start)
                const bufferWidth = getDuration(slot.buffer_start, slot.buffer_end)

                return (
                  <div key={index}>
                    {/* Buffer zone */}
                    <div
                      className="absolute top-1/2 h-12 -translate-y-1/2 rounded bg-yellow-100 opacity-50"
                      style={{
                        left: `${bufferLeft}%`,
                        width: `${bufferWidth}%`,
                      }}
                      title={`Buffer: ${slot.buffer_start} - ${slot.buffer_end}`}
                    />
                    
                    {/* Movie slot */}
                    <div
                      className="absolute top-1/2 h-12 -translate-y-1/2 cursor-pointer rounded bg-blue-500 px-1 text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow-md z-10 active:bg-blue-700"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (onTimeSlotClick) {
                          onTimeSlotClick(screenData.screen_id, slot)
                        }
                      }}
                      title={`${slot.movie_title}\n${slot.start_time} - ${slot.end_time}`}
                    >
                      <div className="flex h-full items-center">
                        <span className="truncate text-xs font-medium">
                          {slot.movie_title}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Empty state */}
              {screenData.timeslots.length === 0 && (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  No showtimes scheduled
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-blue-500"></div>
          <span>Movie</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-yellow-100"></div>
          <span>Buffer (15 min)</span>
        </div>
      </div>
    </div>
  )
}