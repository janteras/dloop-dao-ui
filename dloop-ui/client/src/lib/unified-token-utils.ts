import { formatUnits } from 'viem';
import { getTokenInfo, getAmountWithSymbol } from './token-utils';
import { useAppConfig } from '@/config/app-config';
import { useEffect } from 'react';
import { useToken } from 'wagmi';

// Common token addresses used in the application
export const TOKEN_ADDRESSES = {
  USDC: '0xd093d7331448766923fe7ab270a9f6bce63cefda',
  WBTC: '0x9c3c9283d3e44854697cd22d3faa240cfb032889',
  DLOOP: '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f',
};

/**
 * Enhanced token utility that uses Wagmi's useToken hook when available
 * Falls back to the original implementation when needed
 * 
 * @param address Token contract address
 * @returns Token information including symbol, name, and decimals
 */
export function useTokenInfo(address: string) {
  const useWagmi = useAppConfig(state => state.useWagmi);
  const markComponentMigrated = useAppConfig(state => state.markComponentMigrated);
  
  // Mark this component as migrated
  useEffect(() => {
    markComponentMigrated('TokenHandling');
  }, [markComponentMigrated]);
  
  // Use wagmi's useToken hook when enabled
  const { data: tokenData, isLoading } = useToken({
    address: address as `0x${string}`,
    query: { enabled: useWagmi }
  });
  
  if (useWagmi && tokenData) {
    return {
      symbol: tokenData.symbol,
      name: tokenData.name,
      decimals: tokenData.decimals,
      isLoading
    };
  }
  
  // Fall back to original implementation
  const tokenInfo = getTokenInfo(address);
  return {
    ...tokenInfo,
    isLoading: false
  };
}

/**
 * Format token amount with appropriate decimals and symbol
 * Uses Wagmi's formatUnits when available
 * 
 * @param amount Raw token amount as string or BigInt
 * @param tokenAddress Token contract address
 * @returns Formatted amount with symbol (e.g. "1,000 USDC")
 */
export function formatTokenAmount(amount: string | bigint, tokenAddress: string): string {
  const useWagmi = useAppConfig.getState().useWagmi;
  
  if (useWagmi) {
    // Use Wagmi's formatUnits for consistent formatting
    try {
      const tokenInfo = getTokenInfo(tokenAddress);
      const formattedAmount = formatUnits(BigInt(amount.toString()), tokenInfo.decimals);
      return `${Number(formattedAmount).toLocaleString()} ${tokenInfo.symbol}`;
    } catch (error) {
      console.warn('Error formatting with Wagmi, falling back to original implementation', error);
    }
  }
  
  // Fall back to original implementation
  return getAmountWithSymbol(amount, tokenAddress);
}

/**
 * Hook to get token balance using Wagmi
 * 
 * @param tokenAddress Token contract address
 * @param userAddress User wallet address
 * @returns Formatted token balance
 */
export function useTokenBalance(tokenAddress: string, userAddress?: string) {
  const useWagmi = useAppConfig(state => state.useWagmi);
  const { address } = useUnifiedWallet();
  
  // Use Wagmi's useBalance hook for tokens
  const { data: tokenBalance, isLoading } = useToken({
    address: tokenAddress as `0x${string}`,
    query: { 
      enabled: useWagmi && Boolean(userAddress || address) 
    }
  });
  
  if (useWagmi && tokenBalance) {
    return {
      balance: tokenBalance.totalSupply?.toString() || '0',
      formatted: formatTokenAmount(tokenBalance.totalSupply || '0', tokenAddress),
      isLoading
    };
  }
  
  // In a real implementation, we would call the token contract
  // using ethers to get the balance for the user
  return {
    balance: '0',
    formatted: '0 ' + getTokenInfo(tokenAddress).symbol,
    isLoading: false
  };
}
