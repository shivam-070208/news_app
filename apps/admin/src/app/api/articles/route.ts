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

    // ── TODO: Persist to database / forward to backend ─────────────
    // Example: const article = await db.articles.create({ data: body })
    //          return NextResponse.json({ success: true, article })

    console.log("[POST /api/articles] Received article:", {
      headline: body.headline,
      status: body.status,
      isBreakingNews: body.isBreakingNews,
      tags: body.tags,
      scheduledAt: body.scheduledAt,
    })

    return NextResponse.json(
      {
        success: true,
        message:
          body.status === "publish"
            ? "Article published successfully."
            : "Article saved as draft.",
        data: {
          headline: body.headline,
          summary: body.summary,
          status: body.status,
          scheduledAt: body.scheduledAt,
          isBreakingNews: body.isBreakingNews,
          tags: body.tags,
          // content omitted from response for brevity
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("[POST /api/articles] Error:", err)
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    )
  }
}
