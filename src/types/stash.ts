export type StashMessageType = 'TEXT' | 'LINK' | 'FILE'

export interface StashChannelResponse {
  id: string
  userId: string
  name: string
  icon: string | null
  color: string | null
  isSensitive: boolean
  isPinned: boolean
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
}

export interface StashMessageResponse {
  id: string
  channelId: string
  userId: string
  type: StashMessageType
  label: string | null
  content: string
  isEncrypted: boolean
  linkUrl: string | null
  linkTitle: string | null
  linkDescription: string | null
  linkImageUrl: string | null
  fileName: string | null
  fileSize: number | null
  fileMimeType: string | null
  fileGcsObject: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateChannelRequest {
  name: string
  icon?: string
  color?: string
  isSensitive?: boolean
}

export interface UpdateChannelRequest {
  name?: string
  icon?: string | null
  color?: string | null
  isPinned?: boolean
}

export interface CreateMessageRequest {
  type?: StashMessageType
  label?: string
  content?: string
  linkUrl?: string
  linkTitle?: string
  linkDescription?: string
  linkImageUrl?: string
  fileName?: string
  fileSize?: number
  fileMimeType?: string
  fileGcsObject?: string
}

export interface UpdateMessageRequest {
  label?: string | null
  content?: string
  isPinned?: boolean
}

export interface MessagesPage {
  items: StashMessageResponse[]
  nextCursor: string | null
}
