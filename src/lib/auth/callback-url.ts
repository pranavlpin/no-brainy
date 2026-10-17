/**
 * Resolve a `callbackUrl` from the login page into a path we are willing to
 * send the user to. Anything on another origin, or that fails to parse, falls
 * back to the Today page so the login form can never be used as an open redirect.
 */
export function safeCallbackPath(raw: string | null | undefined, origin: string): string {
  if (!raw) return '/'
  try {
    const url = new URL(raw, origin)
    if (url.origin !== origin || url.pathname.startsWith('//')) return '/'
    return `${url.pathname}${url.search}${url.hash}` || '/'
  } catch {
    return '/'
  }
}
