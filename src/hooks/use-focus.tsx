'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/hooks/use-auth'
import type { ApiResponse } from '@/lib/types/api'
import type { FocusCommand, FocusSessionResponse, FocusSnapshot } from '@/lib/types/focus'
import {
  defaultSetup,
  readFocusCheckpoint,
  writeFocusCheckpoint,
  type FocusRecovery,
  type FocusSetup,
} from '@/lib/focus/checkpoint'
import { elapsedSeconds } from '@/lib/focus/clock'

function message(error: unknown): string {
  const value = error as { error?: { message?: string } }
  return (
    value?.error?.message ??
    'Connection interrupted. Your session input is kept; retry when connected.'
  )
}
function useFocusState(owner: string) {
  const cache = useQueryClient()
  const [recovery, setRecovery] = useState<FocusRecovery>({
    version: 1,
    confirmed: null,
    pending: null,
    setup: defaultSetup,
  })
  const recoveryRef = useRef(recovery)
  const [ready, setReady] = useState(false)
  const [durable, setDurable] = useState(true)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [offset, setOffset] = useState(0)
  const [result, setResult] = useState<FocusSessionResponse | null>(null)
  const persist = useCallback(
    (next: FocusRecovery) => {
      recoveryRef.current = next
      setRecovery(next)
      if (owner) setDurable(writeFocusCheckpoint(owner, next))
    },
    [owner]
  )
  useEffect(() => {
    const saved = owner ? readFocusCheckpoint(owner) : null
    if (saved) {
      recoveryRef.current = saved
      setRecovery(saved)
    }
    setReady(true)
  }, [owner])
  const query = useQuery({
    queryKey: ['focus', owner],
    enabled: !!owner && ready,
    queryFn: async () => {
      const response = await apiClient<ApiResponse<FocusSnapshot>>('/api/focus')
      setOffset(Date.parse(response.data.serverNow) - Date.now())
      return response.data
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: 'always',
    staleTime: 0,
  })
  useEffect(() => {
    if (query.data) persist({ ...recoveryRef.current, confirmed: query.data.active })
  }, [query.data, persist])
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])
  const active = query.data?.active ?? (query.data ? null : recovery.confirmed)
  const send = useCallback(
    async (pending: NonNullable<FocusRecovery['pending']>) => {
      if (busyRef.current || !owner) return
      busyRef.current = true
      setBusy(true)
      setError('')
      persist({ ...recoveryRef.current, pending })
      try {
        const response = await apiClient<ApiResponse<FocusSessionResponse>>('/api/focus', {
          method: pending.method,
          body: JSON.stringify(pending.body),
        })
        const finished = response.data.state === 'finished'
        persist({
          ...recoveryRef.current,
          pending: null,
          confirmed: finished ? null : response.data,
          ...(finished && {
            setup: { ...recoveryRef.current.setup, reflection: '', nextAction: '' },
          }),
        })
        cache.setQueryData<FocusSnapshot>(['focus', owner], (old) => ({
          active: finished ? null : response.data,
          recent: finished
            ? [response.data, ...(old?.recent ?? []).filter((s) => s.id !== response.data.id)]
            : (old?.recent ?? []),
          serverNow: new Date().toISOString(),
        }))
        if (finished) setResult(response.data)
        for (const key of ['focus', 'tasks', 'planner', 'projects', 'goals', 'growth', 'reviews'])
          void cache.invalidateQueries({ queryKey: [key] })
      } catch (e) {
        setError(message(e))
        void query.refetch()
      } finally {
        busyRef.current = false
        setBusy(false)
      }
    },
    [owner, persist, cache, query]
  )
  const setSetup = useCallback(
    (patch: Partial<FocusSetup>) =>
      persist({ ...recoveryRef.current, setup: { ...recoveryRef.current.setup, ...patch } }),
    [persist]
  )
  const start = (taskId: string | null) => {
    if (recoveryRef.current.pending || busyRef.current) return
    const setup = recoveryRef.current.setup
    setResult(null)
    void send({
      method: 'POST',
      body: {
        clientRequestId: crypto.randomUUID(),
        taskId,
        plannedSeconds: setup.minutes * 60,
        intention: setup.intention,
      },
    })
  }
  const command = (
    action: FocusCommand['action'],
    fields: Partial<Pick<FocusCommand, 'outcome' | 'reflection' | 'nextAction'>> = {}
  ) => {
    if (!active || recoveryRef.current.pending || busyRef.current) return
    void send({
      method: 'PATCH',
      body: { id: active.id, expectedUpdatedAt: active.updatedAt, action, ...fields },
    })
  }
  const reconcile = async () => {
    const fresh = await query.refetch()
    if (fresh.isError) {
      setError('Could not refresh yet. Your pending input remains saved.')
      return
    }
    persist({ ...recoveryRef.current, confirmed: fresh.data?.active ?? null, pending: null })
    setError('')
  }
  return {
    active,
    setup: recovery.setup,
    setSetup,
    start,
    command,
    result,
    clearResult: () => setResult(null),
    busy,
    pending: recovery.pending,
    error,
    loading: !ready || query.isLoading,
    offline: query.isError,
    durable,
    remaining: active
      ? Math.max(0, active.plannedSeconds - elapsedSeconds(active, now + offset))
      : 0,
    retry: () =>
      recoveryRef.current.pending ? void send(recoveryRef.current.pending) : void query.refetch(),
    reconcile,
  }
}
const FocusContext = createContext<ReturnType<typeof useFocusState> | null>(null)
function OwnerFocusProvider({ owner, children }: { owner: string; children: React.ReactNode }) {
  const state = useFocusState(owner)
  return <FocusContext.Provider value={state}>{children}</FocusContext.Provider>
}
/** Keep server-coordinated Focus state mounted across routes, fullscreen exit and owner changes. */
export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user?.id)
    return (
      <div
        role="status"
        className="grid min-h-dvh place-items-center text-sm text-muted-foreground"
      >
        Loading your workspace…
      </div>
    )
  return (
    <OwnerFocusProvider key={user?.id ?? 'anonymous'} owner={user?.id ?? ''}>
      {children}
    </OwnerFocusProvider>
  )
}
/** Use the persistent session controller within the workspace shell. */
export function useFocus() {
  const state = useContext(FocusContext)
  if (!state) throw Error('FocusProvider is required')
  return state
}
