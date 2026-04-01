'use client'

import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  value: number | string
  label: string
  trend?: { value: number; positive: boolean }
  className?: string
}

export function StatCard({ icon: Icon, value, label, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-white p-6 shadow-sm dark:bg-gray-900',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="rounded-md bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.positive ? 'text-green-600' : 'text-red-500'
            )}
          >
            {trend.positive ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
