import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

// Base URL for Flask admin analytics API
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/admin/analytics/revenue-summary"

export async function GET(request: NextRequest) {
  try {
    // Get user_id from query params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Send request to Flask API with user_id
    const response = await axios.get(FLASK_API_BASE_URL, {
      params: { user_id: userId }
    })

    // Check if the response is successful
    if (response.status === 200) {
      return NextResponse.json(response.data)
    } else {
      return NextResponse.json(
        { error: "Failed to fetch revenue summary" },
        { status: response.status }
      )
    }
  } catch (error: any) {
    console.error("Error fetching revenue summary:", error)
    
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.error || "Failed to fetch revenue summary" },
        { status: error.response.status }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}