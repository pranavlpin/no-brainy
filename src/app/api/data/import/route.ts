import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { importWorkspace } from '@/lib/data/backup'
import { backupFailure, readBoundedJson } from '@/lib/data/http'

const schema = z
  .object({
    backup: z.unknown(),
    clientRequestId: z.string().uuid(),
    fingerprint: z.string().length(64),
    confirm: z.literal(true, { errorMap: () => ({ message: 'Confirm the import after previewing it.' }) }),
  })
  .strict()

/** Additive import, only after an explicit confirm against a fresh preview. */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { backup, clientRequestId, fingerprint } = schema.parse(await readBoundedJson(req))
    const data = await importWorkspace(user.id, backup, clientRequestId, fingerprint)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return backupFailure(error)
  }
})
