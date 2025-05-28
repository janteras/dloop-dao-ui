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
  isConnecting: boolean;
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
  isConnecting: false,
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [shouldPromptNetworkSwitch, setShouldPromptNetworkSwitch] = useState(false);

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

  // Connect wallet function with improved error handling
  const connect = useCallback(async () => {
    if (!isMetaMaskAvailable) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    if (isConnecting) {
      console.log('⏳ Connection already in progress, please wait...');
      toast.warning('Connection already in progress, please check MetaMask...');
      return;
    }

    try {
      setIsConnecting(true);
      console.log('🔗 Connecting to MetaMask...');

      // Add a small delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 100));

      // First check if already connected without triggering a new request
      let existingAccounts;
      try {
        existingAccounts = await window.ethereum.request({ method: 'eth_accounts' });
      } catch (accountsError: any) {
        if (accountsError.code === -32002) {
          console.log('⏳ MetaMask is busy, waiting...');
          toast.warning('MetaMask is processing another request. Please wait...');
          return;
        }
        throw accountsError;
      }
      
      if (existingAccounts.length > 0) {
        console.log('✅ Wallet already connected, updating info...');
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        await updateAccountInfo(browserProvider);
        toast.success('Wallet connection restored!');
        return;
      }

      // Only request accounts if not already connected
      console.log('📝 Requesting account access...');
      let accounts;
      try {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (requestError: any) {
        if (requestError.code === -32002) {
          toast.error('MetaMask is already processing a request. Please check your wallet and try again.');
          return;
        }
        throw requestError;
      }
      
      if (accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      // Create ethers provider and update account info
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await updateAccountInfo(browserProvider);

      // Check network after successful connection
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      
      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        console.warn(`🚨 Wrong network: Connected to chain ${currentChainId}, app requires Sepolia (${SEPOLIA_CHAIN_ID})`);
        
        // Show immediate network switch prompt
        const switchNetwork = async () => {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID in hex
            });
            toast.success('Successfully switched to Sepolia Testnet!');
            // Refresh the page to ensure all components use the correct network
            window.location.reload();
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              // Network not added, add it first
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0xaa36a7',
                    chainName: 'Sepolia Testnet',
                    rpcUrls: [
                      'https://sepolia.infura.io/v3/',
                      'https://sepolia.drpc.org',
                      'https://rpc.sepolia.org'
                    ],
                    nativeCurrency: {
                      name: 'Sepolia Ether',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  }],
                });
                // Try switching again after adding
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0xaa36a7' }],
                });
                toast.success('Sepolia network added and activated!');
                window.location.reload();
              } catch (addError) {
                console.error('Failed to add Sepolia network:', addError);
                toast.error('Failed to add Sepolia network. Please add it manually in your wallet settings.');
              }
            } else if (switchError.code === 4001) {
              // User rejected the request
              toast.warning('Network switch cancelled. D-Loop requires Sepolia Testnet to function properly.');
            } else {
              console.error('Network switch failed:', switchError);
              toast.error('Failed to switch network. Please manually switch to Sepolia Testnet in your wallet.');
            }
          }
        };

        // Show persistent warning with action button
        toast.error('Wrong Network: Connected to Ethereum Mainnet. D-Loop requires Sepolia Testnet.', {
          duration: 10000,
          action: {
            label: 'Switch Network',
            onClick: switchNetwork,
          },
        });

        // Attempt automatic switch after a brief delay
        setTimeout(switchNetwork, 2000);
      } else {
        toast.success('Wallet connected successfully on Sepolia Testnet!');
      }
      
    } catch (error: any) {
      console.error('❌ Error connecting wallet:', error);

      // Handle specific MetaMask errors with better user guidance
      if (error?.code === -32002) {
        toast.error('MetaMask is already processing a request. Please check your wallet and try again in a moment.');
      } else if (error?.code === 4001) {
        toast.error('Connection cancelled by user.');
      } else if (error?.message?.includes('User rejected')) {
        toast.error('Connection request was rejected. Please try again.');
      } else {
        toast.error('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [updateAccountInfo, isMetaMaskAvailable, isConnecting]);

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
    isConnecting,
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