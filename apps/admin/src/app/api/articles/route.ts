import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export interface ArticlePayload {
  headline: string
  summary: string
  content: Record<string, unknown> // EditorJS output
  status: "draft" | "publish"
  scheduledAt: string | null
  isBreakingNews: boolean
  tags: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ArticlePayload

    // ── Basic validation ────────────────────────────────────────────
    if (!body.headline?.trim()) {
      return NextResponse.json(
        { success: false, error: "Headline is required." },
        { status: 400 }
      )
    }

    if (!["draft", "publish"].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value." },
        { status: 400 }
      )
    }

    // This route is not implemented — use /api/admin/articles instead.
    return NextResponse.json(
      {
        success: false,
        error: "Not implemented. Use /api/admin/articles to create articles.",
      },
      { status: 501 }
    )
  } catch (err) {
    console.error("[POST /api/articles] Error:", err)
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    )
  }
}
