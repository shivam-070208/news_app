import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/src/lib/auth-server"
import {
  getArticles,
  createArticle,
  CreateArticlePayload,
} from "@/src/modules/articles/articles.service"

export async function GET(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    )
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
  )
  const status = searchParams.get("status") || undefined

  try {
    const result = await getArticles(page, limit, status)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[GET /api/admin/articles]", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch articles" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    )
  }

  try {
    const body = (await request.json()) as CreateArticlePayload

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

    const article = await createArticle(body, authCheck.user!.id)

    return NextResponse.json(
      {
        success: true,
        message:
          body.status === "publish"
            ? "Article published successfully."
            : "Article saved as draft.",
        data: article,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error("[POST /api/admin/articles]", err)
    return NextResponse.json(
      { success: false, error: "Failed to create article." },
      { status: 500 }
    )
  }
}
