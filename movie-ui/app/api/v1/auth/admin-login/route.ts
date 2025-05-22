import { type NextRequest, NextResponse } from "next/server"
import axios from "axios"

// Base URL for your Flask API
const FLASK_API_BASE_URL = "http://127.0.0.1:5000/api/v1/auth/admin-login"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Send a request to the Flask API
    const response = await axios.post(FLASK_API_BASE_URL, { email, password })

    // Check if the response is successful
    if (response.status === 200) {
      const { data } = response
      return NextResponse.json({
        success: true,
        user: data.data,
        token: data.token || "admin-jwt-token-" + Math.random().toString(36).substring(2),
      })
    } else {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
    }
  } catch (error: any) {
    console.error("Admin login error:", error)
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data.message || "Authentication failed" },
        { status: error.response.status },
      )
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
