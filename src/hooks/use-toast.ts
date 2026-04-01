import { create } from 'zustand'

interface ToastState {
  message: string | null
  type: 'success' | 'error'
  show: (message: string, type?: 'success' | 'error') => void
  hide: () => void
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: 'success',
  show: (message, type = 'success') => {
    set({ message, type })
  },
  hide: () => set({ message: null }),
}))
