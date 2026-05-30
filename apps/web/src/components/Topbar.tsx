"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  useCategories,
  type CategoryItem,
} from "@/modules/category/hooks/useCategories"
import type { InfiniteData } from "@tanstack/react-query"

import { signOut, getSession, type AuthSession } from "@/lib/auth-client"

const suggestions = [
  {
    label: "Latest headlines",
    description: "Explore the most recent stories from the newsroom.",
  },
  {
    label: "Editorial picks",
    description: "Browse curated articles chosen by our editors.",
  },
  {
    label: "Business updates",
    description: "See market news, company coverage, and finance insight.",
  },
  {
    label: "Culture stories",
    description: "Discover lifestyle, media, and community highlights.",
  },
]

const profilePlaceholder = "/profile.png"

export function Topbar() {
  const router = useRouter()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  console.log(session)
  useEffect(() => {
    let isMounted = true
    setLoadingSession(true)
    getSession()
      .then((s) => {
        if (isMounted) setSession(s)
      })
      .finally(() => {
        if (isMounted) setLoadingSession(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim()) {
      return suggestions
    }

    const normalized = searchTerm.trim().toLowerCase()
    return suggestions.filter(
      (item) =>
        item.label.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized)
    )
  }, [searchTerm])

  const profileLabel =
    session?.user.name || session?.user.email?.split("@")[0] || "Profile"
  const profileSrc = session?.user.image || profilePlaceholder

  const { data: categoryData } = useCategories("")
  const categoryBarItems =
    (
      categoryData as
        | InfiniteData<{
            success: true
            data: { data: CategoryItem[] }
            meta: { page: number }
          }>
        | undefined
    )?.pages
      .flatMap((page) => page.data.data)
      .slice(0, 9) ?? []

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setSession(null)
      router.push("/")
    }
  }

  return (
    <>
      <div className="sticky top-0 z-10 flex justify-between gap-3 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span className="sr-only">Open menu</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 stroke-current"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 whitespace-nowrap italic"
            >
              <span className="text-xs font-semibold tracking-[0.45em] text-slate-500 uppercase dark:text-slate-400">
                NEWS
              </span>
              <span className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                WALLAH
              </span>
            </Link>
          </div>
        </div>

        <div className="hidden flex-1 items-center gap-3 md:flex">
          <div className="relative flex w-full max-w-2xl items-center rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="mr-3 h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400"
            >
              <path
                d="M11 19a8 8 0 100-16 8 8 0 000 16z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && searchTerm.trim()) {
                  router.push(
                    `/articles?q=${encodeURIComponent(searchTerm.trim())}`
                  )
                  setIsSearchOpen(false)
                }
              }}
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500"
              placeholder="Search stories, people, topics..."
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 md:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Open search"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 stroke-current"
            >
              <path
                d="M11 19a8 8 0 100-16 8 8 0 000 16z"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M21 21l-4.35-4.35"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {session && !loadingSession ? (
            <div className="relative">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 shadow-sm transition hover:brightness-95 dark:border-slate-800 dark:bg-slate-900"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                aria-label="Open profile menu"
              >
                <Image
                  src={profileSrc}
                  alt={profileLabel}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              </button>

              {isProfileMenuOpen ? (
                <div className="absolute right-0 z-99 mt-3 w-48 overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950">
                  <div className="space-y-1 p-3 text-sm text-slate-700 dark:text-slate-200">
                    <div className="truncate font-medium">{profileLabel}</div>
                    <div className="text-xs text-slate-500">Signed in</div>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800" />
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm text-slate-900 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-900"
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      router.push("/dashboard")
                    }}
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm text-slate-900 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-900"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            !loadingSession && (
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-0 bg-transparent outline-0"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  className="rounded-lg px-4 py-2"
                  size="sm"
                  asChild
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )
          )}
        </div>
      </div>

      <div className="sticky top-16 z-9 flex justify-between border-t border-slate-200 bg-white/95 px-4 py-3 shadow-sm shadow-slate-900/5 backdrop-blur-sm sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950/90">
        <div className="max-w-9xl mx-auto flex flex-wrap gap-2 overflow-x-auto py-1">
          {categoryBarItems.length > 0 ? (
            categoryBarItems.map((item) => (
              <Link
                key={item.id}
                href={`/articles?category=${encodeURIComponent(item.slug)}`}
                className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary/70 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                {item.name}
              </Link>
            ))
          ) : (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Loading top categories...
            </span>
          )}
        </div>
        <div className="">
          <Link
            href="/category"
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold tracking-[0.35em] text-slate-700 uppercase transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Show more
          </Link>
        </div>
      </div>

      {isSearchOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-950/70 px-4 py-6 backdrop-blur-sm sm:px-6">
          <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-950/20 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm tracking-[0.3em] text-slate-500 uppercase dark:text-slate-400">
                  Search
                </p>
                <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
                  Find stories and topics
                </h2>
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 stroke-current"
                >
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <label className="sr-only" htmlFor="topbar-search">
                  Search stories
                </label>
                <input
                  id="topbar-search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search news, authors, or topics..."
                  className="w-full bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Suggestions
                </p>
                <div className="mt-4 space-y-3">
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      className="w-full rounded-3xl border border-slate-200 p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 dark:border-slate-800 dark:hover:bg-slate-800"
                      onClick={() => {
                        setSearchTerm(suggestion.label)
                        router.push(
                          `/articles?q=${encodeURIComponent(suggestion.label)}`
                        )
                        setIsSearchOpen(false)
                      }}
                    >
                      <p className="font-medium text-slate-950 dark:text-white">
                        {suggestion.label}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {suggestion.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-30 flex bg-slate-950/50">
          <div className="w-full max-w-xs bg-white p-6 shadow-2xl shadow-slate-950/20 dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-slate-950 dark:text-white">
                Menu
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close menu"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5 stroke-current"
                >
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-0 bg-transparent outline-0"
                onClick={() => setIsSidebarOpen(false)}
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                className="rounded-lg py-2"
                size="sm"
                asChild
                onClick={() => setIsSidebarOpen(false)}
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          </div>
          <button
            type="button"
            className="flex-1 bg-transparent"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        </div>
      ) : null}
    </>
  )
}
