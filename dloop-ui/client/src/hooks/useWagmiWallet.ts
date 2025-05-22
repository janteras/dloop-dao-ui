/**
 * Wagmi Wallet Hook
 * 
 * This hook provides a similar interface to the existing useWallet hook but uses wagmi under the hood.
 * This ensures a smooth transition from ethers to wagmi while maintaining compatibility with existing components.
 */

import { 
  useAccount, 
  useBalance, 
  useDisconnect, 
  useChainId,
  useClient
} from 'wagmi';
import { sepolia } from 'viem/chains';
import { useWallet as useLegacyWallet } from '@/components/features/wallet/wagmi-provider';

export function useWagmiWallet() {
  // Get wallet state from wagmi
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const chainId = useChainId();
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
    query: { enabled: Boolean(address) },
  });
  
  // Get additional functionality from our custom wallet provider
  const { connect, isNetworkSupported, switchToSepolia } = useLegacyWallet();
  
  return {
    // Basic wallet state
    address: address || null,
    isConnected,
    isConnecting,
    isDisconnecting,
    chainId,
    balance: balanceData ? balanceData.formatted : null,
    
    // Network state
    isNetworkSupported: chainId === sepolia.id,
    
    // Actions
    connect,
    disconnect,
    switchToSepolia,
    
    // Legacy compatibility flag - makes it easy to detect components using the new hook
    usingWagmi: true
  };
}
