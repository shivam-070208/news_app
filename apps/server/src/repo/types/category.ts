import { z } from "zod"

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  slug: z
    .string()
    .regex(
      slugRegex,
      "Slug must be lowercase letters, numbers, and hyphens only"
    )
    .optional(),
  description: z
    .string()
    .max(500, "Description too long")
    .nullable()
    .optional(),
  parentId: z.string().cuid("Invalid parent ID").nullable().optional(),
})

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .optional(),
  slug: z
    .string()
    .regex(
      slugRegex,
      "Slug must be lowercase letters, numbers, and hyphens only"
    )
    .optional(),
  description: z
    .string()
    .max(500, "Description too long")
    .nullable()
    .optional(),
  parentId: z.string().cuid("Invalid parent ID").nullable().optional(),
})

export const reorderCategoriesSchema = z.object({
  orderedIds: z
    .array(z.string().cuid("Invalid category ID"))
    .min(1, "At least one ID required"),
})

export const listCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  includeArticleCount: z.preprocess((value) => {
    if (value === "true" || value === true) return true
    if (value === "false" || value === false || value === undefined) return false
    return value
  }, z.boolean()),
})

export const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
})

export const deleteCategoryQuerySchema = z.object({
  reassignTo: z.string().cuid("Invalid reassign target ID").optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>
