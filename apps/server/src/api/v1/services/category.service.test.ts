import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getCategoryArticles,
  listCategories,
} from "./category.service"
import { prismaMock } from "../../../__mocks__/db"

describe("Category Service", () => {
  describe("createCategory", () => {
    it("should successfully create a category with an auto-generated slug", async () => {
      // Setup mock returns
      prismaMock.category.findUnique.mockResolvedValue(null) // No slug conflict
      prismaMock.category.aggregate.mockResolvedValue({
        _max: { sortOrder: 0 },
      } as any)

      const mockCategory = {
        id: "cat_1",
        name: "Technology",
        slug: "technology",
        description: null,
        parentId: null,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.category.create.mockResolvedValue(mockCategory)

      const result = await createCategory({ name: "Technology" })

      expect(result).toEqual({ success: true, category: mockCategory })
      expect(prismaMock.category.create).toHaveBeenCalledWith({
        data: {
          name: "Technology",
          slug: "technology",
          description: null,
          parentId: null,
          sortOrder: 1,
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

    it("should fail when parent category does not exist", async () => {
      // First findUnique checks slug (null), second checks parent (null)
      prismaMock.category.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)

      const result = await createCategory({
        name: "Sub Tech",
        parentId: "non_existent",
      })

      expect(result).toEqual({ success: false, error: "PARENT_NOT_FOUND" })
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

    it("should detect circular parent references", async () => {
      const existing = { id: "cat_1", slug: "tech" }

      // existing check
      prismaMock.category.findUnique.mockResolvedValue(existing as any)

      // If parentId === id it fails immediately, let's test where it's an ancestor
      // getAncestorIds will loop via findUnique
      // So input.parentId = "cat_2"
      // cat_2 has parentId = "cat_1" -> CIRCULAR!
      prismaMock.category.findUnique.mockImplementation(
        async (args: { where: { id: string } }) => {
          if (args.where.id === "cat_1") return existing as any // update category check
          if (args.where.id === "cat_2")
            return { id: "cat_2", parentId: "cat_1" } as any // getAncestorIds loop 1
          return null as any
        }
      )

      const result = await updateCategory("cat_1", { parentId: "cat_2" })

      expect(result).toEqual({ success: false, error: "CIRCULAR_PARENT" })
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
      // 1. category to delete
      prismaMock.category.findUnique.mockResolvedValueOnce({
        id: "cat_1",
        _count: { articles: 5 },
      } as any)

      // 2. target category for reassignment
      prismaMock.category.findUnique.mockResolvedValueOnce({
        id: "cat_2",
      } as any)

      prismaMock.$transaction.mockResolvedValueOnce([{}, {}] as any)

      const result = await deleteCategory("cat_1", "cat_2")

      expect(result).toEqual({ success: true })
      expect(prismaMock.$transaction).toHaveBeenCalled()
    })
  })

  describe("reorderCategories", () => {
    it("should reorder successfully when all IDs exist", async () => {
      prismaMock.category.findMany.mockResolvedValue([
        { id: "c1" },
        { id: "c2" },
      ] as any)
      prismaMock.$transaction.mockResolvedValueOnce([] as any)

      const result = await reorderCategories(["c1", "c2"])

      expect(result).toEqual({ success: true })
    })

    it("should fail and return missing IDs if not all exist", async () => {
      prismaMock.category.findMany.mockResolvedValue([{ id: "c1" }] as any)

      const result = await reorderCategories(["c1", "c2"])

      expect(result).toEqual({ success: false, missingIds: ["c2"] })
      expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })
  })
})
