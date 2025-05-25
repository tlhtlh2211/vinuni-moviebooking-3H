import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Simple hard-coded admin authentication
    if (email === "admin@example.com" && password === "admin123") {
      return NextResponse.json({
        success: true,
        user: {
          id: 999,
          email: "admin@example.com",
          role: "admin",
        },
        token: "admin-jwt-token-" + Math.random().toString(36).substring(2),
      })
    }

    // If credentials don't match
    return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
  } catch (error: any) {
    console.error("Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
