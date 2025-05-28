/**
 * D-Loop UI WagmiProvider
 * 
 * A modern React hooks-based wallet provider using wagmi v2 for more consistent
 * state management and blockchain interactions.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  WagmiProvider as WagmiBaseProvider, 
  useAccount, 
  useConnect, 
  useDisconnect,
  useBalance,
  useClient,
  useSimulateContract,
  useWriteContract,
  useTransactionReceipt
} from 'wagmi';
import { 
  formatEther, 
  createWalletClient,
  http, 
  custom, 
  PublicClient,
  WalletClient,
  Account,
  Transport,
  Chain
} from 'viem';
import { config, SEPOLIA_CHAIN, supportedChains } from '@/lib/wagmi-config';
import toast from 'react-hot-toast';
import { ethers } from 'ethers'; // Keep ethers for backward compatibility

// Define the WalletContext props similar to the existing SimplifiedWalletProvider
interface WalletContextProps {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signer: ethers.JsonRpcSigner | null;
  provider: ethers.JsonRpcProvider | null;
  chainId: number | null;
  isConnecting: boolean;
  isDisconnecting: boolean;
  switchToSepolia: () => Promise<void>;
  isNetworkSupported: boolean;
}

// Create the context with default values
export const WalletContext = createContext<WalletContextProps>({
  isConnected: false,
  address: null,
  balance: null,
  connect: async () => {},
  disconnect: () => {},
  signer: null,
  provider: null,
  chainId: null,
  isConnecting: false,
  isDisconnecting: false,
  switchToSepolia: async () => {},
  isNetworkSupported: false,
});

// Main application provider
export function WagmiProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiBaseProvider config={config}>
      <WalletConnectionProvider>
        {children}
      </WalletConnectionProvider>
    </WagmiBaseProvider>
  );
}

// Inner provider that handles wallet connections and state
function WalletConnectionProvider({ children }: { children: ReactNode }) {
  // State for ethers compatibility
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  
  // Access wagmi hooks
  const { address, isConnected, chainId } = useAccount();
  const { connect: wagmiConnect, isPending: isConnecting, connectors } = useConnect();
  const { disconnect: wagmiDisconnect, isPending: isDisconnecting } = useDisconnect();
  const { data: balanceData } = useBalance({ 
    address: address as `0x${string}` | undefined
  });
  
  // Get clients from wagmi
  const client = useClient();
  
  // Derived states
  const isNetworkSupported = !!chainId && supportedChains.some(chain => chain.id === chainId);
  
  // Convert balance to string
  const balance = balanceData ? formatEther(balanceData.value) : null;
  
  // Setup ethers.js provider and signer for backward compatibility
  useEffect(() => {
    if (!client) {
      setProvider(null);
      setSigner(null);
      return;
    }
    
    // Create a transport URL from the client's provider URL
    let transportUrl = 'https://sepolia.infura.io/v3/your-infura-key';
    if (client.transport && 'url' in client.transport) {
      transportUrl = client.transport.url;
    }
    
    // Create an ethers provider from the viem publicClient
    const ethersFallbackProvider = new ethers.JsonRpcProvider(
      transportUrl,
      chainId ? { name: 'unknown', chainId } : undefined
    );
    
    setProvider(ethersFallbackProvider);
    
    // Only create signer if connected
    if (isConnected && address) {
      // Create an ethers signer - this is a simplified implementation that will be 
      // sufficient for read operations and we'll handle writes through wagmi
      const signer = new ethers.JsonRpcSigner(ethersFallbackProvider.provider, address, null, 0);
      
      setSigner(signer as ethers.JsonRpcSigner);
    } else {
      setSigner(null);
    }
  }, [client, isConnected, address, chainId]);
  
  // Connect function
  const connect = async () => {
    try {
      const connector = connectors.find(c => c.id === 'metaMask') || connectors[0];
      if (!connector) {
        toast.error('No wallet connectors available');
        return;
      }
      
      await wagmiConnect({ connector });
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    }
  };
  
  // Disconnect function
  const disconnect = () => {
    try {
      wagmiDisconnect();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };
  
  // Switch to Sepolia (simplified in v2)
  const switchToSepolia = async () => {
    try {
      // In wagmi v2, chain switching is handled by the wallet
      // We'll just display a notification to switch manually
      toast.error('Please switch to Sepolia network in your wallet manually');
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch networks. Please try manually in your wallet.');
    }
  };
  
  // Combine all values for the context
  const contextValue: WalletContextProps = {
    isConnected,
    address: address || null,
    balance,
    connect,
    disconnect,
    signer,
    provider,
    chainId: chainId || null,
    isConnecting,
    isDisconnecting,
    switchToSepolia,
    isNetworkSupported,
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook to use the wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WagmiProvider');
  }
  return context;
}

// Export a hook that's directly compatible with EnhancedAssetDAOService
export function useWalletForContracts() {
  const { signer, provider, isConnected, chainId } = useWallet();
  return {
    signer,
    provider,
    isConnected,
    chainId,
  };
}
