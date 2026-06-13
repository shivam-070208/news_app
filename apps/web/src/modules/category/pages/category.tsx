"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import {
  useCategories,
  type CategoryItem,
} from "@/modules/category/hooks/useCategories"
import { axiosClient } from "@/lib/axios-client"

function CategoryExplorer() {
  const [search, setSearch] = useState("")
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const {
    data,
    error,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useCategories(search)

  const categories = useMemo(
    () => data?.pages.flatMap((page) => page.data.data) ?? [],
    [data]
  )

  const favorites = data?.pages[0]?.data.favorites ?? []
  const total = data?.pages[0]?.meta.total ?? 0
  console.log(data)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      }
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const handleCategoryClick = async (category: CategoryItem) => {
    void axiosClient
      .post(`/api/v1/categories/${category.id}/click`)
      .catch((error) => {
        console.error("Category click tracking failed:", error)
      })
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm tracking-[0.35em] text-slate-500 uppercase dark:text-slate-400">
              Category
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Browse all categories
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/">Back home</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                    All categories
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Scroll to load more categories automatically.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                  {total} categories
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="category-search" className="sr-only">
                  Search categories
                </label>
                <input
                  id="category-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search categories"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {isLoading ? (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Loading categories…
                  </p>
                </div>
              ) : isError ? (
                <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm dark:border-rose-700/50 dark:bg-rose-950 dark:text-rose-200">
                  <p className="text-sm">
                    Unable to load categories. Please refresh.
                  </p>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                    {error?.message}
                  </p>
                </div>
              ) : categories.length === 0 ? (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No categories found.
                  </p>
                </div>
              ) : (
                categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/articles?category=${encodeURIComponent(category.slug)}`}
                    onClick={() => handleCategoryClick(category)}
                    className="border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 transition hover:border-primary/70 hover:bg-primary/5"
                  >
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {category.name}
                      </p>
                    </div>
                  </Link>
                ))
              )}
              <div ref={sentinelRef} />
              {isFetchingNextPage ? (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Loading more categories…
                  </p>
                </div>
              ) : (
                ""
              )}
              {isFetching && !isLoading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Updating categories…
                </p>
              ) : null}
            </div>
          </div>

          <aside className="hidden space-y-6 md:inline">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                    Recent
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {favorites.length}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {favorites.length > 0
                  ? favorites.map((favorite) => (
                      <Link
                        href={`/articles?category=${encodeURIComponent(favorite.slug)}`}
                        key={favorite.id}
                        className="border border-slate-200 bg-slate-50 text-sm text-slate-700"
                      >
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {favorite.name}
                        </p>
                      </Link>
                    ))
                  : ""}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default function CategoryPage() {
  return <CategoryExplorer />
}
