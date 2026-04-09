import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-2 border-retro-dark bg-retro-blue text-white hover:bg-retro-blue/90",
        destructive:
          "border-2 border-retro-dark bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-retro-blue/30 bg-background text-retro-dark hover:bg-retro-blue/5 hover:border-retro-blue/50",
        secondary:
          "border border-retro-blue/25 bg-retro-blue/5 text-retro-dark hover:bg-retro-blue/10 hover:border-retro-blue/40",
        ghost: "hover:bg-retro-blue/5 hover:text-retro-dark",
        link: "text-retro-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
