import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWallet } from '@/components/features/wallet/wallet-provider';
import { getContract } from '@/lib/contracts';
import { AINode } from '@/types';

export const useAINodes = () => {
  const { signer, isConnected } = useWallet();

  // Fetch AI Nodes from the chain
  const { data: nodes, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-nodes'],
    queryFn: async () => {
      try {
        // For demo purposes, we'll use the mock API
        // In a real implementation, we would fetch from the blockchain:
        
        // if (!signer || !isConnected) return [];
        
        // const nodeRegistry = getContract('AINodeRegistry', signer);
        // const count = await nodeRegistry.getNodeCount();
        
        // const nodePromises = [];
        // for (let i = 0; i < count; i++) {
        //   const address = await nodeRegistry.getNodeAddress(i);
        //   const details = await nodeRegistry.getNodeDetails(address);
        //   
        //   nodePromises.push({
        //     id: `node-${i+1}`,
        //     address,
        //     name: details.name,
        //     strategy: details.strategy,
        //     delegatedAmount: parseFloat(ethers.formatEther(details.delegatedAmount)),
        //     accuracy: details.accuracy / 100, // Convert from basis points to percentage
        //     performance: details.performance / 100, // Convert from basis points to percentage
        //     performance90d: (details.performance / 100) * 0.9, // Simulate 90-day performance
        //     proposalsCreated: details.proposalsCreated.toNumber(),
        //     proposalsPassed: details.proposalsPassed.toNumber(),
        //     // These would come from other API calls or IPFS in a real implementation
        //     tradingThesis: {
        //       description: "This AI node focuses on trend-following strategies with a 3-5 day time horizon.",
        //       points: [
        //         "Employs technical analysis on moving averages",
        //         "Uses volume profile analysis",
        //         "Identifies key support/resistance zones"
        //       ],
        //       conclusion: "Best suited for sideways and trending markets with adequate volatility."
        //     },
        //     recentActivity: [
        //       { title: "Created Proposal: Increase WBTC allocation", date: "2 days ago", status: "Passed" },
        //       { title: "Voted: Divest from USDT", date: "1 week ago", status: "Against" },
        //       { title: "Created Proposal: Add LINK to portfolio", date: "2 weeks ago", status: "Passed" }
        //     ]
        //   });
        // }
        // 
        // return Promise.all(nodePromises);

        // Fetch from the mock API for now
        const response = await fetch('/api/nodes');
        if (!response.ok) {
          throw new Error('Failed to fetch AI nodes');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching AI nodes:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    nodes: nodes || [],
    isLoading,
    error,
    refetch,
  };
};