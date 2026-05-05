import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import type { AIModel } from '@/lib/ai/openai-client'

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

export async function getUserAIModel(userId: string): Promise<AIModel | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  })
  const prefs = user?.preferences as Record<string, unknown> | null
  const model = prefs?.aiModel as string | undefined
  if (model === 'gpt-4o' || model === 'gpt-4o-mini') return model
  return null
}
