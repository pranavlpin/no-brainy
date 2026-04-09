'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { MonthlyBarChart } from './charts/monthly-bar-chart'
import { CategoryDonutChart } from './charts/category-donut-chart'
import { CategoryTrendChart } from './charts/category-trend-chart'
import { TopCategoriesBar } from './charts/top-categories-bar'
import { useExpenseTrends, useExpenseStats } from '@/hooks/use-expense-trends'
import { formatINR, getCurrentMonth } from '@/lib/expenses/formatters'

function StatCard({ label, value, subtext, trend }: {
  label: string
  value: string
  subtext?: string
  trend?: number
}): React.ReactElement {
  return (
    <div className="border-2 border-retro-dark/15 p-4">
      <p className="font-mono text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {(subtext || trend !== undefined) && (
        <div className="mt-1 flex items-center gap-1 text-xs">
          {trend !== undefined && (
            <>
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : trend < 0 ? (
                <TrendingDown className="h-3 w-3 text-green-500" />
              ) : (
                <Minus className="h-3 w-3 text-muted-foreground" />
              )}
              <span className={trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-muted-foreground'}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </>
          )}
          {subtext && <span className="text-muted-foreground">{subtext}</span>}
        </div>
      )}
    </div>
  )
}

export function ExpenseCharts(): React.ReactElement {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [fromMonth, setFromMonth] = useState(
    `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`
  )
  const [toMonth, setToMonth] = useState(getCurrentMonth())

  const { data: trends, isLoading: trendsLoading } = useExpenseTrends({ fromMonth, toMonth })
  const { data: stats, isLoading: statsLoading } = useExpenseStats(toMonth)

  if (trendsLoading || statsLoading) {
    return <div className="py-12 text-center text-muted-foreground">Loading charts...</div>
  }

  if (!trends || !stats) {
    return <div className="py-12 text-center text-muted-foreground">No expense data available yet. Add some expenses to see charts.</div>
  }

  const categoryTotals = trends.categories.map((c) => ({
    name: c.name,
    color: c.color,
    total: c.total,
  }))

  return (
    <div className="space-y-6">
      {/* Date range */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="fromMonth" className="font-mono text-xs uppercase tracking-wider text-retro-dark/60">From</label>
          <Input
            id="fromMonth"
            type="month"
            value={fromMonth}
            onChange={(e) => setFromMonth(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="toMonth" className="font-mono text-xs uppercase tracking-wider text-retro-dark/60">To</label>
          <Input
            id="toMonth"
            type="month"
            value={toMonth}
            onChange={(e) => setToMonth(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Selected Month"
          value={formatINR(stats.total)}
          trend={stats.changePercent}
          subtext="vs prev month"
        />
        <StatCard
          label="Transactions"
          value={String(stats.transactionCount)}
        />
        <StatCard
          label="Average"
          value={formatINR(stats.average)}
        />
        <StatCard
          label="Top Category"
          value={stats.topCategory?.categoryName || '-'}
          subtext={stats.topCategory ? formatINR(stats.topCategory.total) : undefined}
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyBarChart data={trends.monthlyTotals} />
        <CategoryDonutChart data={categoryTotals} />
        <CategoryTrendChart months={trends.months} categories={trends.categories} />
        <TopCategoriesBar data={categoryTotals} />
      </div>
    </div>
  )
}
