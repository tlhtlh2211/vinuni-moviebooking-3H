import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

// Base URL for your Flask API
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/admin/movies/check-conflicts"

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check when authentication is implemented
    // For now, this endpoint is open but should be protected in production
    
    const body = await request.json()
    
    // Send a request to the Flask API
    const response = await axios.post(FLASK_API_BASE_URL, body)

    // Check if the response is successful
    if (response.status === 200) {
      const { data } = response
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Failed to check conflicts" }, { status: response.status })
    }
  } catch (error: any) {
    console.error("Error checking conflicts:", error)
    if (error.response) {
      // Pass through the complete error response from Flask
      return NextResponse.json(
        error.response.data,
        { status: error.response.status },
      )
    }
    return NextResponse.json({ status: 'error', message: "Internal server error" }, { status: 500 })
  }
}