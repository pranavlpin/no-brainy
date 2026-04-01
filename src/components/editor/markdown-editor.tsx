"use client"

import { useState, useCallback } from "react"
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

  const handleInsert = useCallback(
    (syntax: string) => {
      // Simple insert: append syntax at the end or let CodeMirror handle it
      // For a more sophisticated approach, we'd need cursor position from CodeMirror
      onChange(value + syntax)
    },
    [value, onChange]
  )

  return (
    <div className="flex flex-col rounded-md border border-border bg-background">
      {!readOnly && (
        <EditorToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onInsert={handleInsert}
        />
      )}

      <div
        className={cn(
          "flex flex-col md:flex-row",
          viewMode === "preview" && "md:flex-col"
        )}
        style={{ minHeight }}
      >
        {/* Editor Panel */}
        {viewMode !== "preview" && (
          <div
            className={cn(
              "flex-1 overflow-hidden",
              viewMode === "split" && "md:border-r md:border-border",
              viewMode === "split" ? "min-h-[200px] md:min-h-0" : ""
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
              viewMode === "split" ? "min-h-[200px] md:min-h-0" : ""
            )}
          >
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>
    </div>
  )
}
