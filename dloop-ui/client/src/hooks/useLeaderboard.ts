import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { getContract } from '@/lib/contracts';
import { Participant, Delegation } from '@/types';
import { useState } from 'react';
import { getAPIPath, fetchAPI } from '@/lib/api-utils'; // Import the new API utility functions

export const useLeaderboard = () => {
  const { signer, address, isConnected } = useWallet();
  const [isDelegating, setIsDelegating] = useState(false);

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
        // Fetch from the API using the new utility functions
        const data = await fetchAPI<any>('/api/leaderboard');
        console.log('Leaderboard data received:', data);
        
        // Validate data structure - ensure it has participants and delegations
        if (!data) {
          console.log('No leaderboard data received, returning empty arrays');
          return { participants: [], delegations: [] };
        }
        
        // Ensuring proper structure in case the API returns unexpected format
        // Look for array at the top level or inside a participants field
        let safeParticipants = [];
        let safeDelegations = [];
        
        // Handle the case where data is an object with participants/delegations properties
        if (data.participants) {
          safeParticipants = Array.isArray(data.participants) ? data.participants : [];
          safeDelegations = Array.isArray(data.delegations) ? data.delegations : [];
          console.log(`Found structured data: ${safeParticipants.length} participants, ${safeDelegations.length} delegations`);
        }
        // Handle the case where data is an array itself
        else if (Array.isArray(data)) {
          safeParticipants = data;
          console.log(`Found array data: ${safeParticipants.length} items`);
        }
        
        // Mark the current user in the participants list if there are participants
        if (address && safeParticipants.length > 0) {
          safeParticipants = safeParticipants.map((p: Participant) => ({
            ...p,
            isCurrentUser: p.address?.toLowerCase() === address.toLowerCase()
          }));
        }
        
        // Add development mode detection
        const isDevelopmentMode = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
        
        // If we're in development mode and no participants, create mock data
        if (isDevelopmentMode && (!safeParticipants || safeParticipants.length === 0)) {
          console.log('Development mode - Creating mock leaderboard data');
          const mockParticipants = [
            {
              address: address || '0x1234567890123456789012345678901234567890',
              name: 'You',
              votingPower: 125000,
              rank: 1,
              isCurrentUser: true,
              delegators: 3,
              type: 'Human',
              performance: 12.5,
              accuracy: 92,
              proposalsCreated: 8,
              proposalsVoted: 15
            },
            {
              address: '0x2345678901234567890123456789012345678901',
              name: 'AI Node #1',
              votingPower: 75000,
              rank: 2,
              isCurrentUser: false,
              delegators: 5,
              type: 'AI Node',
              performance: 18.2,
              accuracy: 88,
              proposalsCreated: 15,
              proposalsVoted: 28
            },
            {
              address: '0x3456789012345678901234567890123456789012',
              name: 'Community Member',
              votingPower: 50000,
              rank: 3,
              isCurrentUser: false,
              delegators: 2,
              type: 'Human',
              performance: 9.7,
              accuracy: 85,
              proposalsCreated: 5,
              proposalsVoted: 12
            }
          ];
          
          return { 
            participants: mockParticipants, 
            delegations: safeDelegations 
          };
        }
        
        // Return the data with safe defaults using our local variables
        return {
          participants: safeParticipants,
          delegations: safeDelegations
        };
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        return { participants: [], delegations: [] };
      }
    },
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
  });

  // Function to delegate tokens
  const delegateTokens = async (to: string, amount: number) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setIsDelegating(true);
      
      // In a real implementation, we would use the contract:
      // const tokenContract = getContract('DLOOP', signer);
      // await tokenContract.delegate(to, ethers.parseEther(amount.toString()));
      
      // For demo purposes, we'll simulate a successful delegation
      console.log(`Delegating ${amount} DLOOP to ${to}`);
      
      // Wait for 2 seconds to simulate blockchain transaction time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh the data
      await refetch();
      
      return true;
    } catch (error) {
      console.error('Error delegating tokens:', error);
      throw error;
    } finally {
      setIsDelegating(false);
    }
  };
  
  // Function to undelegate tokens
  const undelegateTokens = async (from: string, amount: number) => {
    if (!isConnected || !signer) {
      throw new Error('Wallet not connected');
    }
    
    try {
      setIsDelegating(true);
      
      // In a real implementation, we would use the contract:
      // const tokenContract = getContract('DLOOP', signer);
      // await tokenContract.undelegate(from, ethers.parseEther(amount.toString()));
      
      // For demo purposes, we'll simulate a successful undelegation
      console.log(`Undelegating ${amount} DLOOP from ${from}`);
      
      // Wait for 2 seconds to simulate blockchain transaction time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh the data
      await refetch();
      
      return true;
    } catch (error) {
      console.error('Error undelegating tokens:', error);
      throw error;
    } finally {
      setIsDelegating(false);
    }
  };
  
  return {
    participants: data?.participants || [],
    delegations: data?.delegations || [],
    isLoading,
    error,
    refetch,
    delegateTokens,
    undelegateTokens,
    isDelegating,
  };
};