import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

// Base URL for your Flask API - IMPORTANT: Include trailing slash for Flask
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/reservations/"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Send a request to the Flask API
    const response = await axios.get(`${FLASK_API_BASE_URL}?user_id=${userId}`)

    // Check if the response is successful
    if (response.status === 200) {
      const { data } = response
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Failed to fetch reservations" }, { status: response.status })
    }
  } catch (error: any) {
    console.error("Error fetching reservations:", error)
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.message || "Failed to fetch reservations" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, showtime_id, seats } = body

    // Validate input
    if (!user_id || !showtime_id || !seats || !Array.isArray(seats)) {
      return NextResponse.json({ error: "User ID, showtime ID, and seats are required" }, { status: 400 })
    }

    console.log("Creating reservation with:", { user_id, showtime_id, seats });

    // Send a request to the Flask API - include trailing slash
    const response = await axios.post(FLASK_API_BASE_URL, { user_id, showtime_id, seats })

    // Check if the response is successful
    if (response.status === 201) {
      const { data } = response
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Failed to create reservation" }, { status: response.status })
    }
  } catch (error: any) {
    console.error("Error creating reservation:", error.message)
    if (error.response) {
      console.error("Server response:", error.response.data);
      return NextResponse.json(
        { error: error.response.data.error || "Failed to create reservation" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
