/**
 * React Query provider for the application
 * 
 * Sets up the QueryClient with appropriate defaults for
 * blockchain interactions, including retry policies and
 * cache configuration
 */

import React from 'react';
import { QueryClient, QueryClientProvider, DefaultOptions } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

// Default options for React Query
const defaultOptions: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on user rejected transactions
      if (error?.code === 4001 || // MetaMask user rejected
          error?.code === 'ACTION_REJECTED' || // WalletConnect user rejected
          error?.message?.includes('user rejected')) {
        return false;
      }
      
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    staleTime: 30000, // 30 seconds
  },
  mutations: {
    retry: false, // Don't retry mutations by default
  },
};

// Create a client
const queryClient = new QueryClient({
  defaultOptions,
});

interface QueryProviderProps {
  children: React.ReactNode;
  enableDevtools?: boolean;
}

/**
 * Provider component for React Query
 * Wraps the application with the QueryClientProvider
 * and optionally includes the React Query Devtools
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ 
  children, 
  enableDevtools = process.env.NODE_ENV === 'development'
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {enableDevtools && <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />}
    </QueryClientProvider>
  );
};

// Export the query client for direct access when needed
export { queryClient };
