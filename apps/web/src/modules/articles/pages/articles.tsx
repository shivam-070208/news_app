"use client"

import { useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { SectionLayout } from "@/modules/home/components/section-layout"
import { ArticleCard } from "@/modules/home/components/article-card"
import { useArticles } from "@/modules/articles/hooks/useArticles"

const labelForType = (
  type?: string | null,
  category?: string | null,
  q?: string | null
) => {
  if (q) return `Search results for “${q}”`
  if (category) return `Category: ${category}`
  switch (type) {
    case "trending":
      return "Trending articles"
    case "foryou":
      return "Recommended for you"
    case "latest":
    default:
      return "Latest stories"
  }
}

export function ArticlesPage() {
  const searchParams = useSearchParams()
  const type = searchParams.get("type")
  const category = searchParams.get("category")
  const q = searchParams.get("q")

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useArticles({ type, category, q })

  const articles = useMemo(
    () => data?.pages.flatMap((page) => page.articles) ?? [],
    [data]
  )

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionLayout
          title={labelForType(type, category, q)}
          href={
            category
              ? `/articles?category=${encodeURIComponent(category)}`
              : `/articles?type=${type ?? "latest"}`
          }
        >
          {isLoading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Loading stories…
              </p>
            </div>
          ) : isError ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-rose-800 shadow-sm dark:border-rose-700/50 dark:bg-rose-950 dark:text-rose-200">
              <p className="text-sm">
                Unable to load articles. Please refresh.
              </p>
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No articles found matching your query.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  href={`/articles?type=${type ?? "latest"}`}
                />
              ))}
            </div>
          )}
        </SectionLayout>

        <div ref={sentinelRef} className="mt-6" />
        {isFetchingNextPage ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading more articles…
          </p>
        ) : null}
      </section>
    </main>
  )
}
