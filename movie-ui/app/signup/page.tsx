"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Film, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function SignupPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/movies")
    }
  }, [user, router])

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setFormError("All fields are required")
      return false
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError("Please enter a valid email address")
      return false
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long")
      return false
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match")
      return false
    }

    setFormError("")
    return true
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setFormError("")

    try {
      // In a real app, you would call an API endpoint to register the user
      // For now, we'll simulate a successful registration
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess(true)

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error) {
      console.error("Signup error:", error)
      setFormError("An error occurred during signup. Please try again.")
    } finally {
      setIsLoading(false)
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
          <div className="flex justify-between items-center mb-8">
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              className="bg-white text-black hover:bg-gray-100 font-mono border-4 border-black flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              BACK TO LOGIN
            </Button>

            <div className="bg-green-500 p-6 border-8 border-black">
              <h2 className="text-4xl font-mono font-bold text-white">SIGN UP</h2>
            </div>
          </div>

          {formError && (
            <div className="mb-6 bg-red-100 border-4 border-red-500 p-4">
              <p className="font-mono text-red-700">{formError}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-100 border-4 border-green-500 p-4">
              <p className="font-mono text-green-700">Account created successfully! Redirecting to login...</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="bg-white border-8 border-black p-8 mb-8">
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
                  disabled={isLoading || success}
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
                  disabled={isLoading || success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xl font-mono font-bold">
                  CONFIRM PASSWORD
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-4 border-black p-6 font-mono text-xl"
                  disabled={isLoading || success}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800 font-mono text-xl p-8 border-4 border-black flex items-center justify-center gap-2"
                disabled={isLoading || success}
              >
                {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </Button>
            </div>
          </form>

          <div className="bg-blue-500 p-4 border-4 border-black">
            <p className="font-mono text-white text-center">
              Already have an account?{" "}
              <Link href="/login" className="underline font-bold">
                LOGIN
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
