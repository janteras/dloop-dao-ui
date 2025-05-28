import { useCallback, useState, useEffect } from 'react';
import { useTokenInfo } from './useTokenInfo';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';

/**
 * Hook to check if a user has any DLOOP tokens in their wallet
 * Used to validate if a user can vote on proposals
 */
export function useDloopTokenCheck() {
  const { isConnected, address } = useWallet();
  const { availableBalance, delegatedAmount, isLoading } = useTokenInfo();
  const [hasDloopTokens, setHasDloopTokens] = useState<boolean>(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState<boolean>(true);

  // Check if the user has any DLOOP tokens (either available or delegated)
  useEffect(() => {
    if (!isLoading) {
      const availableTokens = parseFloat(availableBalance);
      const delegatedTokens = parseFloat(delegatedAmount);
      const totalTokens = availableTokens + delegatedTokens;
      
      setHasDloopTokens(totalTokens > 0);
      setIsCheckingBalance(false);
    }
  }, [availableBalance, delegatedAmount, isLoading]);

  // Function to check tokens synchronously (for handlers)
  const checkHasDloopTokens = useCallback(() => {
    if (!isConnected || !address) return false;
    
    const availableTokens = parseFloat(availableBalance);
    const delegatedTokens = parseFloat(delegatedAmount);
    return (availableTokens + delegatedTokens) > 0;
  }, [isConnected, address, availableBalance, delegatedAmount]);

  return {
    hasDloopTokens,
    isCheckingBalance,
    checkHasDloopTokens,
    availableBalance
  };
}
