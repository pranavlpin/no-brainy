import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'

export async function getUserApiKey(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  })
  const prefs = user?.preferences as Record<string, unknown> | null
  const encryptedKey = prefs?.openaiApiKey as string | undefined
  if (!encryptedKey) return null
  try {
    return decrypt(encryptedKey)
  } catch {
    return null
  }
}
