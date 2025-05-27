import { NextResponse } from "next/server"
import axios from "axios"

// Base URL for your Flask API
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/movies"

export async function GET(request: Request, context: { params: { movieId: string } }) {
  try {
    // Await params before using them
    const { movieId } = await context.params;
    const movieIdNumber = Number.parseInt(movieId);

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const includeShowtimes = searchParams.get('include_showtimes')

    // Build URL with query parameters
    const url = new URL(`${FLASK_API_BASE_URL}/${movieIdNumber}`)
    if (includeShowtimes) {
      url.searchParams.append('include_showtimes', includeShowtimes)
    }

    // Send a request to the Flask API
    const response = await axios.get(url.toString())

    // Check if the response is successful
    if (response.status === 200) {
      const { data } = response
      return NextResponse.json(data)
    } else {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }
  } catch (error: any) {
    console.error("Error fetching movie details:", error)
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.message || "Movie not found" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
