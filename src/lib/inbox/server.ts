import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/** Return a safe failure envelope without leaking captured content or database details. */
export function inboxError(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}
/** Translate input failures while keeping unexpected failures retryable and private. */
export function inboxFailure(error: unknown) {
  return error instanceof ZodError
    ? inboxError('VALIDATION_ERROR', error.issues[0]?.message ?? 'Check your input', 400)
    : inboxError(
        'INTERNAL_ERROR',
        'Could not save this capture. Your input is kept; please retry.',
        500
      )
}
