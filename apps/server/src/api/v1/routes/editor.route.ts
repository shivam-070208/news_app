import { Router } from "express"
import {
  createEditor,
  updateEditor,
  deleteEditor,
  listEditors,
} from "@v1/controllers/editor.controller"
import { authorizeUser, authorizeAdmin } from "@v1/middelwares/auth.middelware"

const router: Router = Router()

router.get("/", authorizeUser, authorizeAdmin, listEditors)
router.post("/", authorizeUser, authorizeAdmin, createEditor)
router.put("/:id", authorizeUser, authorizeAdmin, updateEditor)
router.delete("/:id", authorizeUser, authorizeAdmin, deleteEditor)

export { router as editorV1Router }
