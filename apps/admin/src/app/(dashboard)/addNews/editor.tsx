"use client"

import { useEffect, useRef, useState } from "react"
import EditorJS, { type ToolConstructable } from "@editorjs/editorjs"
import Header from "@editorjs/header"
import List from "@editorjs/list"
import Paragraph from "@editorjs/paragraph"
import Quote from "@editorjs/quote"
import Table from "@editorjs/table"
import Marker from "@editorjs/marker"
import InlineCode from "@editorjs/inline-code"
import Underline from "@editorjs/underline"
import ImageTool from "@editorjs/image"

// ─── Types ────────────────────────────────────────────────────────
type ActivePanel = null | "link" | "image-url" | "image-file"
type PublishStatus = "draft" | "publish"

// ─── Toolbar button ───────────────────────────────────────────────
function TBtn({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void
  title: string
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault() // prevent editor losing focus
        onClick()
      }}
      className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-gray-200" />
}

// ─── Main component ───────────────────────────────────────────────
export default function Editor({ articleId }: { articleId?: string }) {
  const editorRef = useRef<EditorJS | null>(null)
  const isReadyRef = useRef<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const holderRef = useRef<HTMLDivElement>(null)

  const [headline, setHeadline] = useState("")
  const [summary, setSummary] = useState("")
  const [panel, setPanel] = useState<ActivePanel>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [toastMsg, setToastMsg] = useState("Saved successfully!")
  const [isFetching, setIsFetching] = useState(!!articleId)
  const [isSaving, setIsSaving] = useState(false)
  const [initialContent, setInitialContent] = useState<any>(null)

  // ── Publishing sidebar state ──────────────────────────────────
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("draft")
  const [scheduledAt, setScheduledAt] = useState("")
  const [isBreakingNews, setIsBreakingNews] = useState(false)
  const [tags, setTags] = useState<string[]>(["Politics", "Elections"])
  const [tagInput, setTagInput] = useState("")
  const [editorWordCount, setEditorWordCount] = useState(0)
  const SUGGESTED_TAGS = [
    "Tech",
    "Sports",
    "Global",
    "Business",
    "Science",
    "Health",
  ]

  // ── Focus the editor content area so execCommand works ──────────
  const refocusEditor = () => {
    const editable = holderRef.current?.querySelector<HTMLElement>(
      "[contenteditable=true]"
    )
    editable?.focus()
  }

  // ── Fetch existing article if articleId is provided ────────────
  useEffect(() => {
    if (!articleId) return

    async function fetchArticle() {
      try {
        const res = await fetch(`/api/admin/articles/${articleId}`)
        if (res.ok) {
          const { data } = await res.json()
          setHeadline(data.title || "")
          setSummary(data.summary || "")
          setPublishStatus(
            data.status?.toLowerCase() === "published" ? "publish" : "draft"
          )
          setIsBreakingNews(data.isBreaking || false)

          if (data.publishedAt) {
            // format to YYYY-MM-DDThh:mm for datetime-local input
            const date = new Date(data.publishedAt)
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
            setScheduledAt(date.toISOString().slice(0, 16))
          }

          if (data.tags && Array.isArray(data.tags)) {
            setTags(data.tags.map((t: any) => t.tag.name))
          }

          if (data.fullContent) {
            const parsed = JSON.parse(data.fullContent)
            setInitialContent(parsed)
          }
        }
      } catch (e) {
        console.error("Failed to fetch article", e)
      } finally {
        setIsFetching(false)
      }
    }

    fetchArticle()
  }, [articleId])

  // ── init EditorJS ──────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current || isFetching) return

    editorRef.current = new EditorJS({
      holder: "editorjs-holder",
      data: initialContent || undefined,

      onReady: () => {
        isReadyRef.current = true
      },

      onChange: async (api) => {
        try {
          const data = await api.saver.save()
          // Extract plain text from all block types and count words
          const text = data.blocks
            .map((block) => {
              const d = block.data as Record<string, unknown>
              if (typeof d.text === "string") return d.text
              if (typeof d.caption === "string") return d.caption
              if (Array.isArray(d.items)) return (d.items as string[]).join(" ")
              if (Array.isArray(d.content))
                return (d.content as string[][]).flat().join(" ")
              return ""
            })
            .join(" ")
            // Strip HTML tags left by inline tools
            .replace(/<[^>]+>/g, " ")
          const count = text.trim().split(/\s+/).filter(Boolean).length
          setEditorWordCount(count)
        } catch {
          // silently ignore save errors during onChange
        }
      },

      placeholder:
        "Start writing your story here... Use the toolbar above or click here to begin.",
      tools: {
        header: {
          class: Header as unknown as ToolConstructable,
          inlineToolbar: true,
          config: { levels: [1, 2, 3, 4], defaultLevel: 2 },
        },
        paragraph: {
          class: Paragraph as unknown as ToolConstructable,
          inlineToolbar: true,
        },
        list: {
          class: List as unknown as ToolConstructable,
          inlineToolbar: true,
          config: { defaultStyle: "unordered" },
        },
        quote: {
          class: Quote as unknown as ToolConstructable,
          inlineToolbar: true,
        },
        table: {
          class: Table as unknown as ToolConstructable,
          inlineToolbar: true,
          config: { rows: 2, cols: 3 },
        },
        marker: {
          class: Marker as unknown as ToolConstructable,
        },
        inlineCode: {
          class: InlineCode as unknown as ToolConstructable,
        },
        underline: {
          class: Underline as unknown as ToolConstructable,
        },
        image: {
          class: ImageTool as unknown as ToolConstructable,
          config: {
            uploader: {
              uploadByFile: async (file: File) => {
                const formData = new FormData()
                formData.append("file", file)
                const res = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                })
                return res.json()
              },
              uploadByUrl: async (url: string) => ({
                success: 1,
                file: { url },
              }),
            },
          },
        },
      },
    })

    return () => {
      if (editorRef.current?.destroy) {
        editorRef.current.destroy()
        isReadyRef.current = false
        editorRef.current = null
      }
    }
  }, [isFetching, initialContent])

  // ── Safe block insert — waits for EditorJS async ready ─────────
  const insertBlock = (type: string, data?: Record<string, unknown>) => {
    const editor = editorRef.current
    if (!editor) return
    editor.isReady.then(() => editor.blocks.insert(type, data))
  }

  // ── inline formatting: refocus first, then execCommand ─────────
  const execFmt = (cmd: string, value?: string) => {
    refocusEditor()
    // tiny delay lets the browser restore selection after refocus
    requestAnimationFrame(() => {
      document.execCommand(cmd, false, value ?? "")
    })
  }

  // ── Link insert ───────────────────────────────────────────────
  const togglePanel = (p: ActivePanel) =>
    setPanel((prev) => (prev === p ? null : p))

  const getValidatedUrl = (url: string, isImage = false): string | null => {
    let cleanUrl = url.trim()
    if (!cleanUrl) return null

    // Prepend https:// if it lacks a scheme and isn't a relative/anchor path
    if (
      !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(cleanUrl) &&
      !cleanUrl.startsWith("/") &&
      !cleanUrl.startsWith("#")
    ) {
      cleanUrl = `https://${cleanUrl}`
    }

    try {
      const parsedUrl = new URL(cleanUrl, "http://localhost")
      const allowedSchemes = isImage
        ? ["http:", "https:", "data:"]
        : ["http:", "https:", "mailto:"]

      if (!allowedSchemes.includes(parsedUrl.protocol)) {
        return null
      }

      if (isImage && parsedUrl.protocol === "data:") {
        if (!cleanUrl.startsWith("data:image/")) return null
      }

      if (
        parsedUrl.origin === "http://localhost" &&
        !cleanUrl.startsWith("http://localhost")
      ) {
        return cleanUrl
      }

      return cleanUrl
    } catch {
      return null
    }
  }

  const handleLinkInsert = () => {
    const validUrl = getValidatedUrl(linkUrl)
    if (!validUrl) {
      console.error("Invalid or dangerous URL.")
      return
    }

    refocusEditor()
    requestAnimationFrame(() => {
      document.execCommand("createLink", false, validUrl)
      setLinkUrl("")
      setPanel(null)
    })
  }

  // ── Image from file ───────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()

      if (data.success) {
        insertBlock("image", {
          file: { url: data.file.url },
          caption: "",
          withBorder: false,
          withBackground: false,
          stretched: false,
        })
      } else {
        console.log("Upload failed: " + data.error)
      }
    } catch (err) {
      console.error(err)
      console.log("Error uploading image")
    } finally {
      setPanel(null)
      e.target.value = ""
    }
  }

  // ── Image from URL ─────────────────────────────────────────────
  const handleImageUrlInsert = () => {
    const validUrl = getValidatedUrl(imageUrl, true)
    if (!validUrl) {
      console.error("Invalid or dangerous Image URL.")
      return
    }

    insertBlock("image", {
      file: { url: validUrl },
      caption: "",
      withBorder: false,
      withBackground: false,
      stretched: false,
    })
    setImageUrl("")
    setPanel(null)
  }

  // ── Tag helpers ────────────────────────────────────────────────
  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed))
      setTags((prev) => [...prev, trimmed])
    setTagInput("")
  }
  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag))

  // ── Word / reading-time counters ───────────────────────────────
  const countWords = (str: string) =>
    str.trim().split(/\s+/).filter(Boolean).length
  const wordCount = countWords(headline) + countWords(summary) + editorWordCount
  // Average adult reading speed: 238 wpm (rounded to 200 for comfortable estimate)
  const readingTime =
    wordCount < 1 ? 0 : Math.max(1, Math.round(wordCount / 238))

  // ── Toast helper ───────────────────────────────────────────────
  const showNotification = (
    msg: string,
    type: "success" | "error" = "success"
  ) => {
    setToastMsg(msg)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  // ── Publish Action ─────────────────────────────────────────────
  const handlePublish = async () => {
    if (isSaving) return
    const editor = editorRef.current
    if (!editor) return

    if (!headline.trim()) {
      showNotification("Please enter a headline before saving.", "error")
      return
    }

    setIsSaving(true)
    try {
      const content = await editor.save()
      const payload = {
        headline,
        summary,
        content,
        status: publishStatus,
        scheduledAt: scheduledAt || null,
        isBreakingNews,
        tags,
      }

      const isNew = !articleId
      const url = isNew
        ? "/api/admin/articles"
        : `/api/admin/articles/${articleId}`
      const method = isNew ? "POST" : "PATCH"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.error("Save failed:", body)
        showNotification(
          body.error || "Failed to save. Please try again.",
          "error"
        )
        return
      }

      // After creating, update URL to edit mode without full reload
      if (isNew && body.data?.id) {
        window.history.replaceState(null, "", `/addNews?id=${body.data.id}`)
      }

      const successMsg =
        publishStatus === "publish"
          ? "Article published successfully!"
          : "Draft saved successfully!"
      showNotification(successMsg, "success")
    } catch (err) {
      console.error("Failed to save editor content", err)
      showNotification("An unexpected error occurred.", "error")
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <div className="flex min-h-screen items-start gap-6 px-6 py-8">
      {/* ── LEFT: Main editor column ── */}
      <div className="min-w-0 flex-1 space-y-5">
        {/* ── HEADLINE ── */}
        <section>
          <label className="mb-2 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            Headline
          </label>
          <textarea
            value={headline}
            onChange={(e) => {
              setHeadline(e.target.value)
              // auto-resize
              e.target.style.height = "auto"
              e.target.style.height = e.target.scrollHeight + "px"
            }}
            placeholder="Enter a compelling headline..."
            rows={1}
            className="w-full resize-none overflow-hidden border-none bg-transparent p-0 text-4xl leading-tight font-bold text-gray-900 outline-none placeholder:text-gray-300 focus:ring-0"
          />
          <div className="mt-3 h-px bg-gray-100" />
        </section>

        {/* ── DESCRIPTION ── */}
        <section>
          <label className="mb-2 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            Summary / Description
          </label>
          <textarea
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value)
              e.target.style.height = "auto"
              e.target.style.height = e.target.scrollHeight + "px"
            }}
            placeholder="Write a short summary of the article for social media and SEO..."
            rows={1}
            className="w-full resize-none overflow-hidden border-none bg-transparent p-0 text-base leading-relaxed text-gray-700 outline-none placeholder:text-gray-300 focus:ring-0"
          />
          <div className="mt-3 h-px bg-gray-100" />
        </section>

        {/* ── CONTENT + TOOLBAR ── */}
        <section>
          <label className="mb-3 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            Complete Article Content
          </label>

          {/* ── PERSISTENT TOOLBAR ── */}
          <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            {/* Bold */}
            <TBtn title="Bold" onClick={() => execFmt("bold")}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              </svg>
            </TBtn>

            {/* Italic */}
            <TBtn title="Italic" onClick={() => execFmt("italic")}>
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
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </TBtn>

            {/* Underline */}
            <TBtn title="Underline" onClick={() => execFmt("underline")}>
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
                <path d="M6 4v6a6 6 0 0 0 12 0V4" />
                <line x1="4" y1="20" x2="20" y2="20" />
              </svg>
            </TBtn>

            {/* Strikethrough */}
            <TBtn
              title="Strikethrough"
              onClick={() => execFmt("strikeThrough")}
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
                <path d="M16 4H9a3 3 0 0 0-2.83 4" />
                <path d="M14 12a4 4 0 0 1 0 8H6" />
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
            </TBtn>

            <Divider />

            {/* Link */}
            <TBtn
              title="Insert Link"
              active={panel === "link"}
              onClick={() => togglePanel("link")}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </TBtn>

            {/* Table */}
            <TBtn
              title="Insert Table"
              onClick={() =>
                insertBlock("table", {
                  withHeadings: true,
                  content: [
                    ["", ""],
                    ["", ""],
                  ],
                })
              }
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
              </svg>
            </TBtn>

            {/* Highlight */}
            <TBtn
              title="Highlight selected text"
              onClick={() => execFmt("backColor", "#FEF08A")}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3" />
                <path d="M18 2l4 4-10 10H8v-4L18 2z" />
              </svg>
            </TBtn>

            {/* Image */}
            <TBtn
              title="Insert Image"
              active={panel === "image-url" || panel === "image-file"}
              onClick={() =>
                togglePanel(
                  panel === "image-url" || panel === "image-file"
                    ? null
                    : "image-url"
                )
              }
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </TBtn>

            <Divider />

            {/* Bullet list */}
            <TBtn
              title="Bulleted List"
              onClick={() =>
                insertBlock("list", { style: "unordered", items: [""] })
              }
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </TBtn>

            {/* Ordered list */}
            <TBtn
              title="Numbered List"
              onClick={() =>
                insertBlock("list", { style: "ordered", items: [""] })
              }
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
                <path d="M4 6h1v4" />
                <path d="M4 10h2" />
                <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
              </svg>
            </TBtn>

            {/* Quote */}
            <TBtn
              title="Block Quote"
              onClick={() =>
                insertBlock("quote", {
                  text: "",
                  caption: "",
                  alignment: "left",
                })
              }
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
              </svg>
            </TBtn>

            <Divider />

            {/* + Block */}
            <TBtn
              title="Add paragraph block"
              onClick={() => insertBlock("paragraph", { text: "" })}
            >
              <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Block
              </div>
            </TBtn>
          </div>

          {/* ── LINK PANEL ── */}
          {panel === "link" && (
            <div className="flex items-center gap-2 border border-t-0 border-blue-200 bg-blue-50 px-4 py-2.5">
              <svg
                width="14"
                height="14"
                className="shrink-0 text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <input
                autoFocus
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLinkInsert()
                  if (e.key === "Escape") setPanel(null)
                }}
                className="flex-1 rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={handleLinkInsert}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Apply
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setPanel(null)
                  setLinkUrl("")
                }}
                className="text-sm font-medium text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* ── IMAGE PANEL ── */}
          {(panel === "image-url" || panel === "image-file") && (
            <div className="border border-t-0 border-gray-200 bg-gray-50 px-4 py-2.5">
              {/* Tab switcher */}
              <div className="mb-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPanel("image-file")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${panel === "image-file" ? "border border-gray-200 bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setPanel("image-url")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${panel === "image-url" ? "border border-gray-200 bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  From URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanel(null)
                    setImageUrl("")
                  }}
                  className="ml-auto text-sm text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* File upload */}
              {panel === "image-file" && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm text-gray-500 transition-all hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-500"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Click to pick a PNG / JPG / GIF file
                </button>
              )}

              {/* URL input */}
              {panel === "image-url" && (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleImageUrlInsert()
                      if (e.key === "Escape") setPanel(null)
                    }}
                    className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={handleImageUrlInsert}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Insert
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* ── EDITORJS CONTENT AREA ── */}
          <div
            ref={holderRef}
            id="editorjs-holder"
            className="prose prose-base min-h-80 max-w-none rounded-b-xl border border-t-0 border-gray-200 bg-white px-6 py-5 text-gray-800 [&_.ce-block]:py-0.5 [&_.ce-block__content]:max-w-none [&_.ce-paragraph]:text-gray-800 [&_.ce-toolbar__content]:max-w-none"
          />
        </section>
      </div>
      {/* end left column */}

      {/* ── RIGHT: Publishing sidebar ── */}
      <aside className="w-64 shrink-0 space-y-5">
        {/* Publishing Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
            Publishing Status
          </p>
          <div className="flex overflow-hidden rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setPublishStatus("draft")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                publishStatus === "draft"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "bg-gray-50 text-gray-400 hover:text-gray-600"
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setPublishStatus("publish")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                publishStatus === "publish"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-50 text-gray-400 hover:text-gray-600"
              }`}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Schedule Publication */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
            Schedule Publication
          </p>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white"
          />
        </div>

        {/* Breaking News */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="flex cursor-pointer items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-red-500">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Breaking News
            </span>
            <button
              type="button"
              role="checkbox"
              aria-checked={isBreakingNews}
              onClick={() => setIsBreakingNews((v) => !v)}
              className={`relative h-5 w-5 rounded border-2 transition-colors ${
                isBreakingNews
                  ? "border-red-500 bg-red-500"
                  : "border-gray-300 bg-white"
              }`}
            >
              {isBreakingNews && (
                <svg
                  className="absolute inset-0 m-auto"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          </label>
        </div>

        {/* Article Tags */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
            Article Tags
          </p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault()
                addTag(tagInput)
              }
            }}
            placeholder="Add tag..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
          />
          <div className="mt-2">
            <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Suggested
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Word Count</span>
            <span className="font-semibold text-gray-800">
              {wordCount} words
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reading Time</span>
            <span className="font-semibold text-gray-800">
              {readingTime} min
            </span>
          </div>
        </div>

        {/* Finalize button */}
        <button
          type="button"
          disabled={isSaving || isFetching}
          onClick={handlePublish}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving && (
            <svg
              className="h-4 w-4 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {publishStatus === "draft" ? "Save as Draft" : "Finalize & Publish"}
        </button>
      </aside>

      {/* ── TOAST NOTIFICATION ── */}
      {showToast && (
        <div className="fixed right-6 bottom-6 z-50 flex animate-in items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-6 py-4 text-white shadow-xl duration-300 fade-in slide-in-from-bottom-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">
              {publishStatus === "draft" ? "Draft Saved" : "Article Published"}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Status: <span className="capitalize">{publishStatus}</span>
              {isBreakingNews && " · Breaking News"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
