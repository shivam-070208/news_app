import "dotenv/config"
import express from "express"
import cors from "cors"
import morgan from "morgan"
import { toNodeHandler } from "better-auth/node"
import { auth } from "@workspace/auth"
import { authV1Router } from "@v1/routes/auth.route"
import { editorV1Router } from "@v1/routes"
import { categoryV1Router } from "@v1/routes/category.routes"
import { articleV1Router } from "@v1/routes/article.routes"
import { homeV1Router } from "@v1/routes/home.routes"
import { db } from "@workspace/db"
import "@/jobs/category-click"
import "@/jobs/article-view"

// Variable declaration
const app = express()
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || []
const PORT = process.env.PORT

// Middlewares
app.use(morgan("dev"))

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (ALLOWED_ORIGINS?.includes(origin)) {
        return callback(null, true)
      } else {
        return callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/v1/auth", authV1Router)
app.use("/api/v1/editor", editorV1Router)
app.use("/api/v1/categories", categoryV1Router)
app.use("/api/v1/articles", articleV1Router)
app.use("/api/v1/homepage", homeV1Router)

app.get("/api/v1/seed-dummy-data", async (req, res) => {
  const force = req.query.force === "true"
  const existingCount = await db.category.count()

  if (existingCount > 0 && !force) {
    return res.status(400).json({
      success: false,
      error: {
        code: "SEED_ALREADY_EXISTS",
        message:
          "Seed data already exists. Use ?force=true to recreate or skip.",
      },
    })
  }

  const seedAuthor = await db.user.upsert({
    where: { email: "shvgpt070208@gmail.com" },
    create: {
      email: "shvgpt070208@gmail.com",
      name: "News App Seed Author",
      role: "ADMIN",
    },
    update: {},
  })

  const categories = [
    "Technology",
    "Business",
    "Science",
    "Health",
    "Culture",
    "Travel",
    "Environment",
    "Sports",
    "Politics",
    "Markets",
  ]

  const templateTitles = [
    "How %s is changing the future of work",
    "Inside the latest breakthroughs in %s",
    "What every reader should know about %s",
    "The surprising data behind %s",
    "Why %s is trending this week",
    "The roadmap to smarter %s",
    "How leaders are reshaping %s",
    "A fresh perspective on %s",
    "The next chapter for %s",
    "How to stay ahead in %s",
    "The state of %s after recent shifts",
    "The tech that’s redefining %s",
  ]

  const now = Date.now()

  await Promise.all(
    categories.map(async (name, categoryIndex) => {
      const slug = name.toLowerCase().replace(/\s+/g, "-")
      const category = await db.category.upsert({
        where: { slug },
        create: {
          name,
          slug,
          createdAt: new Date(now - categoryIndex * 24 * 60 * 60 * 1000),
        },
        update: {
          name,
          createdAt: new Date(now - categoryIndex * 24 * 60 * 60 * 1000),
        },
      })

      for (let index = 0; index < 12; index += 1) {
        const template =
          templateTitles[index % templateTitles.length] ??
          "A fresh perspective on %s"
        const title = template.replace("%s", name)
        const slugified = `${slug}-${index + 1}`
        const createdAt = new Date(
          now - categoryIndex * 24 * 60 * 60 * 1000 - index * 2 * 60 * 60 * 1000
        )
        const publishedAt = new Date(createdAt.getTime() + 1000 * 60 * 60)

        await db.article.upsert({
          where: { slug: slugified },
          create: {
            title,
            slug: slugified,
            summary: `A concise briefing on ${name} and why it matters today.`,
            fullContent: `In-depth analysis of ${name} developments, sourced from our reporting team.`,
            thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(
              slugified
            )}/640/360`,
            authorId: seedAuthor.id,
            categoryId: category.id,
            status: "PUBLISHED",
            viewCount: 80 + index * 5,
            publishedAt,
            createdAt,
            updatedAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
          },
          update: {
            title,
            summary: `A concise briefing on ${name} and why it matters today.`,
            fullContent: `In-depth analysis of ${name} developments, sourced from our reporting team.`,
            thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(
              slugified
            )}/640/360`,
            authorId: seedAuthor.id,
            categoryId: category.id,
            status: "PUBLISHED",
            viewCount: 80 + index * 5,
            publishedAt,
            updatedAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
          },
        })
      }
    })
  )

  return res.status(201).json({
    success: true,
    data: {
      categories: categories.length,
      articles: categories.length * 12,
      seededAt: new Date().toISOString(),
    },
  })
})

// Auth handler
app.all("/api/auth/{*any}", toNodeHandler(auth))

app.get("/", (_, res) => {
  res.send("Hello World")
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
