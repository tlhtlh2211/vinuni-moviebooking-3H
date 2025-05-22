"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Film } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@/types/database"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/movies"

  const { user, isLoading, error, login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState("")

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === UserRole.ADMIN) {
        router.push("/admin/dashboard")
      } else {
        router.push(redirect)
      }
    }
  }, [user, router, redirect])

  const validateForm = () => {
    if (!email || !password) {
      setFormError("Email and password are required")
      return false
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError("Please enter a valid email address")
      return false
    }

    setFormError("")
    return true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      await login(email, password)
      // No need to redirect here, the useEffect will handle it
    } catch (err) {
      console.error("Login error:", err)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Brutalist Header */}
      <header className="bg-black text-white p-4 border-b-8 border-yellow-400">
        <div className="container mx-auto flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Film className="h-8 w-8" />
            <h1 className="text-2xl font-mono font-bold tracking-tighter">BRUTAL CINEMA</h1>
          </Link>
        </div>
      </header>

      <div className="container mx-auto p-8 flex justify-center">
        <div className="w-full max-w-md">
          <div className="bg-yellow-400 p-6 border-8 border-black mb-8">
            <h2 className="text-4xl font-mono font-bold text-black text-center">LOGIN</h2>
          </div>

          {(error || formError) && (
            <div className="mb-6 bg-red-100 border-4 border-red-500 p-4">
              <p className="font-mono text-red-700">{error || formError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="bg-white border-8 border-black p-8 mb-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xl font-mono font-bold">
                  EMAIL
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-4 border-black p-6 font-mono text-xl"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xl font-mono font-bold">
                  PASSWORD
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-4 border-black p-6 font-mono text-xl"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800 font-mono text-xl p-8 border-4 border-black flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? "LOGGING IN..." : "LOGIN"}
              </Button>

              <div className="text-center mt-4">
                <p className="font-mono text-sm text-gray-600">
                  Use <span className="font-bold">user@example.com</span> /{" "}
                  <span className="font-bold">password123</span> for user login
                </p>
                <p className="font-mono text-sm text-gray-600">
                  Use <span className="font-bold">admin@example.com</span> / <span className="font-bold">admin123</span>{" "}
                  for admin login
                </p>
              </div>
            </div>
          </form>

          <div className="bg-blue-500 p-4 border-4 border-black">
            <p className="font-mono text-white text-center">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline font-bold">
                SIGN UP
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
