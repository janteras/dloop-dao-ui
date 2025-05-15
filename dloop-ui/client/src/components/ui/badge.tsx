import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline:
          "text-foreground border border-border",
        success: 
          "bg-green-600 text-white hover:bg-green-500",
        warning: 
          "bg-yellow-600 text-white hover:bg-yellow-500",
        danger: 
          "bg-red-600 text-white hover:bg-red-500",
        info: 
          "bg-blue-600 text-white hover:bg-blue-500",
        ghost: 
          "bg-muted text-muted-foreground hover:bg-muted/80",
      },
      size: {
        default: "h-6 px-2.5 py-0.5 text-xs",
        sm: "h-5 px-2 py-0 text-xs",
        lg: "h-7 px-3 py-1 text-sm",
      },
      animate: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animate: "none",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status?: "active" | "pending" | "completed" | "failed" | "warning";
  statusDot?: boolean;
}

function Badge({
  className,
  variant,
  size,
  animate,
  status,
  statusDot = false,
  ...props
}: BadgeProps) {
  // Map status to variant if status is provided
  let statusVariant = variant;
  if (status) {
    statusVariant = {
      active: "success",
      pending: "warning",
      completed: "success",
      failed: "danger",
      warning: "warning",
    }[status] as any;
  }

  return (
    <div
      className={cn(
        badgeVariants({ variant: statusVariant, size, animate, className }),
        statusDot && "pl-1.5 flex items-center gap-1",
      )}
      {...props}
    >
      {statusDot && status && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {props.children}
    </div>
  );
}

export { Badge, badgeVariants };