import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import manifest from '@/app/manifest'

describe('PWA manifest', () => {
  const m = manifest()

  it('is installable: standalone display, start at Today, theme colors, and PNG icons', () => {
    expect(m.display).toBe('standalone')
    expect(m.start_url).toBe('/')
    expect(m.name).toMatch(/NoBrainy/)
    expect(m.theme_color).toBeTruthy()
    expect(m.background_color).toBeTruthy()
    const sizes = (m.icons ?? []).map((i) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect((m.icons ?? []).some((i) => i.purpose === 'maskable')).toBe(true)
  })

  it('references icon files that exist in public/', () => {
    const pub = path.resolve(__dirname, '../../../public')
    for (const icon of m.icons ?? []) {
      expect(existsSync(path.join(pub, icon.src)), icon.src).toBe(true)
    }
    expect(existsSync(path.join(pub, 'icons/apple-touch-icon.png'))).toBe(true)
    expect(existsSync(path.join(pub, 'icon.svg'))).toBe(true)
  })
})
