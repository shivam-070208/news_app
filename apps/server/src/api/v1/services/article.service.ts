import { db } from "@workspace/db"
import type { ArticleStatus } from "@workspace/db/types/enums"

export type ArticlePreview = {
  id: string
  title: string
  slug: string
  summary: string
  thumbnailUrl: string | null
  author: {
    id: string
    name: string | null
  }
  category: {
    id: string
    name: string
    slug: string
  }
  viewCount: number
  publishedAt: string | null
}

export async function getTrendingArticles(
  page: number,
  limit: number
): Promise<{ articles: ArticlePreview[]; total: number }> {
  const skip = (page - 1) * limit

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
      },
      skip,
      take: limit,
      orderBy: [
        { viewCount: "desc" },
        { publishedAt: "desc" },
        { updatedAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        thumbnailUrl: true,
        viewCount: true,
        publishedAt: true,
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    db.article.count({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
      },
    }),
  ])

  return { articles: mapArticles(articles), total }
}

export async function getLatestArticles(
  page: number,
  limit: number
): Promise<{ articles: ArticlePreview[]; total: number }> {
  const skip = (page - 1) * limit

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
      },
      skip,
      take: limit,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        thumbnailUrl: true,
        viewCount: true,
        publishedAt: true,
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    db.article.count({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
      },
    }),
  ])

  return { articles: mapArticles(articles), total }
}

async function getUserTopCategoryIds(
  userId: string,
  limit = 5
): Promise<string[]> {
  const clicked = await db.userCategoryClick.findMany({
    where: { userId },
    orderBy: { count: "desc" },
    take: limit,
    select: { categoryId: true },
  })

  return clicked.map((item) => item.categoryId)
}

export async function getPersonalizedArticles(
  userId: string | undefined,
  page: number,
  limit: number
): Promise<{ articles: ArticlePreview[]; total: number }> {
  if (!userId) {
    return getLatestArticles(page, limit)
  }

  const topCategoryIds = await getUserTopCategoryIds(userId, 5)
  if (topCategoryIds.length === 0) {
    return getLatestArticles(page, limit)
  }

  const skip = (page - 1) * limit

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
        categoryId: { in: topCategoryIds },
      },
      skip,
      take: limit * 2,
      orderBy: [{ publishedAt: "desc" }, { viewCount: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        thumbnailUrl: true,
        viewCount: true,
        publishedAt: true,
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    db.article.count({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
        categoryId: { in: topCategoryIds },
      },
    }),
  ])

  const mixed = mixArticlesByCategory(articles).slice(0, limit)
  return { articles: mixed, total }
}

