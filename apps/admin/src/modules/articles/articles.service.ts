import { db, Prisma } from "@workspace/db"

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface CreateArticlePayload {
  headline: string
  summary: string
  content: Record<string, unknown>
  status: "draft" | "publish"
  scheduledAt: string | null
  isBreakingNews: boolean
  tags: string[]
}

export type UpdateArticlePayload = Partial<CreateArticlePayload>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") +
    "-" +
    Math.random().toString(36).substring(2, 8)
  )
}

/** Upsert the "General" fallback category */
async function getDefaultCategory() {
  return db.category.upsert({
    where: { slug: "general" },
    create: { name: "General", slug: "general" },
    update: {},
  })
}

/** Map frontend status string → DB enum string */
function toDbStatus(status: "draft" | "publish"): "DRAFT" | "PUBLISHED" {
  return status === "publish" ? "PUBLISHED" : "DRAFT"
}

/** Upsert tags and return join-table rows */
async function resolveTagConnections(tagNames: string[]) {
  if (tagNames.length === 0) return []
  return Promise.all(
    tagNames.map(async (name) => {
      const tag = await db.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
      return { tagId: tag.id }
    })
  )
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function getArticles(page = 1, limit = 10, status?: string) {
  const skip = (page - 1) * limit

  const where =
    status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status.toUpperCase())
      ? { status: status.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED" }
      : {}

  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        status: true,
        isBreaking: true,
        publishedAt: true,
        createdAt: true,
        tags: { select: { tag: true } },
      },
    }),
    db.article.count({ where }),
  ])

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getArticleById(id: string) {
  return db.article.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
    },
  })
}

export async function createArticle(
  data: CreateArticlePayload,
  authorId: string
) {
  const [category, tagConnections] = await Promise.all([
    getDefaultCategory(),
    resolveTagConnections(data.tags),
  ])

  const slug = generateSlug(data.headline)

  return db.article.create({
    data: {
      title: data.headline,
      slug,
      summary: data.summary,
      fullContent: JSON.stringify(data.content),
      status: toDbStatus(data.status),
      isBreaking: data.isBreakingNews,
      publishedAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      authorId,
      categoryId: category.id,
      tags: { create: tagConnections },
    },
    include: {
      tags: { include: { tag: true } },
    },
  })
}

export async function updateArticle(id: string, data: UpdateArticlePayload) {
  const updateData: Prisma.ArticleUpdateInput = {}

  if (data.headline !== undefined) updateData.title = data.headline
  if (data.summary !== undefined) updateData.summary = data.summary
  if (data.content !== undefined)
    updateData.fullContent = JSON.stringify(data.content)
  if (data.status !== undefined) updateData.status = toDbStatus(data.status)
  if (data.isBreakingNews !== undefined)
    updateData.isBreaking = data.isBreakingNews
  if (data.scheduledAt !== undefined) {
    updateData.publishedAt = data.scheduledAt
      ? new Date(data.scheduledAt)
      : null
  }

  // Resolve tags outside the transaction (upserts on the Tag table are independent)
  let tagConnections: { tagId: string }[] = []
  if (data.tags !== undefined) {
    tagConnections = await resolveTagConnections(data.tags)
  }

  return db.$transaction(async (tx) => {
    if (data.tags !== undefined) {
      // Replace tags: delete old → create new
      await tx.articleTag.deleteMany({ where: { articleId: id } })
      if (tagConnections.length > 0) {
        updateData.tags = { create: tagConnections }
      }
    }

    return tx.article.update({
      where: { id },
      data: updateData,
      include: {
        tags: { include: { tag: true } },
      },
    })
  })
}

export async function updateArticleStatus(
  id: string,
  status: "draft" | "publish"
) {
  return db.article.update({
    where: { id },
    data: { status: toDbStatus(status) },
  })
}

export async function deleteArticle(id: string) {
  return db.$transaction(async (tx) => {
    await tx.articleTag.deleteMany({ where: { articleId: id } })
    await tx.articleView.deleteMany({ where: { articleId: id } })
    await tx.comment.deleteMany({ where: { articleId: id } })
    return tx.article.delete({ where: { id } })
  })
}
