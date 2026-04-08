'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryIconPicker } from './category-icon-picker'
import { CategoryColorPicker } from './category-color-picker'
import { CategoryBadge } from './category-badge'
import type { ExpenseCategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '@/lib/types/expenses'

interface CategoryFormProps {
  category?: ExpenseCategoryResponse
  onSubmit: (data: CreateCategoryRequest | UpdateCategoryRequest) => void
  onCancel: () => void
  isPending?: boolean
}

export function CategoryForm({ category, onSubmit, onCancel, isPending }: CategoryFormProps): React.ReactElement {
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? 'tag')
  const [color, setColor] = useState(category?.color ?? '#6366F1')

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    onSubmit({ name: name.trim(), icon, color })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Preview */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Preview:</span>
        <CategoryBadge name={name || 'Category'} icon={icon} color={color} size="md" />
      </div>

      <div>
        <Label htmlFor="cat-name">Name</Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Gym, Education"
          required
        />
      </div>

      <div>
        <Label className="mb-2 block">Icon</Label>
        <CategoryIconPicker value={icon} onChange={setIcon} color={color} />
      </div>

      <div>
        <Label className="mb-2 block">Color</Label>
        <CategoryColorPicker value={color} onChange={setColor} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? 'Saving...' : category ? 'Update' : 'Create Category'}
        </Button>
      </div>
    </form>
  )
}
