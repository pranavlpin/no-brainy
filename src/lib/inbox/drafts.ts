export interface CaptureDraft {
  content: string
  requestId: string
  type: 'inbox' | 'task' | 'note'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string
}
const key = (owner: string) => `nobrainy:capture-draft:v1:${owner}`

/** Restore a validated owner-scoped draft; malformed/private storage is never deleted. */
export function readCaptureDraft(
  storage: Pick<Storage, 'getItem'> | undefined,
  owner: string
): CaptureDraft | null {
  try {
    const value = JSON.parse(storage?.getItem(key(owner)) ?? 'null')
    if (
      value?.version !== 1 ||
      typeof value.content !== 'string' ||
      typeof value.requestId !== 'string' ||
      !['inbox', 'task', 'note'].includes(value.type) ||
      !['low', 'medium', 'high', 'urgent'].includes(value.priority) ||
      typeof value.dueDate !== 'string'
    )
      return null
    return {
      content: value.content,
      requestId: value.requestId,
      type: value.type,
      priority: value.priority,
      dueDate: value.dueDate,
    }
  } catch {
    return null
  }
}

/** A false result means the current draft is only in memory, never a server save. */
export function writeCaptureDraft(
  storage: Pick<Storage, 'setItem'> | undefined,
  owner: string,
  draft: CaptureDraft
): boolean {
  if (!storage) return false
  try {
    storage.setItem(key(owner), JSON.stringify({ ...draft, version: 1 }))
    return true
  } catch {
    return false
  }
}
