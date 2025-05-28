
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { NETWORK_CONFIG } from '@/config/contracts';

interface NetworkSwitchingState {
  isSwitching: boolean;
  isCorrectNetwork: boolean;
  currentChainId: string | null;
  switchToSepolia: () => Promise<boolean>;
  validateNetwork: () => Promise<boolean>;
}

export function useUnifiedNetworkSwitching(): NetworkSwitchingState {
  const [isSwitching, setIsSwitching] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<string | null>(null);
  const { toast } = useToast();

  const validateNetwork = useCallback(async (): Promise<boolean> => {
    try {
      let chainId: string | null = null;

      // Check MetaMask/Injected wallet
      if (window.ethereum) {
        chainId = await window.ethereum.request({ method: 'eth_chainId' });
      }

      setCurrentChainId(chainId);
      const isCorrect = chainId === NETWORK_CONFIG.chainId;
      setIsCorrectNetwork(isCorrect);

      if (!isCorrect && chainId) {
        console.warn(`🚨 Network Mismatch: Connected to ${chainId}, but D-Loop requires ${NETWORK_CONFIG.chainId} (Sepolia)`);
        
        // Show immediate warning for wrong network
        toast({
          title: "Wrong Network Detected",
          description: `You're on ${getNetworkName(chainId)}. D-Loop requires Sepolia Testnet.`,
          variant: "destructive"
        });

        // Auto-prompt for network switch if on Mainnet
        if (chainId === '0x1') {
          console.log('🔄 Mainnet detected, initiating auto-switch to Sepolia...');
          toast({
            title: "Mainnet Detected",
            description: "Smart contracts are deployed on Sepolia Testnet. Auto-switching networks...",
            variant: "destructive"
          });
          
          // Auto-trigger network switch with shorter delay
          setTimeout(async () => {
            const success = await switchToSepolia();
            if (success) {
              toast({
                title: "Network Switched Successfully",
                description: "You're now connected to Sepolia Testnet",
                variant: "default"
              });
            }
          }, 1500);
        }
      }

      return isCorrect;
    } catch (error) {
      console.error('Network validation error:', error);
      return false;
    }
  }, [toast]);

  const getNetworkName = (chainId: string): string => {
    const networks: Record<string, string> = {
      '0x1': 'Ethereum Mainnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x89': 'Polygon',
      '0x38': 'BNB Chain',
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  const switchToSepolia = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive"
      });
      return false;
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

      await validateNetwork();
      return true;

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
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                nativeCurrency: {
                  name: 'Sepolia Ether',
                  symbol: 'SEP',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });

          toast({
            title: "Network Added & Switched",
            description: "Sepolia Testnet added and activated",
            variant: "default"
          });

          await validateNetwork();
          return true;

        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          toast({
            title: "Failed to Add Network",
            description: "Please manually add Sepolia Testnet to your wallet",
            variant: "destructive"
          });
          return false;
        }
      } else if (switchError.code === 4001) {
        // User rejected the request
        toast({
          title: "Network Switch Cancelled",
          description: "You cancelled the network switch request",
          variant: "default"
        });
        return false;
      } else {
        console.error('Failed to switch network:', switchError);
        toast({
          title: "Failed to Switch Network",
          description: "Unable to switch to Sepolia Testnet",
          variant: "destructive"
        });
        return false;
      }
    } finally {
      setIsSwitching(false);
    }
  }, [toast, validateNetwork]);

  return {
    isSwitching,
    isCorrectNetwork,
    currentChainId,
    switchToSepolia,
    validateNetwork,
  };
}
