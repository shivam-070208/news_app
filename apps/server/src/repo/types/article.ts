import { z } from "zod"

export const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(8),
  type: z.enum(["trending", "latest", "foryou"]).optional(),
  categorySlug: z.string().optional(),
  q: z.string().optional(),
})

export const homeQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
})

export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>
export type HomeQuery = z.infer<typeof homeQuerySchema>
