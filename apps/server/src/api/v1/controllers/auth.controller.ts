import { Request, Response } from "express"

export class AuthController {
  public status(_req: Request, res: Response) {
    res.json({
      status: "ok",
      service: "auth",
      version: "1",
    })
  }
}
