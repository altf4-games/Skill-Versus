import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary hover:bg-primary/80 border-transparent text-primary-foreground",
    secondary: "bg-secondary hover:bg-secondary/80 border-transparent text-secondary-foreground",
    destructive: "bg-destructive hover:bg-destructive/80 border-transparent text-destructive-foreground",
    outline: "text-foreground border-border",
    success: "bg-green-500 hover:bg-green-500/80 border-transparent text-white",
    warning: "bg-yellow-500 hover:bg-yellow-500/80 border-transparent text-white",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
