import React, { useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { getContract } from '@/lib/contracts';
import { WalletContext } from '@/hooks/useWallet';

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isRageQuitting, setIsRageQuitting] = useState(false);

  // Initialize wallet connection if previously connected
  useEffect(() => {
    const storedAddress = localStorage.getItem('walletAddress');
    if (storedAddress) {
      tryReconnect();
    }
  }, []);

  // Fetch balance whenever address changes
  useEffect(() => {
    if (address) {
      fetchBalance();
    }
  }, [address]);

  const tryReconnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to reconnect wallet:', error);
      localStorage.removeItem('walletAddress');
    }
  };

  const connect = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: 'No Wallet Detected',
          description: 'Please install a Web3 wallet like MetaMask to continue.',
          variant: 'destructive',
        });
        return;
      }

      // Request accounts access
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Check if connected to Sepolia testnet (chainId: 11155111)
      const network = await provider.getNetwork();
      const sepoliaChainId = BigInt(11155111);
      
      if (network.chainId !== sepoliaChainId) {
        try {
          // Try to switch to Sepolia
          await provider.send('wallet_switchEthereumChain', [{ chainId: '0xaa36a7' }]);
        } catch (switchError: any) {
          // If Sepolia network is not set up in the wallet, add it
          if (switchError.code === 4902) {
            await provider.send('wallet_addEthereumChain', [
              {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ]);
            // Try switching again
            await provider.send('wallet_switchEthereumChain', [{ chainId: '0xaa36a7' }]);
          } else {
            throw switchError;
          }
        }
      }

      const userSigner = await provider.getSigner();
      const userAddress = await userSigner.getAddress();

      setSigner(userSigner);
      setAddress(userAddress);
      setIsConnected(true);
      localStorage.setItem('walletAddress', userAddress);

      // Set up event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`,
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect wallet',
        variant: 'destructive',
      });
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress('');
    setBalance(undefined);
    setSigner(null);
    localStorage.removeItem('walletAddress');
    
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }

    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnect();
    } else if (accounts[0] !== address) {
      // User switched accounts
      setAddress(accounts[0]);
      localStorage.setItem('walletAddress', accounts[0]);
      toast({
        title: 'Account Changed',
        description: `Switched to ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
      });
    }
  };

  const handleChainChanged = () => {
    // Reload the page when chain changes
    window.location.reload();
  };

  const fetchBalance = async () => {
    if (!address || !signer) return;

    try {
      // Get the DLoopToken contract
      const tokenContract = getContract('DLoopToken', signer);
      
      // Call the balanceOf method to get the user's DLOOP balance
      const balanceWei = await tokenContract.balanceOf(address);
      
      // Convert from wei to tokens (assuming 18 decimals)
      const balanceFormatted = parseFloat(ethers.formatUnits(balanceWei, 18));
      
      setBalance(balanceFormatted);
    } catch (error) {
      console.error('Error fetching balance:', error);
      // Leave the previous balance value if there's an error
    }
  };

  const rageQuit = async () => {
    if (!isConnected || !signer) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to rage quit.',
        variant: 'destructive',
      });
      return;
    }

    setIsRageQuitting(true);
    try {
      // Get the AssetDAO contract
      const assetDaoContract = getContract('AssetDAO', signer);
      
      // Call the rageQuit function
      const tx = await assetDaoContract.rageQuit();
      
      // Wait for the transaction to be mined
      await tx.wait();
      
      // Fetch updated balance
      await fetchBalance();
      
      return tx;
    } catch (error) {
      console.error('Error during rage quit:', error);
      throw error;
    } finally {
      setIsRageQuitting(false);
    }
  };

  const contextValue = {
    isConnected,
    address,
    balance,
    connect,
    disconnect,
    rageQuit,
    isRageQuitting,
    signer
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}