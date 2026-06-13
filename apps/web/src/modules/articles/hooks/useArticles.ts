import { useInfiniteQuery } from "@tanstack/react-query"
import { axiosClient } from "@/lib/axios-client"

export type ArticleListItem = {
  id: string
  title: string
  slug: string
  summary: string
  thumbnailUrl: string | null
  viewCount: number
  publishedAt: string | null
  author: { name: string | null }
  category: { name: string; slug: string }
}

export type ArticleListResponse = {
  articles: ArticleListItem[]
  category?: { id: string; name: string; slug: string }
}

const PAGE_SIZE = 8

async function fetchArticles(
  page: number,
  params: {
    type?: string | null
    category?: string | null
    q?: string | null
  }
) {
  const searchParams = new URLSearchParams()
  searchParams.set("page", String(page))
  searchParams.set("limit", String(PAGE_SIZE))

  if (params.type) searchParams.set("type", params.type)
  if (params.category) searchParams.set("categorySlug", params.category)
  if (params.q) searchParams.set("q", params.q)

  const { data } = await axiosClient.get<{
    success: true
    data: ArticleListResponse
    meta: { page: number; limit: number; total: number; totalPages: number }
  }>(`/api/v1/articles?${searchParams.toString()}`)

  return {
    page,
    articles: data.data.articles,
    category: data.data.category,
    hasMore: page < data.meta.totalPages,
  }
}

export function useArticles(params: {
  type?: string | null
  category?: string | null
  q?: string | null
}) {
  return useInfiniteQuery({
    queryKey: [
      "articles",
      params.type ?? "latest",
      params.category ?? "",
      params.q ?? "",
    ],
    queryFn: ({ pageParam = 1 }) => fetchArticles(pageParam as number, params),

    initialPageParam: 1,

    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,

    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  })
}
