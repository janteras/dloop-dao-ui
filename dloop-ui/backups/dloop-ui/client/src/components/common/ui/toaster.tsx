'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        className: 'border border-border bg-background text-foreground',
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
        success: {
          iconTheme: {
            primary: 'hsl(var(--color-accent))',
            secondary: 'hsl(var(--background))',
          },
        },
        error: {
          iconTheme: {
            primary: 'hsl(var(--color-warning-red))',
            secondary: 'hsl(var(--background))',
          },
        },
        duration: 5000,
      }}
    />
  );
}