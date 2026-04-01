"use client"

export function WikiLink({ title }: { title: string }) {
  return (
    <a
      href={`/notes?search=${encodeURIComponent(title)}`}
      className="text-primary hover:underline"
    >
      {title}
    </a>
  )
}
