import { Storage } from '@google-cloud/storage'
import { STASH_SIGNED_URL_TTL_SECONDS } from '@/lib/stash/file-validation'

let cachedStorage: Storage | null = null

function getStorage(): Storage {
  if (!cachedStorage) {
    const projectId = process.env.GCS_PROJECT_ID
    cachedStorage = projectId ? new Storage({ projectId }) : new Storage()
  }
  return cachedStorage
}

function getBucketName(): string {
  const name = process.env.GCS_BUCKET_NAME
  if (!name) throw new Error('GCS_BUCKET_NAME env var is not set')
  return name
}

export function isGcsConfigured(): boolean {
  return Boolean(process.env.GCS_BUCKET_NAME)
}

export interface SignedUploadOptions {
  objectKey: string
  mimeType: string
}

export async function getSignedUploadUrl({ objectKey, mimeType }: SignedUploadOptions): Promise<string> {
  const [url] = await getStorage()
    .bucket(getBucketName())
    .file(objectKey)
    .getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + STASH_SIGNED_URL_TTL_SECONDS * 1000,
      contentType: mimeType,
    })
  return url
}

export async function getSignedDownloadUrl(objectKey: string): Promise<string> {
  const [url] = await getStorage()
    .bucket(getBucketName())
    .file(objectKey)
    .getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + STASH_SIGNED_URL_TTL_SECONDS * 1000,
    })
  return url
}

export async function deleteObject(objectKey: string): Promise<void> {
  await getStorage().bucket(getBucketName()).file(objectKey).delete({ ignoreNotFound: true })
}
