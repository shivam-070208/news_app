import { Router } from "express"
import { CronController } from "@v1/controllers/cron.controller"

const router: Router = Router()
const cronController = new CronController()

router.post("/send-newsletters", cronController.sendNewsletters)

export { router as cronV1Router }
