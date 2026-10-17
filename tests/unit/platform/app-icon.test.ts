// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('app icon', () => {
  it('is served from public/ only, never also by an app metadata route', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'public/icon.svg'))).toBe(true)
    expect(fs.existsSync(path.join(process.cwd(), 'src/app/icon.svg'))).toBe(false)
  })

  it('is listed explicitly in the root metadata so the browser still finds it', () => {
    const layout = fs.readFileSync(path.join(process.cwd(), 'src/app/layout.tsx'), 'utf8')
    expect(layout).toMatch(/url: '\/icon\.svg'/)
  })
})
