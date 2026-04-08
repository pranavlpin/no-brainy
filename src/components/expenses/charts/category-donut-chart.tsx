'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatINR } from '@/lib/expenses/formatters'

interface CategoryData {
  name: string
  color: string
  total: number
}

interface CategoryDonutChartProps {
  data: CategoryData[]
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percent: number } }> }): React.ReactElement | null {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md">
      <p className="text-xs font-medium">{item.name}</p>
      <p className="text-sm font-semibold">{formatINR(item.value)}</p>
      <p className="text-xs text-muted-foreground">{(item.payload.percent * 100).toFixed(1)}%</p>
    </div>
  )
}

export function CategoryDonutChart({ data }: CategoryDonutChartProps): React.ReactElement {
  const total = data.reduce((sum, d) => sum + d.total, 0)
  const chartData = data
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((d) => ({ name: d.name, value: Math.round(d.total), color: d.color, percent: d.total / total }))

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="mb-4 text-sm font-semibold">Category Breakdown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => <span className="text-xs">{value}</span>}
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center">
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="text-lg font-bold">{formatINR(total)}</p>
      </div>
    </div>
  )
}
