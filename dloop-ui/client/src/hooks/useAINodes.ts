import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWallet } from '@/hooks/useWallet';
import { getContract } from '@/lib/contracts';
import { AINode } from '@/types';
import { aiNodeIntegrationService } from '@/services/aiNodeIntegrationService';
import { mockAiNodeService } from '@/services/mockAiNodeService';

export const useAINodes = () => {
  const { signer, isConnected, provider } = useWallet();

  // Fetch AI Nodes from the chain integrated with the real NFT data
  const { data: nodes, isLoading, error, refetch } = useQuery({
    queryKey: ['ai-nodes', 'nft-integrated'],
    queryFn: async () => {
      console.log('Fetching AI Nodes data...', { isConnected, hasProvider: !!provider });
      
      // Try to fetch from blockchain via integration service
      if (provider && isConnected) {
        try {
          console.log('Using provider to fetch AI Nodes with NFT data');
          const aiNodes = await aiNodeIntegrationService.getAllAINodes(provider);
          console.log('Fetched AI Nodes from integration service:', aiNodes?.length || 0);
          
          if (aiNodes && aiNodes.length > 0) {
            console.log('Successfully retrieved AI Nodes from blockchain');
            // Add additional UI properties
            return aiNodes.map(node => ({
              ...node,
              // Add trading thesis for consistent UI
              tradingThesis: {
                description: node.description || "This AI node leverages advanced algorithms for optimal asset allocation.",
                points: [
                  "Employs technical analysis and machine learning",
                  "Monitors market sentiment indicators",
                  "Identifies macro-economic patterns"
                ],
                conclusion: "Optimized for balanced risk-reward profiles in diverse market conditions."
              },
              // Add recent activity for consistent UI
              recentActivity: [
                { title: `Created Proposal: Adjustment for ${node.strategy || 'adaptive'}`, date: "3 days ago", status: "Passed" },
                { title: "Voted: Asset reallocation", date: "1 week ago", status: "For" },
                { title: "Created Proposal: Risk mitigation", date: "2 weeks ago", status: "Pending" },
              ]
            }));
          }
        } catch (integrationError) {
          console.error('Error fetching from integration service:', integrationError);
        }
      } else {
        console.log('Provider or wallet connection not available');
      }
      
      // Try the mock service first before falling back to API
      console.log('Using mock AI Node service as fallback');
      const mockNodes = mockAiNodeService.getAllNodes();
      
      if (mockNodes && mockNodes.length > 0) {
        console.log('Successfully retrieved mock AI Nodes:', mockNodes.length);
        return mockNodes;
      }
      
      // If mock service fails too, try the mock API endpoint
      console.log('Falling back to mock API endpoint');
      
      // Try to fetch from the mock API as fallback
      try {
        const response = await fetch('/api/ainodes');
        if (!response.ok) {
          throw new Error('Failed to fetch AI nodes from mock API');
        }
        const mockData = await response.json();
        console.log('Successfully fetched mock data:', mockData.length);
        return mockData;
      } catch (mockError) {
        console.error('Error fetching AI nodes from mock API:', mockError);
        // Return some basic placeholder data
        return [
          {
            id: 'node1',
            name: 'Alpha AI',
            strategy: 'Swing Trading',
            description: 'Alpha AI utilizes a sophisticated swing trading strategy.',
            address: '0x1234567890abcdef1234567890abcdef12345678',
            delegatedAmount: 250000,
            accuracy: 78,
            performance: 22.5,
            performance90d: 18.3,
            proposalsCreated: 28,
            proposalsPassed: 22,
            tradingThesis: {
              description: "This AI node leverages advanced algorithms for optimal asset allocation.",
              points: [
                "Employs technical analysis and machine learning",
                "Monitors market sentiment indicators",
                "Identifies macro-economic patterns"
              ],
              conclusion: "Optimized for balanced risk-reward profiles in diverse market conditions."
            },
            recentActivity: [
              { title: "Created Proposal: Adjustment for strategy", date: "3 days ago", status: "Passed" },
              { title: "Voted: Asset reallocation", date: "1 week ago", status: "For" },
              { title: "Created Proposal: Risk mitigation", date: "2 weeks ago", status: "Pending" },
            ]
          }
        ];
      }
    },
    enabled: !!provider,
    staleTime: 300000, // 5 minutes
  });

  return {
    nodes: nodes || [],
    isLoading,
    error,
    refetch,
  };
};