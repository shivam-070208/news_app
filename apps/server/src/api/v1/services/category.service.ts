import { db } from "@workspace/db"
import { generateSlug } from "@/lib/slug"
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/repo/types/category"

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Walk up the parent chain and collect all ancestor IDs.
 * Used to prevent circular parent references.
 */
async function getAncestorIds(categoryId: string): Promise<string[]> {
  const ancestors: string[] = []
  let current = await db.category.findUnique({
    where: { id: categoryId },
    select: { parentId: true },
  })

  while (current?.parentId) {
    ancestors.push(current.parentId)
    current = await db.category.findUnique({
      where: { id: current.parentId },
      select: { parentId: true },
    })
  }

  return ancestors
}

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
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        ...(includeArticleCount
          ? { _count: { select: { articles: true } } }
          : {}),
      },
    }),
    db.category.count({ where }),
  ])

  const data = categories.map(
    (cat: (typeof categories)[number] & { _count?: { articles: number } }) => {
      const { _count, ...rest } = cat
      return {
        ...rest,
        ...(includeArticleCount ? { articleCount: _count?.articles ?? 0 } : {}),
      }
    }
  )

  return { data, total }
}

// ─── Get single ───────────────────────────────────────────────────────────────

export async function getCategoryById(id: string) {
  return db.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
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

  const [existing, parent] = await Promise.all([
    db.category.findUnique({ where: { slug } }),
    input.parentId
      ? db.category.findUnique({ where: { id: input.parentId } })
      : Promise.resolve(null),
  ])

  if (existing) return { success: false, error: "SLUG_CONFLICT" }
  if (input.parentId && !parent)
    return { success: false, error: "PARENT_NOT_FOUND" }

  const maxOrder = await db.category.aggregate({ _max: { sortOrder: true } })
  const nextOrder = (maxOrder._max.sortOrder ?? 0) + 1

  const category = await db.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      parentId: input.parentId ?? null,
      sortOrder: nextOrder,
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

  // Slug conflict check (only when slug is actually changing)
  if (input.slug && input.slug !== existing.slug) {
    const conflict = await db.category.findUnique({
      where: { slug: input.slug },
    })
    if (conflict) return { success: false, error: "SLUG_CONFLICT" }
  }

  // Circular parent check
  if (input.parentId) {
    if (input.parentId === id) {
      return { success: false, error: "CIRCULAR_PARENT" }
    }
    const ancestors = await getAncestorIds(input.parentId)
    if (ancestors.includes(id)) {
      return { success: false, error: "CIRCULAR_PARENT" }
    }
    const parent = await db.category.findUnique({
      where: { id: input.parentId },
    })
    if (!parent) return { success: false, error: "PARENT_NOT_FOUND" }
  }

  const category = await db.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.parentId !== undefined && { parentId: input.parentId }),
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
  const found = await db.category.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true },
  })

  if (found.length !== orderedIds.length) {
    const foundSet = new Set(found.map((c: { id: string }) => c.id))
    const missingIds = orderedIds.filter((id) => !foundSet.has(id))
    return { success: false, missingIds }
  }

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.category.update({ where: { id }, data: { sortOrder: index } })
    )
  )

  return { success: true }
}
