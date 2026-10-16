import { describe, it, expect, beforeAll } from 'vitest'
import { encryptContent, decryptContent } from './encrypt-message'

describe('encryptContent / decryptContent', () => {
  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-for-encryption-tests-only'
  })

  it('bypasses encryption when channel is not sensitive', () => {
    const result = encryptContent('hello world', false)
    expect(result.isEncrypted).toBe(false)
    expect(result.content).toBe('hello world')
  })

  it('bypasses encryption for empty plaintext', () => {
    const result = encryptContent('', true)
    expect(result.isEncrypted).toBe(false)
    expect(result.content).toBe('')
  })

  it('encrypts when channel is sensitive', () => {
    const plaintext = 'hunter2'
    const result = encryptContent(plaintext, true)
    expect(result.isEncrypted).toBe(true)
    expect(result.content).not.toBe(plaintext)
    expect(result.content.length).toBeGreaterThan(plaintext.length)
    expect(result.content).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)
  })

  it('round-trips encrypt -> decrypt', () => {
    const plaintext = 'multi-line\npassword with !@#$ special chars and unicode 🔐'
    const { content, isEncrypted } = encryptContent(plaintext, true)
    expect(isEncrypted).toBe(true)
    expect(decryptContent(content, true)).toBe(plaintext)
  })

  it('produces different ciphertext for the same plaintext (random IV)', () => {
    const a = encryptContent('same secret', true)
    const b = encryptContent('same secret', true)
    expect(a.content).not.toBe(b.content)
    expect(decryptContent(a.content, true)).toBe('same secret')
    expect(decryptContent(b.content, true)).toBe('same secret')
  })

  it('passes stored value through when isEncrypted is false', () => {
    expect(decryptContent('plain text', false)).toBe('plain text')
  })

  it('returns empty string if decryption fails (corrupt ciphertext)', () => {
    expect(decryptContent('not-a-real-ciphertext', true)).toBe('')
  })
})
