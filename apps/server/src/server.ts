import "./env"
import express from "express"
import cors from "cors"
import morgan from "morgan"
import { toNodeHandler } from "better-auth/node"
import { auth } from "@workspace/auth"
import { authV1Router } from "@v1/routes/auth.route"
import { categoryV1Router } from "@v1/routes/category.routes"
import { preferencesV1Router } from "@v1/routes/preferences.route"
import { tagsV1Router } from "@v1/routes/tags.route"
import { cronV1Router } from "@v1/routes/cron.route"

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

// Routes
app.use("/api/v1/auth", authV1Router)
app.use("/api/v1/categories", categoryV1Router)
app.use("/api/v1/tags", tagsV1Router)
app.use("/api/v1/preferences", preferencesV1Router)
app.use("/api/v1/cron", cronV1Router)

// Auth handler
app.all("/api/auth/{*any}", toNodeHandler(auth))

app.get("/", (_, res) => {
  res.send("News Server is running")
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
