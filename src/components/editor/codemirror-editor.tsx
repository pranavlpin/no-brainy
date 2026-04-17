"use client"

import { useEffect, useRef, useCallback } from "react"
import { EditorView, keymap, placeholder as placeholderExt, highlightSpecialChars } from "@codemirror/view"
import { EditorState } from "@codemirror/state"
import { markdown } from "@codemirror/lang-markdown"
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { search, searchKeymap, highlightSelectionMatches } from "@codemirror/search"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"

interface CodeMirrorEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
}

const baseTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
  },
  ".cm-content": {
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
    lineHeight: "1.6",
    padding: "16px",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-line": {
    padding: "0 4px",
  },
})

export function CodeMirrorEditor({
  value,
  onChange,
  placeholder,
  readOnly = false,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  // Keep callback ref current without triggering re-creation
  onChangeRef.current = onChange

  const createExtensions = useCallback(() => {
    const extensions = [
      baseTheme,
      markdown(),
      syntaxHighlighting(defaultHighlightStyle),
      highlightSpecialChars(),
      history(),
      search({ top: true }),
      highlightSelectionMatches(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString())
        }
      }),
    ]

    if (placeholder) {
      extensions.push(placeholderExt(placeholder))
    }

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true))
      extensions.push(EditorView.editable.of(false))
    }

    return extensions
  }, [placeholder, readOnly])

  // Create editor
  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: createExtensions(),
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createExtensions])

  // Update value from outside (avoid feedback loop)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentValue = view.state.doc.toString()
    if (currentValue !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto [&_.cm-editor]:h-full"
    />
  )
}
