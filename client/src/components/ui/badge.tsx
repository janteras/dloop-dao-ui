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
        // Muted variants with transparency for subtle backgrounds
        "muted-success": 
          "bg-success/15 text-success border border-success/30 dark:text-success dark:border-success/40",
        "muted-warning": 
          "bg-warning/15 text-warning border border-warning/30 dark:text-warning dark:border-warning/40",
        "muted-danger": 
          "bg-destructive/15 text-destructive border border-destructive/30 dark:text-destructive dark:border-destructive/40",
        "muted-info": 
          "bg-info/15 text-info border border-info/30 dark:text-info dark:border-info/40",
        "muted-primary": 
          "bg-primary/15 text-primary border border-primary/30 dark:text-primary dark:border-primary/40",
        // Proposal-specific variants
        invest: 
          "bg-success/15 text-success border border-success/30 dark:text-success dark:border-success/40",
        divest: 
          "bg-warning/15 text-warning border border-warning/30 dark:text-warning dark:border-warning/40",
        parameter: 
          "bg-info/15 text-info border border-info/30 dark:text-info dark:border-info/40",
        // New semantic status variants
        "status-active": 
          "bg-status-active-bg text-status-active border border-status-active-border",
        "status-passed": 
          "bg-status-passed-bg text-status-passed border border-status-passed-border",
        "status-executed": 
          "bg-status-executed-bg text-status-executed border border-status-executed-border",
        "status-failed": 
          "bg-status-failed-bg text-status-failed border border-status-failed-border",
        // New semantic proposal type variants
        "proposal-invest": 
          "bg-proposal-invest-bg text-proposal-invest border border-proposal-invest-border",
        "proposal-divest": 
          "bg-proposal-divest-bg text-proposal-divest border border-proposal-divest-border",
        "proposal-parameter": 
          "bg-proposal-parameter-bg text-proposal-parameter border border-proposal-parameter-border",
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
  proposalType?: "invest" | "divest" | "parameter";
}

function Badge({
  className,
  variant,
  size,
  animate,
  status,
  statusDot = false,
  proposalType,
  ...props
}: BadgeProps) {
  // Map status to variant if status is provided
  let finalVariant = variant;
  
  // Handle status-based variants
  if (status) {
    finalVariant = {
      active: "success",
      pending: "warning",
      completed: "success",
      failed: "danger",
      warning: "warning",
    }[status] as any;
  }
  
  // Proposal type overrides status (higher priority)
  if (proposalType) {
    finalVariant = proposalType;
  }

  return (
    <div
      className={cn(
        badgeVariants({ variant: finalVariant, size, animate, className }),
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