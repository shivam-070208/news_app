import { Request, Response, NextFunction } from "express"
import { ApiErrors } from "@/lib/api-response"
import { auth } from "@workspace/auth"
import { fromNodeHeaders } from "better-auth/node"

/**
 * Extend Express Request to include the authenticated user.
 * Set by your auth middleware (JWT decode, session lookup, etc.)
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: "READER" | "EDITOR" | "ADMIN"
      }
    }
  }
}

async function populateUser(req: Request) {
  if (!req.user) {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      })
      if (session?.user) {
        req.user = {
          id: session.user.id,
          email: session.user.email,
          role: (session.user as any).role || "READER",
        }
      }
    } catch (error) {
      console.error("[Auth Middleware] Session error:", error)
    }
  }
}

/**
 * Requires a valid authenticated user on req.user.
 * Your JWT/session middleware must run before this and populate req.user.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  await populateUser(req)
  if (!req.user) {
    return ApiErrors.unauthorized(res)
  }
  return next()
}

/**
 * Requires ADMIN or EDITOR role.
 * Must be used after requireAuth.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  await populateUser(req)
  if (!req.user) {
    return ApiErrors.unauthorized(res)
  }
  if (req.user.role !== "ADMIN" && req.user.role !== "EDITOR") {
    return ApiErrors.forbidden(res)
  }
  return next()
}

/**
 * Requires ADMIN role only (not EDITOR).
 * Use for destructive operations like delete.
 */
export async function requireAdminOnly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  await populateUser(req)
  if (!req.user) {
    return ApiErrors.unauthorized(res)
  }
  if (req.user.role !== "ADMIN") {
    return ApiErrors.forbidden(res)
  }
  return next()
}
