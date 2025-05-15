import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
  variant?: "rectangle" | "circle" | "text" | "button";
  width?: number | string;
  height?: number | string;
  animate?: boolean;
}

export function Skeleton({
  className,
  variant = "rectangle",
  width,
  height,
  animate = true,
  ...props
}: SkeletonProps) {
  // Base styles
  const baseStyles = "bg-muted rounded";
  
  // Animation styles
  const animateStyles = animate ? "animate-pulse" : "";
  
  // Variant-specific styles
  const variantStyles = {
    rectangle: "",
    circle: "rounded-full",
    text: "h-4 w-full rounded-sm",
    button: "h-10 rounded-md"
  };
  
  // Build the style object for width/height
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div
      className={cn(baseStyles, variantStyles[variant], animateStyles, className)}
      style={style}
      {...props}
    />
  );
}

export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
        <div className="space-y-2">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 3, columns = 3, hasHeader = true, className }: { 
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      {hasHeader && (
        <div className="flex border-b border-border pb-2 mb-2">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={`header-${i}`} className="flex-1 pr-4">
              <Skeleton className="h-5 w-4/5" />
            </div>
          ))}
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex py-2">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1 pr-4">
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}