'use client'

import { useLayoutEffect } from 'react'
import { useThemeStore } from '@/stores/theme-store'
import { useDarkModeStore } from '@/stores/dark-mode-store'
import { useUIStore } from '@/stores/ui-store'

/** Apply stored preferences after hydration so server and first client markup agree. */
export function ThemeInitializer(): null {
  useLayoutEffect(() => {
    useThemeStore.getState().hydrate()
    useDarkModeStore.getState().hydrate()
    useUIStore.getState().hydratePreferences()
  }, [])
  return null
}
