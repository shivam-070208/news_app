import express, { Request, Response, NextFunction } from "express"
import request from "supertest"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { categoryV1Router } from "./category.routes"
import { prismaMock } from "../../../__mocks__/db"

const app = express()
app.use(express.json())

// Mock Auth Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const role = req.headers["x-mock-role"] as string
  if (role) {
    req.user = {
      id: "u_1",
      email: "test@test.com",
      role: role as "READER" | "EDITOR" | "ADMIN",
    }
  }
  next()
})

app.use("/api/v1/categories", categoryV1Router)

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Test App Error:", err)
  res.status(500).json({ error: err.message })
})

describe("Category Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /api/v1/categories", () => {
    it("should return a list of categories (public)", async () => {
      const mockCats = [{ id: "c1", name: "Tech", sortOrder: 0 }]
      prismaMock.category.findMany.mockResolvedValue(mockCats as any)
      prismaMock.category.count.mockResolvedValue(1)

      const res = await request(app).get("/api/v1/categories?page=1&limit=10")

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toEqual(mockCats)
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      })
    })

    it("should fail validation if page is invalid", async () => {
      const res = await request(app).get("/api/v1/categories?page=abc")
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })
  })

  describe("POST /api/v1/categories", () => {
    it("should create category when user is ADMIN", async () => {
      prismaMock.category.findUnique.mockResolvedValue(null)
      prismaMock.category.aggregate.mockResolvedValue({
        _max: { sortOrder: 0 },
      } as any)
      prismaMock.category.create.mockResolvedValue({
        id: "c1",
        name: "Tech",
      } as any)

      const res = await request(app)
        .post("/api/v1/categories")
        .set("x-mock-role", "ADMIN")
        .send({ name: "Tech", description: "All about tech" })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe("Tech")
    })

    it("should block creation when user is READER", async () => {
      const res = await request(app)
        .post("/api/v1/categories")
        .set("x-mock-role", "READER")
        .send({ name: "Tech" })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe("FORBIDDEN")
    })

    it("should block creation when unauthenticated", async () => {
      const res = await request(app)
        .post("/api/v1/categories")
        .send({ name: "Tech" })

      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe("UNAUTHORIZED")
    })

    it("should throw validation error if name is missing", async () => {
      const res = await request(app)
        .post("/api/v1/categories")
        .set("x-mock-role", "ADMIN")
        .send({ description: "No name" })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
      expect(res.body.error.message).toContain("Required")
    })
  })

  describe("DELETE /api/v1/categories/:id", () => {
    it("should allow ADMIN to delete", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: "c1",
        _count: { articles: 0 },
      } as any)

      const res = await request(app)
        .delete("/api/v1/categories/c1")
        .set("x-mock-role", "ADMIN")

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it("should block EDITOR from deleting (requireAdminOnly)", async () => {
      const res = await request(app)
        .delete("/api/v1/categories/c1")
        .set("x-mock-role", "EDITOR")

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe("FORBIDDEN")
    })
  })

  describe("PATCH /api/v1/categories/reorder", () => {
    it("should successfully reorder categories", async () => {
      const mockOrderedIds = [
        "ckx72o3wq000001l4d1u2c3a4",
        "ckx72o3wq000001l4d1u2c3a5",
      ]
      prismaMock.category.findMany.mockResolvedValue([
        { id: mockOrderedIds[0] },
        { id: mockOrderedIds[1] },
      ] as any)
      prismaMock.$transaction.mockResolvedValue([] as any)

      const res = await request(app)
        .patch("/api/v1/categories/reorder")
        .set("x-mock-role", "ADMIN")
        .send({ orderedIds: mockOrderedIds })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it("should throw validation error if orderedIds is missing", async () => {
      const res = await request(app)
        .patch("/api/v1/categories/reorder")
        .set("x-mock-role", "ADMIN")
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })
  })
})
