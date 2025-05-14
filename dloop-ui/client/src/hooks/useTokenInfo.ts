import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { getContract } from '@/lib/contracts';

interface TokenInfo {
  availableBalance: string;
  delegatedAmount: string;
  totalVotingPower: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useTokenInfo(): TokenInfo {
  const { signer, address, isConnected } = useWallet();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['token-info', address],
    queryFn: async () => {
      if (!address || !isConnected) {
        return {
          availableBalance: '0',
          delegatedAmount: '0',
          totalVotingPower: '0'
        };
      }
      
      try {
        // Get contract instances using either signer or provider
        let contractProvider: ethers.JsonRpcProvider | ethers.JsonRpcSigner;
        if (signer) {
          contractProvider = signer;
        } else {
          // Create a compatible provider
          const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/';
          contractProvider = new ethers.JsonRpcProvider(rpcUrl);
        }
        
        const dloopToken = getContract('DLoopToken', contractProvider);
        
        // Fetch base token balance
        const rawBalance = await dloopToken.balanceOf(address);
        
        // Fetch delegated amount (sum of all outgoing delegations)
        const delegatedAmount = await dloopToken.getTotalDelegatedAmount(address);
        
        // Calculate available balance (total - delegated)
        const availableBalance = rawBalance - delegatedAmount;
        
        // Get total voting power (owned + delegated to this address)
        const votingPower = await dloopToken.getTotalDelegatedToAmount(address);
        
        return {
          availableBalance: ethers.formatEther(availableBalance),
          delegatedAmount: ethers.formatEther(delegatedAmount),
          totalVotingPower: ethers.formatEther(votingPower)
        };
      } catch (error) {
        console.error('Error fetching token info:', error);
        throw error;
      }
    },
    enabled: !!address && isConnected,
    staleTime: 30000 // 30 seconds
  });
  
  return {
    availableBalance: data?.availableBalance || '0',
    delegatedAmount: data?.delegatedAmount || '0', 
    totalVotingPower: data?.totalVotingPower || '0',
    isLoading,
    error: error as Error,
    refetch
  };
}
