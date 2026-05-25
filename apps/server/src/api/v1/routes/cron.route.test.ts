import express, { Request, Response, NextFunction } from "express"
import request from "supertest"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { cronV1Router } from "./cron.route"
import { prismaMock } from "../../../__mocks__/db"
import { sendNewsEmail } from "@workspace/email"

// Mock the email package
vi.mock("@workspace/email", () => {
  return {
    sendNewsEmail: vi.fn().mockResolvedValue(true),
  }
})

const app = express()
app.use(express.json())
app.use("/api/v1/cron", cronV1Router)

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Test App Error:", err)
  res.status(500).json({ error: err.message })
})

describe("Cron Routes", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      CRON_SECRET: "test_secret_key",
      FRONTEND_URL: process.env.FRONTEND_URL,
    }
  })

  it("should return 401 if CRON_SECRET authorization header is missing or incorrect", async () => {
    const res = await request(app).post(
      "/api/v1/cron/send-newsletters?frequency=DAILY"
    )

    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe("UNAUTHORIZED")

    const resWrongToken = await request(app)
      .post("/api/v1/cron/send-newsletters?frequency=DAILY")
      .set("Authorization", "Bearer wrong_secret")

    expect(resWrongToken.status).toBe(401)
  })

  it("should return 400 if frequency query parameter is invalid or missing", async () => {
    const res = await request(app)
      .post("/api/v1/cron/send-newsletters")
      .set("Authorization", "Bearer test_secret_key")

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("VALIDATION_ERROR")
    expect(res.body.error.message).toContain("must be either DAILY or WEEKLY")

    const resInvalid = await request(app)
      .post("/api/v1/cron/send-newsletters?frequency=HOURLY")
      .set("Authorization", "Bearer test_secret_key")

    expect(resInvalid.status).toBe(400)
  })

  it("should return 500 if FRONTEND_URL is not set", async () => {
    delete process.env.FRONTEND_URL

    const res = await request(app)
      .post("/api/v1/cron/send-newsletters?frequency=DAILY")
      .set("Authorization", "Bearer test_secret_key")

    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe("INTERNAL_ERROR")
  })

  it("should complete successfully with message when no users are opted in", async () => {
    prismaMock.userPreference.findMany.mockResolvedValue([])

    const res = await request(app)
      .post("/api/v1/cron/send-newsletters?frequency=DAILY")
      .set("Authorization", "Bearer test_secret_key")

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.message).toContain("No users opted in")
    expect(res.body.data.emailsSent).toBe(0)
  })

  it("should successfully fetch articles and dispatch newsletters to opted-in users", async () => {
    // 1. Opted in users
    const mockPreferences = [
      {
        id: "p_1",
        userId: "u_1",
        categoryIds: ["cat_1"],
        tagIds: [],
        receiveEmails: true,
        emailFrequency: "DAILY",
        user: { email: "user1@example.com" },
      },
      {
        id: "p_2",
        userId: "u_2",
        categoryIds: [], // no categories selected -> falls back to top global news
        tagIds: [],
        receiveEmails: true,
        emailFrequency: "DAILY",
        user: { email: "user2@example.com" },
      },
    ]
    prismaMock.userPreference.findMany.mockResolvedValue(mockPreferences as any)

    // 2. Mock published global top articles (empty category fallback)
    const mockTopArticles = [
      { id: "a_top_1", title: "Top Breaking News", slug: "top-breaking" },
    ]
    // 3. Mock published category-specific articles
    const mockCatArticles = [
      { id: "a_cat_1", title: "Category Specific News", slug: "cat-news" },
    ]

    // Prisma calls within the route logic:
    // First query: db.article.findMany for topArticles
    // Second query: db.article.findMany for category-specific articles
    prismaMock.article.findMany
      .mockResolvedValueOnce(mockTopArticles as any) // for topArticlePreviews
      .mockResolvedValueOnce(mockCatArticles as any) // for category "cat_1"

    const res = await request(app)
      .post("/api/v1/cron/send-newsletters?frequency=DAILY")
      .set("Authorization", "Bearer test_secret_key")

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.emailsSent).toBe(2)
    expect(res.body.data.usersTargeted).toBe(2)

    // Verify sendNewsEmail was called for each user with correct articles
    expect(sendNewsEmail).toHaveBeenCalledTimes(2)
    expect(sendNewsEmail).toHaveBeenCalledWith("user1@example.com", [
      {
        title: "Category Specific News",
        url: `${process.env.FRONTEND_URL}/articles/cat-news`,
      },
    ])
    expect(sendNewsEmail).toHaveBeenCalledWith("user2@example.com", [
      {
        title: "Top Breaking News",
        url: `${process.env.FRONTEND_URL}/articles/top-breaking`,
      },
    ])
  })
})
