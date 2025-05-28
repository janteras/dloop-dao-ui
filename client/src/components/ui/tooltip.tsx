import * as React from "react";
import { cn } from "@/lib/utils";

// For backwards compatibility with existing code
type TooltipPosition = "top" | "right" | "bottom" | "left";

// Context to share state between tooltip components
const TooltipContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  position: TooltipPosition;
  delay: number;
  arrow: boolean;
}>({
  open: false,
  setOpen: () => {},
  position: "top",
  delay: 300,
  arrow: true,
});

// Root component - For backwards compatibility with single component usage
interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  contentClassName?: string;
  arrow?: boolean;
}

export function Tooltip({
  children,
  content,
  position = "top",
  delay = 300,
  className,
  contentClassName,
  arrow = true,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const positionMap = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  };

  const arrowMap = {
    top: "bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent",
    right: "left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent",
    bottom: "top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent",
    left: "right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent",
  };

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Clone the child element to add event handlers
  const childElement = React.cloneElement(children, {
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
  });

  return (
    <div className={cn("relative inline-flex", className)}>
      {childElement}
      {open && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-xs bg-card text-card-foreground rounded shadow-md border border-border whitespace-nowrap",
            positionMap[position],
            contentClassName
          )}
          ref={tooltipRef}
        >
          {content}
          {arrow && (
            <span
              className={cn(
                "absolute border-4 border-card h-0 w-0",
                arrowMap[position]
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Provider component for multi-part pattern
interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
}

export function TooltipProvider({
  children,
  delayDuration = 300,
  ...props
}: TooltipProviderProps) {
  const [open, setOpen] = React.useState(false);

  const context = {
    open,
    setOpen,
    position: "top" as TooltipPosition,
    delay: delayDuration, 
    arrow: true,
  };
  
  return (
    <TooltipContext.Provider value={context}>
      {children}
    </TooltipContext.Provider>
  );
}

// Trigger component for multi-part pattern
interface TooltipTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

export function TooltipTrigger({ 
  children, 
  asChild = false, 
  ...props 
}: TooltipTriggerProps) {
  const { open, setOpen, delay } = React.useContext(TooltipContext);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setOpen(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const triggerProps = {
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
    ...props,
  };

  // Simply clone the child element with the trigger props
  return React.cloneElement(children, triggerProps);
}

// Content component for multi-part pattern
interface TooltipContentProps {
  children: React.ReactNode;
  sideOffset?: number;
  align?: "center" | "start" | "end";
  alignOffset?: number;
  side?: TooltipPosition;
  className?: string;
}

export function TooltipContent({
  children,
  className,
  side = "top",
  ...props
}: TooltipContentProps) {
  const { open, arrow } = React.useContext(TooltipContext);

  if (!open) return null;
  
  const positionMap = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  };

  const arrowMap = {
    top: "bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent",
    right: "left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent",
    bottom: "top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent",
    left: "right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent",
  };

  return (
    <div
      className={cn(
        "absolute z-50 px-2 py-1 text-xs bg-card text-card-foreground rounded shadow-md border border-border whitespace-nowrap",
        positionMap[side],
        className
      )}
    >
      {children}
      {arrow && (
        <span
          className={cn(
            "absolute border-4 border-card h-0 w-0",
            arrowMap[side]
          )}
        />
      )}
    </div>
  );
}