import dotenv from "dotenv"
import { spawn } from "child_process"
import path from "path"

// Load local overrides first
dotenv.config({
  path: path.resolve(__dirname, "../.env.local"),
})

// Load defaults second
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
})

// Read command line arguments
const mode = process.argv[2]
const envKey = process.argv[3]
const fallbackPort = process.argv[4]

// Get port from environment or fallback
const port = process.env[envKey] || fallbackPort

console.log(`Starting Next.js in ${mode} mode on port ${port}`)

// Spawn Next.js process
const child = spawn("next", [mode, "-p", port], {
  stdio: "inherit",
})

// Handle shutdown signals
process.on("SIGINT", () => {
  child.kill("SIGINT")
})

process.on("SIGTERM", () => {
  child.kill("SIGTERM")
})
