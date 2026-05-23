import { RequestWithSession } from "@/types/request-with-session"
import ApiError from "@/utils/api-error"
import { tryCatch } from "@/utils/try-catch"
import { auth } from "@workspace/auth"
import { Role } from "@workspace/db/types/enums"
import type { NextFunction, Request, Response } from "express"

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
