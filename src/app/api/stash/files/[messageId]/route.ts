import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth/middleware'
import { getSignedDownloadUrl, isGcsConfigured } from '@/lib/gcs'

function extractMessageId(url: string): string {
  const segments = new URL(url).pathname.split('/')
  const idx = segments.indexOf('files')
  return segments[idx + 1]
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  if (!isGcsConfigured()) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_CONFIGURED', message: 'File downloads are not configured' } },
      { status: 503 }
    )
  }

  const messageId = extractMessageId(req.url)
  const message = await prisma.stashMessage.findFirst({
    where: {
      id: messageId,
      userId: user.id,
      isDeleted: false,
      type: 'FILE',
    },
    select: { fileGcsObject: true },
  })

  if (!message?.fileGcsObject) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'File not found' } },
      { status: 404 }
    )
  }

  try {
    const signedUrl = await getSignedDownloadUrl(message.fileGcsObject)
    // Redirect; signed URL holds the original Content-Type from GCS object.
    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not generate download URL' } },
      { status: 500 }
    )
  }
}
