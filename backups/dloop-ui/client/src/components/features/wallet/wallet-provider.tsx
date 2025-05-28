import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { contracts, NETWORK_CONFIG } from '@/config/contracts';

// Extend Window interface to include ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletContextProps {
  isConnected: boolean;
  address: string;
  balance: number | undefined;
  connect: () => Promise<void>;
  disconnect: () => void;
  rageQuit: () => Promise<void>;
  isRageQuitting: boolean;
  signer: ethers.JsonRpcSigner | null;
  delegateTokens: (delegatee: string, amount: string) => Promise<void>;
  undelegateTokens: (delegatee: string, amount: string) => Promise<void>;
  isDelegating: boolean;
}

const defaultContext: WalletContextProps = {
  isConnected: false,
  address: '',
  balance: undefined,
  connect: async () => {},
  disconnect: () => {},
  rageQuit: async () => {},
  isRageQuitting: false,
  signer: null,
  delegateTokens: async () => {},
  undelegateTokens: async () => {},
  isDelegating: false,
};

export const WalletContext = createContext<WalletContextProps>(defaultContext);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isRageQuitting, setIsRageQuitting] = useState(false);
  const [isDelegating, setIsDelegating] = useState(false);
  const { toast } = useToast();

  // Effect to check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Get connected accounts
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const balanceWei = await provider.getBalance(address);
            const balanceEth = parseFloat(ethers.formatEther(balanceWei));
            
            setIsConnected(true);
            setAddress(address);
            setBalance(balanceEth);
            setSigner(signer);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    
    checkConnection();
  }, []);

  // Function to handle wallet connection
  const connect = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Request account access
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Request to switch to Sepolia Testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: NETWORK_CONFIG.chainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: NETWORK_CONFIG.chainId,
                    chainName: NETWORK_CONFIG.chainName,
                    rpcUrls: NETWORK_CONFIG.rpcUrls,
                    nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                    blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrls,
                  },
                ],
              });
            } catch (addError) {
              throw new Error('Failed to add the Sepolia network to your wallet');
            }
          } else {
            throw switchError;
          }
        }
        
        // Request accounts after ensuring the correct network
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balanceWei = await provider.getBalance(address);
        const balanceEth = parseFloat(ethers.formatEther(balanceWei));
        
        setIsConnected(true);
        setAddress(address);
        setBalance(balanceEth);
        setSigner(signer);
        
        toast({
          title: 'Wallet Connected',
          description: 'Your wallet has been connected successfully.',
        });
      } catch (error: any) {
        console.error('Error connecting wallet:', error);
        toast({
          title: 'Connection Failed',
          description: error.message || 'Failed to connect wallet.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Wallet Not Found',
        description: 'Please install MetaMask or another Ethereum-compatible wallet.',
        variant: 'destructive',
      });
    }
  };

  // Function to handle wallet disconnection
  const disconnect = () => {
    setIsConnected(false);
    setAddress('');
    setBalance(undefined);
    setSigner(null);
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  };

  // Function to execute RageQuit functionality
  const rageQuit = async () => {
    if (!signer || !isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsRageQuitting(true);
      
      // Create a contract instance for ProtocolDAO
      const protocolDAO = new ethers.Contract(
        contracts.ProtocolDAO.address,
        contracts.ProtocolDAO.abi,
        signer
      );
      
      // Call the rageQuit function with the user's address
      const tx = await protocolDAO.rageQuit(address);
      await tx.wait();
      
      toast({
        title: 'RageQuit Successful',
        description: 'You have successfully exited the D-Loop protocol and reclaimed your tokens.',
      });
    } catch (error: any) {
      console.error('RageQuit error:', error);
      toast({
        title: 'RageQuit Failed',
        description: error.message || 'There was an error processing your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRageQuitting(false);
    }
  };

  // Function to delegate tokens to an AI Node or other address
  const delegateTokens = async (delegatee: string, amount: string) => {
    if (!signer || !isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsDelegating(true);
      
      // Create a contract instance for DLoopToken
      const dloopToken = new ethers.Contract(
        contracts.DLoopToken.address,
        contracts.DLoopToken.abi,
        signer
      );
      
      // Convert amount to wei
      const amountWei = ethers.parseEther(amount);
      
      // Call the delegateTokens function
      const tx = await dloopToken.delegateTokens(delegatee, amountWei);
      await tx.wait();
      
      toast({
        title: 'Delegation Successful',
        description: `You have successfully delegated ${amount} DLOOP tokens.`,
      });
    } catch (error: any) {
      console.error('Delegation error:', error);
      toast({
        title: 'Delegation Failed',
        description: error.message || 'There was an error processing your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDelegating(false);
    }
  };

  // Function to undelegate tokens
  const undelegateTokens = async (delegatee: string, amount: string) => {
    if (!signer || !isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsDelegating(true);
      
      // Create a contract instance for DLoopToken
      const dloopToken = new ethers.Contract(
        contracts.DLoopToken.address,
        contracts.DLoopToken.abi,
        signer
      );
      
      // Convert amount to wei
      const amountWei = ethers.parseEther(amount);
      
      // Call the undelegateTokens function
      const tx = await dloopToken.undelegateTokens(delegatee, amountWei);
      await tx.wait();
      
      toast({
        title: 'Undelegation Successful',
        description: `You have successfully undelegated ${amount} DLOOP tokens.`,
      });
    } catch (error: any) {
      console.error('Undelegation error:', error);
      toast({
        title: 'Undelegation Failed',
        description: error.message || 'There was an error processing your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDelegating(false);
    }
  };

  // Listen for account and chain changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User has disconnected their wallet
          disconnect();
        } else if (isConnected && accounts[0] !== address) {
          // User has switched accounts
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const balanceWei = await provider.getBalance(accounts[0]);
          const balanceEth = parseFloat(ethers.formatEther(balanceWei));
          
          setAddress(accounts[0]);
          setBalance(balanceEth);
          setSigner(signer);
          
          toast({
            title: 'Account Changed',
            description: 'Your connected wallet account has changed.',
          });
        }
      };
      
      const handleChainChanged = (_chainId: string) => {
        // Reload the page when the chain changes
        window.location.reload();
      };
      
      // Subscribe to events
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Cleanup function
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [address, disconnect, isConnected, toast]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        balance,
        connect,
        disconnect,
        rageQuit,
        isRageQuitting,
        signer,
        delegateTokens,
        undelegateTokens,
        isDelegating,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}