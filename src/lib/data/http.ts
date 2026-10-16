import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { BACKUP_MAX_BYTES } from '@/lib/validations/backup'

/** Read a JSON body without letting an oversized file reach the parser. */
export async function readBoundedJson(req: NextRequest): Promise<unknown> {
  const length = Number(req.headers.get('content-length') ?? '0')
  if (length > BACKUP_MAX_BYTES * 1.2) throw new Error('Backup is too large. Maximum 10 MB.')
  const text = await req.text()
  if (new TextEncoder().encode(text).length > BACKUP_MAX_BYTES * 1.2) {
    throw new Error('Backup is too large. Maximum 10 MB.')
  }
  return JSON.parse(text)
}

/** Failure envelope that never echoes backup content. */
export function backupFailure(error: unknown) {
  const message =
    error instanceof ZodError
      ? (error.issues[0]?.message ?? 'This file is not a valid NoBrainy core backup.')
      : error instanceof SyntaxError
        ? 'This file is not valid JSON.'
        : error instanceof Error
          ? error.message
          : 'Could not process the backup.'
  const known = error instanceof ZodError || error instanceof SyntaxError || error instanceof Error
  if (!known) console.error('[data]', error)
  return NextResponse.json(
    { success: false, error: { code: known ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message } },
    { status: known ? 400 : 500 }
  )
}
