import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

// Base URL for your Flask API
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/admin/analytics/top-movies/genres"

export async function GET(request: NextRequest) {
  try {
    // Send a request to the Flask API (no authentication required)
    const response = await axios.get(FLASK_API_BASE_URL)

    // Check if the response is successful
    if (response.status === 200) {
      const { data } = response
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Failed to fetch genres" }, { status: response.status })
    }
  } catch (error: any) {
    console.error("Error fetching genres:", error)
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.error || "Failed to fetch genres" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}