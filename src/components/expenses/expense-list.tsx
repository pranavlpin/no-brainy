'use client'

import { Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryBadge } from './category-badge'
import { formatINR, formatDate } from '@/lib/expenses/formatters'
import type { ExpenseResponse } from '@/lib/types/expenses'

interface ExpenseListProps {
  expenses: ExpenseResponse[]
  onEdit: (expense: ExpenseResponse) => void
  onDelete: (id: string) => void
  isDeleting?: boolean
}

export function ExpenseList({ expenses, onEdit, onDelete, isDeleting }: ExpenseListProps): React.ReactElement {
  if (expenses.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No expenses found. Add your first expense to get started.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-retro-dark/10 text-left">
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
            <tr key={exp.id} className="border-b border-border/50 hover:bg-retro-cream/50">
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
  )
}
