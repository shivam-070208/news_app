import { Request, Response, NextFunction } from "express"
import { ApiErrors } from "@/lib/api-response"

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

/**
 * Requires a valid authenticated user on req.user.
 * Your JWT/session middleware must run before this and populate req.user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return ApiErrors.unauthorized(res)
  }
  return next()
}

/**
 * Requires ADMIN or EDITOR role.
 * Must be used after requireAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
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
export function requireAdminOnly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return ApiErrors.unauthorized(res)
  }
  if (req.user.role !== "ADMIN") {
    return ApiErrors.forbidden(res)
  }
  return next()
}
