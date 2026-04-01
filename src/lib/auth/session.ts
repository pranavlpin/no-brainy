import { auth } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import type { AuthUser } from '@/lib/types/auth'

/**
 * Get the current authenticated user from the session.
 * For use in server components and API routes.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
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
