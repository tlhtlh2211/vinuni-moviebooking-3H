import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

// Base URL for your Flask API
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/admin/movies/schedule"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cinema_id: string; date: string }> }
) {
  try {
    // TODO: Add authentication check when authentication is implemented
    // For now, this endpoint is open but should be protected in production
    
    const { cinema_id, date } = await params
    
    // Send a request to the Flask API
    const response = await axios.get(`${FLASK_API_BASE_URL}/${cinema_id}/${date}`)

    // Check if the response is successful
    if (response.status === 200) {
      const { data } = response
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Failed to fetch schedule" }, { status: response.status })
    }
  } catch (error: any) {
    console.error("Error fetching schedule:", error)
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.message || "Failed to fetch schedule" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}