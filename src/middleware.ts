import { auth } from '@/lib/auth/options'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth) {
    // The root is the Today cockpit; anonymous visitors see the welcome page.
    if (req.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/welcome', req.url))
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/',
    '/notes/:path*',
    '/stash/:path*',
    '/tasks/:path*',
    '/books/:path*',
    '/flashcards/:path*',
    '/planner/:path*',
    '/reviews/:path*',
    '/goals/:path*',
    '/search/:path*',
    '/analytics/:path*',
    '/expenses/:path*',
    '/budgets/:path*',
    '/bookmarks/:path*',
    '/watchlist/:path*',
    '/insights/:path*',
    '/ai/:path*',
    '/notifications/:path*',
    '/settings/:path*',
  ],
}
