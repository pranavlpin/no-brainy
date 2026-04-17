"use client"

import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { EditorToolbar } from "./editor-toolbar"
import { CodeMirrorEditor } from "./codemirror-editor"
import { MarkdownPreview } from "./markdown-preview"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  readOnly?: boolean
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Start writing in markdown...",
  minHeight = "400px",
  readOnly = false,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">(
    "split"
  )
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleInsert = useCallback(
    (syntax: string) => {
      onChange(value + syntax)
    },
    [value, onChange]
  )

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  // Escape key exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setIsFullscreen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen])

  // Prevent body scroll in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isFullscreen])

  return (
    <div className={cn(
      "flex flex-col border border-border bg-background",
      isFullscreen && "fixed inset-0 z-50 border-0"
    )}>
      {!readOnly && (
        <EditorToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onInsert={handleInsert}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      <div
        className={cn(
          "flex flex-col md:flex-row overflow-hidden",
          isFullscreen ? "flex-1" : "",
          viewMode === "preview" && "md:flex-col"
        )}
        style={isFullscreen ? undefined : { minHeight }}
      >
        {/* Editor Panel */}
        {viewMode !== "preview" && (
          <div
            className={cn(
              "flex-1 overflow-auto",
              viewMode === "split" && "md:border-r md:border-border",
              !isFullscreen && viewMode === "split" ? "min-h-[200px] md:min-h-0" : ""
            )}
          >
            <CodeMirrorEditor
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              readOnly={readOnly}
            />
          </div>
        )}

        {/* Preview Panel */}
        {viewMode !== "editor" && (
          <div
            className={cn(
              "flex-1 overflow-auto",
              viewMode === "split" && "border-t md:border-t-0",
              !isFullscreen && viewMode === "split" ? "min-h-[200px] md:min-h-0" : ""
            )}
          >
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>
    </div>
  )
}
