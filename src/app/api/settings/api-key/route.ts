import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { encrypt } from '@/lib/crypto'
import type { AuthUser } from '@/lib/types/auth'
import type { Prisma } from '@prisma/client'

export const GET = withAuth(async (_req: NextRequest, user: AuthUser) => {
  const prefs = user.preferences as Record<string, unknown> | null
  const hasKey = !!prefs?.openaiApiKey

  return NextResponse.json({
    success: true,
    data: { hasKey },
  })
})

export const PUT = withAuth(async (req: NextRequest, user: AuthUser) => {
  const body = await req.json()
  const { apiKey } = body as { apiKey?: string }

  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'API key is required' },
      },
      { status: 400 }
    )
  }

  if (!apiKey.startsWith('sk-')) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid API key format. Key must start with sk-',
        },
      },
      { status: 400 }
    )
  }

  const encrypted = encrypt(apiKey)
  const currentPrefs = (user.preferences as Record<string, unknown>) || {}

  await prisma.user.update({
    where: { id: user.id },
    data: {
      preferences: {
        ...currentPrefs,
        openaiApiKey: encrypted,
      } as Prisma.InputJsonValue,
    },
  })

  return NextResponse.json({
    success: true,
    data: { hasKey: true },
  })
})

export const DELETE = withAuth(async (_req: NextRequest, user: AuthUser) => {
  const currentPrefs = (user.preferences as Record<string, unknown>) || {}
  const { openaiApiKey: _, ...rest } = currentPrefs

  await prisma.user.update({
    where: { id: user.id },
    data: {
      preferences: rest as Prisma.InputJsonValue,
    },
  })

  return NextResponse.json({
    success: true,
    data: { hasKey: false },
  })
})