export async function getCategoryArticlesBySlug(
  categorySlug: string,
  page: number,
  limit: number
): Promise<{
  articles: ArticlePreview[]
  total: number
  category: { id: string; name: string; slug: string }
}> {
  const category = await db.category.findUnique({
    where: { slug: categorySlug },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  })

  if (!category) {
    return { articles: [], total: 0, category: null as any }
  }

  const skip = (page - 1) * limit
  const [articles, total] = await Promise.all([
    db.article.findMany({
      where: {
        categoryId: category.id,
        status: "PUBLISHED",
        publishedAt: { not: null },
      },
      skip,
      take: limit,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        thumbnailUrl: true,
        viewCount: true,
        publishedAt: true,
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    db.article.count({
      where: {
        categoryId: category.id,
        status: "PUBLISHED",
        publishedAt: { not: null },
      },
    }),
  ])

  return {
    articles: mapArticles(articles),
    total,
    category,
  }
}

export async function getSearchArticles(
  query: string,
  page: number,
  limit: number
): Promise<{ articles: ArticlePreview[]; total: number }> {
  const skip = (page - 1) * limit
  const searchQuery = query.trim()

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { summary: { contains: searchQuery, mode: "insensitive" } },
          { fullContent: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      skip,
      take: limit,
      orderBy: [{ publishedAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        thumbnailUrl: true,
        viewCount: true,
        publishedAt: true,
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    }),
    db.article.count({
      where: {
        status: "PUBLISHED",
        publishedAt: { not: null },
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { summary: { contains: searchQuery, mode: "insensitive" } },
          { fullContent: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
    }),
  ])

  return { articles: mapArticles(articles), total }
}

export async function getHomepageSections(
  limit: number,
  userId?: string
): Promise<{
  trending: ArticlePreview[]
  latest: ArticlePreview[]
  forYou: ArticlePreview[]
  nextCategorySlug?: string
}> {
  const [trendingResult, latestResult, forYouResult, nextCategorySlug] =
    await Promise.all([
      getTrendingArticles(1, limit),
      getLatestArticles(1, limit),
      getPersonalizedArticles(userId, 1, limit),
      getNextCategorySlug(),
    ])
  console.log(forYouResult)
  return {
    trending: trendingResult.articles,
    latest: latestResult.articles,
    forYou: forYouResult.articles,
    nextCategorySlug,
  }
}

export async function getNextCategorySlug(
  afterCategorySlug?: string
): Promise<string | undefined> {
  const categories = await db.category.findMany({
    where: {
      articles: {
        some: {
          status: "PUBLISHED",
          publishedAt: { not: null },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    select: {
      slug: true,
    },
  })

  if (categories.length === 0) {
    return undefined
  }

  if (!afterCategorySlug) {
    return categories[0]?.slug
  }

  const currentIndex = categories.findIndex(
    (category) => category.slug === afterCategorySlug
  )

  if (currentIndex < 0 || currentIndex === categories.length - 1) {
    return undefined
  }

  return categories[currentIndex + 1]?.slug
}

export async function recordArticleView(
  articleId: string,
  userId?: string
): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.article.updateMany({
      where: { id: articleId },
      data: { viewCount: { increment: 1 } },
    })

    await tx.articleView.create({
      data: {
        articleId,
        userId: userId ?? undefined,
        ipHash: userId ? `user:${userId}` : "anonymous",
      },
    })
  })
}

export async function listArticles({
  page,
  limit,
  type,
  categorySlug,
  q,
  userId,
}: {
  page: number
  limit: number
  type?: "trending" | "latest" | "foryou"
  categorySlug?: string
  q?: string
  userId?: string
}): Promise<{
  data:
    | { articles: ArticlePreview[]; category?: undefined }
    | {
        articles: ArticlePreview[]
        category: { id: string; name: string; slug: string } | null
        nextCategorySlug?: string
      }
  total: number
}> {
  if (categorySlug) {
    const section = await getCategoryArticlesBySlug(categorySlug, page, limit)
    return {
      data: {
        articles: section.articles,
        category: section.category,
        nextCategorySlug: await getNextCategorySlug(categorySlug),
      },
      total: section.total,
    }
  }

  if (q) {
    const searchResult = await getSearchArticles(q, page, limit)
    return {
      data: { articles: searchResult.articles },
      total: searchResult.total,
    }
  }

  if (type === "trending") {
    const result = await getTrendingArticles(page, limit)
    return { data: { articles: result.articles }, total: result.total }
  }

  if (type === "foryou") {
    const result = await getPersonalizedArticles(userId, page, limit)

    return { data: { articles: result.articles }, total: result.total }
  }

  const result = await getLatestArticles(page, limit)
  return { data: { articles: result.articles }, total: result.total }
}

function mapArticles(
  articles: Array<
    | Awaited<ReturnType<typeof db.article.findMany>>[number]
    | {
        id: string
        title: string
        slug: string
        summary: string
        thumbnailUrl: string | null
        viewCount: number
        publishedAt: Date | null
        author: { id: string; name: string | null }
        category: { id: string; name: string; slug: string }
      }
  >
): ArticlePreview[] {
  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    thumbnailUrl: article.thumbnailUrl,
    viewCount: article.viewCount,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    author: {
      id: article.author.id,
      name: article.author.name,
    },
    category: {
      id: article.category.id,
      name: article.category.name,
      slug: article.category.slug,
    },
  }))
}

function mixArticlesByCategory(articles: ArticlePreview[]): ArticlePreview[] {
  const buckets: Record<string, ArticlePreview[]> = {}
  articles.forEach((article) => {
    const key = article.category.slug
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(article)
  })

  const keys = Object.keys(buckets)
  const mixed: ArticlePreview[] = []
  let round = 0

  while (mixed.length < articles.length) {
    let added = false
    for (const key of keys) {
      const bucket = buckets[key]
      if (!bucket) continue
      const article = bucket[round]
      if (article) {
        mixed.push(article)
        added = true
        if (mixed.length >= articles.length) break
      }
    }

    if (!added) break
    round += 1
  }

  return mixed
}
