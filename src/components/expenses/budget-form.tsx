'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import type { CreateBudgetRequest, BudgetType, BudgetPeriod } from '@/lib/types/budgets'

interface BudgetFormProps {
  onSubmit: (data: CreateBudgetRequest) => void
  onCancel: () => void
  isPending?: boolean
}

export function BudgetForm({ onSubmit, onCancel, isPending }: BudgetFormProps): React.ReactElement {
  const { data: categories } = useExpenseCategories()

  const [name, setName] = useState('')
  const [type, setType] = useState<BudgetType>('limit')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<BudgetPeriod>('monthly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (!categoryId && categories?.length) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const data: CreateBudgetRequest = {
      name: name.trim(),
      type,
      categoryId,
      amount: parseFloat(amount),
      period,
      ...(period === 'total' && startDate ? { startDate } : {}),
      ...(period === 'total' && endDate ? { endDate } : {}),
    }
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {/* Name */}
      <div>
        <label htmlFor="budget-name" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">
          Name
        </label>
        <Input
          id="budget-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Monthly food budget"
          required
        />
      </div>

      {/* Type toggle */}
      <div>
        <label className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">Type</label>
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={() => setType('limit')}
            className={`flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
              type === 'limit'
                ? 'border-retro-dark bg-retro-dark text-white'
                : 'border-retro-dark/30 bg-white text-retro-dark hover:border-retro-dark/60'
            }`}
          >
            Spending Limit
          </button>
          <button
            type="button"
            onClick={() => setType('target')}
            className={`flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
              type === 'target'
                ? 'border-retro-dark bg-retro-dark text-white'
                : 'border-retro-dark/30 bg-white text-retro-dark hover:border-retro-dark/60'
            }`}
          >
            Savings Target
          </button>
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="budget-category" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">
          Category
        </label>
        <Select
          id="budget-category"
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

      {/* Amount */}
      <div>
        <label htmlFor="budget-amount" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">
          Amount (INR)
        </label>
        <Input
          id="budget-amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      {/* Period */}
      <div>
        <label htmlFor="budget-period" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">
          Period
        </label>
        <Select
          id="budget-period"
          value={period}
          onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
          <option value="total">Custom Range</option>
        </Select>
      </div>

      {/* Date range (only for total/custom) */}
      {period === 'total' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget-start" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">
              Start Date
            </label>
            <Input
              id="budget-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="budget-end" className="font-mono text-xs uppercase tracking-wider text-retro-dark/70">
              End Date
            </label>
            <Input
              id="budget-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="border-2 border-retro-dark/30 px-4 py-2 font-mono text-sm font-bold text-retro-dark hover:border-retro-dark/60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !name || !amount || !categoryId}
          className="border-2 border-retro-dark bg-retro-blue px-4 py-2 font-mono text-sm font-bold text-white shadow-hard hover-shadow-grow disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Add Budget'}
        </button>
      </div>
    </form>
  )
}
