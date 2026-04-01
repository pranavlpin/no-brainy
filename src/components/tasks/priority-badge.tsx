"use client"

import { Badge } from "@/components/ui/badge"
import type { TaskPriority } from "@/lib/types/tasks"

const priorityConfig: Record<
  TaskPriority,
  { label: string; variant: "red" | "orange" | "blue" | "gray" }
> = {
  urgent: { label: "Urgent", variant: "red" },
  high: { label: "High", variant: "orange" },
  medium: { label: "Medium", variant: "blue" },
  low: { label: "Low", variant: "gray" },
}

interface PriorityBadgeProps {
  priority: TaskPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
