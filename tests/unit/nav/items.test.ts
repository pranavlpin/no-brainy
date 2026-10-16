import { readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { NAV_GROUPS, NAV_ITEMS, NAV_ITEMS_BY_HREF, labelFor } from '@/lib/nav/items'

const EXCLUDED = new Set(['settings', 'notifications'])

describe('nav registry', () => {
  it('covers every top-level dashboard section that has a page', () => {
    const dir = path.resolve(__dirname, '../../../src/app/(dashboard)')
    const sections = readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !EXCLUDED.has(d.name))
      .filter((d) => existsSync(path.join(dir, d.name, 'page.tsx')))
      .map((d) => `/${d.name}`)
    for (const href of sections)
      expect(NAV_ITEMS_BY_HREF[href], `missing nav item for ${href}`).toBeTruthy()
    expect(NAV_ITEMS_BY_HREF['/']).toBeTruthy()
  })

  it('assigns every item to a declared group', () => {
    const keys = new Set(NAV_GROUPS.map((g) => g.key))
    for (const item of NAV_ITEMS) expect(keys.has(item.group), item.href).toBe(true)
  })

  it('labels hrefs and segments, including non-nav routes', () => {
    expect(labelFor('/budgets')).toBe('Budgets')
    expect(labelFor('budgets')).toBe('Budgets')
    expect(labelFor('/')).toBe('Today')
    expect(labelFor('settings')).toBe('Settings')
    expect(labelFor('theme-builder')).toBe('Theme builder')
  })
})
