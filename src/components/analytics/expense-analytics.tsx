'use client'

import Link from 'next/link'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { ArrowRight } from 'lucide-react'
import { useExpenseTrends, useExpenseStats } from '@/hooks/use-expense-trends'
import { formatINR, formatMonthLabel } from '@/lib/expenses/formatters'

function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percent: number } }> }): React.ReactElement | null {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md">
      <p className="text-xs font-medium">{payload[0].name}</p>
      <p className="text-sm font-semibold">{formatINR(payload[0].value)}</p>
      <p className="text-xs text-muted-foreground">{(payload[0].payload.percent * 100).toFixed(1)}%</p>
    </div>
  )
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }): React.ReactElement | null {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{formatINR(payload[0].value)}</p>
    </div>
  )
}

export function ExpenseCategoryDonut(): React.ReactElement {
  const { data: trends, isLoading } = useExpenseTrends(1)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  if (!trends || trends.categories.length === 0) {
    return <p className="text-sm text-muted-foreground">No expense data this month</p>
  }

  const total = trends.categories.reduce((sum, c) => sum + c.total, 0)
  const chartData = trends.categories
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((c) => ({ name: c.name, value: Math.round(c.total), color: c.color, percent: c.total / total }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center text-xs text-muted-foreground">
        Total: <span className="font-semibold text-foreground">{formatINR(total)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 justify-center">
        {chartData.slice(0, 5).map((c) => (
          <div key={c.name} className="flex items-center gap-1 text-[10px]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="text-muted-foreground">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExpenseMonthlyBars(): React.ReactElement {
  const { data: trends, isLoading } = useExpenseTrends(6)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  if (!trends || trends.monthlyTotals.length === 0) {
    return <p className="text-sm text-muted-foreground">No expense data yet</p>
  }

  const chartData = trends.monthlyTotals.map((d) => ({
    month: formatMonthLabel(d.month),
    total: Math.round(d.total),
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fill: 'currentColor', fontSize: 10 }} />
        <YAxis tick={{ fill: 'currentColor', fontSize: 10 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<BarTooltip />} />
        <Bar dataKey="total" fill="#6366F1" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ExpenseStatsRow(): React.ReactElement {
  const { data: stats, isLoading } = useExpenseStats()

  if (isLoading || !stats) return <></>

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-3xl font-bold tabular-nums text-foreground">{formatINR(stats.total)}</p>
        <p className="mt-1 text-sm text-muted-foreground">This month&apos;s spending</p>
      </div>
      <div className="text-right">
        {stats.changePercent !== 0 && (
          <span className={`text-sm font-medium ${stats.changePercent > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {stats.changePercent > 0 ? '+' : ''}{stats.changePercent}%
          </span>
        )}
        <p className="text-xs text-muted-foreground">vs last month</p>
        {stats.topCategory && (
          <p className="mt-1 text-xs text-muted-foreground">
            Top: <span className="font-medium text-foreground">{stats.topCategory.categoryName}</span>
          </p>
        )}
      </div>
    </div>
  )
}

export function ExpenseAnalyticsSection(): React.ReactElement {
  return (
    <div className="space-y-4">
      <ExpenseStatsRow />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Category Breakdown</h3>
          <ExpenseCategoryDonut />
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Monthly Spending (6 months)</h3>
          <ExpenseMonthlyBars />
        </div>
      </div>
      <div className="text-right">
        <Link href="/expenses" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          View full expense dashboard
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
