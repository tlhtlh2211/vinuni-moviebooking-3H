import { NextResponse } from 'next/server';

// Function to log to the console and also return with data
function logAndReturn(message: string, data: any, status: number = 200) {
  console.log(`[API DEBUG] ${message}`, data);
  const response = NextResponse.json(data, { status });
  // Add cache control headers to prevent stale data
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

// API Handler for GET /api/v1/showtimes/:showtimeId/seats
export async function GET(
  request: Request,
  context: { params: { showtimeId: string } }
) {
  // Await params before using them
  const { showtimeId } = await context.params;
  
  console.log(`[API Route] GET /api/v1/showtimes/${showtimeId}/seats`);
  console.log('Route params:', context.params);
  
  try {
    const apiUrl = `http://127.0.0.1:5000/api/v1/showtimes/${showtimeId}/seats`;
    console.log(`Fetching from Flask API: ${apiUrl}`);
    
    // Forward the request to the Flask backend
    const response = await fetch(apiUrl, {
      cache: 'no-store' // Prevent caching
    });
    
    if (!response.ok) {
      console.error(`Flask API error: ${response.status} ${response.statusText}`);
      return logAndReturn(
        'Failed to fetch seats',
        { error: 'Failed to fetch seats from backend', status: response.status },
        response.status
      );
    }
    
    const data = await response.json();
    console.log(`Successfully fetched seats:`, { 
      count: data.data?.length || 0,
      sample: data.data?.slice(0, 2) || []
    });
    
    return logAndReturn('Success', data);
  } catch (error) {
    console.error('[API ERROR] Error fetching seats:', error);
    return logAndReturn(
      'Internal server error',
      { error: 'Internal server error', details: String(error) },
      500
    );
  }
} 