import { beforeEach, vi } from "vitest"
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient } from "@workspace/db"

/**
 * Create ONE deep mock instance of Prisma
 */
const { prisma } = vi.hoisted(() => ({ prisma: mockDeep<PrismaClient>() }))

/**
 * Mock the module BEFORE anything imports it
 * This replaces the real db export everywhere
 */
vi.mock("@workspace/db", () => {
  return {
    db: prisma,
  }
})

/**
 * Export a strongly-typed handle for tests
 */
export const prismaMock = prisma as DeepMockProxy<PrismaClient>

/**
 * Reset mock state before every test
 * - clears calls
 * - resets return values
 */
beforeEach(() => {
  mockReset(prismaMock)
})
