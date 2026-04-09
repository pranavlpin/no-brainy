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
        <label htmlFor="name" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">Name</label>
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
          <label htmlFor="amount" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">Amount (₹)</label>
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
          <label htmlFor="date" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">Date</label>
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
        <label htmlFor="category" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">Category</label>
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
        <label htmlFor="tags" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">Tags (comma separated)</label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. personal, recurring"
        />
      </div>

      <div>
        <label htmlFor="notes" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">Notes (optional)</label>
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
        <button
          type="submit"
          disabled={isPending || !name || !amount || !categoryId}
          className="border-2 border-retro-dark bg-retro-blue px-4 py-2 font-mono text-sm font-bold text-white shadow-hard hover-shadow-grow disabled:opacity-50"
        >
          {isPending ? 'Saving...' : expense ? 'Update' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}
