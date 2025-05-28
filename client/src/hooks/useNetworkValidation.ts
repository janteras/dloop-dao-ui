import { useState, useEffect, useCallback } from 'react';
import { NETWORK_CONFIG } from '@/config/contracts';
import { useToast } from '@/hooks/use-toast';

interface NetworkValidationState {
  isCorrectNetwork: boolean;
  currentNetwork: string;
  chainId: string | null;
  isValidating: boolean;
  switchToSepolia: () => Promise<void>;
}

export function useNetworkValidation(): NetworkValidationState {
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>('Not Connected');
  const [chainId, setChainId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const validateNetwork = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setCurrentNetwork('No Wallet');
      setIsCorrectNetwork(false);
      setChainId(null);
      return;
    }

    setIsValidating(true);
    try {
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      setChainId(currentChainId);

      const networkName = getNetworkName(currentChainId);
      setCurrentNetwork(networkName);

      const isCorrect = currentChainId === NETWORK_CONFIG.chainId;
      setIsCorrectNetwork(isCorrect);

      if (!isCorrect && currentChainId !== '0x0') {
        console.warn(`Wrong network detected: ${networkName} (${currentChainId}). Expected: Sepolia (${NETWORK_CONFIG.chainId})`);
      }
    } catch (error) {
      console.error('Error validating network:', error);
      setCurrentNetwork('Error');
      setIsCorrectNetwork(false);
      setChainId(null);
    } finally {
      setIsValidating(false);
    }
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) {
      const { toast } = useToast();
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive"
      });
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
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
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          throw new Error('Failed to add Sepolia Testnet to wallet');
        }
      } else {
        console.error('Failed to switch network:', switchError);
        throw new Error('Failed to switch to Sepolia Testnet');
      }
    }
  }, []);

  useEffect(() => {
    validateNetwork();

    if (window.ethereum) {
      const handleChainChanged = () => {
        // Small delay to ensure the network change is processed
        setTimeout(validateNetwork, 100);
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', validateNetwork);

      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', validateNetwork);
      };
    }
  }, [validateNetwork]);

  return {
    isCorrectNetwork,
    currentNetwork,
    chainId,
    isValidating,
    switchToSepolia,
  };
}

function getNetworkName(chainId: string): string {
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
}