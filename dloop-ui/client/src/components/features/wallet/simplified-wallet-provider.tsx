import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

// Add window ethereum interface
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletContextProps {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signer: ethers.JsonRpcSigner | null;
  provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null;
  chainId: number | null;
}

// Create context with default values
export const WalletContext = createContext<WalletContextProps>({
  isConnected: false,
  address: null,
  balance: null,
  connect: async () => {},
  disconnect: () => {},
  signer: null,
  provider: null,
  chainId: null,
});

interface SimplifiedWalletProviderProps {
  children: ReactNode;
}

// Sepolia network configuration
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_NETWORK = {
  chainId: SEPOLIA_CHAIN_ID,
  name: 'Sepolia',
};

export function SimplifiedWalletProvider({ children }: SimplifiedWalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [fallbackProvider, setFallbackProvider] = useState<ethers.JsonRpcProvider | null>(null);
  
  // Check if the window object and ethereum are available
  const isMetaMaskAvailable = typeof window !== 'undefined' && window.ethereum;

  // Create a fallback provider using Infura or a public RPC endpoint
  useEffect(() => {
    async function setupFallbackProvider() {
      try {
        // Access the Infura API key from environment variables
        // In Vite, environment variables must be prefixed with VITE_
        const infuraApiKey = import.meta.env.VITE_INFURA_API_KEY;
        let provider: ethers.JsonRpcProvider | null = null;
        
        // Try connecting to Infura first
        if (infuraApiKey) {
          const infuraUrl = `https://sepolia.infura.io/v3/${infuraApiKey}`;
          
          try {
            // Create a JsonRpcProvider with proper error handling
            provider = new ethers.JsonRpcProvider(infuraUrl);
            // Test the connection
            await provider.getBlockNumber();
            console.log("Fallback Infura provider initialized successfully");
          } catch (infuraError) {
            console.warn("Could not connect to Infura, trying fallback public RPC:", infuraError);
            provider = null; // Reset provider to try fallback
          }
        } else {
          console.warn('No Infura API key found. For production, set VITE_INFURA_API_KEY in your environment.');
        }
        
        // If Infura failed, try public RPC fallback
        if (!provider) {
          try {
            // Get the fallback RPC URL from environment variables
            const fallbackRpcUrl = import.meta.env.VITE_FALLBACK_RPC_URL || 'https://eth-sepolia.public.blastapi.io';
            provider = new ethers.JsonRpcProvider(fallbackRpcUrl);
            await provider.getBlockNumber();
            console.log("Using public RPC endpoint as fallback provider");
          } catch (fallbackError) {
            console.error("All provider connections failed:", fallbackError);
            toast.error('Failed to connect to any Ethereum network. Please check your connection.');
            return; // Exit if all connections fail
          }
        }
        
        // We have a working provider at this point
        setFallbackProvider(provider);
        
        // If no wallet is connected yet, use fallback provider as the default
        if (!isConnected) {
          setProvider(provider);
          setChainId(SEPOLIA_CHAIN_ID);
        }
      } catch (error) {
        console.error("Error initializing fallback provider:", error);
        toast.error('Failed to initialize blockchain connection');
      }
    }
    
    setupFallbackProvider();
  }, [isConnected]);
  
  // Function to update account information
  const updateAccountInfo = useCallback(async (browserProvider: ethers.BrowserProvider) => {
    try {
      const accounts = await browserProvider.listAccounts();
      
      if (accounts.length > 0) {
        const userSigner = await browserProvider.getSigner();
        const userAddress = await userSigner.getAddress();
        const network = await browserProvider.getNetwork();
        const userBalance = await browserProvider.getBalance(userAddress);
        
        setIsConnected(true);
        setAddress(userAddress);
        setBalance(ethers.formatEther(userBalance));
        setSigner(userSigner);
        setProvider(browserProvider);
        setChainId(Number(network.chainId));
        
        console.log('Wallet connected successfully:', userAddress);
      } else {
        // No accounts found, user may have disconnected
        setIsConnected(false);
        setAddress(null);
        setBalance(null);
        setSigner(null);
        setChainId(null);
      }
    } catch (error) {
      console.error('Error updating account info:', error);
      setIsConnected(false);
    }
  }, []);
  
  // Connect wallet function
  const connect = useCallback(async () => {
    if (!isMetaMaskAvailable) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }
    
    try {
      console.log('Connecting to MetaMask...');
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create ethers provider
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Update account info with the provider
      await updateAccountInfo(browserProvider);
      
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    }
  }, [updateAccountInfo, isMetaMaskAvailable]);
  
  // Disconnect wallet function
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setBalance(null);
    setSigner(null);
    
    // When disconnecting, switch to fallback provider if available
    if (fallbackProvider) {
      setProvider(fallbackProvider);
      setChainId(SEPOLIA_CHAIN_ID);
    } else {
      setProvider(null);
      setChainId(null);
    }
    
    toast.success('Wallet disconnected');
  }, [fallbackProvider]);
  
  // Handle account changes
  useEffect(() => {
    if (!isMetaMaskAvailable) return;
    
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnect();
      } else if (isConnected) {
        // Account changed while connected, update info
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        await updateAccountInfo(browserProvider);
      }
    };
    
    const handleChainChanged = () => {
      // When the chain changes, reload the page to reset state
      window.location.reload();
    };
    
    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('chainChanged', handleChainChanged);
    
    // Check if we're already connected on initial load
    const checkInitialConnection = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0) {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            await updateAccountInfo(browserProvider);
          }
        }
      } catch (error) {
        console.error('Error checking initial connection:', error);
      }
    };
    
    checkInitialConnection();
    
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect, isConnected, updateAccountInfo, isMetaMaskAvailable]);
  
  const contextValue = {
    isConnected,
    address,
    balance,
    connect,
    disconnect,
    signer,
    provider,
    chainId,
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook to use the wallet context
export const useWallet = () => {
  const context = React.useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a SimplifiedWalletProvider');
  }
  return context;
};