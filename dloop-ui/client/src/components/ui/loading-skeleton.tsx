
import * as React from 'react';
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'text' | 'avatar';
}

export function Skeleton({
  className,
  variant = 'text',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted/50 rounded-md",
        {
          'h-4 w-full': variant === 'text',
          'h-[320px] w-full': variant === 'card',
          'h-12 w-12 rounded-full': variant === 'avatar',
        },
        className
      )}
      {...props}
    />
  );
}
