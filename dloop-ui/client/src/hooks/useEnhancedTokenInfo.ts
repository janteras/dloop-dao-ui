/**
 * Enhanced Token Info Hook
 * 
 * React hooks for accessing the enhanced token service with React Query
 * integration for optimal caching and state management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { 
  enhancedTokenService, 
  EnhancedTokenInfo, 
  TokenAmount, 
  TokenChain 
} from '@/services/enhancedTokenService';
import { tokenKeys, STALE_TIMES } from '@/lib/query/config';
import { useProvider } from '@/hooks/useProvider';
import { useWagmiProvider } from '@/hooks/useWagmiProvider';
import { useFeatureFlag } from '@/config/feature-flags';

/**
 * Hook for accessing token information with React Query
 * 
 * @param address Token address to fetch info for
 * @param options Additional options
 * @returns Token information with loading state
 */
export function useTokenInfo(
  address?: string,
  options: {
    chain?: TokenChain;
    enabled?: boolean;
    implementation?: 'ethers' | 'wagmi';
  } = {}
) {
  const queryClient = useQueryClient();
  const ethersProvider = useProvider();
  const wagmiProvider = useWagmiProvider();
  const useWagmiFlag = useFeatureFlag('useWagmiTokenInfo');
  
  // Determine which implementation to use
  const useWagmiImpl = options.implementation === 'wagmi' || 
    (options.implementation !== 'ethers' && useWagmiFlag);
  
  // Set the appropriate provider based on implementation
  useEffect(() => {
    if (address) {
      if (useWagmiImpl && wagmiProvider) {
        enhancedTokenService.setProvider(options.chain || TokenChain.ETHEREUM, wagmiProvider);
      } else if (ethersProvider) {
        enhancedTokenService.setProvider(options.chain || TokenChain.ETHEREUM, ethersProvider);
      }
    }
  }, [address, ethersProvider, wagmiProvider, useWagmiImpl, options.chain]);
  
  // Use React Query to fetch and cache token information
  const result = useQuery({
    queryKey: tokenKeys.detail(address || ''),
    queryFn: async () => {
      if (!address) return null;
      return enhancedTokenService.getTokenInfoAsync(address, options.chain);
    },
    staleTime: STALE_TIMES.TOKEN_PRICES,
    enabled: Boolean(address) && options.enabled !== false,
    // Default to cached data when refetching
    placeholderData: (prev) => prev
  });
  
  // Combine results for a cleaner API
  return {
    token: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    symbol: result.data?.symbol || '',
    name: result.data?.name || '',
    decimals: result.data?.decimals || 18,
    logoURI: result.data?.logoURI,
    implementation: useWagmiImpl ? 'wagmi' : 'ethers'
  };
}

/**
 * Hook for accessing token price information with React Query
 * 
 * @param address Token address to fetch price for
 * @param options Additional options
 * @returns Token price information with loading state
 */
export function useTokenPrice(
  address?: string,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  const queryClient = useQueryClient();
  
  // Use React Query to fetch and cache token price
  const result = useQuery({
    queryKey: tokenKeys.custom('price', address || ''),
    queryFn: async () => {
      if (!address) return null;
      return enhancedTokenService.getTokenPrice(address);
    },
    staleTime: STALE_TIMES.TOKEN_PRICES,
    enabled: Boolean(address) && options.enabled !== false,
    refetchInterval: options.refetchInterval || 60000, // Default to 1 minute
    // Default to cached data when refetching
    placeholderData: (prev) => prev
  });
  
  // Combine results for a cleaner API
  return {
    price: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    lastUpdated: result.dataUpdatedAt
  };
}

/**
 * Hook for formatting token amounts with the enhanced token service
 * 
 * @param amount Amount to format
 * @param address Token address
 * @param options Formatting options
 * @returns Formatted amount and token info
 */
export function useTokenAmount(
  amount: string | number | bigint | undefined,
  address?: string,
  options: {
    decimals?: number;
    includeSymbol?: boolean;
    compact?: boolean;
    significantDigits?: number;
    chain?: TokenChain;
    enabled?: boolean;
  } = {}
) {
  const [formattedAmount, setFormattedAmount] = useState('');
  const { token } = useTokenInfo(address, { 
    chain: options.chain,
    enabled: options.enabled !== false && Boolean(address)
  });
  
  // Format the amount whenever token info or amount changes
  useEffect(() => {
    if (!address || amount === undefined) {
      setFormattedAmount('');
      return;
    }
    
    const formatted = enhancedTokenService.formatTokenAmount(amount, address, {
      decimals: options.decimals || token?.decimals,
      includeSymbol: options.includeSymbol,
      compact: options.compact,
      significantDigits: options.significantDigits
    });
    
    setFormattedAmount(formatted);
  }, [amount, address, token, options]);
  
  return {
    formattedAmount,
    token,
    raw: amount
  };
}

/**
 * Hook for working with token amounts in both implementations
 * with fallback to legacy token handling
 */
export function useUnifiedTokenAmount(
  amount: string | number | bigint | undefined,
  address?: string,
  options: {
    decimals?: number;
    includeSymbol?: boolean;
    compact?: boolean;
    implementation?: 'ethers' | 'wagmi';
    useEnhancedService?: boolean;
  } = {}
) {
  const { useEnhancedService = true, ...tokenAmountOptions } = options;
  
  // Use the enhanced service if specified
  const enhancedResult = useTokenAmount(amount, address, tokenAmountOptions);
  
  // Get implementation-specific result from the unified token utilities
  // This is a stub - in a real implementation, you would import and use
  // your existing unified token handling
  const legacyResult = {
    formattedAmount: amount?.toString() || '',
    token: null,
    raw: amount
  };
  
  // Return the appropriate result based on the useEnhancedService option
  return useEnhancedService ? enhancedResult : legacyResult;
}
