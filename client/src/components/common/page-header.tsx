import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-1 md:flex-row md:items-center md:justify-between", className)}>
      <div>
        {children ? children : (
          <>
            <h1 className="font-semibold text-2xl md:text-3xl">{title}</h1>
            {description && (
              <p className="text-muted-foreground text-sm mt-1">{description}</p>
            )}
          </>
        )}
      </div>
      {actions && <div className="mt-4 md:mt-0">{actions}</div>}
    </div>
  );
}