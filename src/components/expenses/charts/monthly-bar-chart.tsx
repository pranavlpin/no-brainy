'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { formatINR, formatMonthLabel } from '@/lib/expenses/formatters'

interface MonthlyTotal {
  month: string
  total: number
}

interface MonthlyBarChartProps {
  data: MonthlyTotal[]
  selectedMonth?: string
  onMonthClick?: (month: string) => void
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { rawMonth: string } }>; label?: string }): React.ReactElement | null {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{formatINR(payload[0].value)}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">Click to view details</p>
    </div>
  )
}

export function MonthlyBarChart({ data, selectedMonth, onMonthClick }: MonthlyBarChartProps): React.ReactElement {
  const chartData = data.map((d) => ({
    month: formatMonthLabel(d.month),
    rawMonth: d.month,
    total: Math.round(d.total),
  }))

  const handleClick = (entry: { rawMonth: string }): void => {
    if (onMonthClick) onMonthClick(entry.rawMonth)
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="mb-4 text-sm font-semibold">Monthly Spending</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} onClick={(state: Record<string, unknown>) => {
          const payload = state?.activePayload as Array<{ payload: { rawMonth: string } }> | undefined
          if (payload?.[0]?.payload) {
            handleClick(payload[0].payload)
          }
        }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} />
          <YAxis className="text-xs" tick={{ fill: 'currentColor', fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(233 100% 59% / 0.05)' }} />
          <Bar dataKey="total" radius={[4, 4, 0, 0]} className="cursor-pointer">
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.rawMonth === selectedMonth ? '#2D4CFF' : '#6366F1'}
                opacity={selectedMonth && entry.rawMonth !== selectedMonth ? 0.4 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {selectedMonth && (
        <p className="mt-2 text-center font-mono text-xs text-retro-dark/50">
          Showing stats for {formatMonthLabel(selectedMonth)}
        </p>
      )}
    </div>
  )
}
