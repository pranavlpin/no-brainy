'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { DraftSave } from '@/lib/drafts/draft-save'

type Entity = { id: string; userId: string; updatedAt: string }

const queues = new Map<string, { queue: DraftSave<Entity>; users: number }>()

/**
 * Bind an entity-scoped draft queue to a page. Drafts are keyed by owner,
 * kind, and id; they flush on navigation and warn before unload.
 */
export function useDraftSave<T extends Entity>(
  kind: string,
  remote: T | undefined,
  save: (patch: Partial<T>, version: string) => Promise<T>,
  reload: () => Promise<T | undefined>
) {
  const saveRef = useRef(save)
  saveRef.current = save
  const remoteRef = useRef(remote)
  remoteRef.current = remote
  const [queue, setQueue] = useState<DraftSave<T>>()
  const key = remote ? `nobrainy:draft:${remote.userId}:${kind}:${remote.id}` : undefined

  useEffect(() => {
    if (!key || !remoteRef.current) return
    let storage: Storage | undefined
    try {
      storage = typeof localStorage !== 'undefined' ? localStorage : undefined
    } catch {
      storage = undefined
    }
    const existing = queues.get(key)
    const next = existing
      ? (existing.queue as unknown as DraftSave<T>)
      : new DraftSave<T>(
          key,
          remoteRef.current,
          (patch, version) => saveRef.current(patch, version),
          storage
        )
    const entry = existing ?? { queue: next as unknown as DraftSave<Entity>, users: 0 }
    entry.users += 1
    queues.set(key, entry)
    next.setSave((patch, version) => saveRef.current(patch, version))
    next.remote(remoteRef.current)
    setQueue(next)
    next.start()

    const unload = (event: BeforeUnloadEvent) => {
      if (next.getSnapshot().state !== 'saved') {
        void next.flush()
        event.preventDefault()
      }
    }
    const pagehide = () => void next.flush()
    window.addEventListener('beforeunload', unload)
    window.addEventListener('pagehide', pagehide)
    return () => {
      window.removeEventListener('beforeunload', unload)
      window.removeEventListener('pagehide', pagehide)
      entry.users -= 1
      void next.flush().then(() => {
        if (!entry.users && queues.get(key) === entry && next.getSnapshot().state === 'saved') {
          queues.delete(key)
        }
      })
    }
  }, [key])

  useEffect(() => {
    if (remote) queue?.remote(remote)
  }, [queue, remote])

  const snapshot = useSyncExternalStore(
    queue?.subscribe ?? (() => () => {}),
    () => queue?.getSnapshot(),
    () => queue?.getSnapshot()
  )

  return {
    value: snapshot?.value ?? remote,
    state: snapshot?.state ?? 'saved',
    durable: snapshot?.durable ?? true,
    change: (patch: Partial<T>) => queue?.change(patch),
    retry: () => queue?.retry(),
    flush: () => queue?.flush() ?? Promise.resolve(),
    resolve: async (keep: boolean) => {
      const current = await reload()
      if (!current) return
      if (keep) queue?.keepDraft(current)
      else queue?.discard(current)
    },
  }
}
