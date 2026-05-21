import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"

import { Pool } from "pg"
import { PrismaClient } from "./generated/prisma/client.ts"

const connectionString = process.env.DATABASE_URL
declare global {
  var prisma: PrismaClient | undefined
}

const globalForPrisma = global as typeof globalThis & { prisma?: PrismaClient }
const db =
  globalForPrisma.prisma ??
  (() => {
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
  })()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}
export { db }
