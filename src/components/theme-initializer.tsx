'use client'

import { useEffect } from 'react'
import { useThemeStore, THEMES } from '@/stores/theme-store'

export function ThemeInitializer(): null {
  const theme = useThemeStore((s) => s.theme)
  const customThemes = useThemeStore((s) => s.customThemes)
  const activeCustomThemeId = useThemeStore((s) => s.activeCustomThemeId)

  useEffect(() => {
    const html = document.documentElement

    if (theme === 'custom') {
      // Remove preset classes
      THEMES.forEach((t) => html.classList.remove(`theme-${t}`))
      // Apply custom CSS vars
      const active = customThemes.find((c) => c.id === activeCustomThemeId)
      if (active) {
        Object.entries(active.colors).forEach(([key, value]) => {
          html.style.setProperty(key, value)
        })
      }
    } else {
      // Clear custom vars
      const varsToRemove = [
        '--retro-blue',
        '--retro-pink',
        '--retro-yellow',
        '--retro-mint',
        '--retro-orange',
        '--retro-dark',
        '--retro-cream',
      ]
      varsToRemove.forEach((v) => html.style.removeProperty(v))
      // Apply preset
      THEMES.forEach((t) => html.classList.remove(`theme-${t}`))
      if (theme !== 'retro') {
        html.classList.add(`theme-${theme}`)
      }
    }
  }, [theme, customThemes, activeCustomThemeId])

  return null
}
