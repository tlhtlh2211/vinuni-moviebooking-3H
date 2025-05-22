import { NextResponse } from "next/server"
import axios from "axios"

// Base URL for your Flask API
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/showtimes"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const showtimeId = Number.parseInt(params.id)

    // Send a request to the Flask API to get seats for the showtime
    const response = await axios.get(`${FLASK_API_BASE_URL}/${showtimeId}/seats`)

    // Check if the response is successful
    if (response.status === 200) {
      const { data } = response
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Failed to fetch seats" }, { status: response.status })
    }
  } catch (error: any) {
    console.error("Error fetching seats:", error)
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.message || "Failed to fetch seats" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
