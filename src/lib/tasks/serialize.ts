import type { Task, TaskLink } from '@prisma/client'
import type { TaskResponse } from '@/lib/types/tasks'

type WithRelations = Task & { subtasks?: WithRelations[]; taskLinks?: TaskLink[] }
/** Preserve legacy timestamp deadlines while exposing new planned/recurrence dates as calendar keys. */
export function serializeTask(task: WithRelations): TaskResponse {
  return {
    ...task,
    priority: task.priority as TaskResponse['priority'],
    status: task.status as TaskResponse['status'],
    quadrant: task.quadrant as TaskResponse['quadrant'],
    context: task.context as TaskResponse['context'],
    effort: task.effort as TaskResponse['effort'],
    dueDate: task.dueDate?.toISOString() ?? null,
    plannedDate: task.plannedDate?.toISOString().slice(0, 10) ?? null,
    occurrenceDate: task.occurrenceDate?.toISOString().slice(0, 10) ?? null,
    recurrenceAnchor: task.recurrenceAnchor?.toISOString().slice(0, 10) ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    subtasks: task.subtasks?.map(serializeTask),
  }
}
