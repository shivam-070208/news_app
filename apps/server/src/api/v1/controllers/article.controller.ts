import { Request, Response } from "express"
import { sendSuccess, ApiErrors, buildMeta } from "@/lib/api-response"
import {
  listArticles,
  recordArticleView,
} from "@/api/v1/services/article.service"
import type { RequestWithSession } from "@/types/request-with-session"

export class ArticleController {
  async list(req: Request, res: Response) {
    const { page, limit, type, categorySlug, q } = req.query as any
    const userId = (req as RequestWithSession).session?.user?.id

    const result = await listArticles({
      page,
      limit,
      type,
      categorySlug,
      q,
      userId,
    })

    if (categorySlug && "category" in result.data && !result.data.category) {
      return ApiErrors.notFound(res, "Category")
    }

    return sendSuccess(res, result.data, buildMeta(page, limit, result.total))
  }

  async recordView(req: Request, res: Response) {
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    if (!id) {
      return ApiErrors.validation(res, "Article ID is required")
    }

    const userId = (req as RequestWithSession).session?.user?.id

    try {
      await recordArticleView(id, userId)
      return sendSuccess(res, { recorded: true })
    } catch (error) {
      console.error("Failed to record article view:", error)
      return ApiErrors.internal(res)
    }
  }
}
