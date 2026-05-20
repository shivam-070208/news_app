import { tryCatch } from "@/utils/try-catch"
import ApiError from "@/utils/api-error"
import type { Request, Response } from "express"
import { db } from "@workspace/db"
import { Role } from "@workspace/db/types/enums"

export const createEditor = tryCatch(async (req: Request, res: Response) => {
  const { email, name, image } = req.body

  if (!email) {
    throw new ApiError({
      statusCode: "HTTP_400_BAD_REQUEST",
      message: "Email is required",
    })
  }

  const existingUser = await db.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new ApiError({
      statusCode: "HTTP_409_CONFLICT",
      message: "User already exists with this email",
    })
  }

  const user = await db.user.create({
    data: {
      email,
      name,
      image,
      role: Role.EDITOR,
    },
  })

  // TODO(jobs): Enqueue "editor-welcome-email" job with onboarding links and temporary access instructions.
  res.status(201).json({ user })
})

export const updateEditor = tryCatch(async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, image, email } = req.body

  const user = await db.user.findUnique({
    where: { id },
  })

  if (!user || user.role !== Role.EDITOR) {
    throw new ApiError({
      statusCode: "HTTP_404_NOT_FOUND",
      message: "Editor user not found",
    })
  }

  const updatedUser = await db.user.update({
    where: { id },
    data: {
      name: name !== undefined ? name : user.name,
      image: image !== undefined ? image : user.image,
      email: email !== undefined ? email : user.email,
    },
  })

  // TODO(jobs): Enqueue "editor-profile-updated" job when email/name is changed to keep notifications centralized.
  res.json({ user: updatedUser })
})

export const deleteEditor = tryCatch(async (req: Request, res: Response) => {
  const { id } = req.params

  const user = await db.user.findUnique({
    where: { id },
  })

  if (!user || user.role !== Role.EDITOR) {
    throw new ApiError({
      statusCode: "HTTP_404_NOT_FOUND",
      message: "Editor user not found",
    })
  }

  await db.user.delete({
    where: { id },
  })

  // TODO(workers): Revoke active sessions/tokens for deleted editor and enqueue account-removal notification email.
  res.status(204).send()
})

export const listEditors = tryCatch(async (req: Request, res: Response) => {
  const pageParam = Number.parseInt(String(req.query.page ?? "1"), 10)
  const limitParam = Number.parseInt(String(req.query.limit ?? "10"), 10)
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
  const limit =
    Number.isNaN(limitParam) || limitParam < 1 ? 10 : Math.min(limitParam, 50)
  const search = String(req.query.search ?? "").trim()
  const sortByRaw = String(req.query.sortBy ?? "createdAt")
  const sortOrderRaw = String(req.query.sortOrder ?? "desc").toLowerCase()

  const allowedSortBy = new Set(["createdAt", "name", "email"])
  const sortBy = allowedSortBy.has(sortByRaw) ? sortByRaw : "createdAt"
  const sortOrder = sortOrderRaw === "asc" ? "asc" : "desc"

  const where = {
    role: Role.EDITOR,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }

  const [editors, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.user.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  // TODO(workers): Add cache invalidation hooks if editor-list query is cached in Redis for large datasets.
  res.json({
    editors,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  })
})
