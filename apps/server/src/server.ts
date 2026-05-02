import "dotenv/config"
import express from "express"
import cors from "cors"
import morgan from "morgan"
import { toNodeHandler } from "better-auth/node"
import { auth } from "@workspace/auth"
import { authV1Router } from "@v1/routes/auth.route"
import { editorV1Router } from "./api/v1/routes"

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

app.use("/api/v1/auth", authV1Router)
app.use("/api/v1/editor", editorV1Router)
app.all("/api/auth/{*any}", toNodeHandler(auth))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (_, res) => {
  res.send("Hello World")
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
