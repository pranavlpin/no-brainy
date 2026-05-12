'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCreateChannel } from '@/hooks/use-stash'

interface NewChannelDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: (channelId: string) => void
}

export function NewChannelDialog({ open, onClose, onCreated }: NewChannelDialogProps) {
  const [name, setName] = useState('')
  const [isSensitive, setIsSensitive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const create = useCreateChannel()

  const handleClose = () => {
    setName('')
    setIsSensitive(false)
    setError(null)
    onClose()
  }

  const handleConfirm = async () => {
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      setError('Name is required')
      return
    }
    setError(null)
    try {
      const channel = await create.mutateAsync({ name: trimmed, isSensitive })
      handleClose()
      onCreated?.(channel.id)
    } catch {
      setError('Could not create channel')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="New channel"
      description="Channels are private buckets for messages, links, and files."
      onConfirm={handleConfirm}
      confirmLabel={create.isPending ? 'Creating...' : 'Create'}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="channel-name">
            Name
          </label>
          <Input
            id="channel-name"
            placeholder="e.g. Passwords, Receipts, Bookmarks"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm()
            }}
          />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isSensitive}
            onChange={(e) => setIsSensitive(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <div className="text-sm">
            <div className="font-medium">Mark as sensitive</div>
            <div className="text-muted-foreground">
              Encrypts message content at rest. Cannot be changed later.
            </div>
          </div>
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </Dialog>
  )
}
