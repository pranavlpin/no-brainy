export function isHttpUrl(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length === 0 || /\s/.test(trimmed)) return false
  try {
    const u = new URL(trimmed)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function getHostname(value: string): string {
  try {
    return new URL(value.trim()).hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}
