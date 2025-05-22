import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

// Base URL for your Flask API
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/reservations"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservationId = Number.parseInt(params.id)

    // Send a request to the Flask API to confirm the reservation
    const response = await axios.post(`${FLASK_API_BASE_URL}/${reservationId}/confirm`)

    // Check if the response is successful
    if (response.status === 200) {
      const { data } = response
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Failed to confirm reservation" }, { status: response.status })
    }
  } catch (error: any) {
    console.error("Error confirming reservation:", error)
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.message || "Failed to confirm reservation" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
