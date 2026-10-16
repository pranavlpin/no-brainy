import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { importWorkspace } from '@/lib/data/backup'
import { readBackupRequest, backupFailure } from '@/lib/data/http'
const schema = z
  .object({
    backup: z.unknown(),
    clientRequestId: z.string().uuid(),
    fingerprint: z.string().length(64),
    confirm: z.literal(true),
  })
  .strict()
export const POST = withAuth(async (req, user) => {
  try {
    const { backup, clientRequestId, fingerprint } = schema.parse(await readBackupRequest(req))
    return NextResponse.json({
      success: true,
      data: await importWorkspace(user.id, backup, clientRequestId, fingerprint),
    })
  } catch (error) {
    return backupFailure(error)
  }
})
