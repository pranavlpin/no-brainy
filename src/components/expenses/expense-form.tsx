'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import type { CreateExpenseRequest, UpdateExpenseRequest, ExpenseResponse } from '@/lib/types/expenses'

interface ExpenseFormProps {
  expense?: ExpenseResponse
  onSubmit: (data: CreateExpenseRequest | UpdateExpenseRequest) => void
  onCancel: () => void
  isPending?: boolean
}

export function ExpenseForm({ expense, onSubmit, onCancel, isPending }: ExpenseFormProps): React.ReactElement {
  const { data: categories } = useExpenseCategories()

  const [name, setName] = useState(expense?.name ?? '')
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '')
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? '')
  const [tags, setTags] = useState(expense?.tags?.join(', ') ?? '')
  const [notes, setNotes] = useState(expense?.notes ?? '')

  useEffect(() => {
    if (!categoryId && categories?.length) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const data: CreateExpenseRequest = {
      name: name.trim(),
      amount: parseFloat(amount),
      date,
      categoryId,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      notes: notes.trim() || undefined,
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Amazon order, Swiggy"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          <option value="">Select category</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. personal, recurring"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional details..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !name || !amount || !categoryId}>
          {isPending ? 'Saving...' : expense ? 'Update' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}
