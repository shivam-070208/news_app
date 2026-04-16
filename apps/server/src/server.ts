import "dotenv/config"
import express from "express"
import cors from "cors"
import morgan from "morgan"
import { toNodeHandler } from "better-auth/node"
import { auth } from "@workspace/auth"

// Variable declaration
const app = express()
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
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
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

app.all("/api/auth/{*any}", toNodeHandler(auth))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (_, res) => {
  res.send("Hello World")
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
