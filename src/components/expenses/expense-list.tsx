'use client'

import { useState } from 'react'
import { Trash2, Pencil, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { CategoryBadge } from './category-badge'
import { formatINR, formatDate } from '@/lib/expenses/formatters'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import { useBulkUpdateCategory } from '@/hooks/use-expenses'
import type { ExpenseResponse } from '@/lib/types/expenses'

interface ExpenseListProps {
  expenses: ExpenseResponse[]
  onEdit: (expense: ExpenseResponse) => void
  onDelete: (id: string) => void
  isDeleting?: boolean
}

export function ExpenseList({ expenses, onEdit, onDelete, isDeleting }: ExpenseListProps): React.ReactElement {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const { data: categories } = useExpenseCategories()
  const bulkUpdate = useBulkUpdateCategory()

  const allSelected = expenses.length > 0 && selectedIds.size === expenses.length
  const someSelected = selectedIds.size > 0

  const toggleAll = (): void => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(expenses.map((e) => e.id)))
    }
  }

  const toggleOne = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkCategoryChange = (): void => {
    if (!bulkCategoryId || selectedIds.size === 0) return
    bulkUpdate.mutate(
      { ids: Array.from(selectedIds), categoryId: bulkCategoryId },
      {
        onSuccess: () => {
          setSelectedIds(new Set())
          setBulkCategoryId('')
        },
      },
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No expenses found. Add your first expense to get started.
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-retro-dark/10 text-left">
              <th className="pb-3 pr-2 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 cursor-pointer accent-retro-blue"
                  title={allSelected ? 'Deselect all' : 'Select all'}
                />
              </th>
              <th className="pb-3 pr-4 font-mono text-xs uppercase tracking-wider text-retro-dark/50">Date</th>
              <th className="pb-3 pr-4 font-mono text-xs uppercase tracking-wider text-retro-dark/50">Name</th>
              <th className="pb-3 pr-4 font-mono text-xs uppercase tracking-wider text-retro-dark/50">Category</th>
              <th className="pb-3 pr-4 font-mono text-xs uppercase tracking-wider text-retro-dark/50">Tags</th>
              <th className="pb-3 pr-4 text-right font-mono text-xs uppercase tracking-wider text-retro-dark/50">Amount</th>
              <th className="pb-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr
                key={exp.id}
                className={`border-b border-border/50 hover:bg-retro-cream/50 ${selectedIds.has(exp.id) ? 'bg-retro-blue/5' : ''}`}
              >
                <td className="py-3 pr-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(exp.id)}
                    onChange={() => toggleOne(exp.id)}
                    className="h-4 w-4 cursor-pointer accent-retro-blue"
                  />
                </td>
                <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                  {formatDate(exp.date)}
                </td>
                <td className="py-3 pr-4 font-medium">{exp.name}</td>
                <td className="py-3 pr-4">
                  {exp.category && (
                    <CategoryBadge
                      name={exp.category.name}
                      icon={exp.category.icon}
                      color={exp.category.color}
                    />
                  )}
                </td>
                <td className="py-3 pr-4">
                  {exp.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {exp.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4 text-right font-mono whitespace-nowrap">
                  <span className={Number(exp.amount) < 0 ? 'text-green-500' : ''}>
                    {formatINR(Number(exp.amount))}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(exp)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(exp.id)}
                      disabled={isDeleting}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating bulk action bar */}
      {someSelected && (
        <div className="sticky bottom-4 mt-4 flex items-center justify-between gap-3 border-2 border-retro-dark bg-white p-3 shadow-hard">
          <span className="font-mono text-xs text-retro-dark/60">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-retro-dark/40" />
            <Select
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value)}
              className="w-44 h-8 text-xs"
            >
              <option value="">Move to category...</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Select>
            <button
              onClick={handleBulkCategoryChange}
              disabled={!bulkCategoryId || bulkUpdate.isPending}
              className="border-2 border-retro-dark bg-retro-blue px-3 py-1 font-mono text-xs font-bold text-white shadow-hard hover-shadow-grow disabled:opacity-50"
            >
              {bulkUpdate.isPending ? 'Updating...' : 'Apply'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="font-mono text-xs text-retro-dark/50 hover:text-retro-dark"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
