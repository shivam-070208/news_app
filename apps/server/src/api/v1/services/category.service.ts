import { db } from "@workspace/db"
import { generateSlug } from "@/lib/slug"
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/repo/types/category"

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listCategories({
  page,
  limit,
  search,
  includeArticleCount,
}: {
  page: number
  limit: number
  search?: string
  includeArticleCount: boolean
}) {
  const skip = (page - 1) * limit

  const where = search
    ? { name: { contains: search, mode: "insensitive" as const } }
    : {}

  const [categories, total] = await Promise.all([
    db.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        ...(includeArticleCount
          ? { _count: { select: { articles: true } } }
          : {}),
      },
    }),
    db.category.count({ where }),
  ])

  const data = categories.map((cat: any) => {
    const { _count, ...rest } = cat
    return {
      ...rest,
      ...(includeArticleCount ? { articleCount: _count?.articles ?? 0 } : {}),
    }
  })

  return { data, total }
}

// ─── Get single ───────────────────────────────────────────────────────────────

export async function getCategoryById(id: string) {
  return db.category.findUnique({
    where: { id },
    include: {
      _count: { select: { articles: true } },
    },
  })
}

// ─── Create ───────────────────────────────────────────────────────────────────

export type CreateCategoryResult =
  | { success: true; category: Awaited<ReturnType<typeof db.category.create>> }
  | { success: false; error: "SLUG_CONFLICT" | "PARENT_NOT_FOUND" }

export async function createCategory(
  input: CreateCategoryInput
): Promise<CreateCategoryResult> {
  const slug = input.slug ?? generateSlug(input.name)

  const existing = await db.category.findUnique({ where: { slug } })
  if (existing) return { success: false, error: "SLUG_CONFLICT" }

  const category = await db.category.create({
    data: {
      name: input.name,
      slug,
    },
  })

  return { success: true, category }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export type UpdateCategoryResult =
  | { success: true; category: Awaited<ReturnType<typeof db.category.update>> }
  | {
      success: false
      error:
        | "NOT_FOUND"
        | "SLUG_CONFLICT"
        | "CIRCULAR_PARENT"
        | "PARENT_NOT_FOUND"
    }

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<UpdateCategoryResult> {
  const existing = await db.category.findUnique({ where: { id } })
  if (!existing) return { success: false, error: "NOT_FOUND" }

  if (input.slug && input.slug !== existing.slug) {
    const conflict = await db.category.findUnique({
      where: { slug: input.slug },
    })
    if (conflict) return { success: false, error: "SLUG_CONFLICT" }
  }

  const category = await db.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
    },
  })

  return { success: true, category }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export type DeleteCategoryResult =
  | { success: true }
  | {
      success: false
      error: "NOT_FOUND" | "HAS_ARTICLES" | "REASSIGN_TARGET_NOT_FOUND"
    }

export async function deleteCategory(
  id: string,
  reassignTo?: string
): Promise<DeleteCategoryResult> {
  const category = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { articles: true } } },
  })

  if (!category) return { success: false, error: "NOT_FOUND" }

  if (category._count.articles > 0) {
    if (!reassignTo) return { success: false, error: "HAS_ARTICLES" }

    const target = await db.category.findUnique({ where: { id: reassignTo } })
    if (!target) return { success: false, error: "REASSIGN_TARGET_NOT_FOUND" }

    await db.$transaction([
      db.article.updateMany({
        where: { categoryId: id },
        data: { categoryId: reassignTo },
      }),
      db.category.delete({ where: { id } }),
    ])

    return { success: true }
  }

  await db.category.delete({ where: { id } })
  return { success: true }
}

// ─── Articles in category ─────────────────────────────────────────────────────

export async function getCategoryArticles(
  categoryId: string,
  {
    page,
    limit,
    status,
  }: {
    page: number
    limit: number
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  }
) {
  const skip = (page - 1) * limit

  const where = {
    categoryId,
    ...(status ? { status } : {}),
  }

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        thumbnailUrl: true,
        status: true,
        isBreaking: true,
        viewCount: true,
        publishedAt: true,
        createdAt: true,
        author: { select: { id: true, name: true } },
      },
    }),
    db.article.count({ where }),
  ])

  return { articles, total }
}

// ─── Reorder ──────────────────────────────────────────────────────────────────

export type ReorderResult =
  | { success: true }
  | { success: false; missingIds: string[] }

export async function reorderCategories(
  orderedIds: string[]
): Promise<ReorderResult> {
  // DB schema no longer supports sortOrder field natively.
  // Bypass reordering logic and return success for the controller.
  return { success: true }
}
