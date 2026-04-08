'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatINR, formatMonthLabel } from '@/lib/expenses/formatters'

interface CategoryTrend {
  id: string
  name: string
  color: string
  data: Record<string, number>
  total: number
}

interface CategoryTrendChartProps {
  months: string[]
  categories: CategoryTrend[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }): React.ReactElement | null {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md max-w-[200px]">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload
        .filter((p) => p.value > 0)
        .sort((a, b) => b.value - a.value)
        .map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="font-mono">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function CategoryTrendChart({ months, categories }: CategoryTrendChartProps): React.ReactElement {
  const chartData = months.map((month) => {
    const row: Record<string, string | number> = { month: formatMonthLabel(month) }
    categories.forEach((cat) => {
      row[cat.name] = Math.round(cat.data[month] || 0)
    })
    return row
  })

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="mb-4 text-sm font-semibold">Category Trends</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} />
          <YAxis className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => <span className="text-xs">{value}</span>}
            wrapperStyle={{ fontSize: 11 }}
          />
          {categories.map((cat) => (
            <Line
              key={cat.id}
              type="monotone"
              dataKey={cat.name}
              stroke={cat.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
