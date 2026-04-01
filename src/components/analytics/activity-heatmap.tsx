'use client'

import { cn } from '@/lib/utils'

interface ActivityHeatmapProps {
  data: { hour: number; count: number }[]
  className?: string
}

function getIntensityClass(count: number, max: number): string {
  if (max === 0 || count === 0) return 'bg-gray-100 dark:bg-gray-800'
  const ratio = count / max
  if (ratio > 0.75) return 'bg-primary'
  if (ratio > 0.5) return 'bg-primary/75'
  if (ratio > 0.25) return 'bg-primary/50'
  return 'bg-primary/25'
}

export function ActivityHeatmap({ data, className }: ActivityHeatmapProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex gap-0.5">
        {data.map((item) => (
          <div
            key={item.hour}
            className={cn(
              'flex-1 h-8 rounded-sm transition-colors',
              getIntensityClass(item.count, maxCount)
            )}
            title={`${item.hour}:00 - ${item.count} tasks`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11pm</span>
      </div>
    </div>
  )
}
