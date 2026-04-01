import { auth } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import type { AuthUser } from '@/lib/types/auth'

/**
 * Get the authenticated user for API routes.
 * Returns the user or null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
    timezone: user.timezone,
    preferences: user.preferences as Record<string, unknown>,
    createdAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastActiveAt.toISOString(),
  }
}

/**
 * Wrapper for protected API routes.
 * Returns 401 if the user is not authenticated.
 */
export function withAuth(
  handler: (req: NextRequest, user: AuthUser) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }
    return handler(req, user)
  }
}
