import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query"
import { axiosClient } from "@/lib/axios-client"

export type CategoryItem = {
  id: string
  name: string
  slug: string
  clicks?: number
}

interface CategoryPageData {
  data: CategoryItem[]
  favorites: CategoryItem[]
}

interface CategoryApiResponse {
  success: true
  data: CategoryPageData
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const CATEGORY_PAGE_SIZE = 20

async function fetchCategoryPage(
  page: number,
  search?: string
): Promise<CategoryApiResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(CATEGORY_PAGE_SIZE),
  })

  if (search?.trim()) {
    params.set("search", search.trim())
  }

  const { data } = await axiosClient.get<CategoryApiResponse>(
    `/api/v1/categories/public?${params.toString()}`
  )

  return data
}

export function useCategories(
  search?: string
): UseInfiniteQueryResult<CategoryApiResponse, Error> {
  return useInfiniteQuery<
    CategoryApiResponse,
    Error,
    CategoryApiResponse,
    ["categories", string],
    number
  >({
    queryKey: ["categories", search ?? ""],
    queryFn: async ({ pageParam, signal }) => {
      // pageParam may be `unknown`, so cast it to `number` or use default 1
      const page = typeof pageParam === "number" ? pageParam : 1
      return fetchCategoryPage(page, search)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  })
}
