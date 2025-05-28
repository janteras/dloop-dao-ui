/**
 * React Query Configuration
 * 
 * This file contains the global configuration for React Query,
 * including default settings for caching, retries, and error handling.
 */

import { QueryClient } from '@tanstack/react-query';
import { processContractError } from '@/services/errorHandling';

// Default stale time for most queries (30 seconds)
const DEFAULT_STALE_TIME = 30 * 1000;

// Default cache time (5 minutes)
const DEFAULT_CACHE_TIME = 5 * 60 * 1000;

// Specific stale times for different types of data
export const STALE_TIMES = {
  // Proposal data updates less frequently
  PROPOSALS: 1 * 60 * 1000, // 1 minute
  // Balance data needs to be more fresh
  BALANCES: 15 * 1000, // 15 seconds
  // Token prices update frequently
  TOKEN_PRICES: 30 * 1000, // 30 seconds
  // Chain/network data is relatively static
  NETWORK_INFO: 5 * 60 * 1000, // 5 minutes
};

/**
 * Global React Query client configuration
 * 
 * - Implements exponential backoff for retries
 * - Sets sensible defaults for cache invalidation
 * - Integrates with our error handling system
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_CACHE_TIME,
      refetchOnWindowFocus: import.meta.env.PROD, // Only in production
      retry: (failureCount, error) => {
        // Don't retry user rejection errors or invalid input errors
        if (
          error instanceof Error && 
          (error.message.includes('user rejected') || 
           error.message.includes('invalid input'))
        ) {
          return false;
        }
        
        // Handle known issues with getProposalCount reverting
        if (
          error instanceof Error && 
          error.message.includes('getProposalCount')
        ) {
          // Only retry once for this specific issue
          return failureCount < 1;
        }
        
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Process contract errors through our centralized system
      onError: (error) => {
        if (error instanceof Error) {
          processContractError(error, { operation: 'query' });
        }
      },
    },
    mutations: {
      // Retry once for mutations by default
      retry: 1,
      onError: (error) => {
        if (error instanceof Error) {
          processContractError(error, { operation: 'mutation' });
        }
      },
    },
  },
});

/**
 * Generates a query key factory for a specific domain
 * This helps maintain consistent and predictable query keys
 */
export const createQueryKeyFactory = <T extends string>(domain: string) => {
  return {
    all: () => [domain] as const,
    lists: () => [domain, 'list'] as const,
    list: (filters: Record<string, unknown>) => [domain, 'list', filters] as const,
    details: () => [domain, 'detail'] as const,
    detail: (id: string | number) => [domain, 'detail', id] as const,
    implementation: (type: 'ethers' | 'wagmi') => [domain, 'implementation', type] as const,
    custom: <K extends string>(...parts: K[]) => [domain, ...parts] as const,
  };
};

// Export domain-specific query key factories
export const proposalKeys = createQueryKeyFactory('proposals');
export const tokenKeys = createQueryKeyFactory('tokens');
export const walletKeys = createQueryKeyFactory('wallet');
export const networkKeys = createQueryKeyFactory('network');
