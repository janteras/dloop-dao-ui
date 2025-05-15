import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { ReactNode, useEffect, useState } from 'react';
import { sepolia } from 'wagmi/chains';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';

interface Web3ModalProviderProps {
  children: ReactNode;
}

// Create wallet metadata for a better user experience
const metadata = {
  name: 'D-Loop Protocol',
  description: 'DeFi governance protocol for AI-enhanced investment',
  url: window.location.origin,
  icons: ['https://d-loop.io/images/d-loop.png'],
};

// Create a query client for React Query
const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export function Web3ModalProvider({ children }: Web3ModalProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<any>(null);

  // Effect to fetch config and initialize Web3Modal
  useEffect(() => {
    async function setupWeb3Modal() {
      if (typeof window === 'undefined') return;
      
      try {
        // Fetch environment variables from our backend
        const response = await fetch('/api/config');
        const { infuraApiKey } = await response.json();
        
        // Use the WalletConnect Project ID provided directly
        const walletConnectProjectId = '6f23ad7f41333ccb23a5b2b6d330509a';
        
        console.log('Config loaded successfully, using Project ID:', walletConnectProjectId);
        
        // Create a custom chain with the correct RPC URL
        const customSepolia = {
          ...sepolia,
          rpcUrls: {
            ...sepolia.rpcUrls,
            default: {
              http: [`https://sepolia.infura.io/v3/${infuraApiKey}`],
            },
            public: {
              http: [`https://sepolia.infura.io/v3/${infuraApiKey}`],
            },
          },
        };
        
        // Create wagmi config with the specific Project ID
        const wagmiConfig = defaultWagmiConfig({
          chains: [customSepolia],
          projectId: walletConnectProjectId,
          metadata,
        });

        // Create Web3Modal with simplified configuration focusing on MetaMask
        createWeb3Modal({
          wagmiConfig,
          projectId: walletConnectProjectId,
          themeMode: 'dark',
          defaultChain: customSepolia,
          // Focus on MetaMask for simplicity
          includeWalletIds: ['c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'], // MetaMask
          featuredWalletIds: ['c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'], // MetaMask
        });
        
        // Set the config in state
        setConfig(wagmiConfig);
      } catch (error) {
        console.error('Error setting up Web3Modal:', error);
      }
    }

    setupWeb3Modal();
  }, []);
  
  // Effect to handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration errors and don't render until config is loaded
  if (!mounted || !config) return null;
  
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClientInstance}>
        {children}
      </QueryClientProvider>
    </WagmiConfig>
  );
}