import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { useWagmiWallet } from '@/components/features/wallet/wagmi-wallet-provider';
import { useAppConfig } from '@/config/app-config';
import { useEffect } from 'react';

/**
 * Unified wallet hook that selects between Ethers and Wagmi implementations
 * based on the application configuration
 * 
 * This hook provides a consistent interface regardless of the underlying implementation
 */
export function useUnifiedWallet() {
  const useWagmi = useAppConfig((state) => state.useWagmi);
  const markComponentMigrated = useAppConfig((state) => state.markComponentMigrated);
  
  // Mark this component as migrated
  useEffect(() => {
    markComponentMigrated('WalletConnection');
  }, [markComponentMigrated]);
  
  // Select the appropriate implementation
  const ethersWallet = useWallet();
  const wagmiWallet = useWagmiWallet();
  
  if (useWagmi) {
    return {
      isConnected: wagmiWallet.isConnected,
      address: wagmiWallet.address || null,
      balance: wagmiWallet.balance !== undefined ? String(wagmiWallet.balance) : null,
      connect: wagmiWallet.connect,
      disconnect: wagmiWallet.disconnect,
      isLoading: wagmiWallet.isLoading,
      // Compatibility with ethers implementation (will be undefined)
      signer: null,
      provider: null,
      chainId: null,
      // Add a flag to identify the implementation
      implementation: 'wagmi' as const
    };
  }
  
  return {
    ...ethersWallet,
    isLoading: false, // Add property for compatibility
    implementation: 'ethers' as const
  };
}
