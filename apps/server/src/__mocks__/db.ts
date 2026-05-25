import { beforeEach, vi } from "vitest"
import { mockDeep, mockReset } from "vitest-mock-extended"

/**
 * Create ONE deep mock instance of Prisma.
 * Variables prefixed with 'mock' or '__' are whitelisted in vi.mock scopes.
 */
const mockPrisma = mockDeep()

/**
 * Mock the module BEFORE anything imports it
 * This replaces the real db export everywhere
 */
vi.mock("@workspace/db", () => {
  return {
    db: mockPrisma,
  }
})

/**
 * Export a strongly-typed handle for tests
 */
export const prismaMock = mockPrisma as any

/**
 * Reset mock state before every test
 */
beforeEach(() => {
  mockReset(prismaMock)
})
