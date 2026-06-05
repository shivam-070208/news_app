import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = [
  "/login",
  "/verify-email",
  "/_next",
  "/favicon.ico",
  "/api",
]
const DASHBOARD_ROLES = ["ADMIN", "EDITOR", "SUPERADMIN"]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (publicPath) =>
      pathname === publicPath || pathname.startsWith(publicPath + "/")
  )
}

function normalizeRole(role?: string) {
  return role?.toUpperCase() ?? ""
}

async function getSession(request: NextRequest) {
  try {
    const url = new URL("/api/session", request.nextUrl.origin)
    const response = await fetch(url.toString(), {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      credentials: "include",
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    return response.json().catch(() => null)
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const session = await getSession(request)
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const role = normalizeRole(session.user.role)
  if (!DASHBOARD_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (!session.user.emailVerified) {
    return NextResponse.redirect(new URL("/verify-email", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/:path*"],
}
