import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { createWeb3Modal } from '@web3modal/wagmi';
import { http } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { createConfig, connect } from '@wagmi/core';
import { injected } from '@wagmi/connectors';
import { walletConnect } from '@wagmi/connectors';

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
  connect: (type: 'metamask' | 'walletconnect') => Promise<void>;
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

interface WalletConnectProviderProps {
  children: ReactNode;
}

// Sepolia network configuration
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/ca485bd6567e4c5fb5693ee66a5885d8';

export function WalletConnectProvider({ children }: WalletConnectProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [fallbackProvider, setFallbackProvider] = useState<ethers.JsonRpcProvider | null>(null);
  
  // Check if the window object and ethereum are available
  const isMetaMaskAvailable = typeof window !== 'undefined' && window.ethereum;

  // Initialize WalletConnect configuration
  useEffect(() => {
    async function configureWalletConnect() {
      try {
        const projectId = '6f23ad7f41333ccb23a5b2b6d330509a';

        // Configure chains
        const { chains, publicClient } = configureChains(
          [sepolia, mainnet],
          [http(SEPOLIA_RPC_URL)]
        );

        // Create wagmi config
        const config = createConfig({
          autoConnect: true,
          publicClient,
          connectors: [
            new InjectedConnector({ chains }),
            new WalletConnectConnector({
              chains,
              options: {
                projectId,
                showQrModal: true,
                metadata: {
                  name: 'D-Loop Protocol',
                  description: 'D-Loop Decentralized Governance',
                  url: window.location.origin,
                  icons: [`${window.location.origin}/favicon.ico`]
                }
              }
            })
          ]
        });

        // Create web3modal instance
        createWeb3Modal({
          wagmiConfig: config,
          projectId,
          chains,
          themeMode: 'light',
          themeVariables: {
            '--w3m-accent': '#3E7DEF',
            '--w3m-border-radius-master': '4px'
          }
        });

        console.log('WalletConnect configured successfully');
      } catch (error) {
        console.error('Error configuring WalletConnect:', error);
      }
    }

    configureWalletConnect();
  }, []);

  // Create a fallback provider using Infura
  useEffect(() => {
    async function setupFallbackProvider() {
      try {
        // Use hardcoded Infura API key
        const infuraUrl = SEPOLIA_RPC_URL;
        
        // Create a simple JsonRpcProvider with minimal configuration
        const provider = new ethers.JsonRpcProvider(infuraUrl);
        
        // Set the network manually instead of relying on auto-detection
        provider.getBlockNumber().then(() => {
          console.log("Fallback Infura provider initialized successfully");
          
          setFallbackProvider(provider);
          
          // If no wallet is connected yet, use fallback provider as the default
          if (!isConnected) {
            setProvider(provider);
            setChainId(SEPOLIA_CHAIN_ID);
          }
        }).catch(error => {
          console.error("Could not connect to Infura:", error);
        });
      } catch (error) {
        console.error("Error initializing fallback provider:", error);
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
        disconnectWallet();
      }
    } catch (error) {
      console.error('Error updating account info:', error);
      disconnectWallet();
    }
  }, []);
  
  // Connect wallet function
  const connectWallet = useCallback(async (type: 'metamask' | 'walletconnect' = 'metamask') => {
    if (type === 'metamask') {
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
    } else if (type === 'walletconnect') {
      try {
        console.log('Connecting via WalletConnect...');
        
        // This opens the WalletConnect modal
        const result = await connect({
          connector: new WalletConnectConnector({
            chains: [sepolia],
            options: {
              projectId: '6f23ad7f41333ccb23a5b2b6d330509a',
              showQrModal: true,
              metadata: {
                name: 'D-Loop Protocol',
                description: 'D-Loop Decentralized Governance',
                url: window.location.origin,
                icons: [`${window.location.origin}/favicon.ico`]
              }
            }
          })
        });
        
        if (result && result.account) {
          // After connection, we need to create an ethers provider manually
          console.log('WalletConnect connected:', result.account);
          
          // Create a simple ethers provider
          const wcProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
          
          setIsConnected(true);
          setAddress(result.account);
          setProvider(wcProvider);
          setChainId(SEPOLIA_CHAIN_ID);
          
          // Get balance
          const balance = await wcProvider.getBalance(result.account);
          setBalance(ethers.formatEther(balance));
          
          toast.success('Connected via WalletConnect');
        }
      } catch (error) {
        console.error('Error connecting via WalletConnect:', error);
        toast.error('Failed to connect with WalletConnect');
      }
    }
  }, [updateAccountInfo, isMetaMaskAvailable]);
  
  // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
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
  
  // Handle account changes with MetaMask
  useEffect(() => {
    if (!isMetaMaskAvailable) return;
    
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnectWallet();
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
  }, [disconnectWallet, isConnected, updateAccountInfo, isMetaMaskAvailable]);
  
  const contextValue = {
    isConnected,
    address,
    balance,
    connect: connectWallet,
    disconnect: disconnectWallet,
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
    throw new Error('useWallet must be used within a WalletConnectProvider');
  }
  return context;
};