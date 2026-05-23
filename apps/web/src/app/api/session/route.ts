import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const backendOrigin = process.env.NEXT_PUBLIC_SERVER_URL
  if (!backendOrigin) {
    return NextResponse.json(
      {
        error: "NEXT_PUBLIC_SERVER_URL is required for session proxy.",
      },
      { status: 500 }
    )
  }

  const url = new URL("/api/auth/get-session", backendOrigin)
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
    credentials: "include",
    cache: "no-store",
  })

  const body = await response.text()
  const headers = new Headers(response.headers)
  headers.set("content-type", "application/json")

  return new NextResponse(body, {
    status: response.status,
    headers,
  })
}
