import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  align: "left" | "right" | "center";
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  contentRef: { current: null },
  align: "left",
});

export function DropdownMenu({
  children,
  align = "left",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <DropdownMenuContext.Provider
      value={{ open, setOpen, triggerRef, contentRef, align }}
    >
      <div className={cn("relative inline-block text-left", className)}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild = false,
  className,
}: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    setOpen(!open);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      ref: triggerRef,
      "aria-expanded": open,
      "aria-haspopup": true,
    });
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      className={cn(
        "inline-flex justify-center w-full px-4 py-2 text-sm font-medium rounded-md",
        className
      )}
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="true"
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
}: DropdownMenuContentProps) {
  const { open, contentRef, align } = React.useContext(DropdownMenuContext);

  if (!open) return null;

  const alignClasses = {
    left: "origin-top-left left-0",
    right: "origin-top-right right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 mt-2 w-56 rounded-md shadow-lg bg-card border border-border ring-1 ring-black ring-opacity-5 focus:outline-none",
        alignClasses[align],
        className
      )}
      role="menu"
      aria-orientation="vertical"
      tabIndex={-1}
    >
      <div className="py-1" role="none">
        {children}
      </div>
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled = false,
  className,
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
      setOpen(false);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "text-left w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      role="menuitem"
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// Additional components for more complex dropdown menus
export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <div
      className={cn("border-t border-border my-1", className)}
      role="separator"
    />
  );
}

export function DropdownMenuLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block px-4 py-2 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}