"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { AuthCard, AuthHeader, AuthMessage } from "./index"
import {
  getSession,
  isAllowedDashboardRole,
  sendVerificationEmail,
} from "../../../lib/auth-client"

export function VerifyEmailPanel() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const loadSession = async () => {
      const session = await getSession()

      if (!session?.user) {
        router.push("/login")
        return
      }

      if (!isAllowedDashboardRole(session.user.role)) {
        setError("You are not authorized to access this verification page.")
        return
      }

      if (session.user.emailVerified) {
        router.push("/")
        return
      }

      setEmail(session.user.email)
    }

    loadSession()
  }, [router])

  const handleResend = async () => {
    setError("")
    setMessage("")
    setIsSending(true)

    try {
      const result = await sendVerificationEmail()

      if (result.error) {
        setError(result.error.message || "Unable to send verification email.")
        setIsSending(false)
        return
      }

      setMessage("Verification email sent. Please check your inbox.")
      setIsSending(false)
    } catch (error) {
      console.error("Send verification email error:", error)
      setError("Unable to send verification email at this time.")
      setIsSending(false)
    }
  }

  return (
    <AuthCard>
      <div className="space-y-8">
        <AuthHeader
          title="Verify your email"
          subtitle="A verification email is required before admin access is granted."
        />

        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <p>
            We need to confirm that your email address is verified before you
            can continue.
          </p>
          <p>
            Your account will remain blocked until verification is complete.
          </p>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            Email: {email}
          </p>
        </div>

        <div className="space-y-4">
          <AuthMessage message={error} variant="error" />
          <AuthMessage message={message} variant="success" />

          <Button
            type="button"
            className="w-full"
            onClick={handleResend}
            disabled={isSending || !email}
          >
            {isSending ? "Sending..." : "Resend verification email"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Back to login
          </Button>
        </div>
      </div>
    </AuthCard>
  )
}
