'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowLeft, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { CategoryBadge, ICON_MAP } from '@/components/expenses/category-badge'
import { CategoryForm } from '@/components/expenses/category-form'
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
} from '@/hooks/use-expense-categories'
import type { ExpenseCategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '@/lib/types/expenses'

export default function CategoriesPage(): React.ReactElement {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ExpenseCategoryResponse | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategoryResponse | undefined>()

  const { data: categories, isLoading } = useExpenseCategories()
  const createCategory = useCreateExpenseCategory()
  const updateCategory = useUpdateExpenseCategory()
  const deleteCategory = useDeleteExpenseCategory()

  const handleCreate = (data: CreateCategoryRequest | UpdateCategoryRequest): void => {
    createCategory.mutate(data as CreateCategoryRequest, {
      onSuccess: () => setShowForm(false),
    })
  }

  const handleUpdate = (data: CreateCategoryRequest | UpdateCategoryRequest): void => {
    if (!editing) return
    updateCategory.mutate(
      { id: editing.id, data: data as UpdateCategoryRequest },
      { onSuccess: () => setEditing(undefined) },
    )
  }

  const handleDelete = (): void => {
    if (!deleteTarget) return
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(undefined),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/expenses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-sm text-muted-foreground">
              Manage your expense categories
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditing(undefined); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Form */}
      {(showForm || editing) && (
        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editing ? 'Edit Category' : 'New Category'}
          </h2>
          <CategoryForm
            category={editing}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditing(undefined) }}
            isPending={createCategory.isPending || updateCategory.isPending}
          />
        </div>
      )}

      {/* Category grid */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories?.map((cat) => {
            const IconComponent = ICON_MAP[cat.icon]
            return (
              <div
                key={cat.id}
                className="group relative rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
              >
                {/* Icon + Color indicator */}
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  {IconComponent ? (
                    <IconComponent className="h-5 w-5" style={{ color: cat.color }} />
                  ) : (
                    <span className="text-sm" style={{ color: cat.color }}>?</span>
                  )}
                </div>

                <h3 className="font-medium">{cat.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {cat.expenseCount ?? 0} expense{(cat.expenseCount ?? 0) !== 1 ? 's' : ''}
                  {cat.isDefault && <span className="ml-2 text-primary">&middot; Default</span>}
                </p>

                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => { setShowForm(false); setEditing(cat) }}
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!cat.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(cat)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add new card */}
          <button
            onClick={() => { setEditing(undefined); setShowForm(true) }}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-4 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors min-h-[120px]"
          >
            <Plus className="h-6 w-6 mb-1" />
            <span className="text-sm">Add Category</span>
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(undefined)}
        title="Delete Category"
        description={
          deleteTarget && (deleteTarget.expenseCount ?? 0) > 0
            ? `Cannot delete "${deleteTarget.name}" because it has ${deleteTarget.expenseCount} expenses. Reassign them first.`
            : `Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`
        }
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={(deleteTarget?.expenseCount ?? 0) === 0 ? handleDelete : undefined}
      />
    </div>
  )
}
