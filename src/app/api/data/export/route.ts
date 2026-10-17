import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { exportWorkspace } from '@/lib/data/backup'
import { backupFailure } from '@/lib/data/http'

/** Download the core workspace as a versioned JSON file. */
export const GET = withAuth(async (_req: NextRequest, user) => {
  try {
    const backup = await exportWorkspace(user.id)
    return NextResponse.json(backup, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="nobrainy-core-${backup.exportedAt.slice(0, 10)}.json"`,
      },
    })
  } catch (error) {
    return backupFailure(error)
  }
})
