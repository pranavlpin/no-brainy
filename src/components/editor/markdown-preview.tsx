"use client"

import { memo, createElement } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import rehypeSanitize from "rehype-sanitize"
import { sanitizeSchema } from "@/lib/markdown/sanitize"
import { parseWikiLinks } from "@/lib/markdown/plugins"
import { WikiLink } from "./wiki-link"
import { MermaidDiagram } from "./mermaid-diagram"
import { cn } from "@/lib/utils"
import type { Components } from "react-markdown"

interface MarkdownPreviewProps {
  content: string
  className?: string
}

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "")
    const language = match?.[1]

    // Mermaid diagram support
    if (language === "mermaid") {
      const chart = String(children).replace(/\n$/, "")
      return createElement(MermaidDiagram, { chart })
    }

    // Inline code vs block code
    const isInline = !className
    if (isInline) {
      return createElement(
        "code",
        {
          className: "rounded bg-muted px-1.5 py-0.5 text-sm font-mono",
          ...props,
        },
        children
      )
    }

    return createElement(
      "code",
      { className, ...props },
      children
    )
  },
  a({ href, children, ...props }) {
    return createElement(
      "a",
      {
        href,
        target: href?.startsWith("http") ? "_blank" : undefined,
        rel: href?.startsWith("http") ? "noopener noreferrer" : undefined,
        className: "text-primary hover:underline",
        ...props,
      },
      children
    )
  },
  input({ type, checked, ...props }) {
    if (type === "checkbox") {
      return createElement("input", {
        type: "checkbox",
        checked,
        readOnly: true,
        className: "mr-2 h-4 w-4 rounded border-border",
        ...props,
      })
    }
    return createElement("input", { type, checked, ...props })
  },
  p({ children, ...props }) {
    // Process wiki links in paragraph text
    if (typeof children === "string") {
      const parts = parseWikiLinks(children, (title, key) =>
        createElement(WikiLink, { title, key })
      )
      if (parts.length > 1 || parts[0] !== children) {
        return createElement("p", props, ...parts)
      }
    }

    // Handle array of children that might contain strings with wiki links
    if (Array.isArray(children)) {
      const processed = children.flatMap((child, idx) => {
        if (typeof child === "string") {
          return parseWikiLinks(child, (title, key) =>
            createElement(WikiLink, { title, key: `${idx}-${key}` })
          )
        }
        return [child]
      })
      return createElement("p", props, ...processed)
    }

    return createElement("p", props, children)
  },
}

function MarkdownPreviewInner({ content, className }: MarkdownPreviewProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none p-4 text-retro-dark",
        "prose-p:text-retro-dark prose-li:text-retro-dark prose-strong:text-retro-dark",
        "prose-td:text-retro-dark prose-th:text-retro-dark prose-blockquote:text-retro-dark/70",
        "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-retro-dark",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-code:before:content-none prose-code:after:content-none prose-code:text-retro-dark prose-code:bg-retro-dark/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm",
        "prose-pre:bg-retro-dark prose-pre:text-retro-cream prose-pre:border-2 prose-pre:border-retro-dark/20",
        "[&_pre_code]:bg-transparent [&_pre_code]:text-retro-cream [&_pre_code]:p-0",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeHighlight,
          [rehypeSanitize, sanitizeSchema],
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export const MarkdownPreview = memo(MarkdownPreviewInner)
