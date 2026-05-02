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

  res.status(204).send()
})

export const listEditors = tryCatch(async (_: Request, res: Response) => {
  const editors = await db.user.findMany({
    where: { role: Role.EDITOR },
    orderBy: { createdAt: "desc" },
  })

  res.json({ editors })
})
