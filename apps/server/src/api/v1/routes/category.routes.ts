import { Router } from "express"
import { CategoryController } from "@v1/controllers/category.controller"
import { validate } from "@/api/v1/middelwares/validate"
import { authorizeUser, authorizeAdmin } from "@v1/middelwares/auth.middelware"
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
  listArticlesQuerySchema,
  deleteCategoryQuerySchema,
} from "@/repo/types/category"

const router: Router = Router()
const categoryController = new CategoryController()

// ─── Public routes (no auth needed) ──────────────────────────────────────────
// Readers need to browse categories on the client site

// GET /api/v1/categories  — public list (no article count by default)
router.get(
  "/",
  validate("query", listCategoriesQuerySchema),
  categoryController.list
)

// ─── Admin routes ─────────────────────────────────────────────────────────────

// GET /api/v1/categories/:id/articles
router.get(
  "/:id/articles",
  authorizeUser,
  authorizeAdmin,
  validate("query", listArticlesQuerySchema),
  categoryController.getArticles
)

// POST /api/v1/categories
router.post(
  "/",
  authorizeUser,
  authorizeAdmin,
  validate("body", createCategorySchema),
  categoryController.create
)

// PUT /api/v1/categories/:id
router.put(
  "/:id",
  authorizeUser,
  authorizeAdmin,
  validate("body", updateCategorySchema),
  categoryController.update
)

// DELETE /api/v1/categories/:id  — ADMIN only (not EDITOR)
router.delete(
  "/:id",
  authorizeUser,
  authorizeAdmin,
  validate("query", deleteCategoryQuerySchema),
  categoryController.remove
)

// GET /api/v1/categories/:id  — public single category
router.get("/:id", categoryController.getOne)

export { router as categoryV1Router }
