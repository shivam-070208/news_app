import { Request, Response, NextFunction } from "express"
import { ApiErrors } from "@/lib/api-response"
import { auth } from "@workspace/auth"
import { fromNodeHeaders } from "better-auth/node"
import { RequestWithSession } from "@/types/request-with-session"
import ApiError from "@/utils/api-error"
import { tryCatch } from "@/utils/try-catch"
import { Role } from "@workspace/db/types/enums"

export const authorizeUser = tryCatch(
  async (req: Request, _: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
      headers: req.headers as HeadersInit,
    })
    if (!session || !session.user) {
      throw new ApiError({
        statusCode: "HTTP_401_UNAUTHORIZED",
        message: "Unauthorized",
      })
    }
    ;(req as RequestWithSession).session =
      session as unknown as RequestWithSession["session"]
    next()
  }
)

export const authorizeAdmin = tryCatch(
  async (req: Request, _: Response, next: NextFunction) => {
    const session = (req as RequestWithSession).session
    if (session.user.role !== Role.ADMIN) {
      throw new ApiError({
        statusCode: "HTTP_403_FORBIDDEN",
        message: "Forbidden",
      })
    }
    next()
  }
)

export const authorizeEditor = tryCatch(
  async (req: Request, _: Response, next: NextFunction) => {
    const session = (req as RequestWithSession).session
    if (session.user.role !== Role.EDITOR) {
      throw new ApiError({
        statusCode: "HTTP_403_FORBIDDEN",
        message: "Forbidden",
      })
    }
  }
)

export const attachOptionalSession = tryCatch(
  async (req: Request, _: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
      headers: req.headers as HeadersInit,
    })
    if (session && session.user) {
      ;(req as RequestWithSession).session =
        session as unknown as RequestWithSession["session"]
    }
    next()
  }
)

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
