"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { axiosClient } from "@/lib/axios-client"
import { FeaturedCard } from "../components/feature-card"
import { SectionLayout } from "../components/section-layout"
import { ArticleCard } from "../components/article-card"

type ArticleItem = {
  id: string
  title: string
  slug: string
  summary: string
  thumbnailUrl: string | null
  category: { id: string; name: string; slug: string }
  author: { name: string | null }
  publishedAt: string | null
  viewCount: number
}

type HomepagePayload = {
  trending: ArticleItem[]
  latest: ArticleItem[]
  forYou: ArticleItem[]
  nextCategorySlug?: string
}

type CategorySection = {
  category: { id: string; name: string; slug: string }
  articles: ArticleItem[]
}

export function HomePage() {
  const [homepage, setHomepage] = useState<HomepagePayload | null>(null)
  const [categorySections, setCategorySections] = useState<CategorySection[]>(
    []
  )
  const [nextCategory, setNextCategory] = useState<string | undefined>(
    undefined
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSection, setIsLoadingSection] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    axiosClient
      .get<{ success: true; data: HomepagePayload }>("/api/v1/homepage")
      .then((res) => {
        setHomepage(res.data.data)
        setNextCategory(res.data.data.nextCategorySlug ?? undefined)
      })
      .catch((err) => {
        console.error(err)
        setError("Unable to load homepage data. Please try again.")
      })
      .finally(() => setIsLoading(false))
  }, [])

  const featuredSections = useMemo(
    () => [
      {
        title: "Trending",
        link: "/articles?type=trending",
        articles: homepage?.trending ?? [],
      },
      {
        title: "For you",
        link: "/articles?type=foryou",
        articles: homepage?.forYou ?? [],
      },
      {
        title: "Latest",
        link: "/articles?type=latest",
        articles: homepage?.latest ?? [],
      },
    ],
    [homepage]
  )

  const loadNextCategory = useCallback(async () => {
    if (!nextCategory || isLoadingSection) return
    setIsLoadingSection(true)

    try {
      const response = await axiosClient.get<{
        success: true
        data: {
          articles: ArticleItem[]
          category: { id: string; name: string; slug: string }
          nextCategorySlug?: string
        }
      }>(
        `/api/v1/articles?categorySlug=${encodeURIComponent(nextCategory)}&page=1&limit=8`
      )

      const section = response.data.data
      const nextSlug = section.nextCategorySlug ?? undefined

      if (section.articles.length > 0) {
        setCategorySections((current) => [...current, section])
      }

      setNextCategory(nextSlug)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingSection(false)
    }
  }, [nextCategory, isLoadingSection])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !nextCategory) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextCategory && !isLoadingSection) {
          void loadNextCategory()
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [nextCategory, isLoadingSection, loadNextCategory])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-8">
            <FeaturedCard />
          </div>

          <aside className="hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 xl:block dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              Stay informed
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Trending, recommended, and latest sections are loaded first.
              Scroll to load category-based sections on demand.
            </p>
          </aside>
        </div>
        <div className="flex w-full flex-col gap-2">
          {isLoading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              Loading homepage sections…
            </div>
          ) : error ? (
            <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-10 text-center text-rose-800 shadow-sm dark:border-rose-700/50 dark:bg-rose-950 dark:text-rose-200">
              <p>{error}</p>
            </div>
          ) : (
            featuredSections.map((section) =>
              section.articles.length > 0 ? (
                <SectionLayout
                  key={section.title}
                  title={section.title}
                  href={section.link}
                  description={`Hand-picked ${section.title.toLowerCase()} stories updated for you.`}
                >
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {section.articles.slice(0, 4).map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        href={`/articles?type=${section.title.toLowerCase()}`}
                      />
                    ))}
                  </div>
                </SectionLayout>
              ) : null
            )
          )}

          {categorySections.map((section) => (
            <SectionLayout
              key={section.category.slug}
              title={section.category.name}
              href={`/articles?category=${encodeURIComponent(section.category.slug)}`}
            >
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {section.articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    href={`/articles?category=${encodeURIComponent(section.category.slug)}`}
                  />
                ))}
              </div>
            </SectionLayout>
          ))}

          <div ref={sentinelRef} />
          {isLoadingSection ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Loading more categories…
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
