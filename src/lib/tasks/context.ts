import type { TaskContext } from '@/lib/types/tasks'

/** The top-bar filter: everything, or one side of life. */
export type WorkspaceContext = TaskContext | 'all'

export const WORKSPACE_CONTEXTS: { value: WorkspaceContext; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
]

/** Unclassified items belong to every context; a filter never hides them. */
export function matchesContext(
  item: { context?: TaskContext | null },
  context: WorkspaceContext
): boolean {
  if (context === 'all') return true
  return item.context == null || item.context === context
}

export function filterByContext<T extends { context?: TaskContext | null }>(
  items: T[],
  context: WorkspaceContext
): T[] {
  return context === 'all' ? items : items.filter((item) => matchesContext(item, context))
}
