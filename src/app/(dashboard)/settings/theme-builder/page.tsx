'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, Shuffle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { ThemePreview } from '@/components/settings/theme-preview'
import { useThemeStore, THEMES, type ThemeName } from '@/stores/theme-store'

const COLOR_KEYS = [
  { key: '--background', label: 'Background', description: 'Main page and card background' },
  { key: '--page-bg-subtle', label: 'Content Area', description: 'Content area tint behind cards' },
  { key: '--sidebar-bg', label: 'Sidebar', description: 'Sidebar background color' },
  { key: '--retro-blue', label: 'Blue', description: 'Primary actions, buttons, links' },
  { key: '--retro-pink', label: 'Pink', description: 'Badges, highlights, accents' },
  { key: '--retro-yellow', label: 'Yellow', description: 'Decorative bars, star ratings' },
  { key: '--retro-mint', label: 'Mint', description: 'Success states, progress fills' },
  { key: '--retro-orange', label: 'Orange', description: 'Warnings, alerts, due dates' },
  { key: '--retro-dark', label: 'Dark', description: 'Text, borders, card outlines' },
  { key: '--retro-cream', label: 'Cream', description: 'Subtle fills and accents' },
] as const

const PRESET_DEFAULTS: Record<ThemeName, Record<string, string>> = {
  retro: {
    '--background': '0 0% 100%',
    '--retro-blue': '233 100% 59%',
    '--retro-pink': '336 100% 58%',
    '--retro-yellow': '52 100% 50%',
    '--retro-mint': '160 100% 45%',
    '--retro-orange': '25 100% 55%',
    '--retro-dark': '240 20% 13%',
    '--retro-cream': '48 100% 96%',
    '--sidebar-bg': '220 15% 18%',
    '--page-bg-subtle': '44 100% 95%',
  },
  ocean: {
    '--background': '200 20% 98%',
    '--retro-blue': '220 90% 50%',
    '--retro-pink': '195 100% 45%',
    '--retro-yellow': '45 90% 55%',
    '--retro-mint': '175 70% 45%',
    '--retro-orange': '15 80% 55%',
    '--retro-dark': '220 30% 15%',
    '--retro-cream': '200 30% 96%',
    '--sidebar-bg': '215 35% 20%',
    '--page-bg-subtle': '200 30% 96%',
  },
  forest: {
    '--background': '120 15% 98%',
    '--retro-blue': '150 60% 35%',
    '--retro-pink': '340 60% 55%',
    '--retro-yellow': '45 85% 50%',
    '--retro-mint': '120 50% 45%',
    '--retro-orange': '25 75% 50%',
    '--retro-dark': '150 25% 13%',
    '--retro-cream': '90 25% 95%',
    '--sidebar-bg': '150 25% 18%',
    '--page-bg-subtle': '80 25% 96%',
  },
  sunset: {
    '--background': '30 30% 98%',
    '--retro-blue': '270 70% 55%',
    '--retro-pink': '340 85% 55%',
    '--retro-yellow': '35 100% 55%',
    '--retro-mint': '180 50% 45%',
    '--retro-orange': '15 80% 55%',
    '--retro-dark': '280 20% 15%',
    '--retro-cream': '30 40% 96%',
    '--sidebar-bg': '270 25% 20%',
    '--page-bg-subtle': '30 40% 96%',
  },
}

function generateHarmoniousPalette(): Record<string, string> {
  const baseHue = Math.floor(Math.random() * 360)
  return {
    '--background': `${(baseHue + 40) % 360} 15% 99%`,
    '--retro-blue': `${baseHue} 80% 55%`,
    '--retro-pink': `${(baseHue + 150) % 360} 75% 55%`,
    '--retro-yellow': `${(baseHue + 60) % 360} 85% 55%`,
    '--retro-mint': `${(baseHue + 120) % 360} 65% 45%`,
    '--retro-orange': `${(baseHue + 30) % 360} 80% 55%`,
    '--retro-dark': `${baseHue} 20% 13%`,
    '--retro-cream': `${(baseHue + 40) % 360} 30% 95%`,
    '--sidebar-bg': `${baseHue} 20% 18%`,
    '--page-bg-subtle': `${(baseHue + 40) % 360} 25% 95%`,
  }
}

