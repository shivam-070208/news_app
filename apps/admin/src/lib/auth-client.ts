import {
  createAuthClient,
  AuthClient,
  BetterAuthClientOptions,
} from "better-auth/client"

const options: BetterAuthClientOptions = {
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  fetchOptions: {
    onRequest: (context) => {
      return {
        ...context,
        headers: {
          ...context.headers,
          "Content-Type": "application/json",
        },
      }
    },
    onResponse: (context) => {
      return context
    },
  },
}
// Ensure the Content-Type is always application/json for all outgoing requests
export const authClient: AuthClient<typeof options> = createAuthClient(options)

export type AuthUser = {
  id: string
  email: string
  name?: string
  role?: string
  emailVerified?: boolean
}

export type AuthSession = {
  session: {
    id?: string
  }
  user: AuthUser
}

export const LOGIN_ALLOWED_ROLES = ["ADMIN", "SUPERADMIN", "EDITOR"]
export const DASHBOARD_ALLOWED_ROLES = ["ADMIN", "EDITOR", "SUPERADMIN"]

export function normalizeRole(role?: string) {
  return role?.toUpperCase() ?? ""
}

export function isAllowedLoginRole(role?: string) {
  return LOGIN_ALLOWED_ROLES.includes(normalizeRole(role))
}

export function isAllowedDashboardRole(role?: string) {
  return DASHBOARD_ALLOWED_ROLES.includes(normalizeRole(role))
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const session = await authClient.getSession()
    console.log(session)
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
  if (!session || !session.user || !session.user.email) {
    throw new Error("No session or user email found")
  }
  return await authClient.sendVerificationEmail({
    email: session.user.email,
    callbackURL: `${window.location.origin}/login`,
  })
}
