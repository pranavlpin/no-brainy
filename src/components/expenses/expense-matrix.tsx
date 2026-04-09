'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategoryBadge } from './category-badge'
import { useExpenseSummary } from '@/hooks/use-expense-summary'
import { formatINR, formatMonthLabel, getCurrentMonth } from '@/lib/expenses/formatters'

export function ExpenseMatrix(): React.ReactElement {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const defaultStart = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`
  const defaultEnd = getCurrentMonth()

  const [startMonth, setStartMonth] = useState(defaultStart)
  const [endMonth, setEndMonth] = useState(defaultEnd)

  const { data, isLoading } = useExpenseSummary({ startMonth, endMonth })

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading summary...</div>
  }

  if (!data || data.rows.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">No expense data for this period.</div>
  }

  return (
    <div className="space-y-4">
      {/* Month range picker */}
      <div className="flex items-end gap-3">
        <div>
          <Label htmlFor="startMonth" className="text-xs">From</Label>
          <Input
            id="startMonth"
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label htmlFor="endMonth" className="text-xs">To</Label>
          <Input
            id="endMonth"
            type="month"
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-retro-dark">
              <th className="sticky left-0 z-10 bg-retro-dark px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-retro-cream">
                Category
              </th>
              {data.months.map((month) => (
                <th key={month} className="px-4 py-3 text-right font-mono text-xs uppercase tracking-wider text-retro-cream whitespace-nowrap">
                  {formatMonthLabel(month)}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-mono text-xs uppercase tracking-wider text-retro-cream">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.categoryId} className="border-t border-border/50 hover:bg-muted/20">
                <td className="sticky left-0 z-10 bg-background px-4 py-2.5">
                  <CategoryBadge name={row.category} icon={row.icon} color={row.color} />
                </td>
                {data.months.map((month) => (
                  <td key={month} className="px-4 py-2.5 text-right font-mono text-xs whitespace-nowrap">
                    {row.months[month] ? formatINR(row.months[month]) : (
                      <span className="text-muted-foreground/40">-</span>
                    )}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold whitespace-nowrap">
                  {formatINR(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-retro-dark/20 bg-retro-dark/5 font-semibold">
              <td className="sticky left-0 z-10 bg-retro-dark/5 px-4 py-3 font-mono text-sm">Total</td>
              {data.months.map((month) => (
                <td key={month} className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap">
                  {formatINR(data.monthTotals[month] ?? 0)}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap">
                {formatINR(data.grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
