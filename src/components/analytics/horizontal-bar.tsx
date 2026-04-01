'use client'

import { cn } from '@/lib/utils'

interface HorizontalBarProps {
  data: {
    label: string
    value: number
    total: number
    color?: string
    trackColor?: string
  }[]
  className?: string
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-gray-400',
}

export function HorizontalBar({ data, className }: HorizontalBarProps) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {data.map((item, i) => {
        const totalWidth = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0
        const completedWidth =
          item.total > 0 ? (item.value / item.total) * 100 : 0

        return (
          <div key={i}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="capitalize font-medium text-foreground">
                {item.label}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {item.value}/{item.total}
              </span>
            </div>
            <div
              className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden"
              style={{ width: `${totalWidth}%`, minWidth: item.total > 0 ? 32 : 0 }}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  item.color ?? priorityColors[item.label] ?? 'bg-primary'
                )}
                style={{ width: `${completedWidth}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
