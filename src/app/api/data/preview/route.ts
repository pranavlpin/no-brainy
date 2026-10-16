import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { previewImport } from '@/lib/data/backup'
import { backupFailure, readBoundedJson } from '@/lib/data/http'

/** Validate a backup and describe what an import would add. Writes nothing. */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const data = await previewImport(user.id, await readBoundedJson(req))
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return backupFailure(error)
  }
})
