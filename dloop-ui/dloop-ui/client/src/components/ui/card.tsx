import * as React from "react";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";

const useMergeRefs = (refs: any[]) => {
  return React.useCallback((element: any) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") ref(element);
      else if (ref != null) ref.current = element;
    });
  }, [refs]);
};

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "outline" | "filled" | "gradient";
    hoverEffect?: boolean;
  }
>(({ className, variant = "default", hoverEffect = false, ...props }, ref) => {
  const { ref: swipeRef } = useSwipeable({
    onSwipeLeft: (eventData) => console.log("Swiped left!", eventData),
    onSwipeRight: (eventData) => console.log("Swiped right!", eventData),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const mergedRef = useMergeRefs([ref, swipeRef]);

  const baseClasses = "rounded-lg touch-manipulation overflow-hidden";
  ref = useMergeRefs([ref, swipeRef]);
  const variantClasses = {
    default: "bg-card text-card-foreground shadow-sm border border-border",
    outline: "border border-border bg-transparent",
    filled: "bg-muted border-none",
    gradient: "gradient-bg border-border/50 border"
  };

  const hoverClasses = hoverEffect 
    ? "transition-all duration-200 hover:shadow-md hover:border-accent/40 hover:-translate-y-0.5" 
    : "";

  return (
    <div
      ref={ref}
      className={cn(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        "p-4 sm:p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };