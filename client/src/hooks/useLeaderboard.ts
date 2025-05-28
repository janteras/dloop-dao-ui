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
  // Mock data for development use or when the API is unavailable
  const mockLeaderboardData = {
    participants: [
      {
        address: address || '0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1',
        name: address ? 'You' : 'AI.Gov#01',
        type: 'Human',
        votingPower: 425000,
        accuracy: 92,
        isCurrentUser: !!address,
        rank: 1,
        delegators: 15,
        performance: 18.4,
        proposalsCreated: 22,
        proposalsVoted: 38
      },
      {
        address: '0x9E23fA851681545894f3B3c33BD1E7D22239BDE8',
        name: 'DeFiWhale',
        type: 'Human',
        votingPower: 375000,
        accuracy: 88,
        isCurrentUser: false,
        rank: 2,
        delegators: 8,
        performance: 14.2,
        proposalsCreated: 11,
        proposalsVoted: 35
      },
      {
        address: '0x3A4B670Be17F3a36F8F55BF7C3c7453495A04Ed1',
        name: 'AI.Gov#02',
        type: 'AI Node',
        votingPower: 310000,
        accuracy: 95,
        isCurrentUser: false,
        rank: 3,
        delegators: 12,
        performance: 22.7,
        proposalsCreated: 14,
        proposalsVoted: 48
      },
      {
        address: '0x4B670B1a36F8F55BF7C3c7453495A04EdF3A4576',
        name: 'CryptoSage',
        type: 'Human',
        votingPower: 285000,
        accuracy: 87,
        isCurrentUser: false,
        rank: 4,
        delegators: 7,
        performance: 12.8,
        proposalsCreated: 9,
        proposalsVoted: 27
      },
      {
        address: '0x5C781D367fE20523Be90986CDC75F88B8a0B4546',
        name: 'AI.Gov#03',
        type: 'AI Node',
        votingPower: 260000,
        accuracy: 93,
        isCurrentUser: false,
        rank: 5,
        delegators: 9,
        performance: 19.6,
        proposalsCreated: 12,
        proposalsVoted: 42
      }
    ],
    delegations: [
      {
        nodeId: 'node-1',
        address: '0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1',
        amount: 12500,
        since: '2025-03-15T12:00:00Z'
      },
      {
        nodeId: 'node-3',
        address: '0x9E23fA851681545894f3B3c33BD1E7D22239BDE8',
        amount: 7500,
        since: '2025-04-02T15:30:00Z'
      },
      {
        nodeId: 'node-2',
        address: '0x3A4B670Be17F3a36F8F55BF7C3c7453495A04Ed1',
        amount: 5000,
        since: '2025-02-28T09:15:00Z'
      }
    ]
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      try {
        // Try to fetch from the API using the improved utility functions with fallback
        const data = await fetchAPI<any>(
          '/api/leaderboard', 
          undefined,  // No special options needed
          mockLeaderboardData  // Provide mock data as fallback
        );
        
        console.log('Leaderboard data received:', data);
        
        // Validate data structure - ensure it has participants and delegations
        if (!data) {
          console.log('No leaderboard data received, using mock data');
          return mockLeaderboardData;
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
        
        // Ensure we have participants data, otherwise use mock data
        if (!safeParticipants || safeParticipants.length === 0) {
          console.log('No participants found in API response - Using mock leaderboard data');
          return mockLeaderboardData;
        }
        
        // Return the data with safe defaults using our local variables
        return {
          participants: safeParticipants,
          delegations: safeDelegations
        };
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        // Return mock data instead of empty arrays for better UX
        console.log('Using mock data as fallback after error');
        return mockLeaderboardData;
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