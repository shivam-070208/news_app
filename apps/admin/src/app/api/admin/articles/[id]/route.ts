import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-server"
import {
  getArticleById,
  updateArticle,
  deleteArticle,
  UpdateArticlePayload,
} from "@/modules/articles/articles.service"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const authCheck = await requireAuth(request)
  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    )
  }

  try {
    const { id } = await params
    const article = await getArticleById(id)
    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, data: article })
  } catch (error) {
    console.error("[GET /api/admin/articles/:id]", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch article" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const authCheck = await requireAuth(request)
  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    )
  }

  try {
    const { id } = await params
    const body = (await request.json()) as UpdateArticlePayload

    if (body.status && !["draft", "publish"].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value." },
        { status: 400 }
      )
    }

    const article = await updateArticle(id, body)
    return NextResponse.json({ success: true, data: article })
  } catch (error) {
    console.error("[PATCH /api/admin/articles/:id]", error)
    return NextResponse.json(
      { success: false, error: "Failed to update article" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const authCheck = await requireAuth(request)
  if ("error" in authCheck) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    )
  }

  try {
    const { id } = await params
    await deleteArticle(id)
    return NextResponse.json({
      success: true,
      message: "Article deleted successfully",
    })
  } catch (error) {
    console.error("[DELETE /api/admin/articles/:id]", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete article" },
      { status: 500 }
    )
  }
}
