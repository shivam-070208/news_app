import { Request, Response } from "express"

import { sendSuccess, ApiErrors, buildMeta } from "@/lib/api-response"
import {
  listCategories,
  listPublicCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryArticles,
  getUserFavoriteCategories,
} from "@/api/v1/services/category.service"
import { categoryClickQueue } from "@/jobs/category-click"
import type { RequestWithSession } from "@/types/request-with-session"
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/repo/types/category"

export class CategoryController {
  // GET /api/v1/admin/categories
  async list(req: Request, res: Response) {
    const { page, limit, search, includeArticleCount } = req.query as any

    const { data, total } = await listCategories({
      page,
      limit,
      search,
      includeArticleCount,
    })

    return sendSuccess(res, data, buildMeta(page, limit, total))
  }

  // GET /api/v1/categories/public
  async listPublic(req: Request, res: Response) {
    const { page, limit, search } = req.query as any
    const session = (req as RequestWithSession).session
    const userId = session?.user?.id

    const [listResult, favorites] = await Promise.all([
      listPublicCategories({ page, limit, search }),
      userId ? getUserFavoriteCategories(userId, 5) : Promise.resolve([]),
    ])

    return sendSuccess(
      res,
      { ...listResult, favorites },
      buildMeta(page, limit, listResult.total)
    )
  }

  // POST /api/v1/categories/:id/click
  async trackClick(req: Request, res: Response) {
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    if (!id) {
      return ApiErrors.validation(res, "Category ID is required")
    }

    const category = await getCategoryById(id)
    if (!category) return ApiErrors.notFound(res, "Category")
    console.log(req.session)
    void categoryClickQueue
      .add("track", {
        userId: (req as RequestWithSession).session.user.id,
        categoryId: id,
      })
      .catch((error) => {
        console.error("Failed to enqueue category click job:", error)
      })

    return sendSuccess(res, { queued: true })
  }

  // GET /api/v1/admin/categories/:id
  async getOne(req: Request, res: Response) {
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    if (!id) {
      return ApiErrors.validation(res, "Category ID is required")
    }

    const category = await getCategoryById(id)
    if (!category) return ApiErrors.notFound(res, "Category")

    return sendSuccess(res, {
      ...category,
      articleCount: category._count.articles,
      _count: undefined,
    })
  }

  // POST /api/v1/admin/categories
  async create(req: Request, res: Response) {
    const input = req.body as CreateCategoryInput
    const result = await createCategory(input)

    if (!result.success) {
      if (result.error === "SLUG_CONFLICT") return ApiErrors.slugConflict(res)
      if (result.error === "PARENT_NOT_FOUND")
        return ApiErrors.notFound(res, "Parent category")
      return ApiErrors.internal(res)
    }

    return sendSuccess(res, result.category, undefined, 201)
  }

  // PUT /api/v1/admin/categories/:id
  async update(req: Request, res: Response) {
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    if (!id) {
      return ApiErrors.validation(res, "Category ID is required")
    }

    const input = req.body as UpdateCategoryInput
    const result = await updateCategory(id, input)

    if (!result.success) {
      if (result.error === "NOT_FOUND")
        return ApiErrors.notFound(res, "Category")
      if (result.error === "SLUG_CONFLICT") return ApiErrors.slugConflict(res)
      if (result.error === "CIRCULAR_PARENT")
        return ApiErrors.circularParent(res)
      if (result.error === "PARENT_NOT_FOUND")
        return ApiErrors.notFound(res, "Parent category")
      return ApiErrors.internal(res)
    }

    return sendSuccess(res, result.category)
  }

  // DELETE /api/v1/admin/categories/:id
  async remove(req: Request, res: Response) {
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    if (!id) {
      return ApiErrors.validation(res, "Category ID is required")
    }

    const reassignTo = req.query.reassignTo as string | undefined
    const result = await deleteCategory(id, reassignTo)

    if (!result.success) {
      if (result.error === "NOT_FOUND")
        return ApiErrors.notFound(res, "Category")
      if (result.error === "HAS_ARTICLES") return ApiErrors.hasArticles(res)
      if (result.error === "REASSIGN_TARGET_NOT_FOUND")
        return ApiErrors.notFound(res, "Reassign target category")
      return ApiErrors.internal(res)
    }

    return sendSuccess(res, { deleted: true })
  }

  // GET /api/v1/admin/categories/:id/articles
  async getArticles(req: Request, res: Response) {
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    if (!id) {
      return ApiErrors.validation(res, "Category ID is required")
    }

    const category = await getCategoryById(id)
    if (!category) return ApiErrors.notFound(res, "Category")

    const { page, limit, status } = req.query as any

    const { articles, total } = await getCategoryArticles(id, {
      page,
      limit,
      status,
    })

    return sendSuccess(
      res,
      {
        category: { id: category.id, name: category.name, slug: category.slug },
        articles,
      },
      buildMeta(page, limit, total)
    )
  }
}
