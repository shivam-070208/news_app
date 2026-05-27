import * as dotenv from "dotenv"
import path from "path"

// Load env from the root of apps/server
dotenv.config({ path: path.resolve(__dirname, "../.env.local") })
// Also load normal .env if present
dotenv.config()
