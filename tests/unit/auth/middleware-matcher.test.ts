// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/options', () => ({ auth: (handler: unknown) => handler }))

import { config } from '@/middleware'

describe('auth middleware matcher', () => {
  it('protects every dashboard section, including ones added later', () => {
    const dir = path.join(process.cwd(), 'src/app/(dashboard)')
    const sections = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
    expect(sections.length).toBeGreaterThan(10)
    expect(config.matcher).toContain('/')
    for (const section of sections) {
      expect(config.matcher, `section /${section} is not matched`).toContain(`/${section}/:path*`)
    }
  })
})
