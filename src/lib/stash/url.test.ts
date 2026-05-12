import { describe, it, expect } from 'vitest'
import { isHttpUrl, getHostname } from './url'

describe('isHttpUrl', () => {
  it('accepts https URLs', () => {
    expect(isHttpUrl('https://example.com')).toBe(true)
    expect(isHttpUrl('https://example.com/path?q=1#hash')).toBe(true)
  })

  it('accepts http URLs', () => {
    expect(isHttpUrl('http://example.com')).toBe(true)
  })

  it('trims surrounding whitespace', () => {
    expect(isHttpUrl('  https://example.com  ')).toBe(true)
  })

  it('rejects URLs with embedded whitespace', () => {
    expect(isHttpUrl('https://example.com hello')).toBe(false)
    expect(isHttpUrl('check out https://example.com')).toBe(false)
  })

  it('rejects empty / non-URL strings', () => {
    expect(isHttpUrl('')).toBe(false)
    expect(isHttpUrl('   ')).toBe(false)
    expect(isHttpUrl('hello world')).toBe(false)
    expect(isHttpUrl('example.com')).toBe(false)
  })

  it('rejects non-http(s) protocols', () => {
    expect(isHttpUrl('ftp://example.com')).toBe(false)
    expect(isHttpUrl('file:///etc/passwd')).toBe(false)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('mailto:foo@bar.com')).toBe(false)
  })
})

describe('getHostname', () => {
  it('returns the hostname', () => {
    expect(getHostname('https://news.ycombinator.com/item?id=1')).toBe('news.ycombinator.com')
  })

  it('strips www. prefix', () => {
    expect(getHostname('https://www.example.com')).toBe('example.com')
  })

  it('returns the input on malformed URL', () => {
    expect(getHostname('not-a-url')).toBe('not-a-url')
  })
})
