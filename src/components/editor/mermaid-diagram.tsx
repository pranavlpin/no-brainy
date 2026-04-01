"use client"

import { useEffect, useRef, useState, useId } from "react"

interface MermaidDiagramProps {
  chart: string
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const uniqueId = useId().replace(/:/g, "-")

  useEffect(() => {
    let cancelled = false

    async function renderDiagram() {
      if (!containerRef.current) return

      try {
        const { default: mermaid } = await import("mermaid")
        mermaid.initialize({ startOnLoad: false, theme: "default" })

        if (cancelled) return

        const { svg } = await mermaid.render(
          `mermaid-${uniqueId}`,
          chart
        )

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram"
          )
        }
      }
    }

    renderDiagram()

    return () => {
      cancelled = true
    }
  }, [chart, uniqueId])

  if (error) {
    return (
      <pre className="rounded-md border border-destructive bg-muted p-4 text-sm text-destructive overflow-x-auto">
        <code>{chart}</code>
        <p className="mt-2 text-xs">Mermaid error: {error}</p>
      </pre>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex justify-center overflow-x-auto py-4"
    />
  )
}
