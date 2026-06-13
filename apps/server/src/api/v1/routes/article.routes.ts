import { Router } from "express"
import { ArticleController } from "@v1/controllers/article.controller"
import { validate } from "@/api/v1/middelwares/validate"
import { attachOptionalSession } from "@v1/middelwares/auth.middelware"
import { listArticlesQuerySchema } from "@/repo/types/article"

const router = Router()
const controller = new ArticleController()

router.get(
  "/",
  attachOptionalSession,
  validate("query", listArticlesQuerySchema),
  controller.list
)
router.post("/:id/view", attachOptionalSession, controller.recordView)

export { router as articleV1Router }
