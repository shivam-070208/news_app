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

type EditorUser = {
  id: string
  name: string | null
  email: string
  createdAt: string
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

type EditorPayload = {
  name: string
  email: string
  image: string
}

const defaultForm: EditorPayload = {
  name: "",
  email: "",
  image: "",
}

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL

const getEditorApiUrl = (path = "") => {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_SERVER_URL is not configured.")
  }

  return `${API_BASE_URL}/api/v1/editor${path}`
}

export default function EditorManagementPage() {
  const [editors, setEditors] = useState<EditorUser[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingEditor, setEditingEditor] = useState<EditorUser | null>(null)
  const [form, setForm] = useState<EditorPayload>(defaultForm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const fetchEditors = useCallback(
    async (page: number) => {
      setIsLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pagination.limit),
          search,
          sortBy,
          sortOrder,
        })
        const response = await fetch(
          `${getEditorApiUrl()}?${params.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        )
        const data = await response.json()

        if (!response.ok) {
          setError(
            data?.message || data?.error || "Unable to fetch editor list."
          )
          return
        }

        setEditors(data.editors ?? [])
        setPagination((prev) => ({
          ...prev,
          ...(data.pagination || {}),
        }))
      } catch (fetchError) {
        console.error(fetchError)
        setError("Unable to fetch editor list.")
      } finally {
        setIsLoading(false)
      }
    },
    [pagination.limit, search, sortBy, sortOrder]
  )

  useEffect(() => {
    fetchEditors(1)
  }, [fetchEditors])

  const totalLabel = useMemo(
    () => `${pagination.total} editor${pagination.total === 1 ? "" : "s"}`,
    [pagination.total]
  )

  const openCreateDialog = () => {
    setEditingEditor(null)
    setForm(defaultForm)
    setIsDialogOpen(true)
  }

  const openEditDialog = (editor: EditorUser) => {
    setEditingEditor(editor)
    setForm({
      name: editor.name ?? "",
      email: editor.email,
      image: "",
    })
    setIsDialogOpen(true)
  }

  const closeDialog = (force = false) => {
    if (isSubmitting && !force) return
    setIsDialogOpen(false)
    setEditingEditor(null)
    setForm(defaultForm)
  }

  const handleSave = async () => {
    if (!form.email.trim()) {
      setError("Email is required.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const requestUrl = editingEditor
        ? getEditorApiUrl(`/${editingEditor.id}`)
        : getEditorApiUrl()
      const method = editingEditor ? "PUT" : "POST"
      const response = await fetch(requestUrl, {
        method,
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email.trim(),
          name: form.name.trim(),
          image: form.image.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.message || data?.error || "Unable to save editor.")
        return
      }

      closeDialog(true)
      await fetchEditors(pagination.page)
    } catch (saveError) {
      console.error(saveError)
      setError("Unable to save editor.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (editor: EditorUser) => {
    const shouldDelete = window.confirm(
      `Delete editor "${editor.name || editor.email}"? This cannot be undone.`
    )
    if (!shouldDelete) return

    setError("")
    try {
      const response = await fetch(getEditorApiUrl(`/${editor.id}`), {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.message || data?.error || "Unable to delete editor.")
        return
      }
      await fetchEditors(pagination.page)
    } catch (deleteError) {
      console.error(deleteError)
      setError("Unable to delete editor.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Editor Management
        </h1>
        <p className="mt-1 text-muted-foreground">
          Create and manage editor accounts with quick search, sorting, and
          paging.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="gap-4 border-b pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-lg">Editors</CardTitle>
            <div className="text-sm text-muted-foreground">{totalLabel}</div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_140px_auto]">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name or email"
            />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="createdAt">Newest</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>
            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as "asc" | "desc")
              }
              className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <Button onClick={openCreateDialog}>Add Editor</Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Loading editors...
                  </TableCell>
                </TableRow>
              ) : editors.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No editors found for current filters.
                  </TableCell>
                </TableRow>
              ) : (
                editors.map((editor) => (
                  <TableRow key={editor.id}>
                    <TableCell>{editor.name || "—"}</TableCell>
                    <TableCell>{editor.email}</TableCell>
                    <TableCell>
                      {new Date(editor.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(editor)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(editor)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => fetchEditors(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || isLoading}
                onClick={() => fetchEditors(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsDialogOpen(true)
            return
          }
          closeDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEditor ? "Edit editor" : "Create editor"}
            </DialogTitle>
            <DialogDescription>
              {editingEditor
                ? "Update the details for this editor account."
                : "Add a new editor account to access the admin workflow."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <Input
              placeholder="Email address"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
            />
            <Input
              placeholder="Profile image URL (optional)"
              value={form.image}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, image: event.target.value }))
              }
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeDialog()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingEditor ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
