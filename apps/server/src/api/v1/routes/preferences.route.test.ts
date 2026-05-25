import express, { Request, Response, NextFunction } from "express"
import request from "supertest"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { preferencesV1Router } from "./preferences.route"
import { prismaMock } from "../../../__mocks__/db"
import { auth } from "@workspace/auth"

// Mock the auth module
vi.mock("@workspace/auth", () => {
  return {
    auth: {
      api: {
        getSession: vi.fn(),
      },
    },
  }
})

const app = express()
app.use(express.json())
app.use("/api/v1/preferences", preferencesV1Router)

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Test App Error:", err)
  res.status(500).json({ error: err.message })
})

describe("Preferences Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /api/v1/preferences", () => {
    it("should return 401 when unauthorized", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const res = await request(app).get("/api/v1/preferences")

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe("UNAUTHORIZED")
    })

    it("should return preferences (upsert default preference if none)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "u_1", email: "test@example.com" },
        session: { id: "s_1" },
      } as any)

      const mockPreference = {
        id: "p_1",
        userId: "u_1",
        categoryIds: [],
        tagIds: [],
        receiveEmails: false,
        emailFrequency: "DAILY",
      }

      prismaMock.userPreference.upsert.mockResolvedValue(mockPreference as any)

      const res = await request(app).get("/api/v1/preferences")

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toEqual(mockPreference)
      expect(prismaMock.userPreference.upsert).toHaveBeenCalledWith({
        where: { userId: "u_1" },
        create: {
          userId: "u_1",
          categoryIds: [],
          tagIds: [],
          receiveEmails: false,
          emailFrequency: "DAILY",
        },
        update: {},
      })
    })
  })

  describe("PUT /api/v1/preferences", () => {
    it("should return 401 when unauthorized", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const res = await request(app)
        .put("/api/v1/preferences")
        .send({ receiveEmails: true })

      expect(res.status).toBe(401)
    })

    it("should fail validation with invalid payload", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "u_1", email: "test@example.com" },
        session: { id: "s_1" },
      } as any)

      const res = await request(app)
        .put("/api/v1/preferences")
        .send({ emailFrequency: "INVALID_FREQ" })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("should fail when category ID does not exist in database", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "u_1", email: "test@example.com" },
        session: { id: "s_1" },
      } as any)

      prismaMock.category.findMany.mockResolvedValue([]) // returns empty list, meaning categories do not exist

      const res = await request(app)
        .put("/api/v1/preferences")
        .send({ categoryIds: ["cl00000000000000000000001"] })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
      expect(res.body.error.message).toContain(
        "do not exist: cl00000000000000000000001"
      )
    })

    it("should fail when tag ID does not exist in database", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "u_1", email: "test@example.com" },
        session: { id: "s_1" },
      } as any)

      prismaMock.category.findMany.mockResolvedValue([
        { id: "cl00000000000000000000003" },
      ] as any)
      prismaMock.tag.findMany.mockResolvedValue([]) // no tags found

      const res = await request(app)
        .put("/api/v1/preferences")
        .send({
          categoryIds: ["cl00000000000000000000003"],
          tagIds: ["cl00000000000000000000002"],
        })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
      expect(res.body.error.message).toContain(
        "do not exist: cl00000000000000000000002"
      )
    })

    it("should successfully update preferences", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: "u_1", email: "test@example.com" },
        session: { id: "s_1" },
      } as any)

      prismaMock.category.findMany.mockResolvedValue([
        { id: "cl00000000000000000000003" },
      ] as any)
      prismaMock.tag.findMany.mockResolvedValue([
        { id: "cl00000000000000000000004" },
      ] as any)
      prismaMock.userPreference.upsert.mockResolvedValue({
        id: "p_1",
        userId: "u_1",
        categoryIds: ["cl00000000000000000000003"],
        tagIds: ["cl00000000000000000000004"],
        receiveEmails: true,
        emailFrequency: "WEEKLY",
      } as any)

      const res = await request(app)
        .put("/api/v1/preferences")
        .send({
          categoryIds: ["cl00000000000000000000003"],
          tagIds: ["cl00000000000000000000004"],
          receiveEmails: true,
          emailFrequency: "WEEKLY",
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.emailFrequency).toBe("WEEKLY")
      expect(prismaMock.userPreference.upsert).toHaveBeenCalledWith({
        where: { userId: "u_1" },
        update: {
          categoryIds: ["cl00000000000000000000003"],
          tagIds: ["cl00000000000000000000004"],
          receiveEmails: true,
          emailFrequency: "WEEKLY",
        },
        create: {
          userId: "u_1",
          categoryIds: ["cl00000000000000000000003"],
          tagIds: ["cl00000000000000000000004"],
          receiveEmails: true,
          emailFrequency: "WEEKLY",
        },
      })
    })
  })
})
