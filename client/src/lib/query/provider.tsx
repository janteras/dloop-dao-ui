/**
 * React Query Provider
 * 
 * A wrapper component that provides the React Query context to the application,
 * including development tools when in development mode.
 */

import { PropsWithChildren, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './config';

/**
 * React Query Provider props
 */
interface QueryProviderProps extends PropsWithChildren {
  /**
   * Whether to enable the React Query devtools
   * @default process.env.NODE_ENV === 'development'
   */
  enableDevTools?: boolean;
}

/**
 * React Query Provider component
 * 
 * Provides the React Query context to the application and
 * includes development tools when in development mode.
 */
export function QueryProvider({
  children,
  enableDevTools = process.env.NODE_ENV === 'development',
}: QueryProviderProps) {
  // Use state to ensure the same QueryClient instance is used across renders
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      {enableDevTools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
