import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWallet } from '@/components/features/wallet/wallet-provider';
import { getContract } from '@/lib/contracts';
import { Participant, Delegation } from '@/types';

export const useLeaderboard = () => {
  const { signer, address, isConnected } = useWallet();

  // Fetch leaderboard data from the chain
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      try {
        // For demo purposes, we'll use the mock API
        // In a real implementation, we would fetch from the blockchain:
        
        // if (!signer || !isConnected) return { participants: [], delegations: [] };
        
        // const protocolDAO = getContract('ProtocolDAO', signer);
        // const nodeRegistryAddress = await protocolDAO.nodeRegistry();
        
        // const nodeRegistry = new ethers.Contract(
        //   nodeRegistryAddress,
        //   // We would need the ABI here
        //   [],
        //   signer
        // );
        
        // // This would require custom on-chain methods or event filtering to get participants
        // const participantsData = await fetchParticipantsFromEvents(protocolDAO);
        
        // // Process the data to match our expected format
        // const participants = participantsData.map(p => ({
        //   address: p.address,
        //   name: p.name || undefined,
        //   type: p.isAINode ? 'AI Node' : 'Human',
        //   votingPower: parseFloat(ethers.formatEther(p.votingPower)),
        //   accuracy: p.accuracy / 100, // Convert from basis points
        //   isCurrentUser: p.address.toLowerCase() === address.toLowerCase()
        // }));
        
        // // This would require custom on-chain methods or event filtering to get delegations
        // const delegationsData = await fetchDelegationsFromEvents(protocolDAO);
        
        // // Process the data to match our expected format
        // const delegations = delegationsData.map(d => ({
        //   id: `${d.from}-${d.to}-${d.blockNumber}`,
        //   from: d.from,
        //   to: d.to,
        //   toName: participants.find(p => p.address.toLowerCase() === d.to.toLowerCase())?.name,
        //   toType: participants.find(p => p.address.toLowerCase() === d.to.toLowerCase())?.type || 'Human',
        //   amount: parseFloat(ethers.formatEther(d.amount)),
        //   date: d.timestamp * 1000
        // }));
        
        // return {
        //   participants: participants.sort((a, b) => b.votingPower - a.votingPower),
        //   delegations
        // };

        // Fetch from the mock API for now
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const data = await response.json();
        
        // Mark the current user in the participants list
        if (address) {
          const participants = data.participants.map((p: Participant) => ({
            ...p,
            isCurrentUser: p.address.toLowerCase() === address.toLowerCase()
          }));
          return { ...data, participants };
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        return { participants: [], delegations: [] };
      }
    },
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    participants: data?.participants || [],
    delegations: data?.delegations || [],
    isLoading,
    error,
    refetch,
  };
};