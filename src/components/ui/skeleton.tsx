import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md border-2 border-retro-dark/10 bg-retro-cream/50 dark:bg-gray-800/50", className)}
      {...props}
    />
  )
}

export { Skeleton }
