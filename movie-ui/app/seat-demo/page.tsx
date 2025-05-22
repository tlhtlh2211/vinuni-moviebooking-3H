'use client';

import { useState, useEffect } from 'react';
import { lockSeat } from '../utils/seatHelpers';

type Seat = {
  seat_id: number;
  seat_label: string;
  status: 'available' | 'locked' | 'sold';
  [key: string]: unknown;
};

export default function SeatDemo() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState(16); // Default user ID
  const [showtimeId, setShowtimeId] = useState(226); // Default showtime ID
  const [seatLoading, setSeatLoading] = useState<{[key: number]: boolean}>({});

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await fetch(`/api/v1/showtimes/${showtimeId}/seats`);
        const data = await response.json();
        if (data.data) {
          setSeats(data.data);
        } else {
          setError('No seat data found');
        }
      } catch (_error) {
        setError('Failed to load seats');
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [showtimeId]);

  const handleSeatClick = async (seatId: number) => {
    // Start loading state for this seat
    setSeatLoading(prev => ({ ...prev, [seatId]: true }));
    
    try {
      // Try to lock the seat immediately
      const locked = await lockSeat(showtimeId, seatId, userId);
      
      if (locked) {
        // If successfully locked, update the seat status in the UI
        setSeats(prevSeats => 
          prevSeats.map(seat => 
            seat.seat_id === seatId ? { ...seat, status: 'locked' } : seat
          )
        );
        alert(`Seat ${seatId} locked successfully!`);
      } else {
        setError(`Failed to lock seat ${seatId}. Please try another seat.`);
      }
    } catch (_error) {
      setError(`Failed to lock seat ${seatId}`);
    } finally {
      // Clear loading state for this seat
      setSeatLoading(prev => ({ ...prev, [seatId]: false }));
    }
  };

  if (loading) return <div>Loading seats...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Seat Locking Demo</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <label className="block mb-2">
          User ID:
          <input 
            type="number" 
            value={userId} 
            onChange={(e) => setUserId(parseInt(e.target.value))}
            className="ml-2 border p-1"
          />
        </label>
        
        <label className="block mb-2">
          Showtime ID:
          <input 
            type="number" 
            value={showtimeId} 
            onChange={(e) => setShowtimeId(parseInt(e.target.value))}
            className="ml-2 border p-1"
          />
        </label>
      </div>
      
      <div className="grid grid-cols-8 gap-4 mb-6">
        {seats.map(seat => (
          <button
            key={seat.seat_id}
            className={`
              p-4 border-2 flex flex-col items-center justify-center
              ${seat.status === 'available' ? 'bg-white hover:bg-gray-100' : ''}
              ${seat.status === 'locked' ? 'bg-yellow-200' : ''}
              ${seat.status === 'sold' ? 'bg-gray-300' : ''}
              ${seatLoading[seat.seat_id] ? 'animate-pulse bg-blue-100' : ''}
            `}
            disabled={seat.status !== 'available' || seatLoading[seat.seat_id]}
            onClick={() => handleSeatClick(seat.seat_id)}
          >
            <span className="font-bold">{seat.seat_label}</span>
            <span className="text-xs">{seat.seat_id}</span>
            <span className="text-xs mt-1">{seat.status}</span>
          </button>
        ))}
      </div>
      
      <div className="flex gap-2 mb-4">
        <div className="w-6 h-6 bg-white border"></div>
        <span>Available</span>
      </div>
      
      <div className="flex gap-2 mb-4">
        <div className="w-6 h-6 bg-yellow-200 border"></div>
        <span>Locked</span>
      </div>
      
      <div className="flex gap-2 mb-4">
        <div className="w-6 h-6 bg-gray-300 border"></div>
        <span>Sold</span>
      </div>
    </div>
  );
} 