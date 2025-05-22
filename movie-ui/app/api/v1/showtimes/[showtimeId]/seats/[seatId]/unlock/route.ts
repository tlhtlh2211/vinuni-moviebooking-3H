import { type NextRequest, NextResponse } from "next/server"
import axios, { AxiosError } from "axios"

// Base URL for your Flask API
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/showtimes"

export async function POST(request: NextRequest, { params }: { params: { showtimeId: string; seatId: string } }) {
  try {
    const showtimeId = Number.parseInt(params.showtimeId)
    const seatId = Number.parseInt(params.seatId)
    const body = await request.json()
    const { user_id } = body

    // Validate input
    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Send a request to the Flask API to unlock a seat
    const response = await axios.post(`${FLASK_API_BASE_URL}/${showtimeId}/seats/${seatId}/unlock`, { user_id })

    // Check if the response is successful
    if (response.status === 200) {
      const { data } = response
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Failed to unlock seat" }, { status: response.status })
    }
  } catch (error: unknown) {
    console.error("Error unlocking seat:", error)
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: error.response.data.message || "Failed to unlock seat" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
