// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function modelBlock(schema: string, name: string): string {
  const m = schema.match(new RegExp(`model ${name} \\{[\\s\\S]*?\\n\\}`))
  if (!m) throw new Error(`model ${name} not found`)
  return m[0]
}

describe('NoteLink can point at any entity', () => {
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma/schema.prisma'), 'utf8')

  it('declares no foreign key from targetId to notes', () => {
    expect(modelBlock(schema, 'NoteLink')).not.toMatch(/targetNote/)
    expect(modelBlock(schema, 'Note')).not.toMatch(/linkedFrom/)
  })

  it('ships a migration that drops the old constraint', () => {
    const dir = path.join(process.cwd(), 'prisma/migrations')
    const sql = fs
      .readdirSync(dir)
      .filter((d) => fs.existsSync(path.join(dir, d, 'migration.sql')))
      .map((d) => fs.readFileSync(path.join(dir, d, 'migration.sql'), 'utf8'))
      .join('\n')
    expect(sql).toMatch(/DROP CONSTRAINT "note_links_targetId_fkey"/)
  })
})
