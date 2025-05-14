'use client';

import { ThemeProvider } from '@/components/common/theme-provider';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { WalletProvider } from '@/components/features/wallet/wallet-provider';
import { Toaster } from '@/components/common/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}