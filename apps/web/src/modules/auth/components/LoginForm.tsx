"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { AuthCard, AuthHeader, AuthInput, AuthMessage } from "./index"
import {
  getSession,
  signInWithEmailPassword,
  signInWithGoogle,
  normalizeRole,
  DASHBOARD_ALLOWED_ROLES,
} from "../../../lib/auth-client"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (!session?.user) return

      if (!DASHBOARD_ALLOWED_ROLES.includes(normalizeRole(session.user.role))) {
        setError("You are not authorized to access this dashboard.")
        return
      }

      if (!session.user.emailVerified) {
        router.push("/verify-email")
        return
      }

      router.push("/dashboard")
    }

    checkSession()
  }, [router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      const result = await signInWithEmailPassword(email.trim(), password)

      if (result.error) {
        setError(
          result.error.message || "Unable to sign in with provided credentials."
        )
        setIsSubmitting(false)
        return
      }

      const session = await getSession()
      if (!session?.user) {
        setError("Unable to read the current session after login.")
        setIsSubmitting(false)
        return
      }

      if (!session.user.emailVerified) {
        router.push("/verify-email")
        return
      }

      setSuccess("Signed in successfully. Redirecting...")
      router.push("/dashboard")
    } catch (error) {
      console.error("Sign in error:", error)
      setError("An unexpected error occurred during sign in.")
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
          title="Sign in to the newsroom"
          subtitle="Access your dashboard and manage news with one account."
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
            <span>or continue with</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <AuthInput
              id="login-email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
            <AuthInput
              id="login-password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
            />
          </div>

          <div className="space-y-4">
            <AuthMessage message={error} variant="error" />
            <AuthMessage message={success} variant="success" />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !email || !password}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </AuthCard>
  )
}
