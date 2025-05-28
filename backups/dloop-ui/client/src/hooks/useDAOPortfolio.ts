import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWallet } from '@/components/features/wallet/wallet-provider';
import { getContract } from '@/lib/contracts';

interface Portfolio {
  dloopBalance: number;
  daiBalance: number;
  delegatedDloop: number;
  pendingRewards: number;
  totalVotingPower: number;
}

export const useDAOPortfolio = () => {
  const { signer, address, isConnected } = useWallet();

  const { data: portfolio, isLoading, error, refetch } = useQuery({
    queryKey: ['portfolio', address],
    queryFn: async (): Promise<Portfolio> => {
      try {
        // In a production environment, this would fetch real data from the blockchain
        // For now, use mock data for the UI development
        if (!isConnected || !signer) {
          return {
            dloopBalance: 0,
            daiBalance: 0,
            delegatedDloop: 0,
            pendingRewards: 0,
            totalVotingPower: 0,
          };
        }

        // This section shows how we would fetch actual on-chain data:
        /*
        // Get DLoopToken contract instance
        const dloopToken = getContract('DLoopToken', signer);
        
        // Get balances for the DLOOP token
        const dloopBalanceWei = await dloopToken.balanceOf(address);
        const dloopBalance = parseFloat(ethers.formatEther(dloopBalanceWei));
        
        // Get delegated tokens - this would be a custom method on the token contract
        const delegations = await dloopToken.getDelegationsForAddress(address);
        let delegatedDloop = 0;
        
        if (delegations && delegations.length) {
          // Sum up all delegations
          delegatedDloop = delegations.reduce((total, d) => {
            return total + parseFloat(ethers.formatEther(d.amount));
          }, 0);
        }
        
        // Get DAI balance - assuming we have DAI in the contract configuration
        // This would require a different token contract
        const daiToken = new ethers.Contract(
          '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI address
          ['function balanceOf(address owner) view returns (uint256)'],
          signer
        );
        
        const daiBalanceWei = await daiToken.balanceOf(address);
        const daiBalance = parseFloat(ethers.formatEther(daiBalanceWei));
        
        // Get pending rewards - this would come from a rewards contract
        const rewardsContract = getContract('GovernanceRewards', signer);
        const pendingRewardsWei = await rewardsContract.pendingRewards(address);
        const pendingRewards = parseFloat(ethers.formatEther(pendingRewardsWei));
        
        // Calculate total voting power
        const totalVotingPower = dloopBalance + pendingRewards;
        
        return {
          dloopBalance,
          daiBalance,
          delegatedDloop,
          pendingRewards,
          totalVotingPower
        };
        */

        // Using mock data instead
        return {
          dloopBalance: 156.23,
          daiBalance: 85.45,
          delegatedDloop: 42.5,
          pendingRewards: 12.75,
          totalVotingPower: 156.23 + 12.75, // dloopBalance + pendingRewards
        };
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        throw error;
      }
    },
    enabled: isConnected && !!address,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    portfolio: portfolio || {
      dloopBalance: 0,
      daiBalance: 0,
      delegatedDloop: 0,
      pendingRewards: 0,
      totalVotingPower: 0,
    },
    isLoading,
    error,
    refetch,
  };
};