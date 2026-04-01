"use client"

import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Code2,
  Link,
  Table,
  SplitSquareHorizontal,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EditorToolbarProps {
  viewMode: "split" | "editor" | "preview"
  onViewModeChange: (mode: "split" | "editor" | "preview") => void
  onInsert?: (syntax: string) => void
}

const formatButtons = [
  { icon: Bold, label: "Bold", syntax: "**bold**", shortcut: "Cmd+B" },
  { icon: Italic, label: "Italic", syntax: "*italic*", shortcut: "Cmd+I" },
  { icon: Heading2, label: "Heading", syntax: "## ", shortcut: "" },
  { icon: List, label: "Bullet List", syntax: "- ", shortcut: "" },
  { icon: ListOrdered, label: "Ordered List", syntax: "1. ", shortcut: "" },
  { icon: CheckSquare, label: "Checkbox", syntax: "- [ ] ", shortcut: "" },
  { icon: Code2, label: "Code", syntax: "`code`", shortcut: "" },
  { icon: Link, label: "Link", syntax: "[text](url)", shortcut: "" },
  {
    icon: Table,
    label: "Table",
    syntax: "| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |",
    shortcut: "",
  },
] as const

const viewModeButtons = [
  { mode: "split" as const, icon: SplitSquareHorizontal, label: "Split View" },
  { mode: "editor" as const, icon: Code2, label: "Editor" },
  { mode: "preview" as const, icon: Eye, label: "Preview" },
] as const

export function EditorToolbar({
  viewMode,
  onViewModeChange,
  onInsert,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border bg-muted/50 px-2 py-1">
      <div className="flex items-center gap-0.5">
        {formatButtons.map((btn) => (
          <Button
            key={btn.label}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title={
              btn.shortcut ? `${btn.label} (${btn.shortcut})` : btn.label
            }
            onClick={() => onInsert?.(btn.syntax)}
          >
            <btn.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <div className="mx-2 h-6 w-px bg-border" />

      <div className="flex items-center gap-0.5 ml-auto">
        {viewModeButtons.map((btn) => (
          <Button
            key={btn.mode}
            variant={viewMode === btn.mode ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 px-2 text-xs", {
              "bg-secondary": viewMode === btn.mode,
            })}
            title={btn.label}
            onClick={() => onViewModeChange(btn.mode)}
          >
            <btn.icon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{btn.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
