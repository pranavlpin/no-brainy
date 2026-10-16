export type CaptureState = 'inbox' | 'processed' | 'someday' | 'archived'
export type CaptureDestinationType = 'task' | 'note' | 'bookmark'
export type ProcessKind = CaptureDestinationType | 'someday'

export interface CaptureResponse {
  id: string
  userId: string
  clientRequestId: string
  content: string
  sourceUrl: string | null
  state: CaptureState
  destinationType: CaptureDestinationType | null
  destinationId: string | null
  processedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CaptureInput {
  content: string
  clientRequestId: string
  sourceUrl?: string | null
}

export interface ProcessCaptureInput {
  kind: ProcessKind
  title?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  /** Calendar day keys. */
  plannedDate?: string | null
  dueDate?: string | null
  url?: string
}

export interface CaptureFilters {
  state?: CaptureState | 'all'
  search?: string
  page?: number
  pageSize?: number
  id?: string
}

/** Where a processed capture went; bookmarks open the library. */
export function captureDestination(
  capture: Pick<CaptureResponse, 'destinationType' | 'destinationId'>
): string | null {
  if (!capture.destinationId) return null
  if (capture.destinationType === 'task') return `/tasks/${capture.destinationId}`
  if (capture.destinationType === 'note') return `/notes/${capture.destinationId}`
  if (capture.destinationType === 'bookmark') return '/bookmarks'
  return null
}
