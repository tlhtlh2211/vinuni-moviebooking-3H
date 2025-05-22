import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

// Base URL for your Flask API
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/movies"

export async function GET() {
  try {
    // Send a request to the Flask API
    const response = await axios.get(FLASK_API_BASE_URL)

    // Check if the response is successful
    if (response.status === 200) {
      const { data } = response
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Failed to fetch movies" }, { status: response.status })
    }
  } catch (error: any) {
    console.error("Error fetching movies:", error)
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.message || "Failed to fetch movies" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.duration || !body.rating || !body.release_date) {
      return NextResponse.json(
        {
          error: "Missing required fields: title, duration, rating, and release_date are required",
        },
        { status: 400 },
      )
    }

    // Send a request to the Flask API
    const response = await axios.post(FLASK_API_BASE_URL, body)

    // Check if the response is successful
    if (response.status === 201) {
      const { data } = response
      return NextResponse.json(data, { status: 201 })
    } else {
      return NextResponse.json({ error: "Failed to create movie" }, { status: response.status })
    }
  } catch (error: any) {
    console.error("Error creating movie:", error)
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.message || "Failed to create movie" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
