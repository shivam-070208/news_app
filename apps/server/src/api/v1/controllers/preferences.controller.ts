import { Request, Response } from "express"
import { db } from "@workspace/db"
import { ApiErrors, sendSuccess } from "@/lib/api-response"
import { auth } from "@workspace/auth"
import type { UpdatePreferencesInput } from "@/repo/types/preferences"

export class PreferencesController {
  /**
   * GET /api/v1/preferences
   * Returns the authenticated user's preferences, creating defaults if none exist.
   * Uses upsert to avoid a race condition on concurrent first requests.
   */
  public async get(req: Request, res: Response) {
    try {
      if (!req.user) return ApiErrors.unauthorized(res)

      const userId = req.user.id

      // upsert avoids the findUnique → create race condition on concurrent requests
      const preference = await db.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          categoryIds: [],
          tagIds: [],
          receiveEmails: false,
          emailFrequency: "DAILY",
        },
        update: {}, // no-op if it already exists
      })

      return sendSuccess(res, preference)
    } catch (error) {
      console.error("[preferences.get]", error)
      return ApiErrors.internal(res)
    }
  }

  /**
   * PUT /api/v1/preferences
   * Updates the authenticated user's preferences.
   * Body is pre-validated by the `validate` middleware using updatePreferencesSchema.
   */
  public async update(req: Request, res: Response) {
    try {
      if (!req.user) return ApiErrors.unauthorized(res)

      const userId = req.user.id
      const { categoryIds, tagIds, receiveEmails, emailFrequency } =
        req.body as UpdatePreferencesInput

      // Validate that provided categoryIds actually exist in the DB
      if (categoryIds && categoryIds.length > 0) {
        const existingCategories = await db.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true },
        })
        const foundIds = new Set(
          existingCategories.map((c: { id: string }) => c.id)
        )
        const invalidIds = categoryIds.filter((id: string) => !foundIds.has(id))
        if (invalidIds.length > 0) {
          return ApiErrors.validation(
            res,
            `The following category IDs do not exist: ${invalidIds.join(", ")}`
          )
        }
      }

      // Validate that provided tagIds actually exist in the DB
      if (tagIds && tagIds.length > 0) {
        const existingTags = await db.tag.findMany({
          where: { id: { in: tagIds } },
          select: { id: true },
        })
        const foundIds = new Set(existingTags.map((t: { id: string }) => t.id))
        const invalidIds = tagIds.filter((id: string) => !foundIds.has(id))
        if (invalidIds.length > 0) {
          return ApiErrors.validation(
            res,
            `The following tag IDs do not exist: ${invalidIds.join(", ")}`
          )
        }
      }

      const preference = await db.userPreference.upsert({
        where: { userId },
        update: {
          ...(categoryIds !== undefined && { categoryIds }),
          ...(tagIds !== undefined && { tagIds }),
          ...(receiveEmails !== undefined && { receiveEmails }),
          ...(emailFrequency !== undefined && { emailFrequency }),
        },
        create: {
          userId,
          categoryIds: categoryIds ?? [],
          tagIds: tagIds ?? [],
          receiveEmails: receiveEmails ?? false,
          emailFrequency: emailFrequency ?? "DAILY",
        },
      })

      return sendSuccess(res, preference)
    } catch (error) {
      console.error("[preferences.update]", error)
      return ApiErrors.internal(res)
    }
  }
}
