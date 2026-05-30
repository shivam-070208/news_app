import { Request, Response } from "express"
import { sendSuccess } from "@/lib/api-response"
import { getHomepageSections } from "@/api/v1/services/article.service"
import type { RequestWithSession } from "@/types/request-with-session"

export class HomeController {
  async index(req: Request, res: Response) {
    const { limit } = req.query as any
    const userId = (req as RequestWithSession).session?.user?.id
    const data = await getHomepageSections(limit, userId)
    return sendSuccess(res, data)
  }
}
