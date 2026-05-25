"use client"

import React, { useEffect, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002"

interface PreferenceData {
  categoryIds: string[]
  tagIds: string[]
  receiveEmails: boolean
  emailFrequency: "DAILY" | "WEEKLY"
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
}

// ─── Small reusable pill/toggle chip ─────────────────────────────────────────

function Chip({
  id,
  label,
  selected,
  onClick,
}: {
  id: string
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 ${
        selected
          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-gray-300 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
      }`}
    >
      {selected && <span className="text-xs">✓</span>}
      {label}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubscriptionPage() {
  const [preferences, setPreferences] = useState<PreferenceData>({
    categoryIds: [],
    tagIds: [],
    receiveEmails: false,
    emailFrequency: "DAILY",
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const init = async () => {
      try {
        const [catRes, tagRes, prefRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/categories`, { credentials: "include" }),
          fetch(`${API_URL}/api/v1/tags`, { credentials: "include" }),
          fetch(`${API_URL}/api/v1/preferences`, { credentials: "include" }),
        ])

        if (catRes.ok) {
          const d = await catRes.json()
          setCategories(d.data ?? [])
        }

        if (tagRes.ok) {
          const d = await tagRes.json()
          setTags(d.data ?? [])
        }

        if (prefRes.ok) {
          const d = await prefRes.json()
          if (d.data) {
            setPreferences({
              categoryIds: d.data.categoryIds ?? [],
              tagIds: d.data.tagIds ?? [],
              receiveEmails: d.data.receiveEmails ?? false,
              emailFrequency: d.data.emailFrequency ?? "DAILY",
            })
          }
        } else if (prefRes.status === 401) {
          showToast("Please log in to manage your preferences.", "error")
        }
      } catch {
        showToast("Could not connect to the server. Is it running?", "error")
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const toggle = (field: "categoryIds" | "tagIds", id: string) => {
    setPreferences((prev) => {
      const list = prev[field]
      const isSelected = list.includes(id)
      return {
        ...prev,
        [field]: isSelected ? list.filter((x) => x !== id) : [...list, id],
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(preferences),
      })

      if (res.ok) {
        showToast("Preferences saved successfully!", "success")
      } else if (res.status === 401) {
        showToast("You must be logged in to save preferences.", "error")
      } else if (res.status === 400) {
        const err = await res.json()
        showToast(
          err.error?.message ??
            "Validation error. Please check your selections.",
          "error"
        )
      } else {
        showToast("Failed to save preferences. Please try again.", "error")
      }
    } catch {
      showToast("An error occurred. Please check your connection.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading your preferences...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-zinc-950">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}

      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl transition-all duration-300 hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="px-6 py-8 sm:p-10">
            <h1 className="mb-1 text-3xl font-bold text-gray-900 dark:text-white">
              Subscription Settings
            </h1>
            <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
              Customize what news you follow and how you receive updates.
            </p>

            {/* ── Email Toggle ── */}
            <div className="mb-10 rounded-xl border border-gray-100 bg-gray-50 p-6 dark:border-zinc-700/50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Email Newsletters
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    Receive a personalized digest in your inbox.
                  </p>
                </div>
                <button
                  id="email-toggle"
                  type="button"
                  onClick={() =>
                    setPreferences((p) => ({
                      ...p,
                      receiveEmails: !p.receiveEmails,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:outline-none ${
                    preferences.receiveEmails
                      ? "bg-indigo-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      preferences.receiveEmails
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {preferences.receiveEmails && (
                <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-5 dark:border-zinc-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Delivery Frequency
                  </span>
                  <select
                    id="email-frequency"
                    value={preferences.emailFrequency}
                    onChange={(e) =>
                      setPreferences((p) => ({
                        ...p,
                        emailFrequency: e.target.value as "DAILY" | "WEEKLY",
                      }))
                    }
                    className="block w-44 rounded-lg border border-gray-300 bg-white py-1.5 pr-10 pl-3 text-sm text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="DAILY">Daily Digest</option>
                    <option value="WEEKLY">Weekly Digest</option>
                  </select>
                </div>
              )}
            </div>

            {/* ── Categories ── */}
            <div className="mb-10">
              <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
                News Categories
              </h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Select the topics you want to follow. Your email digest will
                include articles from these categories.
              </p>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400 italic dark:text-gray-500">
                  No categories available yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {categories.map((cat) => (
                    <Chip
                      key={cat.id}
                      id={`cat-${cat.slug}`}
                      label={cat.name}
                      selected={preferences.categoryIds.includes(cat.id)}
                      onClick={() => toggle("categoryIds", cat.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Tags ── */}
            <div className="mb-10">
              <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
                Topics &amp; Tags
              </h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Follow specific topics to further refine your news feed and
                email digest.
              </p>
              {tags.length === 0 ? (
                <p className="text-sm text-gray-400 italic dark:text-gray-500">
                  No tags available yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Chip
                      key={tag.id}
                      id={`tag-${tag.id}`}
                      label={`# ${tag.name}`}
                      selected={preferences.tagIds.includes(tag.id)}
                      onClick={() => toggle("tagIds", tag.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Save ── */}
            <div className="mt-8 flex items-center justify-end border-t border-gray-100 pt-6 dark:border-zinc-800">
              <button
                id="save-preferences"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {isSaving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
