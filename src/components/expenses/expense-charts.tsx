'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
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
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
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

const MONTH_OPTIONS = [3, 6, 9, 12]

export function ExpenseCharts(): React.ReactElement {
  const [months, setMonths] = useState(6)
  const [statsMonth, setStatsMonth] = useState(getCurrentMonth())

  const { data: trends, isLoading: trendsLoading } = useExpenseTrends(months)
  const { data: stats, isLoading: statsLoading } = useExpenseStats(statsMonth)

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
      {/* Date range controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        <div>
          <Label htmlFor="statsMonth" className="text-xs">Stats for month</Label>
          <Input
            id="statsMonth"
            type="month"
            value={statsMonth}
            onChange={(e) => setStatsMonth(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label htmlFor="trendRange" className="text-xs">Chart range</Label>
          <Select
            id="trendRange"
            value={String(months)}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-40"
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>Last {m} months</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="This Month"
          value={formatINR(stats.total)}
          trend={stats.changePercent}
          subtext="vs last month"
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
