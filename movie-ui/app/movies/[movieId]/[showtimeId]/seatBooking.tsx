'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { lockSeat, createReservation } from '../../utils/seatHelpers';

interface Seat {
  seat_id: number;
  seat_label: string;
  status: 'available' | 'sold' | 'locked';
}

interface SeatBookingProps {
  showtime: {
    id: number;
    movie_id: number;
    title?: string;
  };
  userId: number;
}

export default function SeatBooking({ showtime, userId }: SeatBookingProps) {
  const router = useRouter();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [seatLoading, setSeatLoading] = useState<{[key: number]: boolean}>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await fetch(`/api/v1/showtimes/${showtime.id}/seats`);
        const data = await response.json();
        if (data.data) {
          setSeats(data.data);
        }
      } catch (err) {
        setError('Failed to load seats');
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [showtime.id]);

  const handleSeatClick = async (seatId: number) => {
    if (selectedSeats.includes(seatId)) {
      // If seat is already selected, just remove from selection
      // Note: We don't unlock seats as they'll expire automatically
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
      return;
    }

    // Start loading state for this seat
    setSeatLoading(prev => ({ ...prev, [seatId]: true }));
    
    try {
      // Try to lock the seat immediately
      const locked = await lockSeat(showtime.id, seatId, userId);
      
      if (locked) {
        // If successfully locked, add to selected seats
        setSelectedSeats([...selectedSeats, seatId]);
        
        // Update the seat status in the UI to show it's locked
        setSeats(prevSeats => 
          prevSeats.map((seat) => 
            seat.seat_id === seatId ? { ...seat, status: 'locked' } : seat
          )
        );
      } else {
        setError(`Failed to lock seat ${seatId}. Please try another seat.`);
      }
    } catch (err) {
      setError(`Failed to lock seat ${seatId}`);
    } finally {
      // Clear loading state for this seat
      setSeatLoading(prev => ({ ...prev, [seatId]: false }));
    }
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Seats are already locked, just create the reservation
      const response = await fetch('/api/v1/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtime_id: showtime.id,
          user_id: userId,
          seats: selectedSeats
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reservation');
      }
      
      const reservation = await response.json();
      
      // Navigate to confirmation page
      router.push(`/reservation-confirmation/${reservation.reservation_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to book seats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading seats...</div>;

  return (
    <div className="seat-booking-container">
      <h2>Select Seats</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="seat-map">
        {seats.map((seat) => (
          <button
            key={seat.seat_id}
            className={`seat ${seat.status} ${selectedSeats.includes(seat.seat_id) ? 'selected' : ''} ${seatLoading[seat.seat_id] ? 'loading' : ''}`}
            disabled={seat.status !== 'available' || seatLoading[seat.seat_id]}
            onClick={() => handleSeatClick(seat.seat_id)}
          >
            {seatLoading[seat.seat_id] ? '...' : seat.seat_label}
          </button>
        ))}
      </div>
      
      <div className="booking-summary">
        <p>Selected seats: {selectedSeats.length}</p>
        <button 
          onClick={handleBooking}
          disabled={selectedSeats.length === 0 || loading}
        >
          {loading ? 'Processing...' : 'Book Seats'}
        </button>
      </div>
      
      <style jsx>{`
        .seat-map {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 10px;
          margin: 20px 0;
        }
        
        .seat {
          padding: 10px;
          border: 1px solid #ccc;
          cursor: pointer;
        }
        
        .seat.available {
          background-color: #fff;
        }
        
        .seat.sold, .seat.locked {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .seat.selected {
          background-color: #4caf50;
          color: white;
        }
        
        .seat.loading {
          background-color: #f0f0f0;
          cursor: wait;
        }
        
        .error-message {
          color: red;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
} 