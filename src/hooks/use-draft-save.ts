'use client'

import { useEffect, useRef, useState } from 'react'
import { DraftSave } from '@/lib/tasks/draft-save'

type Entity = { id: string; userId: string; updatedAt: string }
const activeQueues = new Map<string, { queue: DraftSave<Entity>; users: number }>()

/** Bind an entity-scoped durable queue to a page, flushing on navigation and protecting reloads. */
export function useDraftSave<T extends Entity>(
  kind: 'task' | 'note' | 'day-plan',
  remote: T | undefined,
  save: (patch: Partial<T>, version: string) => Promise<T>,
  reload: () => Promise<T | undefined>
) {
  const saveRef = useRef(save)
  saveRef.current = save
  const [queue, setQueue] = useState<DraftSave<T>>()
  const [, render] = useState(0)
  const key = remote ? `nobrainy:draft:${remote.userId}:${kind}:${remote.id}` : undefined
  const remoteRef = useRef(remote)
  remoteRef.current = remote

  useEffect(() => {
    if (!key || !remoteRef.current) return
    let storage: Storage | undefined
    try {
      storage = localStorage
    } catch {
      /* Storage availability is surfaced by the queue. */
    }
    const existing = activeQueues.get(key)
    const next = existing
      ? (existing.queue as unknown as DraftSave<T>)
      : new DraftSave(
          key,
          remoteRef.current,
          (patch, version) => saveRef.current(patch, version),
          storage
        )
    const entry = existing ?? { queue: next as unknown as DraftSave<Entity>, users: 0 }
    entry.users += 1
    activeQueues.set(key, entry)
    next.setSave((patch, version) => saveRef.current(patch, version))
    next.remote(remoteRef.current)
    const unsubscribe = next.subscribe(() => render((count) => count + 1))
    setQueue(next)
    next.start()
    const unload = (event: BeforeUnloadEvent) => {
      if (next.getSnapshot().state !== 'saved') {
        void next.flush()
        event.preventDefault()
        event.returnValue = ''
      }
    }
    const pagehide = () => {
      void next.flush()
    }
    window.addEventListener('beforeunload', unload)
    window.addEventListener('pagehide', pagehide)
    return () => {
      unsubscribe()
      window.removeEventListener('beforeunload', unload)
      window.removeEventListener('pagehide', pagehide)
      entry.users -= 1
      const finish = async () => {
        await next.flush()
        if (!entry.users) {
          if (next.getSnapshot().state === 'pending') void finish()
          else if (activeQueues.get(key) === entry) activeQueues.delete(key)
        }
      }
      void finish()
    }
  }, [key])

  useEffect(() => {
    if (remote) queue?.remote(remote)
  }, [queue, remote])
  const snapshot = queue?.getSnapshot()
  return {
    value: snapshot?.value ?? remote,
    state: snapshot?.state ?? 'saved',
    durable: snapshot?.durable ?? true,
    change: (patch: Partial<T>) => queue?.change(patch),
    retry: () => queue?.retry(),
    flush: () => queue?.flush(),
    discard: () => queue?.discard(remote),
    resolve: async (keep: boolean) => {
      const current = await reload()
      if (current) {
        if (keep) queue?.keepDraft(current)
        else queue?.discard(current)
      }
    },
  }
}
