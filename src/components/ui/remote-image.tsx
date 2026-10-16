'use client'
import { useState, type ReactNode } from 'react'
import Image from 'next/image'
/** Keep optional remote media bounded and replace a failed image without breaking the surrounding action. */
export function RemoteImage({
  src,
  alt,
  width,
  height,
  className,
  fallback,
}: {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  fallback?: ReactNode
}) {
  const [failed, setFailed] = useState<string | null>(null)
  const allowed =
    /^https?:\/\//i.test(src) ||
    src.startsWith('/') ||
    /^data:image\/(png|jpeg|webp|gif);/i.test(src)
  if (!allowed || failed === src)
    return <>{fallback ?? <div className={className} aria-hidden="true" />}</>
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      loading="lazy"
      className={className}
      onError={() => setFailed(src)}
    />
  )
}
