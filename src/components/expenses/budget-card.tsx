'use client'

import { Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { formatINR } from '@/lib/expenses/formatters'
import type { BudgetResponse } from '@/lib/types/budgets'

interface BudgetCardProps {
  budget: BudgetResponse
  onEdit: (budget: BudgetResponse) => void
  onDelete: (id: string) => void
}

function getProgressColor(budget: BudgetResponse): string {
  if (budget.type === 'target') return 'bg-green-500'
  if (budget.percentage > 100) return 'bg-red-500'
  if (budget.percentage >= 75) return 'bg-yellow-500'
  return 'bg-green-500'
}

function getBorderClass(budget: BudgetResponse): string {
  if (budget.type === 'target' && budget.health === 'completed') {
    return 'border-green-500 bg-green-50/50'
  }
  if (budget.type === 'limit' && budget.health === 'over-budget') {
    return 'border-red-500 bg-red-50/50'
  }
  return 'border-retro-dark/20'
}

function getStatusText(budget: BudgetResponse): { text: string; className: string } {
  if (budget.type === 'target' && budget.health === 'completed') {
    return { text: 'Target reached!', className: 'text-green-600 font-bold' }
  }
  if (budget.health === 'over-budget') {
    return { text: `${formatINR(Math.abs(budget.remaining))} over budget!`, className: 'text-red-600 font-bold' }
  }
  if (budget.type === 'target') {
    return { text: `${formatINR(budget.remaining)} to go`, className: 'text-retro-dark/60' }
  }
  return { text: `${formatINR(budget.remaining)} remaining`, className: 'text-retro-dark/60' }
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps): React.ReactElement {
  const progressColor = getProgressColor(budget)
  const borderClass = getBorderClass(budget)
  const status = getStatusText(budget)
  const cappedPercentage = Math.min(budget.percentage, 100)

  return (
    <div className={`group relative border-2 ${borderClass} p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-retro-dark/40 hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{budget.categoryIcon}</span>
          <div>
            <h3 className="font-mono text-sm font-bold text-retro-dark">{budget.name}</h3>
            <p className="text-xs text-retro-dark/50">{budget.categoryName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-retro-dark/40 bg-retro-dark/5 px-1.5 py-0.5">
            {budget.period}
          </span>
          {budget.type === 'target' && budget.health === 'completed' && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-2 w-full bg-retro-dark/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${cappedPercentage}%` }}
          />
        </div>
      </div>

      {/* Amount info */}
      <div className="mt-2 flex items-baseline justify-between">
        <span className="font-mono text-sm font-bold text-retro-dark">
          {formatINR(budget.spent)} <span className="text-retro-dark/40 font-normal">/ {formatINR(budget.amount)}</span>
        </span>
        <span className="font-mono text-xs text-retro-dark/60">
          {budget.percentage.toFixed(0)}%
        </span>
      </div>

      {/* Status + days left */}
      <div className="mt-1 flex items-center justify-between">
        <span className={`font-mono text-xs ${status.className}`}>{status.text}</span>
        {budget.daysLeft !== null && (
          <span className="font-mono text-[10px] text-retro-dark/40">
            {budget.daysLeft}d left
          </span>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(budget)}
          className="p-1 hover:bg-retro-dark/10 rounded"
          aria-label="Edit budget"
        >
          <Pencil className="h-3.5 w-3.5 text-retro-dark/60" />
        </button>
        <button
          onClick={() => onDelete(budget.id)}
          className="p-1 hover:bg-red-100 rounded"
          aria-label="Delete budget"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500/60" />
        </button>
      </div>
    </div>
  )
}
