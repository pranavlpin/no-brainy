import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { previewImport } from '@/lib/data/backup'
import { readBackupRequest, backupFailure } from '@/lib/data/http'
export const POST = withAuth(async (req, user) => {
  try {
    return NextResponse.json({
      success: true,
      data: await previewImport(user.id, await readBackupRequest(req)),
    })
  } catch (error) {
    return backupFailure(error)
  }
})
