/**
 * Token Contract Hooks
 * 
 * React hooks for interacting with ERC20 tokens using wagmi v2
 */

import { useCallback } from 'react';
import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useBalance,
  type Hash
} from 'wagmi';
import { getErc20Contract } from '@/lib/contract-configs';
import { formatUnits, parseUnits, type Address } from 'viem';
import toast from 'react-hot-toast';

/**
 * Hook to get token information (symbol, decimals, etc.)
 */
export function useTokenInfo(tokenAddress?: string) {
  // Don't run the queries if no token address is provided
  const contractConfig = tokenAddress ? 
    getErc20Contract(tokenAddress) : 
    { address: '0x0' as Address, abi: [] as const };
  
  // Get token symbol
  const { data: symbol, isLoading: isLoadingSymbol } = useReadContract({
    ...contractConfig,
    functionName: 'symbol',
    query: { enabled: !!tokenAddress },
  });
  
  // Get token name
  const { data: name, isLoading: isLoadingName } = useReadContract({
    ...contractConfig,
    functionName: 'name',
    query: { enabled: !!tokenAddress },
  });
  
  // Get token decimals
  const { data: decimals, isLoading: isLoadingDecimals } = useReadContract({
    ...contractConfig,
    functionName: 'decimals',
    query: { enabled: !!tokenAddress },
  });
  
  return {
    symbol: symbol as string,
    name: name as string,
    decimals: decimals ? Number(decimals) : 18,
    isLoading: isLoadingSymbol || isLoadingName || isLoadingDecimals,
  };
}

/**
 * Hook to get token balance for an address
 */
export function useTokenBalance(tokenAddress?: string, walletAddress?: Address) {
  const { data, isLoading, error, refetch } = useBalance({
    address: walletAddress,
    token: tokenAddress as Address,
  });
  
  const { decimals } = useTokenInfo(tokenAddress);
  
  const formattedBalance = data ? 
    formatUnits(data.value, data.decimals || decimals) : 
    '0';
    
  return {
    balance: formattedBalance,
    rawBalance: data?.value,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to approve token spending
 */
export function useTokenApproval(tokenAddress?: string) {
  const { writeContract, isPending, error, data } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess, error: confirmError } = 
    useWaitForTransactionReceipt({
      hash: data as Hash | undefined,
    });
  
  const approveToken = useCallback((spenderAddress: string, amount: string, decimals: number = 18) => {
    if (!tokenAddress) {
      toast.error('Token address is required for approval');
      return;
    }
    
    try {
      const contractConfig = getErc20Contract(tokenAddress);
      const parsedAmount = parseUnits(amount, decimals);
      
      writeContract({
        ...contractConfig,
        functionName: 'approve',
        args: [spenderAddress as Address, parsedAmount],
      });
    } catch (error) {
      console.error('Error approving token:', error);
      toast.error('Failed to approve token. Please check your inputs and try again.');
    }
  }, [tokenAddress, writeContract]);
  
  return {
    approveToken,
    isLoading: isPending || isConfirming,
    isSuccess,
    error: error || confirmError,
    transactionHash: data,
  };
}

/**
 * Hook to get token allowance
 */
export function useTokenAllowance(tokenAddress?: string, ownerAddress?: Address, spenderAddress?: Address) {
  const contractConfig = tokenAddress ? 
    getErc20Contract(tokenAddress) : 
    { address: '0x0' as Address, abi: [] as const };
  
  const { data, isLoading, error, refetch } = useReadContract({
    ...contractConfig,
    functionName: 'allowance',
    args: [ownerAddress || '0x0' as Address, spenderAddress || '0x0' as Address],
    query: { enabled: !!tokenAddress && !!ownerAddress && !!spenderAddress },
  });
  
  const { decimals } = useTokenInfo(tokenAddress);
  
  const allowance = data ? formatUnits(data as bigint, decimals) : '0';
  
  return {
    allowance,
    rawAllowance: data,
    isLoading,
    error,
    refetch,
  };
}
