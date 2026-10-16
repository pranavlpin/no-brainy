import { create } from 'zustand'
import type { CaptureKind } from '@/lib/capture/parse'

interface CommandState {
  paletteOpen: boolean
  captureOpen: boolean
  captureKind: CaptureKind
  captureSeed: string
  helpOpen: boolean
  setPalette: (open: boolean) => void
  togglePalette: () => void
  openCapture: (opts?: { kind?: CaptureKind; seed?: string }) => void
  closeCapture: () => void
  setHelp: (open: boolean) => void
  reset: () => void
}

/** Open/closed state for the command palette, quick capture, and shortcut sheet. */
export const useCommandStore = create<CommandState>((set) => ({
  paletteOpen: false,
  captureOpen: false,
  captureKind: 'task',
  captureSeed: '',
  helpOpen: false,
  setPalette: (open) => set({ paletteOpen: open }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
  openCapture: (opts) =>
    set({
      captureOpen: true,
      paletteOpen: false,
      captureKind: opts?.kind ?? 'task',
      captureSeed: opts?.seed ?? '',
    }),
  closeCapture: () => set({ captureOpen: false, captureSeed: '' }),
  setHelp: (open) => set({ helpOpen: open }),
  reset: () =>
    set({
      paletteOpen: false,
      captureOpen: false,
      captureKind: 'task',
      captureSeed: '',
      helpOpen: false,
    }),
}))
