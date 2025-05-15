import { useCallback, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import EthereumProvider from '@walletconnect/ethereum-provider';
import { toast } from 'react-hot-toast';

// Define interface for hook return values
interface UseWalletConnectReturn {
  wcProvider: EthereumProvider | null;
  ethersProvider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Custom hook to handle WalletConnect integration with ethers.js v6
 * 
 * @returns {UseWalletConnectReturn} WalletConnect state and methods
 */
export function useWalletConnect(): UseWalletConnectReturn {
  const [wcProvider, setWcProvider] = useState<EthereumProvider | null>(null);
  const [ethersProvider, setEthersProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Project ID for WalletConnect
  const projectId = '6f23ad7f41333ccb23a5b2b6d330509a';

  // Initialize WalletConnect provider
  const initWalletConnect = useCallback(async () => {
    try {
      // Create new provider instance
      const provider = await EthereumProvider.init({
        projectId,
        chains: [11155111], // Sepolia testnet
        optionalChains: [1, 11155111], // Mainnet and Sepolia
        showQrModal: true,
        methods: [
          'eth_sendTransaction',
          'eth_sign',
          'personal_sign',
          'eth_signTypedData',
        ],
        events: [
          'chainChanged',
          'accountsChanged',
        ],
        metadata: {
          name: 'D-Loop Protocol',
          description: 'Decentralized Governance',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`]
        }
      });

      // Register event listeners
      provider.on('connect', (connectInfo: { chainId: number }) => {
        console.log('WalletConnect connected', connectInfo);
        setChainId(connectInfo.chainId);
        setIsConnected(true);
        toast.success('WalletConnect connected');
      });

      provider.on('disconnect', () => {
        console.log('WalletConnect disconnected');
        setIsConnected(false);
        setAddress(null);
        setSigner(null);
        setEthersProvider(null);
        toast.error('WalletConnect disconnected');
      });

      provider.on('accountsChanged', (accounts: string[]) => {
        console.log('WalletConnect accounts changed', accounts);
        if (accounts.length > 0) {
          setAddress(accounts[0]);
        } else {
          setAddress(null);
        }
      });

      provider.on('chainChanged', (newChainId: number) => {
        console.log('WalletConnect chain changed', newChainId);
        setChainId(newChainId);
        
        // Check if on Sepolia
        if (newChainId !== 11155111) {
          toast.warning('Please switch to Sepolia testnet');
        }
      });

      // Set WalletConnect provider
      setWcProvider(provider);
      return provider;
    } catch (error) {
      console.error('Failed to initialize WalletConnect', error);
      toast.error('Failed to initialize WalletConnect');
      return null;
    }
  }, []);

  // Connect to WalletConnect
  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      // Initialize or get existing provider
      const provider = wcProvider || await initWalletConnect();
      
      if (!provider) {
        toast.error('Could not initialize WalletConnect');
        setIsConnecting(false);
        return;
      }
      
      // Request connection
      const accounts = await provider.enable();
      
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        
        // Create ethers provider
        const browserProvider = new ethers.BrowserProvider(provider as any);
        setEthersProvider(browserProvider);
        
        // Get current chain ID
        const network = await browserProvider.getNetwork();
        setChainId(Number(network.chainId));
        
        // Get signer
        const walletSigner = await browserProvider.getSigner();
        setSigner(walletSigner);
        
        setIsConnected(true);
        toast.success('Connected via WalletConnect');
      } else {
        toast.error('No accounts found');
      }
    } catch (error) {
      console.error('Failed to connect via WalletConnect', error);
      toast.error('Failed to connect via WalletConnect');
    } finally {
      setIsConnecting(false);
    }
  }, [wcProvider, initWalletConnect]);

  // Disconnect from WalletConnect
  const disconnect = useCallback(async () => {
    if (wcProvider) {
      try {
        await wcProvider.disconnect();
      } catch (error) {
        console.error('Error disconnecting from WalletConnect', error);
      }
    }
    
    // Reset state
    setIsConnected(false);
    setAddress(null);
    setSigner(null);
    setEthersProvider(null);
    toast.success('Disconnected from WalletConnect');
  }, [wcProvider]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wcProvider) {
        wcProvider.removeAllListeners();
      }
    };
  }, [wcProvider]);

  return {
    wcProvider,
    ethersProvider,
    signer,
    address,
    chainId,
    isConnected,
    isConnecting,
    connect,
    disconnect
  };
}