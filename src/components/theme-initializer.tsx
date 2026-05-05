'use client'

import { useEffect } from 'react'
import { useThemeStore, THEMES } from '@/stores/theme-store'

export function ThemeInitializer(): null {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const html = document.documentElement
    THEMES.forEach((t) => html.classList.remove(`theme-${t}`))
    if (theme !== 'retro') {
      html.classList.add(`theme-${theme}`)
    }
  }, [theme])

  return null
}
