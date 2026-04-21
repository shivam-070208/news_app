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
export default function Editor() {
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

  // ── Focus the editor content area so execCommand works ──────────
  const refocusEditor = () => {
    const editable = holderRef.current?.querySelector<HTMLElement>(
      "[contenteditable=true]"
    )
    editable?.focus()
  }

  // ── init EditorJS ──────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current) return

    editorRef.current = new EditorJS({
      holder: "editorjs-holder",

      onReady: () => {
        isReadyRef.current = true
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
  }, [])

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
    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(cleanUrl) && !cleanUrl.startsWith("/") && !cleanUrl.startsWith("#")) {
      cleanUrl = `https://${cleanUrl}`
    }

    try {
      const parsedUrl = new URL(cleanUrl, "http://localhost")
      const allowedSchemes = isImage ? ["http:", "https:", "data:"] : ["http:", "https:", "mailto:"]

      if (!allowedSchemes.includes(parsedUrl.protocol)) {
        return null
      }

      if (isImage && parsedUrl.protocol === "data:") {
        if (!cleanUrl.startsWith("data:image/")) return null
      }

      if (parsedUrl.origin === "http://localhost" && !cleanUrl.startsWith("http://localhost")) {
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
      alert("Invalid or dangerous URL.")
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
        alert("Upload failed: " + data.error)
      }
    } catch (err) {
      console.error(err)
      alert("Error uploading image")
    } finally {
      setPanel(null)
      e.target.value = ""
    }
  }

  // ── Image from URL ─────────────────────────────────────────────
  const handleImageUrlInsert = () => {
    const validUrl = getValidatedUrl(imageUrl, true)
    if (!validUrl) {
      alert("Invalid or dangerous Image URL.")
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

  // ── Publish Action ─────────────────────────────────────────────
  const handlePublish = async () => {
    const editor = editorRef.current
    if (!editor) return

    try {
      const content = await editor.save()
      const payload = {
        headline,
        summary,
        content,
      }

      // Clean, unadulterated JSON format logged to console
      console.log(JSON.stringify(payload, null, 2))

      setShowToast(true)
      setTimeout(() => setShowToast(false), 3500)
    } catch (err) {
      console.error("Failed to save editor content", err)
    }
  }
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* ── HEADLINE ── */}
      <section>
        <label className="mb-2 block text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
          Headline
        </label>
        <textarea
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Enter a compelling headline..."
          rows={2}
          className="w-full resize-none border-none bg-transparent p-0 text-4xl leading-tight font-bold text-gray-900 outline-none placeholder:text-gray-300 focus:ring-0"
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
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Write a short summary of the article for social media and SEO..."
          rows={3}
          className="w-full resize-none border-none bg-transparent p-0 text-base leading-relaxed text-gray-700 outline-none placeholder:text-gray-300 focus:ring-0"
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
          <TBtn title="Strikethrough" onClick={() => execFmt("strikeThrough")}>
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
            onClick={() => togglePanel(panel === "image-url" || panel === "image-file" ? null : "image-url")}
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
              insertBlock("quote", { text: "", caption: "", alignment: "left" })
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
          className="prose prose-base min-h-[320px] max-w-none rounded-b-xl border border-t-0 border-gray-200 bg-white px-6 py-5 text-gray-800 [&_.ce-block]:py-0.5 [&_.ce-block__content]:max-w-none [&_.ce-paragraph]:text-gray-800 [&_.ce-toolbar__content]:max-w-none"
        />
      </section>

      {/* ── PUBLISH BUTTON ── */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handlePublish}
          className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Publish this News
        </button>
      </div>

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
            <p className="text-sm font-medium">News Published Successfully</p>
            <p className="mt-0.5 text-xs text-gray-400">
              The JSON payload has been logged to console.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
