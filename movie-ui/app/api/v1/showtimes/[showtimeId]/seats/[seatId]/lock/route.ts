import { NextResponse } from 'next/server';
import axios from 'axios';

// Function to log to the console and also return with data
function logAndReturn(message: string, data: any, status: number = 200) {
  console.log(`[API DEBUG] ${message}`, data);
  return NextResponse.json(data, { status });
}

// API Handler for POST /api/v1/showtimes/:showtimeId/seats/:seatId/lock
export async function POST(
  request: Request,
  context: { params: { showtimeId: string, seatId: string } }
) {
  // Await params before using them
  const { showtimeId, seatId } = await context.params;
  
  console.log(`[API Route] POST /api/v1/showtimes/${showtimeId}/seats/${seatId}/lock`);
  console.log('Route params:', context.params);
  
  try {
    const body = await request.json();
    const { user_id } = body;
    
    if (!user_id) {
      return logAndReturn(
        'Missing user ID',
        { error: 'User ID is required' },
        400
      );
    }
    
    console.log(`Locking seat ${seatId} for user ${user_id}`);
    
    const apiUrl = `http://127.0.0.1:5000/api/v1/showtimes/${showtimeId}/seats/${seatId}/lock`;
    console.log(`Fetching from Flask API: ${apiUrl}`);
    
    // Forward the request to the Flask backend
    const response = await axios.post(apiUrl, { user_id });
    
    if (response.status === 200) {
      const data = response.data;
      return logAndReturn('Successfully locked seat', data);
    } else {
      return logAndReturn(
        'Failed to lock seat',
        { error: 'Failed to lock seat', status: response.status },
        response.status
      );
    }
  } catch (error: any) {
    console.error('[API ERROR] Error locking seat:', error.message);
    if (error.response) {
      console.error('Server response:', error.response.data);
      return logAndReturn(
        'Error from backend',
        { error: error.response?.data?.error || 'Internal server error', details: error.message },
        error.response?.status || 500
      );
    }
    return logAndReturn(
      'Internal server error',
      { error: 'Internal server error', details: String(error) },
      500
    );
  }
}
