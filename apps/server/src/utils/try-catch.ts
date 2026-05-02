import { Request, Response, NextFunction } from "express"
import ApiError from "./api-error.js"

export function tryCatch(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await handler(req, res, next)
    } catch (err) {
      console.log(err)
      if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
          message: err.message,
          cause: err.cause,
        })
      } else {
        return res.status(500).json({
          message: "Internal Server Error",
        })
      }
    }
  }
}
