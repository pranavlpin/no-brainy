import type { QueryClient, QueryKey } from '@tanstack/react-query'

/** A cache entry captured before an optimistic patch, for rollback. */
export interface CacheSnapshot {
  key: QueryKey
  data: unknown
}

type Predicate<T> = (item: T) => boolean
type Patch<T> = (item: T) => T

const MAX_DEPTH = 6

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function hasId(v: unknown): v is { id: string } {
  return isRecord(v) && typeof v.id === 'string'
}

/**
 * Walk any cached value (raw arrays, `{ data: { items } }` pages, nested
 * planner or home payloads, single detail objects) and replace every object
 * with an `id` that satisfies `predicate` using `patch`. Untouched branches
 * keep their identity so React Query and React can skip re-renders.
 */
export function patchDeep<T extends { id: string }, D = unknown>(
  data: D,
  predicate: Predicate<T>,
  patch: Patch<T>,
  depth = 0
): D {
  if (depth > MAX_DEPTH || data == null) return data

  if (Array.isArray(data)) {
    let changed = false
    const next = data.map((item) => {
      const out = patchDeep(item, predicate, patch, depth + 1)
      if (out !== item) changed = true
      return out
    })
    return (changed ? next : data) as D
  }

  if (isRecord(data)) {
    if (hasId(data) && predicate(data as unknown as T)) {
      return patch(data as unknown as T) as unknown as D
    }
    let changed = false
    const next: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(data)) {
      const out = patchDeep(v, predicate, patch, depth + 1)
      if (out !== v) changed = true
      next[k] = out
    }
    return (changed ? next : data) as D
  }

  return data
}

/**
 * Apply `patch` to every cache whose key starts with `keyPrefix`.
 * Returns snapshots for `restoreCaches`.
 */
export function patchCaches<T extends { id: string }>(
  queryClient: QueryClient,
  keyPrefix: QueryKey,
  predicate: Predicate<T>,
  patch: Patch<T>
): CacheSnapshot[] {
  const snapshots: CacheSnapshot[] = []
  for (const [key, data] of queryClient.getQueriesData({ queryKey: keyPrefix })) {
    if (data === undefined) continue
    const next = patchDeep<T>(data, predicate, patch)
    if (next !== data) {
      snapshots.push({ key, data })
      queryClient.setQueryData(key, next)
    }
  }
  return snapshots
}

/** Remove every object with `id` in `ids` from arrays inside matching caches. */
export function removeFromCaches(
  queryClient: QueryClient,
  keyPrefix: QueryKey,
  ids: ReadonlySet<string>
): CacheSnapshot[] {
  const snapshots: CacheSnapshot[] = []
  const strip = (value: unknown, depth = 0): unknown => {
    if (depth > MAX_DEPTH || value == null) return value
    if (Array.isArray(value)) {
      const kept = value.filter((v) => !(hasId(v) && ids.has(v.id)))
      let changed = kept.length !== value.length
      const next = kept.map((v) => {
        const out = strip(v, depth + 1)
        if (out !== v) changed = true
        return out
      })
      return changed ? next : value
    }
    if (isRecord(value)) {
      let changed = false
      const next: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value)) {
        const out = strip(v, depth + 1)
        if (out !== v) changed = true
        next[k] = out
      }
      return changed ? next : value
    }
    return value
  }
  for (const [key, data] of queryClient.getQueriesData({ queryKey: keyPrefix })) {
    if (data === undefined) continue
    const next = strip(data)
    if (next !== data) {
      snapshots.push({ key, data })
      queryClient.setQueryData(key, next)
    }
  }
  return snapshots
}

/** Put snapshots back after a failed mutation. */
export function restoreCaches(
  queryClient: QueryClient,
  snapshots: CacheSnapshot[] | undefined
): void {
  if (!snapshots) return
  for (const { key, data } of snapshots) {
    queryClient.setQueryData(key, data)
  }
}
