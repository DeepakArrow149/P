import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ui-transition-normal ui-focus-ring",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground ui-hover-secondary",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground ui-hover-secondary",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground ui-hover-secondary",
        outline: "text-foreground",
        // Variants for hourly breakup status
        working: "border-transparent bg-green-500 text-white ui-hover-secondary",
        break: "border-transparent bg-yellow-400 text-black ui-hover-secondary",
        off: "border-transparent bg-muted text-muted-foreground ui-hover-secondary",
      },
      size: { // Added size variants for more control
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px] h-5", // Smaller size for compact display
        xs: "px-1.5 py-0 text-[9px] h-4 leading-tight", // Even smaller
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

