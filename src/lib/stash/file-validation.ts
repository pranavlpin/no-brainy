export const STASH_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const STASH_SIGNED_URL_TTL_SECONDS = 5 * 60   // 5 min

const ALLOWED_MIME_PREFIXES = ['image/', 'text/']
const ALLOWED_MIME_EXACT = new Set<string>([
  'application/pdf',
  'application/json',
  'application/zip',
])
// SVG can carry inline scripts; block it since signed download URLs are
// served by GCS with the original Content-Type.
const BLOCKED_MIME_EXACT = new Set<string>(['image/svg+xml'])

export function isAllowedMime(mimeType: string): boolean {
  if (!mimeType) return false
  if (BLOCKED_MIME_EXACT.has(mimeType)) return false
  if (ALLOWED_MIME_EXACT.has(mimeType)) return true
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))
}

export function sanitizeFilename(name: string): string {
  // Strip path separators, control chars, and trim length.
  const cleaned = name
    .replace(/[\\/]/g, '_')
    .replace(/[\x00-\x1f]/g, '_')
    .replace(/[^\w.\-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  return cleaned.slice(0, 100) || 'file'
}
