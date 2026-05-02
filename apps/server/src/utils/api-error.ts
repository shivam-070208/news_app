import { HTTPStatusCodes } from "@workspace/shared"

interface ApiErrorOptions {
  statusCode: keyof typeof HTTPStatusCodes
  message: string
  isOperational?: boolean
  cause?: any
}

class ApiError extends Error {
  statusCode: number
  isOperational: boolean
  cause?: any

  constructor({
    statusCode,
    message,
    isOperational = true,
    cause,
  }: ApiErrorOptions) {
    super(message)

    Object.setPrototypeOf(this, new.target.prototype)

    this.statusCode = Number(HTTPStatusCodes[statusCode])
    this.isOperational = isOperational
    this.cause = cause

    Error.captureStackTrace(this, this.constructor)
  }
}

export default ApiError
