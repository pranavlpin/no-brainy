import { z } from 'zod'

export const createChannelSchema = z.object({
  name: z.string().trim().min(1).max(50),
  icon: z.string().max(64).optional(),
  color: z.string().max(32).optional(),
  isSensitive: z.boolean().default(false),
})

export const updateChannelSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  icon: z.string().max(64).nullable().optional(),
  color: z.string().max(32).nullable().optional(),
  isPinned: z.boolean().optional(),
})

export const createMessageSchema = z.object({
  type: z.enum(['TEXT', 'LINK', 'FILE']).default('TEXT'),
  label: z.string().trim().max(200).optional(),
  content: z.string().max(50_000).default(''),
  linkUrl: z.string().url().max(2048).optional(),
  linkTitle: z.string().max(500).optional(),
  linkDescription: z.string().max(5000).optional(),
  linkImageUrl: z.string().url().max(2048).optional(),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().nonnegative().max(10 * 1024 * 1024).optional(),
  fileMimeType: z.string().max(127).optional(),
  fileGcsObject: z.string().max(1024).optional(),
})

export const updateMessageSchema = z.object({
  label: z.string().trim().max(200).nullable().optional(),
  content: z.string().max(50_000).optional(),
  isPinned: z.boolean().optional(),
})

export const messageQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(2000).default(50),
})

export const uploadUrlSchema = z.object({
  channelId: z.string().min(1).max(40),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(127),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
})

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  channelId: z.string().max(40).optional(),
  type: z.enum(['TEXT', 'LINK', 'FILE']).optional(),
})

export type CreateChannelInput = z.infer<typeof createChannelSchema>
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>
export type CreateMessageInput = z.infer<typeof createMessageSchema>
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>
export type MessageQueryInput = z.infer<typeof messageQuerySchema>
export type UploadUrlInput = z.infer<typeof uploadUrlSchema>
export type SearchInput = z.infer<typeof searchSchema>
