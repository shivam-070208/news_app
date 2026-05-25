import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"

import { Pool } from "pg"
import { PrismaClient } from "./generated/prisma/client"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required")
}
declare global {
  var prisma: PrismaClient | undefined
}

const globalForPrisma = global as typeof globalThis & { prisma?: PrismaClient }
const db =
  globalForPrisma.prisma ??
  (() => {
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required")
    }
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
  })()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}
export { db }
