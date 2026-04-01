'use client'

import { cn } from '@/lib/utils'

interface BarChartProps {
  data: { label: string; value: number; maxValue?: number; color?: string }[]
  height?: number
  className?: string
}

export function BarChart({ data, height = 160, className }: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => d.maxValue ?? d.value), 1)

  return (
    <div className={cn('flex items-end gap-1', className)} style={{ height }}>
      {data.map((item, i) => {
        const barHeight = maxVal > 0 ? (item.value / maxVal) * 100 : 0
        return (
          <div
            key={i}
            className="flex flex-1 flex-col items-center gap-1"
            title={`${item.label}: ${item.value}`}
          >
            {item.value > 0 && (
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {item.value}
              </span>
            )}
            <div className="w-full flex items-end" style={{ height: height - 32 }}>
              <div
                className={cn(
                  'w-full rounded-t transition-all',
                  item.color ?? 'bg-primary'
                )}
                style={{
                  height: `${Math.max(barHeight, item.value > 0 ? 4 : 0)}%`,
                  minHeight: item.value > 0 ? 4 : 0,
                }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
