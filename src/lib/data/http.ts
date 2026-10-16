import { NextResponse } from 'next/server'
import { BACKUP_MAX_BYTES } from '@/lib/validations/backup'
/** Read a bounded JSON request before parsing private workspace records. */
export async function readBackupRequest(req: Request): Promise<unknown> {
  if (Number(req.headers.get('content-length')) > BACKUP_MAX_BYTES)
    throw Error('Backup is too large. Maximum 10 MB.')
  const reader = req.body?.getReader()
  if (!reader) throw Error('Missing backup')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > BACKUP_MAX_BYTES) {
        await reader.cancel()
        throw Error('Backup is too large. Maximum 10 MB.')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
/** Return private-safe failures without echoing backup contents or database errors. */
export function backupFailure(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  const conflict = /import request|import preview/.test(message)
  const known =
    /^(Backup is too large|Backup contains too many|Invalid .* reference|Task reference cycle|Duplicate |This import request|The import preview)/.test(
      message
    )
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'BACKUP_ERROR',
        message: known
          ? message
          : 'Could not process this core backup. Check its version and contents, then retry. No partial import was saved.',
      },
    },
    { status: conflict ? 409 : message.startsWith('Backup is too large') ? 413 : 400 }
  )
}
