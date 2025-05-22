import axios from 'axios';

/**
 * Lock a seat for a specific user and showtime
 */
export async function lockSeat(showtimeId: number, seatId: number, userId: number): Promise<boolean> {
  try {
    const response = await axios.post(`/api/v1/showtimes/${showtimeId}/seats/${seatId}/lock`, {
      user_id: userId
    });
    
    console.log(`Seat ${seatId} locked successfully until ${response.data.expires_at}`);
    return true;
  } catch (error) {
    console.error(`Failed to lock seat ${seatId}:`, error);
    return false;
  }
}

/**
 * Unlock a seat for a specific user and showtime
 */
export async function unlockSeat(showtimeId: number, seatId: number, userId: number): Promise<boolean> {
  try {
    const response = await axios.post(`/api/v1/showtimes/${showtimeId}/seats/${seatId}/unlock`, {
      user_id: userId
    });
    
    console.log(`Seat ${seatId} unlocked successfully`);
    return true;
  } catch (error) {
    console.error(`Failed to unlock seat ${seatId}:`, error);
    return false;
  }
}

/**
 * Lock multiple seats for a user and showtime
 */
export async function lockSeats(showtimeId: number, seatIds: number[], userId: number): Promise<number[]> {
  const successfulLocks: number[] = [];
  
  for (const seatId of seatIds) {
    const locked = await lockSeat(showtimeId, seatId, userId);
    if (locked) {
      successfulLocks.push(seatId);
    }
  }
  
  return successfulLocks;
}

/**
 * Unlock multiple seats for a user and showtime
 */
export async function unlockSeats(showtimeId: number, seatIds: number[], userId: number): Promise<boolean> {
  let allUnlocked = true;
  
  for (const seatId of seatIds) {
    const unlocked = await unlockSeat(showtimeId, seatId, userId);
    if (!unlocked) {
      allUnlocked = false;
    }
  }
  
  return allUnlocked;
}

/**
 * Create a reservation after locking seats
 */
export async function createReservation(
  showtimeId: number,
  seatIds: number[],
  userId: number
): Promise<any> {
  try {
    // First, ensure all seats are locked
    const lockedSeats = await lockSeats(showtimeId, seatIds, userId);
    
    if (lockedSeats.length !== seatIds.length) {
      const failedSeats = seatIds.filter(id => !lockedSeats.includes(id));
      throw new Error(`Failed to lock seats: ${failedSeats.join(', ')}`);
    }
    
    // Then create the reservation
    const response = await axios.post('/api/v1/reservations', {
      showtime_id: showtimeId,
      user_id: userId,
      seats: seatIds
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
} 