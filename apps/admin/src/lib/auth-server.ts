import { NextRequest } from "next/server"
import { auth } from "@workspace/auth"

export async function getSession(request: NextRequest) {
  try {
    return await auth.api.getSession({
      headers: request.headers,
    })
  } catch (error) {
    console.error("Failed to get session:", error)
    return null
  }
}

export function isAllowedDashboardRole(role?: string) {
  const DASHBOARD_ALLOWED_ROLES = ["ADMIN", "EDITOR", "SUPERADMIN"]
  return DASHBOARD_ALLOWED_ROLES.includes(role?.toUpperCase() ?? "")
}

export async function requireAuth(request: NextRequest) {
  const session = await getSession(request)

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 }
  }

  if (!isAllowedDashboardRole(session.user.role)) {
    return { error: "Forbidden", status: 403 }
  }

  return { session, user: session.user }
}
