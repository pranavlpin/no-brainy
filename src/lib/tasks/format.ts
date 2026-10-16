import type { Task } from '@prisma/client'
import type { TaskResponse } from '@/lib/types/tasks'

/** Serialize a Prisma task row for API responses. */
export function formatTask(task: Task): TaskResponse {
  return {
    id: task.id,
    userId: task.userId,
    parentTaskId: task.parentTaskId,
    goalId: task.goalId,
    title: task.title,
    descriptionMd: task.descriptionMd,
    priority: task.priority as TaskResponse['priority'],
    status: task.status as TaskResponse['status'],
    tags: task.tags,
    dueDate: task.dueDate?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    isRecurring: task.isRecurring,
    rrule: task.rrule,
    quadrant: task.quadrant as TaskResponse['quadrant'],
    orderIndex: task.orderIndex,
    plannedDate: task.plannedDate ? task.plannedDate.toISOString().slice(0, 10) : null,
    estimatedMinutes: task.estimatedMinutes ?? null,
    effort: (task.effort as TaskResponse['effort']) ?? null,
    context: (task.context as TaskResponse['context']) ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  }
}
