import { Router } from "express"
import { PreferencesController } from "@v1/controllers/preferences.controller"
import { validate } from "@/api/v1/middelwares/validate"
import { updatePreferencesSchema } from "@/repo/types/preferences"
import { requireAuth } from "@/api/v1/middelwares/auth.middleware"

const router: Router = Router()
const preferencesController = new PreferencesController()

router.get("/", requireAuth, preferencesController.get)
router.put(
  "/",
  requireAuth,
  validate("body", updatePreferencesSchema),
  preferencesController.update
)

export { router as preferencesV1Router }
