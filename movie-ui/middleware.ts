import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware will log all requests to help debug routing issues
export function middleware(request: NextRequest) {
  // Log all API requests
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`[MIDDLEWARE] ${request.method} ${request.nextUrl.pathname}`)
  }

  // Continue to the next middleware or route handler
  return NextResponse.next()
}

// Only match API routes
export const config = {
  matcher: ['/api/:path*'],
} 