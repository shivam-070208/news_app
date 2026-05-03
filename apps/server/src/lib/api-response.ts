import { Response } from "express"

export type ApiMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: ApiMeta,
  status = 200
) {
  return res.status(status).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  })
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string
) {
  return res.status(status).json({
    success: false,
    error: { code, message },
  })
}

export const ApiErrors = {
  notFound: (res: Response, resource = "Resource") =>
    sendError(res, 404, "NOT_FOUND", `${resource} not found`),

  slugConflict: (res: Response) =>
    sendError(
      res,
      409,
      "SLUG_CONFLICT",
      "A category with this slug already exists"
    ),

  hasArticles: (res: Response) =>
    sendError(
      res,
      409,
      "HAS_ARTICLES",
      "Category has articles. Use ?reassignTo=categoryId to move them, or reassign manually."
    ),

  circularParent: (res: Response) =>
    sendError(
      res,
      400,
      "CIRCULAR_PARENT",
      "A category cannot be its own ancestor"
    ),

  validation: (res: Response, message: string) =>
    sendError(res, 400, "VALIDATION_ERROR", message),

  unauthorized: (res: Response) =>
    sendError(res, 401, "UNAUTHORIZED", "Authentication required"),

  forbidden: (res: Response) =>
    sendError(res, 403, "FORBIDDEN", "Insufficient permissions"),

  internal: (res: Response) =>
    sendError(res, 500, "INTERNAL_ERROR", "An unexpected error occurred"),
}

export function buildMeta(page: number, limit: number, total: number): ApiMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}
