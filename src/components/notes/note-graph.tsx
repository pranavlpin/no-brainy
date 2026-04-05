'use client'

import React, { useEffect, useRef, useState, useCallback, type PointerEvent as ReactPointerEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import type { NoteGraph } from '@/lib/types/notes'

interface GraphNodeDatum extends SimulationNodeDatum {
  id: string
  title: string
}

interface GraphLinkDatum extends SimulationLinkDatum<GraphNodeDatum> {
  source: string | GraphNodeDatum
  target: string | GraphNodeDatum
}

interface NoteGraphProps {
  data: NoteGraph
  currentNoteId?: string
  width?: number
  height?: number
}

interface Transform {
  x: number
  y: number
  k: number
}

export function NoteGraphView({
  data,
  currentNoteId,
  width = 800,
  height = 600,
}: NoteGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()

  const [nodes, setNodes] = useState<GraphNodeDatum[]>([])
  const [links, setLinks] = useState<GraphLinkDatum[]>([])
  const [transform, setTransform] = useState<Transform>({ x: width / 2, y: height / 2, k: 1 })
  const simulationRef = useRef<ReturnType<typeof forceSimulation<GraphNodeDatum>> | null>(null)
  const dragNodeRef = useRef<GraphNodeDatum | null>(null)
  const panStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  useEffect(() => {
    if (data.nodes.length === 0) return

    const simNodes: GraphNodeDatum[] = data.nodes.map((n) => ({
      ...n,
      x: undefined,
      y: undefined,
    }))

    const simLinks: GraphLinkDatum[] = data.edges.map((e) => ({
      source: e.source,
      target: e.target,
    }))

    const simulation = forceSimulation<GraphNodeDatum>(simNodes)
      .force(
        'link',
        forceLink<GraphNodeDatum, GraphLinkDatum>(simLinks)
          .id((d) => d.id)
          .distance(100)
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide(30))
      .on('tick', () => {
        setNodes([...simNodes])
        setLinks([...simLinks])
      })

    simulationRef.current = simulation

    return () => {
      simulation.stop()
      simulationRef.current = null
    }
  }, [data])

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      router.push(`/notes/${nodeId}`)
    },
    [router]
  )

  // Drag handling via pointer events on node circles
  const handleNodePointerDown = useCallback(
    (e: ReactPointerEvent<SVGCircleElement>, node: GraphNodeDatum) => {
      e.stopPropagation()
      e.preventDefault()
      const target = e.currentTarget
      target.setPointerCapture(e.pointerId)
      dragNodeRef.current = node
      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0.3).restart()
      }
      node.fx = node.x
      node.fy = node.y
    },
    []
  )

  const handleNodePointerMove = useCallback(
    (e: ReactPointerEvent<SVGCircleElement>) => {
      const node = dragNodeRef.current
      if (!node) return
      // Convert screen coords to graph coords
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      node.fx = (mx - transform.x) / transform.k
      node.fy = (my - transform.y) / transform.k
    },
    [transform]
  )

  const handleNodePointerUp = useCallback(
    (e: ReactPointerEvent<SVGCircleElement>) => {
      const node = dragNodeRef.current
      if (!node) return
      e.currentTarget.releasePointerCapture(e.pointerId)
      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0)
      }
      node.fx = null
      node.fy = null
      dragNodeRef.current = null
    },
    []
  )

  // Pan via pointer events on the SVG background
  const handleSvgPointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      // Only pan if not dragging a node
      if (dragNodeRef.current) return
      if (e.target !== svgRef.current && (e.target as SVGElement).tagName !== 'rect') return
      const target = e.currentTarget
      target.setPointerCapture(e.pointerId)
      panStartRef.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y }
    },
    [transform]
  )

  const handleSvgPointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!panStartRef.current) return
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      setTransform((prev) => ({
        ...prev,
        x: panStartRef.current!.tx + dx,
        y: panStartRef.current!.ty + dy,
      }))
    },
    []
  )

  const handleSvgPointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (panStartRef.current) {
        e.currentTarget.releasePointerCapture(e.pointerId)
        panStartRef.current = null
      }
    },
    []
  )

  // Zoom via wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
      setTransform((prev) => {
        const newK = Math.min(4, Math.max(0.1, prev.k * scaleFactor))
        // Zoom towards cursor position
        const svg = svgRef.current
        if (!svg) return prev
        const rect = svg.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        return {
          k: newK,
          x: mx - (mx - prev.x) * (newK / prev.k),
          y: my - (my - prev.y) * (newK / prev.k),
        }
      })
    },
    []
  )

  if (data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        No notes to display in the graph.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-slate-950">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full touch-none"
        style={{ minHeight: height }}
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onWheel={handleWheel}
      >
        {/* Background for capturing pan events */}
        <rect width={width} height={height} fill="transparent" />
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {/* Links */}
          {links.map((link, i) => {
            const src = link.source as GraphNodeDatum
            const tgt = link.target as GraphNodeDatum
            return (
              <line
                key={i}
                x1={src.x ?? 0}
                y1={src.y ?? 0}
                x2={tgt.x ?? 0}
                y2={tgt.y ?? 0}
                stroke="#475569"
                strokeWidth={1.5}
                strokeOpacity={0.6}
              />
            )
          })}
          {/* Nodes */}
          {nodes.map((node) => (
            <g key={node.id} transform={`translate(${node.x ?? 0},${node.y ?? 0})`}>
              <circle
                r={8}
                fill={node.id === currentNoteId ? '#3b82f6' : '#64748b'}
                stroke={node.id === currentNoteId ? '#93c5fd' : '#94a3b8'}
                strokeWidth={node.id === currentNoteId ? 3 : 1.5}
                cursor="pointer"
                onClick={() => handleNodeClick(node.id)}
                onPointerDown={(e) => handleNodePointerDown(e, node)}
                onPointerMove={handleNodePointerMove}
                onPointerUp={handleNodePointerUp}
              />
              <text
                dx={12}
                dy={4}
                fontSize="11px"
                fill="#cbd5e1"
                pointerEvents="none"
              >
                {node.title.length > 20 ? node.title.slice(0, 20) + '...' : node.title}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
