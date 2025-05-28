import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NETWORK_CONFIG } from '@/config/contracts';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface NetworkIndicatorProps {
  className?: string;
  showSwitchButton?: boolean;
}

export default function NetworkIndicator({ className, showSwitchButton = true }: NetworkIndicatorProps) {
  const [currentNetwork, setCurrentNetwork] = useState<string>('Not Connected');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const networkName = getNetworkName(chainId);
          setCurrentNetwork(networkName);
          const isCorrect = chainId === NETWORK_CONFIG.chainId;
          setIsCorrectNetwork(isCorrect);
          
          // Show warning if on wrong network
          if (!isCorrect && chainId !== '0x0') {
            toast({
              title: "Wrong Network Detected",
              description: `Please switch to Sepolia Testnet. Currently on: ${networkName}`,
              variant: "destructive"
            });
          }
          
          // Listen for network changes
          const handleChainChanged = (chainId: string) => {
            const networkName = getNetworkName(chainId);
            setCurrentNetwork(networkName);
            const isCorrect = chainId === NETWORK_CONFIG.chainId;
            setIsCorrectNetwork(isCorrect);
            
            if (isCorrect) {
              toast({
                title: "Network Switched",
                description: "Successfully connected to Sepolia Testnet",
                variant: "default"
              });
              // Reload page to refresh contract connections
              window.location.reload();
            }
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

  const switchToSepolia = async () => {
    if (!window.ethereum) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive"
      });
      return;
    }

    setIsSwitching(true);
    try {
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
      
      toast({
        title: "Network Switched",
        description: "Successfully switched to Sepolia Testnet",
        variant: "default"
      });
      
      // Reload page to ensure all components use the correct network
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (switchError: any) {
      // If Sepolia is not added to the wallet, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: NETWORK_CONFIG.chainId,
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
              },
            ],
          });
          
          // Try switching again after adding
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: NETWORK_CONFIG.chainId }],
          });
          
          toast({
            title: "Network Added & Switched",
            description: "Sepolia Testnet added and activated successfully",
            variant: "default"
          });
          
          setTimeout(() => window.location.reload(), 1000);
          
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          toast({
            title: "Failed to Add Network",
            description: "Please manually add Sepolia Testnet to your wallet",
            variant: "destructive"
          });
        }
      } else if (switchError.code === 4001) {
        // User rejected the request
        toast({
          title: "Network Switch Cancelled",
          description: "You cancelled the network switch request",
          variant: "default"
        });
      } else {
        console.error('Failed to switch network:', switchError);
        toast({
          title: "Failed to Switch Network",
          description: "Please manually switch to Sepolia Testnet in your wallet",
          variant: "destructive"
        });
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const getNetworkName = (chainId: string): string => {
    const networks: Record<string, string> = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten',
      '0x4': 'Rinkeby',
      '0x5': 'Goerli',
      '0xaa36a7': 'Sepolia Testnet',
      '0x89': 'Polygon',
      '0x38': 'BNB Chain',
      '0xa86a': 'Avalanche',
    };
    
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={isCorrectNetwork ? 'default' : 'destructive'}>
        {!isCorrectNetwork && <AlertTriangle className="w-3 h-3 mr-1" />}
        {currentNetwork}
      </Badge>
      {!isCorrectNetwork && showSwitchButton && currentNetwork !== 'No Wallet' && currentNetwork !== 'Error' && (
        <Button
          size="sm"
          variant="outline"
          onClick={switchToSepolia}
          disabled={isSwitching}
          className="text-xs"
        >
          {isSwitching ? (
            <RefreshCw className="w-3 h-3 animate-spin mr-1" />
          ) : null}
          Switch to Sepolia
        </Button>
      )}
    </div>
  );
}