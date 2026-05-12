import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth/middleware'
import { uploadUrlSchema } from '@/lib/validations/stash'
import { getSignedUploadUrl, isGcsConfigured } from '@/lib/gcs'
import { isAllowedMime, sanitizeFilename, STASH_MAX_FILE_SIZE } from '@/lib/stash/file-validation'
import type { ApiResponse } from '@/lib/types/api'

interface UploadUrlResponse {
  uploadUrl: string
  gcsObject: string
  expiresInSeconds: number
}

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    if (!isGcsConfigured()) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_CONFIGURED', message: 'File uploads are not configured' } },
        { status: 503 }
      )
    }

    const body = await req.json()
    const data = uploadUrlSchema.parse(body)

    if (data.sizeBytes > STASH_MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 10MB limit' } },
        { status: 400 }
      )
    }

    if (!isAllowedMime(data.mimeType)) {
      return NextResponse.json(
        { success: false, error: { code: 'MIME_NOT_ALLOWED', message: `MIME type "${data.mimeType}" is not allowed` } },
        { status: 400 }
      )
    }

    const channel = await prisma.stashChannel.findFirst({
      where: { id: data.channelId, userId: user.id, isDeleted: false },
      select: { id: true },
    })
    if (!channel) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Channel not found' } },
        { status: 404 }
      )
    }

    const nonce = randomBytes(8).toString('hex')
    const safeName = sanitizeFilename(data.filename)
    const objectKey = `${user.id}/${data.channelId}/${nonce}-${safeName}`

    const uploadUrl = await getSignedUploadUrl({ objectKey, mimeType: data.mimeType })

    const response: ApiResponse<UploadUrlResponse> = {
      success: true,
      data: { uploadUrl, gcsObject: objectKey, expiresInSeconds: 300 },
    }
    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {}
      for (const issue of error.issues) {
        const field = issue.path.join('.')
        if (!details[field]) details[field] = []
        details[field].push(issue.message)
      }
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Could not create upload URL' } },
      { status: 500 }
    )
  }
})
