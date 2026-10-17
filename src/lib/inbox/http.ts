import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/** Failure envelope that never echoes captured content or database details. */
export function inboxError(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

/** Input failures are 400; anything else stays retryable and private. */
export function inboxFailure(error: unknown) {
  if (error instanceof ZodError) {
    return inboxError('VALIDATION_ERROR', error.issues[0]?.message ?? 'Check your input', 400)
  }
  console.error('[inbox]', error)
  return inboxError('INTERNAL_ERROR', 'Could not save this capture. Your text is kept; retry.', 500)
}
