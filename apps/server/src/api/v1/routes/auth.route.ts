import { Router } from "express"
import { AuthController } from "@v1/controllers/auth.controller"

const router: Router = Router()
const authController = new AuthController()

router.get("/status", authController.status)
export { router as authV1Router }
