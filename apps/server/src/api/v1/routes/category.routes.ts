import { Router } from "express"
import { CategoryController } from "@v1/controllers/category.controller"
import { validate } from "@/api/v1/middelwares/validate"
import {
  requireAdmin,
  requireAdminOnly,
} from "@/api/v1/middelwares/auth.middleware"
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
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

// PATCH /api/v1/categories/reorder  — must be before /:id to avoid param conflict
router.patch(
  "/reorder",
  requireAdmin,
  validate("body", reorderCategoriesSchema),
  categoryController.reorder
)

// GET /api/v1/categories/:id/articles
router.get(
  "/:id/articles",
  requireAdmin,
  validate("query", listArticlesQuerySchema),
  categoryController.getArticles
)

// POST /api/v1/categories
router.post(
  "/",
  requireAdmin,
  validate("body", createCategorySchema),
  categoryController.create
)

// PUT /api/v1/categories/:id
router.put(
  "/:id",
  requireAdmin,
  validate("body", updateCategorySchema),
  categoryController.update
)

// DELETE /api/v1/categories/:id  — ADMIN only (not EDITOR)
router.delete(
  "/:id",
  requireAdminOnly,
  validate("query", deleteCategoryQuerySchema),
  categoryController.remove
)

// GET /api/v1/categories/:id  — public single category
router.get("/:id", categoryController.getOne)

export { router as categoryV1Router }
