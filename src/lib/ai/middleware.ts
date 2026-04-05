import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/middleware'
import { getUserApiKey } from '@/lib/ai/get-api-key'
import type { AuthUser } from '@/lib/types/auth'

export interface AIContext {
  user: AuthUser
  apiKey: string
}

/**
 * Wrapper for AI API routes. Authenticates user AND ensures they have
 * a valid OpenAI API key. Returns 401 for no session, 403 for no key.
 */
export function withAI(
  handler: (req: NextRequest, ctx: AIContext) => Promise<NextResponse | Response>
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

    const apiKey = await getUserApiKey(user.id)
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AI_NOT_CONFIGURED',
            message: 'OpenAI API key not configured. Add your key in Settings to use AI features.',
          },
        },
        { status: 403 }
      )
    }

    return handler(req, { user, apiKey })
  }
}
