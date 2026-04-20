"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
  const previewRef = useRef<HTMLDivElement>(null)

  const handleInsert = useCallback(
    (syntax: string) => {
      onChange(value + syntax)
    },
    [value, onChange]
  )

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  const handlePrint = useCallback(() => {
    const previewEl = previewRef.current
    if (!previewEl) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Note</title>
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a2e; line-height: 1.7; }
          h1, h2, h3, h4 { font-family: 'Space Grotesk', sans-serif; margin-top: 1.5em; }
          h1 { font-size: 2em; } h2 { font-size: 1.5em; } h3 { font-size: 1.2em; }
          code { background: #f3f4f6; padding: 2px 6px; font-family: 'Space Mono', monospace; font-size: 0.85em; }
          pre { background: #1a1a2e; color: #fff8e7; padding: 16px; overflow-x: auto; }
          pre code { background: none; color: inherit; padding: 0; }
          blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 16px; color: #555; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f9f9f9; }
          img { max-width: 100%; }
          a { color: #2D4CFF; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${previewEl.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 300)
  }, [])

  const handleExportDoc = useCallback(() => {
    const previewEl = previewRef.current
    if (!previewEl) return

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><style>
        body { font-family: Calibri, sans-serif; font-size: 11pt; color: #1a1a2e; line-height: 1.6; }
        h1 { font-size: 20pt; } h2 { font-size: 16pt; } h3 { font-size: 13pt; }
        code { font-family: Consolas, monospace; background: #f3f4f6; padding: 1px 4px; }
        pre { background: #f3f4f6; padding: 10px; font-family: Consolas, monospace; font-size: 9pt; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #999; padding: 6px; }
        blockquote { border-left: 3px solid #ccc; padding-left: 12px; color: #555; }
      </style></head>
      <body>${previewEl.innerHTML}</body></html>
    `
    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'note.doc'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
          onPrint={handlePrint}
          onExportDoc={handleExportDoc}
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
            ref={previewRef}
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
