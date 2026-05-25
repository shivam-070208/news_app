import { Router } from "express"
import { db } from "@workspace/db"
import { sendSuccess, ApiErrors } from "@/lib/api-response"

const router: Router = Router()

/**
 * GET /api/v1/tags
 * Public endpoint — returns all tags (id, name).
 */
router.get("/", async (_req, res) => {
  try {
    const tags = await db.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    })
    return sendSuccess(res, tags)
  } catch (error) {
    console.error("[tags.list]", error)
    return ApiErrors.internal(res)
  }
})

export { router as tagsV1Router }
