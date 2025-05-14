import { createContext, useContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { useToast } from '@/hooks/use-toast';

// Define the wallet context interface
interface WalletContextType {
  isConnected: boolean;
  address: string;
  balance: number | undefined;
  connect: () => void;
  disconnect: () => void;
  isLoading: boolean;
}

// Create the context with default values
export const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: '',
  balance: undefined,
  connect: () => {},
  disconnect: () => {},
  isLoading: false,
});

// Provider component props
interface WalletProviderProps {
  children: ReactNode;
}

// Export the provider component
export function WagmiWalletProvider({ children }: WalletProviderProps) {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get balance for connected address
  const { data: balanceData } = useBalance({
    address: address
  });

  // Format balance to a readable number
  const balance = balanceData ? parseFloat(balanceData.formatted) : undefined;

  const handleConnect = useCallback(() => {
    try {
      setIsLoading(true);
      
      // Get Web3Modal to show available wallets
      if (connectors.length > 0) {
        // Find the web3modal connector which shows all options
        const web3modalConnector = connectors.find(c => c.id === 'walletConnect');
        
        if (web3modalConnector) {
          console.log('Connecting with Web3Modal connector');
          connect({ connector: web3modalConnector });
        } else {
          // Fallback to injected if available (MetaMask)
          const injectedConnector = connectors.find(c => c.id === 'injected');
          if (injectedConnector) {
            console.log('Connecting with injected connector (MetaMask)');
            connect({ connector: injectedConnector });
          } else {
            // Last resort - use the first available connector
            console.log('Connecting with first available connector:', connectors[0].id);
            connect({ connector: connectors[0] });
          }
        }
      } else {
        throw new Error('No wallet connectors available');
      }
      
      toast({
        title: 'Connect your wallet',
        description: 'Please select a wallet to connect to D-Loop',
      });
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [connect, connectors, toast]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    toast({
      title: 'Wallet disconnected',
      description: 'Your wallet has been disconnected',
    });
  }, [disconnect, toast]);

  // Show toast when connection status changes
  useEffect(() => {
    if (isConnected && address) {
      toast({
        title: 'Wallet connected',
        description: 'Your wallet has been connected successfully',
      });
    }
  }, [isConnected, address, toast]);

  // Context value
  const value = {
    isConnected,
    address: address || '',
    balance,
    connect: handleConnect,
    disconnect: handleDisconnect,
    isLoading: isPending || isLoading,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook to use the wallet context
export function useWagmiWallet() {
  return useContext(WalletContext);
}