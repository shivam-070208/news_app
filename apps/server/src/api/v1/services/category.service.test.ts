import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryArticles,
  listCategories,
} from "./category.service"
import { prismaMock } from "../../../__mocks__/db"

describe("Category Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createCategory", () => {
    it("should successfully create a category with an auto-generated slug", async () => {
      prismaMock.category.findUnique.mockResolvedValue(null)

      const mockCategory = {
        id: "cat_1",
        name: "Technology",
        slug: "technology",
        createdAt: new Date(),
      }

      prismaMock.category.create.mockResolvedValue(mockCategory)

      const result = await createCategory({ name: "Technology" })

      expect(result).toEqual({ success: true, category: mockCategory })
      expect(prismaMock.category.create).toHaveBeenCalledWith({
        data: {
          name: "Technology",
          slug: "technology",
        },
      })
    })

    it("should fail when slug already exists", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: "cat_2",
        slug: "technology",
      } as any)

      const result = await createCategory({ name: "Technology" })

      expect(result).toEqual({ success: false, error: "SLUG_CONFLICT" })
      expect(prismaMock.category.create).not.toHaveBeenCalled()
    })
  })

  describe("updateCategory", () => {
    it("should successfully update a category", async () => {
      const existing = { id: "cat_1", slug: "tech" }
      const updated = { ...existing, name: "New Tech" }

      prismaMock.category.findUnique.mockResolvedValue(existing as any)
      prismaMock.category.update.mockResolvedValue(updated as any)

      const result = await updateCategory("cat_1", { name: "New Tech" })

      expect(result).toEqual({ success: true, category: updated })
      expect(prismaMock.category.update).toHaveBeenCalledWith({
        where: { id: "cat_1" },
        data: { name: "New Tech" },
      })
    })

    it("should fail when category is not found", async () => {
      prismaMock.category.findUnique.mockResolvedValue(null)

      const result = await updateCategory("cat_1", { name: "New Tech" })

      expect(result).toEqual({ success: false, error: "NOT_FOUND" })
      expect(prismaMock.category.update).not.toHaveBeenCalled()
    })
  })

  describe("deleteCategory", () => {
    it("should delete category if it has no articles", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: "cat_1",
        _count: { articles: 0 },
      } as any)

      const result = await deleteCategory("cat_1")

      expect(result).toEqual({ success: true })
      expect(prismaMock.category.delete).toHaveBeenCalledWith({
        where: { id: "cat_1" },
      })
    })

    it("should fail to delete if it has articles and no reassignTo is provided", async () => {
      prismaMock.category.findUnique.mockResolvedValue({
        id: "cat_1",
        _count: { articles: 5 },
      } as any)

      const result = await deleteCategory("cat_1")

      expect(result).toEqual({ success: false, error: "HAS_ARTICLES" })
      expect(prismaMock.category.delete).not.toHaveBeenCalled()
    })

    it("should reassign articles and delete category", async () => {
      prismaMock.category.findUnique.mockResolvedValueOnce({
        id: "cat_1",
        _count: { articles: 5 },
      } as any)
      prismaMock.category.findUnique.mockResolvedValueOnce({
        id: "cat_2",
      } as any)

      prismaMock.$transaction.mockResolvedValueOnce([{}, {}] as any)

      const result = await deleteCategory("cat_1", "cat_2")

      expect(result).toEqual({ success: true })
      expect(prismaMock.$transaction).toHaveBeenCalled()
    })
  })
})
