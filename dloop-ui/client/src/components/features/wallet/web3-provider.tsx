import { createWeb3Modal } from '@web3modal/wagmi/react';
import { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create wagmi config
const projectId = 'a73aad5a3ad6ec54ba2b52124f56b9a2'; // Replace with your WalletConnect Project ID

const metadata = {
  name: 'D-Loop Protocol',
  description: 'D-Loop Protocol - Asset-backed stablecoin with AI-driven governance',
  url: 'https://d-loop.io',
  icons: ['https://d-loop.io/images/d-loop.png']
};

// Create wagmi config
const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  connectors: [],
});

// Create Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#F3BA2F',
    '--w3m-border-radius-master': '8px',
  },
});

// Create TanStack Query client
const queryClient = new QueryClient();

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}