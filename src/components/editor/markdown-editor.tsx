"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { EditorToolbar } from "./editor-toolbar"
import { CodeMirrorEditor } from "./codemirror-editor"
import { MarkdownPreview } from "./markdown-preview"
import { getColorCSS, stripColorStyles } from "@/lib/markdown/color-blocks"
import { X } from "lucide-react"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  readOnly?: boolean
  noteId?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Start writing in markdown...",
  minHeight = "400px",
  readOnly = false,
  noteId,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">(
    "split"
  )
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [splitRatio, setSplitRatio] = useState(50) // percentage for editor
  const [scrollSync, setScrollSync] = useState(false)
  const isDragging = useRef(false)
  const isScrolling = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const editorPanelRef = useRef<HTMLDivElement>(null)
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

  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [printWithColors, setPrintWithColors] = useState(true)

  const executePrint = useCallback((withColors: boolean) => {
    const previewEl = previewRef.current
    if (!previewEl) return

    let bodyHtml = previewEl.innerHTML
    const colorCSS = withColors ? getColorCSS() : ''
    if (!withColors) {
      bodyHtml = stripColorStyles(bodyHtml)
    }

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
          ${colorCSS}
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${bodyHtml}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 300)
    setShowPrintDialog(false)
  }, [])

  const handlePrint = useCallback(() => {
    setShowPrintDialog(true)
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
        ${getColorCSS()}
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

  // Drag to resize split panels
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMove = (moveEvent: MouseEvent): void => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((moveEvent.clientX - rect.left) / rect.width) * 100
      setSplitRatio(Math.min(80, Math.max(20, pct)))
    }

    const handleUp = (): void => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }, [])

  const toggleScrollSync = useCallback(() => {
    setScrollSync((prev) => !prev)
  }, [])

  // Scroll sync: when one panel scrolls, sync the other proportionally
  useEffect(() => {
    if (!scrollSync || viewMode !== 'split') return

    const editorEl = editorPanelRef.current?.querySelector('.cm-scroller') as HTMLElement | null
    const previewEl = previewRef.current

    if (!editorEl || !previewEl) return

    const syncScroll = (source: HTMLElement, target: HTMLElement): void => {
      if (isScrolling.current) return
      isScrolling.current = true
      const sourcePct = source.scrollTop / (source.scrollHeight - source.clientHeight || 1)
      target.scrollTop = sourcePct * (target.scrollHeight - target.clientHeight || 1)
      requestAnimationFrame(() => { isScrolling.current = false })
    }

    const onEditorScroll = (): void => syncScroll(editorEl, previewEl)
    const onPreviewScroll = (): void => syncScroll(previewEl, editorEl)

    editorEl.addEventListener('scroll', onEditorScroll, { passive: true })
    previewEl.addEventListener('scroll', onPreviewScroll, { passive: true })

    return () => {
      editorEl.removeEventListener('scroll', onEditorScroll)
      previewEl.removeEventListener('scroll', onPreviewScroll)
    }
  }, [scrollSync, viewMode])

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
          scrollSync={scrollSync}
          onToggleScrollSync={toggleScrollSync}
        />
      )}

      <div
        ref={containerRef}
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
            ref={editorPanelRef}
            className={cn(
              "overflow-auto",
              viewMode === "split" ? "min-h-[200px] md:min-h-0" : "flex-1",
            )}
            style={viewMode === "split" ? { width: `${splitRatio}%`, flexShrink: 0 } : undefined}
          >
            <CodeMirrorEditor
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              readOnly={readOnly}
              noteId={noteId}
            />
          </div>
        )}

        {/* Drag handle (split mode only, desktop) */}
        {viewMode === "split" && (
          <div
            onMouseDown={handleDragStart}
            className="hidden md:flex w-2 cursor-col-resize items-center justify-center bg-border/50 hover:bg-retro-blue/20 active:bg-retro-blue/30 transition-colors shrink-0"
            title="Drag to resize"
          >
            <div className="h-8 w-0.5 rounded-full bg-retro-dark/20" />
          </div>
        )}

        {/* Preview Panel */}
        {viewMode !== "editor" && (
          <div
            ref={previewRef}
            className={cn(
              "overflow-auto",
              viewMode === "split" ? "border-t md:border-t-0 min-h-[200px] md:min-h-0 flex-1" : "flex-1",
            )}
          >
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>

      {/* Print dialog */}
      {showPrintDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowPrintDialog(false)} />
          <div className="relative z-[60] w-full max-w-sm border-2 border-retro-dark bg-white p-6 shadow-hard">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-retro-dark">Print Note</h3>
              <button onClick={() => setShowPrintDialog(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="flex items-center gap-3 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={printWithColors}
                onChange={(e) => setPrintWithColors(e.target.checked)}
                className="h-4 w-4 accent-retro-blue"
              />
              <span className="text-sm text-retro-dark">Include color blocks and inline colors</span>
            </label>
            <p className="text-xs text-muted-foreground mt-1 ml-7">
              Uncheck for a clean black & white print
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowPrintDialog(false)}
                className="border border-retro-dark/20 px-3 py-1.5 font-mono text-xs text-retro-dark hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => executePrint(printWithColors)}
                className="border-2 border-retro-dark bg-retro-blue px-4 py-1.5 font-mono text-xs font-bold text-white shadow-hard hover-shadow-grow"
              >
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
