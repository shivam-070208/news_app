import { Request, Response, NextFunction } from "express"
import { ZodSchema, ZodError } from "zod"
import { ApiErrors } from "@/lib/api-response"

type ValidateTarget = "body" | "query" | "params"

/**
 * Middleware factory — validates req[target] against a Zod schema.
 * On success, replaces req[target] with the parsed (coerced) data.
 * On failure, returns 400 with the first validation error message.
 *
 * Usage:
 *   router.post("/", validate("body", createCategorySchema), controller.create)
 */
export function validate(target: ValidateTarget, schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target])

    if (!result.success) {
      const firstError = result.error.issues[0]
      if (!firstError) {
        return ApiErrors.validation(res, "Invalid request")
      }
      const field = firstError.path.join(".") || target
      const message = `[${field}] ${firstError.message}`
      return ApiErrors.validation(res, message)
    }

    // Replace with parsed/coerced/defaulted values
    Object.defineProperty(req, target, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    })
    return next()
  }
}
