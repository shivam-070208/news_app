"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tag {
  tag: { id: string; name: string }
}

interface Article {
  id: string
  title: string
  summary: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  isBreaking: boolean
  createdAt: string
  publishedAt: string | null
  tags: Tag[]
}

interface PaginatedResult {
  items: Article[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type FilterStatus = "all" | "PUBLISHED" | "DRAFT"

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({
  status,
  publishedAt,
}: {
  status: string
  publishedAt: string | null
}) {
  const isScheduled =
    status === "DRAFT" && publishedAt && new Date(publishedAt) > new Date()
  const display = isScheduled
    ? "Scheduled"
    : status === "PUBLISHED"
      ? "Published"
      : "Draft"
  const colors = isScheduled
    ? "bg-purple-100 text-purple-700"
    : status === "PUBLISHED"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-gray-100 text-gray-600"

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${colors}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isScheduled ? "bg-purple-500" : status === "PUBLISHED" ? "bg-emerald-500" : "bg-gray-400"}`}
      />
      {display}
    </span>
  )
}

function BreakingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      BREAKING
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="h-20 w-28 shrink-0 rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded-full bg-gray-100" />
            <div className="h-5 w-16 rounded-full bg-gray-100" />
          </div>
          <div className="h-5 w-3/4 rounded bg-gray-100" />
          <div className="h-4 w-full rounded bg-gray-50" />
          <div className="h-4 w-2/3 rounded bg-gray-50" />
        </div>
      </div>
    </div>
  )
}

function ArticleCard({
  article,
  onDelete,
  onStatusChange,
}: {
  article: Article
  onDelete: (id: string) => void
  onStatusChange: (id: string, currentStatus: string) => void
}) {
  const [actionLoading, setActionLoading] = useState(false)

  const handleToggleStatus = async () => {
    setActionLoading(true)
    await onStatusChange(article.id, article.status)
    setActionLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return
    setActionLoading(true)
    await onDelete(article.id)
    setActionLoading(false)
  }

  const isPublished = article.status === "PUBLISHED"

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-gray-200 hover:shadow-md">
      {/* Breaking ribbon */}
      {article.isBreaking && (
        <div className="absolute top-0 left-0 h-full w-1 rounded-l-2xl bg-red-500" />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Badges row */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge
              status={article.status}
              publishedAt={article.publishedAt}
            />
            {article.isBreaking && <BreakingBadge />}
            {article.tags?.slice(0, 2).map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600"
              >
                {tag.name}
              </span>
            ))}
          </div>

          {/* Headline */}
          <h2 className="mb-1.5 line-clamp-2 text-base leading-snug font-bold text-gray-900 group-hover:text-blue-700">
            {article.title}
          </h2>

          {/* Summary */}
          <p className="line-clamp-2 text-sm leading-relaxed text-gray-500">
            {article.summary}
          </p>

          {/* Date */}
          <p className="mt-2 text-xs text-gray-400">
            {new Date(article.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          <Link
            href={`/addNews?id=${article.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </Link>

          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              isPublished
                ? "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isPublished ? (
                <>
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </>
              ) : (
                <>
                  <polyline points="20 6 9 17 4 12" />
                </>
              )}
            </svg>
            {isPublished ? "Unpublish" : "Publish"}
          </button>

          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewsManagementPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<FilterStatus>("all")

  const fetchArticles = useCallback(
    async (pageNum: number, statusFilter: FilterStatus) => {
      try {
        setLoading(true)
        setError(null)
        const statusParam =
          statusFilter !== "all" ? `&status=${statusFilter}` : ""
        const res = await fetch(
          `/api/admin/articles?page=${pageNum}&limit=10${statusParam}`
        )
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || "Failed to fetch articles")
        }
        const { data } = (await res.json()) as { data: PaginatedResult }
        setArticles(data.items)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching articles")
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchArticles(page, filter)
  }, [page, filter, fetchArticles])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      // Stay on current page, but go back one if now empty
      await fetchArticles(page, filter)
    } catch {
      setError("Failed to delete article. Please try again.")
    }
  }

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "draft" : "publish"
    try {
      const res = await fetch(`/api/admin/articles/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      await fetchArticles(page, filter)
    } catch {
      setError("Failed to update article status. Please try again.")
    }
  }

  const handleFilterChange = (f: FilterStatus) => {
    setFilter(f)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Editorial Feed
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and manage recent story performance.{" "}
            {!loading && (
              <span className="font-medium text-gray-700">
                {total} articles total.
              </span>
            )}
          </p>
        </div>
        <Link
          href="/addNews"
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-700"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New Article
        </Link>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="mb-6 flex w-fit items-center gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1">
        {(["all", "PUBLISHED", "DRAFT"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              filter === f
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {f === "all" ? "All" : f === "PUBLISHED" ? "Published" : "Drafts"}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 text-gray-300"
          >
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
          </svg>
          <p className="text-sm font-medium text-gray-500">
            {filter !== "all"
              ? `No ${filter.toLowerCase()} articles found.`
              : "No articles yet."}
          </p>
          <Link
            href="/addNews"
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Write your first article
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
