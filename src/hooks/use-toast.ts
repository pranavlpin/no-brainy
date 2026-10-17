import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  /** Auto-dismiss delay in milliseconds. */
  durationMs: number
  action?: ToastAction
}

export interface ShowToastOptions {
  action?: ToastAction
  durationMs?: number
}

interface ToastState {
  toasts: ToastItem[]
  /** Show a toast. Returns its id so callers can dismiss it early. */
  show: (message: string, type?: ToastType, options?: ShowToastOptions) => string
  dismiss: (id: string) => void
  clear: () => void
}

const MAX_TOASTS = 3
const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3500,
  info: 3500,
  error: 6000,
}

function nextId(): string {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Stacked toast store. Keeps at most three toasts; the oldest is dropped
 * when a fourth arrives. `show(message, type)` stays backward compatible.
 */
export const useToast = create<ToastState>((set) => ({
  toasts: [],
  show: (message, type = 'success', options) => {
    const id = nextId()
    const toast: ToastItem = {
      id,
      message,
      type,
      durationMs: options?.durationMs ?? DEFAULT_DURATION[type],
      action: options?.action,
    }
    set((s) => ({ toasts: [...s.toasts, toast].slice(-MAX_TOASTS) }))
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}))
