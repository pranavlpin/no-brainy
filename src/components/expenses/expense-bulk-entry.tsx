'use client'

import { useState, useRef, useCallback } from 'react'
import { Trash2, Save, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import { useBulkCreateExpenses } from '@/hooks/use-expenses'
import { formatINR } from '@/lib/expenses/formatters'
import type { ExpenseCategoryResponse } from '@/lib/types/expenses'

interface BulkRow {
  id: string
  date: string
  name: string
  amount: string
  categoryId: string
  tags: string
  notes: string
}

function createEmptyRow(defaultDate: string, defaultCategoryId: string): BulkRow {
  return {
    id: Math.random().toString(36).slice(2),
    date: defaultDate,
    name: '',
    amount: '',
    categoryId: defaultCategoryId,
    tags: '',
    notes: '',
  }
}

export function ExpenseBulkEntry(): React.ReactElement {
  const { data: categories } = useExpenseCategories()
  const bulkCreate = useBulkCreateExpenses()

  const today = new Date().toISOString().split('T')[0]
  const defaultCategoryId = categories?.[0]?.id ?? ''

  const [rows, setRows] = useState<BulkRow[]>([
    createEmptyRow(today, defaultCategoryId),
  ])
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const updateRow = useCallback((id: string, field: keyof BulkRow, value: string): void => {
    setRows((prev) => {
      const updated = prev.map((r) => r.id === id ? { ...r, [field]: value } : r)

      // Auto-add new row if editing the last row and it has content
      const lastRow = updated[updated.length - 1]
      if (lastRow.id === id && (field === 'name' || field === 'amount') && value) {
        const needsNewRow = lastRow.name || lastRow.amount
        if (needsNewRow) {
          updated.push(createEmptyRow(lastRow.date, lastRow.categoryId))
        }
      }

      return updated
    })
    setSavedCount(null)
  }, [])

  const removeRow = (id: string): void => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id)
      if (filtered.length === 0) {
        return [createEmptyRow(today, defaultCategoryId)]
      }
      return filtered
    })
  }

  const validRows = rows.filter((r) => r.name.trim() && r.amount && parseFloat(r.amount) !== 0 && r.categoryId)
  const totalAmount = validRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)

  const handleSave = (): void => {
    if (validRows.length === 0) return

    const expenses = validRows.map((r) => ({
      date: r.date,
      name: r.name.trim(),
      amount: parseFloat(r.amount),
      categoryId: r.categoryId,
      tags: r.tags ? r.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      notes: r.notes.trim() || undefined,
    }))

    bulkCreate.mutate({ expenses }, {
      onSuccess: (res) => {
        setSavedCount(res.data.created)
        // Reset to single empty row
        setRows([createEmptyRow(today, defaultCategoryId)])
      },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, field: keyof BulkRow): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Move to next row's same field
      const rowIndex = rows.findIndex((r) => r.id === rowId)
      if (rowIndex < rows.length - 1) {
        const nextRowId = rows[rowIndex + 1].id
        const nextInput = tableRef.current?.querySelector(
          `[data-row="${nextRowId}"][data-field="${field}"]`
        ) as HTMLInputElement | null
        nextInput?.focus()
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {validRows.length} valid row{validRows.length !== 1 ? 's' : ''}
          {validRows.length > 0 && (
            <span> &middot; Total: <span className="font-semibold text-foreground">{formatINR(totalAmount)}</span></span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {savedCount !== null && (
            <span className="text-sm text-green-600 font-medium">
              {savedCount} expense{savedCount !== 1 ? 's' : ''} saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={validRows.length === 0 || bulkCreate.isPending}
            className="flex items-center gap-2 border-2 border-retro-dark bg-retro-blue px-3 py-1.5 font-mono text-xs font-bold text-white shadow-hard hover-shadow-grow disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {bulkCreate.isPending ? 'Saving...' : `Save ${validRows.length} Expense${validRows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Spreadsheet */}
      <div ref={tableRef} className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-retro-blue/10 text-left">
              <th className="px-2 py-2.5 font-mono text-xs uppercase tracking-wider text-retro-dark/60 w-8">#</th>
              <th className="px-2 py-2.5 font-mono text-xs uppercase tracking-wider text-retro-dark/60 w-32">Date</th>
              <th className="px-2 py-2.5 font-mono text-xs uppercase tracking-wider text-retro-dark/60 min-w-[180px]">Name</th>
              <th className="px-2 py-2.5 font-mono text-xs uppercase tracking-wider text-retro-dark/60 w-28">Amount (₹)</th>
              <th className="px-2 py-2.5 font-mono text-xs uppercase tracking-wider text-retro-dark/60 w-40">Category</th>
              <th className="px-2 py-2.5 font-mono text-xs uppercase tracking-wider text-retro-dark/60 w-32">Tags</th>
              <th className="px-2 py-2.5 font-mono text-xs uppercase tracking-wider text-retro-dark/60 w-36">Notes</th>
              <th className="px-2 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isValid = row.name.trim() && row.amount && parseFloat(row.amount) !== 0 && row.categoryId
              const isEmpty = !row.name && !row.amount
              return (
                <tr
                  key={row.id}
                  className={`border-t border-border/50 ${isValid ? 'bg-retro-mint/5' : ''} ${isEmpty && idx === rows.length - 1 ? 'opacity-60' : ''}`}
                >
                  <td className="px-2 py-1 text-muted-foreground text-xs">{idx + 1}</td>
                  <td className="px-1 py-1">
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                      className="h-8 text-xs border-0 bg-transparent focus:bg-background focus:border-border rounded-sm"
                      data-row={row.id}
                      data-field="date"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      value={row.name}
                      onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, row.id, 'name')}
                      placeholder="Expense name..."
                      className="h-8 text-xs border-0 bg-transparent focus:bg-background focus:border-border rounded-sm"
                      data-row={row.id}
                      data-field="name"
                      autoFocus={idx === 0 && !row.name}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, row.id, 'amount')}
                      placeholder="0.00"
                      className="h-8 text-xs border-0 bg-transparent focus:bg-background focus:border-border rounded-sm font-mono"
                      data-row={row.id}
                      data-field="amount"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Select
                      value={row.categoryId}
                      onChange={(e) => updateRow(row.id, 'categoryId', e.target.value)}
                      className="h-8 text-xs border-0 bg-transparent focus:bg-background focus:border-border rounded-sm"
                      data-row={row.id}
                      data-field="categoryId"
                    >
                      <option value="">--</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      value={row.tags}
                      onChange={(e) => updateRow(row.id, 'tags', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, row.id, 'tags')}
                      placeholder="tag1, tag2"
                      className="h-8 text-xs border-0 bg-transparent focus:bg-background focus:border-border rounded-sm"
                      data-row={row.id}
                      data-field="tags"
                    />
                  </td>
                  <td className="px-1 py-1">
                    <Input
                      value={row.notes}
                      onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, row.id, 'notes')}
                      placeholder="Optional"
                      className="h-8 text-xs border-0 bg-transparent focus:bg-background focus:border-border rounded-sm"
                      data-row={row.id}
                      data-field="notes"
                    />
                  </td>
                  <td className="px-1 py-1">
                    {rows.length > 1 && !(isEmpty && idx === rows.length - 1) && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add row hint */}
      <p className="text-xs text-muted-foreground">
        Start typing in the last row to add more. Press <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">Enter</kbd> to move down.
      </p>
    </div>
  )
}
