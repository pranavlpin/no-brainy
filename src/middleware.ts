import { auth } from '@/lib/auth/options'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/notes/:path*',
    '/tasks/:path*',
    '/books/:path*',
    '/flashcards/:path*',
    '/planner/:path*',
    '/reviews/:path*',
    '/goals/:path*',
    '/search/:path*',
    '/analytics/:path*',
    '/settings/:path*',
  ],
}
