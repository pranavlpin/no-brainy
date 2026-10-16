export type CaptureState = 'inbox' | 'processed' | 'someday' | 'archived'
export interface CaptureResponse {
  id: string
  userId: string
  clientRequestId: string
  content: string
  sourceUrl: string | null
  state: CaptureState
  destinationType: 'task' | 'note' | 'bookmark' | null
  destinationId: string | null
  createdAt: string
  updatedAt: string
  processedAt: string | null
}
export interface CaptureInput {
  content: string
  clientRequestId: string
  sourceUrl?: string | null
}
export interface ProcessCaptureInput {
  kind: 'task' | 'note' | 'bookmark' | 'someday'
  title?: string
  projectId?: string | null
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string | null
  url?: string
}

/** Existing destinations stay linked even when processing is undone; bookmark results open the library. */
export function captureDestination(capture: CaptureResponse): string | null {
  if (!capture.destinationId) return null
  if (capture.destinationType === 'task') return `/tasks/${capture.destinationId}`
  if (capture.destinationType === 'note') return `/notes/${capture.destinationId}`
  if (capture.destinationType === 'bookmark') return '/bookmarks'
  return null
}
