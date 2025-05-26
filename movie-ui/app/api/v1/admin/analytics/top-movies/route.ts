import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

// Base URL for your Flask API (note the trailing slash)
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/admin/analytics/top-movies/"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const params: any = {}
    
    if (searchParams.has('limit')) {
      params.limit = searchParams.get('limit')
    }
    if (searchParams.has('sort_by')) {
      params.sort_by = searchParams.get('sort_by')
    }
    if (searchParams.has('genre')) {
      params.genre = searchParams.get('genre')
    }

    // Send a request to the Flask API (no authentication required)
    const response = await axios.get(FLASK_API_BASE_URL, {
      params
    })

    // Check if the response is successful
    if (response.status === 200) {
      const { data } = response
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Failed to fetch top movies" }, { status: response.status })
    }
  } catch (error: any) {
    console.error("Error fetching top movies:", error)
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.error || "Failed to fetch top movies" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}