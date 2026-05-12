import type { StashChannelResponse, StashMessageResponse } from '@/types/stash'

type ChannelRow = {
  id: string
  userId: string
  name: string
  icon: string | null
  color: string | null
  isSensitive: boolean
  isPinned: boolean
  lastMessageAt: Date | null
  createdAt: Date
  updatedAt: Date
}

type MessageRow = {
  id: string
  channelId: string
  userId: string
  type: 'TEXT' | 'LINK' | 'FILE'
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
  createdAt: Date
  updatedAt: Date
}

export function formatChannel(c: ChannelRow): StashChannelResponse {
  return {
    id: c.id,
    userId: c.userId,
    name: c.name,
    icon: c.icon,
    color: c.color,
    isSensitive: c.isSensitive,
    isPinned: c.isPinned,
    lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }
}

export function formatMessage(m: MessageRow): StashMessageResponse {
  return {
    id: m.id,
    channelId: m.channelId,
    userId: m.userId,
    type: m.type,
    label: m.label,
    content: m.content,
    isEncrypted: m.isEncrypted,
    linkUrl: m.linkUrl,
    linkTitle: m.linkTitle,
    linkDescription: m.linkDescription,
    linkImageUrl: m.linkImageUrl,
    fileName: m.fileName,
    fileSize: m.fileSize,
    fileMimeType: m.fileMimeType,
    fileGcsObject: m.fileGcsObject,
    isPinned: m.isPinned,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }
}
