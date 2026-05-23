"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { AuthCard, AuthHeader, AuthInput, AuthMessage } from "./index"
import {
  signUpWithEmailPassword,
  signInWithGoogle,
  getSession,
} from "../../../lib/auth-client"

export function SignupForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      const result = await signUpWithEmailPassword(
        email.trim(),
        password,
        name.trim()
      )

      if (result.error) {
        setError(result.error.message || "Unable to create your account.")
        setIsSubmitting(false)
        return
      }

      const session = await getSession()
      if (session?.user?.emailVerified) {
        router.push("/dashboard")
        return
      }

      setSuccess("Account created. Check your inbox to verify email.")
      router.push("/verify-email")
    } catch (error) {
      console.error("Signup error:", error)
      setError("An unexpected error occurred during signup.")
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setSuccess("")
    setIsGoogleLoading(true)

    try {
      const result = await signInWithGoogle()
      if (result.error) {
        setError(result.error.message || "Unable to start Google sign in.")
        setIsGoogleLoading(false)
        return
      }

      setError("Unable to continue with Google login.")
      setIsGoogleLoading(false)
    } catch (error) {
      console.error("Google sign in error:", error)
      setError("An unexpected error occurred during Google sign in.")
      setIsGoogleLoading(false)
    }
  }

  return (
    <AuthCard>
      <div className="space-y-8">
        <AuthHeader
          title="Create your account"
          subtitle="Sign up for news updates, dashboard access, and editorial tools."
        />

        <div className="space-y-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading
              ? "Connecting to Google..."
              : "Continue with Google"}
          </Button>

          <div className="flex items-center gap-3 text-xs tracking-[0.3em] text-slate-500 uppercase dark:text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span>or sign up with</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <AuthInput
              id="signup-name"
              label="Name"
              value={name}
              onChange={setName}
              placeholder="Your full name"
            />
            <AuthInput
              id="signup-email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
            <AuthInput
              id="signup-password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Create a password"
            />
          </div>

          <div className="space-y-4">
            <AuthMessage message={error} variant="error" />
            <AuthMessage message={success} variant="success" />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !email || !password || !name}
            >
              {isSubmitting ? "Creating account..." : "Sign up"}
            </Button>
          </div>
        </form>
      </div>
    </AuthCard>
  )
}
