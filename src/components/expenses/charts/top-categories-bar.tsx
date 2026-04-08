'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { formatINR } from '@/lib/expenses/formatters'

interface CategoryTotal {
  name: string
  color: string
  total: number
}

interface TopCategoriesBarProps {
  data: CategoryTotal[]
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { name: string; percent: string } }> }): React.ReactElement | null {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md">
      <p className="text-xs font-medium">{payload[0].payload.name}</p>
      <p className="text-sm font-semibold">{formatINR(payload[0].value)}</p>
      <p className="text-xs text-muted-foreground">{payload[0].payload.percent}</p>
    </div>
  )
}

export function TopCategoriesBar({ data }: TopCategoriesBarProps): React.ReactElement {
  const grandTotal = data.reduce((sum, d) => sum + d.total, 0)
  const chartData = data
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((d) => ({
      name: d.name,
      total: Math.round(d.total),
      color: d.color,
      percent: grandTotal > 0 ? `${((d.total / grandTotal) * 100).toFixed(1)}%` : '0%',
    }))

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="mb-4 text-sm font-semibold">Top Categories</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
          <XAxis type="number" className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="name" className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
