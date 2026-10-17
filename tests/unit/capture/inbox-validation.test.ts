import { describe, expect, it } from 'vitest'
import { parseCapture } from '@/lib/capture/parse'
import { captureSchema, captureSource, processCaptureSchema } from '@/lib/validations/inbox'

const today = '2026-10-16'

describe('inbox capture parsing and validation', () => {
  it('recognizes the inbox prefix and keeps the rest verbatim', () => {
    const p = parseCapture('inbox: half an idea about onboarding tomorrow', { today })
    expect(p.kind).toBe('inbox')
    expect(p.title).toBe('half an idea about onboarding tomorrow')
    expect(p.dueDate).toBeUndefined()
  })

  it('requires a uuid request id and non-empty content for a capture', () => {
    expect(
      captureSchema.safeParse({ content: '  ', clientRequestId: crypto.randomUUID() }).success
    ).toBe(false)
    expect(captureSchema.safeParse({ content: 'x', clientRequestId: 'nope' }).success).toBe(false)
    expect(
      captureSchema.safeParse({ content: 'x', clientRequestId: crypto.randomUUID() }).success
    ).toBe(true)
  })

  it('extracts a web source and refuses unsafe schemes', () => {
    expect(captureSource('read https://example.com/post). later')).toBe('https://example.com/post')
    expect(captureSource('javascript:alert(1)')).toBeNull()
    expect(captureSource('no link here')).toBeNull()
  })

  it('needs a url for bookmarks and a real date key for planning fields', () => {
    expect(processCaptureSchema.safeParse({ kind: 'bookmark' }).success).toBe(false)
    expect(processCaptureSchema.safeParse({ kind: 'bookmark', url: 'https://x.y/z' }).success).toBe(
      true
    )
    expect(
      processCaptureSchema.safeParse({ kind: 'task', plannedDate: '2026-10-20' }).success
    ).toBe(true)
    expect(
      processCaptureSchema.safeParse({ kind: 'task', plannedDate: '2026-13-01' }).success
    ).toBe(false)
    expect(processCaptureSchema.safeParse({ kind: 'someday' }).success).toBe(true)
  })
})
