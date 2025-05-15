import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { NETWORK_CONFIG } from '@/config/contracts';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface NetworkIndicatorProps {
  className?: string;
}

export default function NetworkIndicator({ className }: NetworkIndicatorProps) {
  const [currentNetwork, setCurrentNetwork] = useState<string>('Not Connected');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);

  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const networkName = getNetworkName(chainId);
          setCurrentNetwork(networkName);
          setIsCorrectNetwork(chainId === NETWORK_CONFIG.chainId);
          
          // Listen for network changes
          const handleChainChanged = (chainId: string) => {
            const networkName = getNetworkName(chainId);
            setCurrentNetwork(networkName);
            setIsCorrectNetwork(chainId === NETWORK_CONFIG.chainId);
          };
          
          window.ethereum.on('chainChanged', handleChainChanged);
          
          return () => {
            window.ethereum.removeListener('chainChanged', handleChainChanged);
          };
        } catch (error) {
          console.error('Error checking network:', error);
          setCurrentNetwork('Error');
          setIsCorrectNetwork(false);
        }
      } else {
        setCurrentNetwork('No Wallet');
        setIsCorrectNetwork(false);
      }
    };
    
    checkNetwork();
  }, []);

  const getNetworkName = (chainId: string): string => {
    const networks: Record<string, string> = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten',
      '0x4': 'Rinkeby',
      '0x5': 'Goerli',
      '0xaa36a7': 'Sepolia',
      '0x89': 'Polygon',
      '0x38': 'BNB Chain',
      '0xa86a': 'Avalanche',
    };
    
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  return (
    <Badge variant={isCorrectNetwork ? 'default' : 'destructive'} className={className}>
      {currentNetwork}
    </Badge>
  );
}