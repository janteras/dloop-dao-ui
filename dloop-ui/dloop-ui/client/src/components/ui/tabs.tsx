import * as React from "react";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{
  selectedTab: string;
  setSelectedTab: (id: string) => void;
}>({
  selectedTab: '',
  setSelectedTab: () => {},
});

interface TabsProps {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
  onChange?: (value: string) => void;
}

interface TabProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'pills';
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function Tabs({ children, defaultValue, className, onChange }: TabsProps) {
  const [selectedTab, setSelectedTab] = React.useState(defaultValue);

  const handleTabChange = React.useCallback((value: string) => {
    setSelectedTab(value);
    onChange?.(value);
  }, [onChange]);

  return (
    <TabsContext.Provider value={{ selectedTab, setSelectedTab: handleTabChange }}>
      <div className={cn("w-full", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className, variant = 'default' }: TabsListProps) {
  const variantClasses = {
    default: "bg-muted p-1 rounded-md",
    outline: "border-b border-border",
    pills: "flex gap-2"
  };

  return (
    <div className={cn("flex flex-wrap", variantClasses[variant], className)}>
      {children}
    </div>
  );
}

export function Tab({ children, value, className, disabled = false }: TabProps) {
  const { selectedTab, setSelectedTab } = React.useContext(TabsContext);
  const isSelected = selectedTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-background text-foreground shadow"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        className
      )}
      onClick={() => setSelectedTab(value)}
    >
      {children}
    </button>
  );
}

// For backwards compatibility with existing code
export const TabsTrigger = Tab;

export function TabsContent({ children, value, className }: TabsContentProps) {
  const { selectedTab } = React.useContext(TabsContext);

  return selectedTab === value ? (
    <div
      role="tabpanel"
      className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
    >
      {children}
    </div>
  ) : null;
}