import { createAuthClient } from "better-auth/client"
import type { AuthClient, BetterAuthClientOptions } from "better-auth/client"

const options: BetterAuthClientOptions = {
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  fetchOptions: {
    onRequest: (context) => ({
      ...context,
      headers: {
        ...context.headers,
        "Content-Type": "application/json",
      },
    }),
    onResponse: (context) => context,
  },
}

export const authClient: AuthClient<typeof options> = createAuthClient(options)

export type AuthUser = {
  id: string
  email: string
  name?: string
  role?: string
  emailVerified?: boolean
  image?: string
}

export type AuthSession = {
  session: {
    id?: string
  }
  user: AuthUser
}

export const DASHBOARD_ALLOWED_ROLES = ["ADMIN", "EDITOR", "SUPERADMIN"]

export function normalizeRole(role?: string) {
  return role?.toUpperCase() ?? ""
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const session = await authClient.getSession()
    return session.data ? (session.data as AuthSession) : null
  } catch (error) {
    console.error("Failed to get session:", error)
    return null
  }
}

export async function signInWithEmailPassword(email: string, password: string) {
  return await authClient.signIn.email({
    email,
    password,
    callbackURL: `${window.location.origin}/login`,
  })
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  name: string
) {
  return await authClient.signUp.email({
    email,
    password,
    name,
    callbackURL: `${window.location.origin}/login`,
  })
}

export async function signInWithGoogle() {
  return await authClient.signIn.social({
    provider: "google",
    callbackURL: `${window.location.origin}/login`,
  })
}

export async function signOut() {
  return await authClient.signOut()
}

export async function sendVerificationEmail() {
  const session = await getSession()
  if (!session?.user?.email) {
    throw new Error("No session or user email found")
  }

  return await authClient.sendVerificationEmail({
    email: session.user.email,
    callbackURL: `${window.location.origin}/login`,
  })
}
