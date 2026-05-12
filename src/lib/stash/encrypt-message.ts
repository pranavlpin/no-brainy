import { encrypt, decrypt } from '@/lib/crypto'

export interface EncryptedField {
  content: string
  isEncrypted: boolean
}

export function encryptContent(plaintext: string, isSensitive: boolean): EncryptedField {
  if (!isSensitive || plaintext.length === 0) {
    return { content: plaintext, isEncrypted: false }
  }
  return { content: encrypt(plaintext), isEncrypted: true }
}

export function decryptContent(stored: string, isEncrypted: boolean): string {
  if (!isEncrypted || stored.length === 0) return stored
  try {
    return decrypt(stored)
  } catch {
    return ''
  }
}
