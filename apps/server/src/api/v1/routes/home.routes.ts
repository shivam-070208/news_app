import { Router } from "express"
import { HomeController } from "@v1/controllers/home.controller"
import { validate } from "@/api/v1/middelwares/validate"
import { attachOptionalSession } from "@v1/middelwares/auth.middelware"
import { homeQuerySchema } from "@/repo/types/article"

const router = Router()
const controller = new HomeController()

router.get(
  "/",
  attachOptionalSession,
  validate("query", homeQuerySchema),
  controller.index
)

export { router as homeV1Router }
