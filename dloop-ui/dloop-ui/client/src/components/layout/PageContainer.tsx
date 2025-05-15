import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageContainer component that provides consistent horizontal padding and max-width
 * across different screen sizes for the D-Loop UI
 */
export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl transition-all duration-300 ease-in-out ${className}`}>
      <div className="w-full space-y-4 sm:space-y-6 py-4 sm:py-6">
        {children}
      </div>
    </div>
  );
}