export default function ThemeBuilderPage(): JSX.Element {
  const {
    theme,
    customThemes,
    activeCustomThemeId,
    applyCustomTheme,
    saveCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    applyLiveColors,
    setTheme,
  } = useThemeStore()

  const [themeName, setThemeName] = useState('My Custom Theme')
  const [colors, setColors] = useState<Record<string, string>>(PRESET_DEFAULTS.retro)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [startFrom, setStartFrom] = useState<ThemeName>('retro')

  // On mount, load active custom theme colors or current preset
  useEffect(() => {
    if (theme === 'custom' && activeCustomThemeId) {
      const active = customThemes.find((c) => c.id === activeCustomThemeId)
      if (active) {
        setColors(active.colors)
        setThemeName(active.name)
        setEditingId(active.id)
        return
      }
    }
    // Fall back to current preset
    const presetKey = theme === 'custom' ? 'retro' : theme
    setColors(PRESET_DEFAULTS[presetKey])
    setStartFrom(presetKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleColorChange = useCallback((key: string, value: string) => {
    setColors((prev) => {
      const next = { ...prev, [key]: value }
      applyLiveColors(next)
      return next
    })
  }, [applyLiveColors])

  const handleStartFrom = (preset: ThemeName): void => {
    setStartFrom(preset)
    const newColors = PRESET_DEFAULTS[preset]
    setColors(newColors)
    applyLiveColors(newColors)
    setEditingId(null)
  }

  const handleRandomize = (): void => {
    const newColors = generateHarmoniousPalette()
    setColors(newColors)
    applyLiveColors(newColors)
  }

  const handleSave = (): void => {
    if (!themeName.trim()) return

    if (editingId) {
      updateCustomTheme(editingId, { name: themeName, colors })
      applyCustomTheme(editingId)
    } else {
      const saved = saveCustomTheme({ name: themeName, colors })
      setEditingId(saved.id)
      applyCustomTheme(saved.id)
    }
  }

  const handleSelectSaved = (id: string): void => {
    const found = customThemes.find((c) => c.id === id)
    if (!found) return
    setColors(found.colors)
    setThemeName(found.name)
    setEditingId(id)
    applyCustomTheme(id)
  }

  const handleDelete = (id: string): void => {
    deleteCustomTheme(id)
    if (editingId === id) {
      setEditingId(null)
      setThemeName('My Custom Theme')
      const newColors = PRESET_DEFAULTS.retro
      setColors(newColors)
      applyLiveColors(newColors)
    }
  }

  // On unmount, if user hasn't saved, revert to previous theme state
  useEffect(() => {
    return () => {
      // Re-apply the stored theme on leave to avoid orphan live previews
      const stored = localStorage.getItem('nobrainy-theme')
      if (stored === 'custom') {
        const activeId = localStorage.getItem('nobrainy-active-custom-theme')
        if (activeId) {
          const customs = JSON.parse(localStorage.getItem('nobrainy-custom-themes') || '[]') as Array<{ id: string; colors: Record<string, string> }>
          const active = customs.find((c) => c.id === activeId)
          if (active) {
            Object.entries(active.colors).forEach(([k, v]) => {
              document.documentElement.style.setProperty(k, v)
            })
            return
          }
        }
        // No valid custom theme found, revert to retro
        setTheme('retro')
      }
    }
  }, [setTheme])

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded border-2 border-retro-dark/15 text-retro-dark/60 hover:border-retro-dark/30 hover:text-retro-dark"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-retro-dark">
            Theme Builder
          </h1>
          <p className="text-sm text-retro-dark/60">
            Create a custom color palette for your workspace.
          </p>
        </div>
      </div>

      {/* Name + Start From */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="font-mono text-xs uppercase tracking-wider text-retro-dark/60 mb-1 block">
            Theme Name
          </label>
          <Input
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            placeholder="My Custom Theme"
            className="max-w-xs"
          />
        </div>
        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-retro-dark/60 mb-1 block">
            Start From
          </label>
          <select
            value={startFrom}
            onChange={(e) => handleStartFrom(e.target.value as ThemeName)}
            className="rounded border-2 border-retro-dark/15 bg-white px-3 py-2 text-sm font-mono capitalize focus:border-retro-blue focus:outline-none"
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two-column: pickers + preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Color pickers */}
        <div className="space-y-3">
          {COLOR_KEYS.map(({ key, label, description }) => (
            <ColorPicker
              key={key}
              label={label}
              description={description}
              value={colors[key] || '0 0% 50%'}
              onChange={(val) => handleColorChange(key, val)}
            />
          ))}
        </div>

        {/* Right: Live preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <ThemePreview />
        </div>
      </div>

      {/* Bottom bar: saved themes + actions */}
      <div className="rounded-lg border-2 border-retro-dark/10 bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} className="gap-1.5">
            <Save className="h-4 w-4" />
            {editingId ? 'Update Theme' : 'Save Theme'}
          </Button>
          <Button variant="outline" onClick={handleRandomize} className="gap-1.5">
            <Shuffle className="h-4 w-4" />
            Randomize
          </Button>
        </div>

        {customThemes.length > 0 && (
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-wider text-retro-dark/60">
              Saved Themes
            </p>
            <div className="flex flex-wrap gap-2">
              {customThemes.map((ct) => (
                <div
                  key={ct.id}
                  className={`flex items-center gap-2 rounded border-2 px-3 py-1.5 text-sm ${
                    editingId === ct.id
                      ? 'border-retro-blue bg-retro-blue/5'
                      : 'border-retro-dark/10 hover:border-retro-dark/25'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectSaved(ct.id)}
                    className="font-medium text-retro-dark"
                  >
                    {ct.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ct.id)}
                    className="text-retro-dark/40 hover:text-red-600"
                    aria-label={`Delete ${ct.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
