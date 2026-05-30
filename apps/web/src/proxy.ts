import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/login", "/signup", "/verify-email"]

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

async function proxy(request: NextRequest) {
  const session = await getSession(request)
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (!session.user.emailVerified) {
    return NextResponse.redirect(new URL("/verify-email", request.url))
  }

  return NextResponse.next()
}
export default proxy

export const config = {
  matcher: ["/dashboard", "/dashboard/(.*)"],
}
