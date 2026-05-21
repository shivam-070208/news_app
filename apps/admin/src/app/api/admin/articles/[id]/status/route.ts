import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/src/lib/auth-server"
import { updateArticleStatus } from "@/src/modules/articles/articles.service"

type RouteContext = { params: Promise<{ id: string }> }

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
    const body = await request.json()
    const { status } = body

    if (!["draft", "publish"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Use 'draft' or 'publish'." },
        { status: 400 }
      )
    }

    const article = await updateArticleStatus(id, status)
    return NextResponse.json({
      success: true,
      message:
        status === "publish"
          ? "Article published successfully."
          : "Article unpublished.",
      data: article,
    })
  } catch (error) {
    console.error("[PATCH /api/admin/articles/:id/status]", error)
    return NextResponse.json(
      { success: false, error: "Failed to update status" },
      { status: 500 }
    )
  }
}
