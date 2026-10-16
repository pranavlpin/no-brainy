'use client'

import { CommandPalette } from './command-palette'
import { ShortcutsProvider } from './shortcuts-provider'
import { ShortcutsSheet } from './shortcuts-sheet'
import { QuickCaptureModal } from '@/components/quick-capture/quick-capture-modal'
import { useCommandStore } from '@/stores/command-store'

/** Mounts global shortcuts plus the palette, capture, and shortcut sheet dialogs. */
export function CommandLayer() {
  const paletteOpen = useCommandStore((s) => s.paletteOpen)
  const setPalette = useCommandStore((s) => s.setPalette)
  const captureOpen = useCommandStore((s) => s.captureOpen)
  const captureKind = useCommandStore((s) => s.captureKind)
  const captureSeed = useCommandStore((s) => s.captureSeed)
  const closeCapture = useCommandStore((s) => s.closeCapture)
  const helpOpen = useCommandStore((s) => s.helpOpen)
  const setHelp = useCommandStore((s) => s.setHelp)

  return (
    <ShortcutsProvider>
      <CommandPalette open={paletteOpen} onOpenChange={setPalette} />
      <QuickCaptureModal
        open={captureOpen}
        onClose={closeCapture}
        initialKind={captureKind}
        seed={captureSeed}
      />
      <ShortcutsSheet open={helpOpen} onClose={() => setHelp(false)} />
    </ShortcutsProvider>
  )
}
