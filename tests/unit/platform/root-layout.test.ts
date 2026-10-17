import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../../../')

describe('root layout and favicon', () => {
  it('does not render a manual <head>, which turned an empty GA id into a stray text node', () => {
    const src = readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8')
    expect(src).not.toMatch(/<head>/)
    expect(src).not.toMatch(/GA_ID &&/)
  })

  it('ships a favicon.ico that browsers request by default', () => {
    const file = path.join(root, 'public/favicon.ico')
    expect(existsSync(file)).toBe(true)
    const bytes = readFileSync(file)
    // ICO header: reserved 0, type 1 (icon), at least one image
    expect(Array.from(bytes.subarray(0, 4))).toEqual([0, 0, 1, 0])
    expect(bytes.readUInt16LE(4)).toBeGreaterThanOrEqual(1)
  })
})
