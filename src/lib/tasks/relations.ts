import type { Prisma } from '@prisma/client'

/** Validate related owners and prevent a task from becoming its own ancestor. */
export async function validTaskRelations(
  db: Prisma.TransactionClient,
  userId: string,
  data: { parentTaskId?: string | null; goalId?: string | null; projectId?: string | null },
  taskId?: string
): Promise<boolean> {
  if (
    data.goalId &&
    !(await db.goal.findFirst({ where: { id: data.goalId, userId }, select: { id: true } }))
  )
    return false
  if (
    data.projectId &&
    !(await db.project.findFirst({ where: { id: data.projectId, userId }, select: { id: true } }))
  )
    return false
  let parentId = data.parentTaskId
  const seen = new Set<string>()
  while (parentId) {
    if (parentId === taskId || seen.has(parentId)) return false
    seen.add(parentId)
    const parent = await db.task.findFirst({
      where: { id: parentId, userId },
      select: { parentTaskId: true },
    })
    if (!parent) return false
    parentId = parent.parentTaskId
  }
  return true
}
