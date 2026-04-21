'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pin, PinOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { MarkdownEditor } from '@/components/editor/markdown-editor'
import { TagInput } from '@/components/notes/tag-input'
import { useNote, useUpdateNote, useDeleteNote } from '@/hooks/use-notes'
import { useNoteLinks, useAddNoteLink, useRemoveNoteLink } from '@/hooks/use-links'
import { LinkManager } from '@/components/linking/link-manager'
import { BacklinksPanel } from '@/components/notes/backlinks-panel'
import { NoteAIPanel } from '@/components/notes/note-ai-panel'
import { MarkdownCheatsheet } from '@/components/notes/markdown-cheatsheet'
import { FlashcardGenerator } from '@/components/ai/flashcard-generator'
import { ActionItemsPreview } from '@/components/ai/action-items-preview'
import { AIActionButton } from '@/components/ai/ai-action-button'
import { apiClient } from '@/lib/api-client'
import type { AIActionResponse } from '@/lib/ai/types'
import type { LinkedItemData } from '@/components/linking/linked-item'

type SaveStatus = 'idle' | 'saving' | 'saved'

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string

  const { data: note, isLoading, error } = useNote(noteId)
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const { data: noteLinks } = useNoteLinks(noteId)
  const addNoteLink = useAddNoteLink(noteId)
  const removeNoteLink = useRemoveNoteLink(noteId)

  const linkItems: LinkedItemData[] = (noteLinks ?? []).map((l) => ({
    targetType: l.targetType,
    targetId: l.targetId,
    title: l.title,
    extra: l.extra,
  }))

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isPinned, setIsPinned] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isExtractingActions, setIsExtractingActions] = useState(false)
  const [extractedActions, setExtractedActions] = useState<Array<{ title: string; priority: 'critical' | 'high' | 'medium' | 'low'; reason: string }> | null>(null)
  const [initialized, setInitialized] = useState(false)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize form when note loads
  useEffect(() => {
    if (note && !initialized) {
      setTitle(note.title)
      setContent(note.contentMd)
      setTags(note.tags)
      setIsPinned(note.isPinned)
      setInitialized(true)
    }
  }, [note, initialized])

  const saveNote = useCallback(
    (updates: { title?: string; contentMd?: string; tags?: string[]; isPinned?: boolean }) => {
      setSaveStatus('saving')
      updateNote.mutate(
        { id: noteId, ...updates },
        {
          onSuccess: () => setSaveStatus('saved'),
          onError: () => setSaveStatus('idle'),
        }
      )
    },
    [noteId, updateNote]
  )

  // Auto-save debounced
  const debouncedSave = useCallback(
    (updates: { title?: string; contentMd?: string; tags?: string[]; isPinned?: boolean }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        saveNote(updates)
      }, 500)
    },
    [saveNote]
  )

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    debouncedSave({ title: newTitle, contentMd: content, tags, isPinned })
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    debouncedSave({ title, contentMd: newContent, tags, isPinned })
  }

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags)
    saveNote({ title, contentMd: content, tags: newTags, isPinned })
  }

  const handlePinToggle = () => {
    const newPinned = !isPinned
    setIsPinned(newPinned)
    saveNote({ title, contentMd: content, tags, isPinned: newPinned })
  }

  const handleDelete = () => {
    deleteNote.mutate(noteId, {
      onSuccess: () => router.push('/notes'),
    })
  }

  const saveStatusText =
    saveStatus === 'saving'
      ? 'Saving...'
      : saveStatus === 'saved'
        ? 'Saved just now'
        : ''

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Not found
  if (error || (!isLoading && !note)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-lg font-medium">Note not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This note may have been deleted or does not exist.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/notes')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Notes
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/notes')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {saveStatusText && (
            <span className="text-xs text-muted-foreground">{saveStatusText}</span>
          )}
          <Button variant="ghost" size="icon" onClick={handlePinToggle} title={isPinned ? 'Unpin' : 'Pin'}>
            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            title="Delete note"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Untitled"
        className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-muted-foreground/50"
      />

      {/* Tags */}
      <TagInput tags={tags} onChange={handleTagsChange} />

      {/* Editor */}
      <MarkdownEditor value={content} onChange={handleContentChange} minHeight="500px" noteId={noteId} />

      {/* AI Actions */}
      <NoteAIPanel
        noteId={noteId}
        existingTags={tags}
        onAddTag={(tag) => handleTagsChange([...tags, tag])}
      />

      {/* AI Extract Actions */}
      <div className="space-y-4">
        <AIActionButton
          label="Extract Actions"
          onClick={async () => {
            setIsExtractingActions(true)
            setExtractedActions(null)
            try {
              const res = await apiClient<AIActionResponse<{ tasks: Array<{ title: string; priority: 'critical' | 'high' | 'medium' | 'low'; reason: string }> }>>(`/api/notes/${noteId}/ai/actions`, {
                method: 'POST',
              })
              setExtractedActions(res.data.tasks)
            } catch {
              // Error toast handled by API client
            } finally {
              setIsExtractingActions(false)
            }
          }}
          isLoading={isExtractingActions}
        />

        {extractedActions && (
          <ActionItemsPreview
            tasks={extractedActions}
            sourceType="note"
            sourceId={noteId}
            onClose={() => setExtractedActions(null)}
          />
        )}
      </div>

      {/* AI Flashcard Generation */}
      <FlashcardGenerator sourceType="note" sourceId={noteId} />

      {/* Links */}
      <LinkManager
        entityType="note"
        entityId={noteId}
        links={linkItems}
        onAdd={(targetType, targetId) => addNoteLink.mutate({ targetType, targetId })}
        onRemove={(targetType, targetId) => removeNoteLink.mutate({ targetType, targetId })}
      />

      {/* Backlinks */}
      <BacklinksPanel noteId={noteId} />

      <MarkdownCheatsheet />

      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete note"
        description="Are you sure you want to delete this note? It can be restored later."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
