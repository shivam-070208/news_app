"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"

type CategoryItem = {
  id: string
  name: string
  slug: string
  createdAt: string
  articleCount?: number
}

type CategoryForm = {
  name: string
  slug: string
}

const defaultForm: CategoryForm = {
  name: "",
  slug: "",
}

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL

const getCategoryApiUrl = (path = "") => {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_SERVER_URL is not configured.")
  }
  return `${API_BASE_URL}/api/v1/categories${path}`
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(
    null
  )
  const [form, setForm] = useState<CategoryForm>(defaultForm)
  const [error, setError] = useState("")

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
        includeArticleCount: "true",
      })
      const response = await fetch(
        `${getCategoryApiUrl()}?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      )
      const data = await response.json()

      if (!response.ok) {
        setError(data?.message || data?.error || "Unable to load categories.")
        return
      }

      setCategories(data.data ?? [])
    } catch (fetchError) {
      console.error(fetchError)
      setError("Unable to load categories.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const openCreateDialog = () => {
    setEditingCategory(null)
    setForm(defaultForm)
    setError("")
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: CategoryItem) => {
    setEditingCategory(category)
    setForm({
      name: category.name,
      slug: category.slug,
    })
    setError("")
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    if (isSubmitting) return
    setIsDialogOpen(false)
    setEditingCategory(null)
    setForm(defaultForm)
    setError("")
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Name is required.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
      }

      if (form.slug.trim()) {
        payload.slug = form.slug.trim()
      }

      const method = editingCategory ? "PUT" : "POST"
      const endpoint = editingCategory ? `/${editingCategory.id}` : ""
      const response = await fetch(getCategoryApiUrl(endpoint), {
        method,
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(
          data?.message || data?.error?.message || "Unable to save category."
        )
        return
      }

      closeDialog()
      await fetchCategories()
    } catch (saveError) {
      console.error(saveError)
      setError("Unable to save category.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (category: CategoryItem) => {
    const confirmed = window.confirm(
      `Delete category \"${category.name}\"? This action cannot be undone.`
    )
    if (!confirmed) return

    setError("")
    try {
      const response = await fetch(getCategoryApiUrl(`/${category.id}`), {
        method: "DELETE",
        credentials: "include",
      })
      const data = await response.json()

      if (!response.ok) {
        setError(
          data?.message || data?.error?.message || "Unable to delete category."
        )
        return
      }

      await fetchCategories()
    } catch (deleteError) {
      console.error(deleteError)
      setError("Unable to delete category.")
    }
  }

  const articleCountLabel = useMemo(
    () =>
      `${categories.length} category${categories.length === 1 ? "" : "ies"}`,
    [categories.length]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Category Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create, edit, and remove categories used by the news portal.
          </p>
        </div>
        <Button onClick={openCreateDialog}>New category</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{articleCountLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>
                      {new Date(category.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{category.articleCount ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => openEditDialog(category)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(category)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {isLoading && (
              <p className="mt-4 text-sm text-muted-foreground">
                Loading categories…
              </p>
            )}
            {!isLoading && categories.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                No categories found. Create one to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit category" : "Create category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the details for this category."
                : "Add a new category to organize news articles."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Name
                </label>
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Category name"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">
                  Slug
                </label>
                <Input
                  value={form.slug}
                  onChange={(event) =>
                    setForm({ ...form, slug: event.target.value })
                  }
                  placeholder="category-slug (optional)"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {editingCategory ? "Update category" : "Create category"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
