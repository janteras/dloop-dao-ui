import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWallet } from '@/hooks/useWallet';
import { getContract } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';
import { Proposal, CreateProposalParams } from '@/types';
import { timeRemaining } from '@/lib/utils';

export const useProposals = () => {
  const { signer, isConnected } = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch Protocol metrics
  const { data: protocolMetrics } = useQuery({
    queryKey: ['protocol-metrics'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/protocol/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch protocol metrics');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching protocol metrics:', error);
        return null;
      }
    },
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Fetch Protocol DAO proposals
  const { data: protocolProposals, isLoading: protocolLoading, error: protocolError } = useQuery({
    queryKey: ['protocol-dao-proposals'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/protocol/proposals');
        if (!response.ok) {
          throw new Error('Failed to fetch protocol proposals');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching protocol proposals:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch Asset DAO proposals from the chain
  const { data: proposals, refetch, isLoading, error } = useQuery({
    queryKey: ['asset-dao-proposals'],
    queryFn: async () => {
      try {
        // First try to fetch from the blockchain if connected
        if (signer) {
          try {
            const assetDAO = getContract('AssetDAO', signer);
            const count = await assetDAO.getProposalCount();
            
            // If there are no proposals yet, return empty array
            if (count <= 0) return [];
            
            const proposalPromises = [];
            for (let i = 1; i <= count; i++) {
              proposalPromises.push(assetDAO.proposals(i));
            }
            
            const proposalsRaw = await Promise.all(proposalPromises);
            return proposalsRaw.map((p, index) => {
              const status = getProposalStatus(p);
              const type = p.proposalType === 0 ? 'invest' : 'divest';
              const endsIn = timeRemaining(p.votingEnds.toNumber() * 1000);
              
              return {
                id: index + 1,
                title: p.description.split('\n')[0] || `Proposal #${index + 1}`,
                description: p.description,
                proposer: p.proposer,
                createdAt: p.createdAt.toNumber() * 1000,
                endTime: p.votingEnds.toNumber() * 1000,
                forVotes: parseFloat(ethers.formatEther(p.forVotes)),
                againstVotes: parseFloat(ethers.formatEther(p.againstVotes)),
                executed: p.executed,
                canceled: p.canceled,
                status,
                type,
                amount: parseFloat(ethers.formatEther(p.amount)),
                token: p.asset,
                endsIn,
              };
            });
          } catch (blockchainError) {
            console.error('Error fetching from blockchain:', blockchainError);
            // If blockchain fetch fails, fall back to API
          }
        }

        // Fall back to API when not connected to blockchain or on error
        const response = await fetch('/api/proposals');
        if (!response.ok) {
          throw new Error('Failed to fetch proposals');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching proposals:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
  });

  // Define supported tokens with their Sepolia testnet addresses
  const supportedTokens = [
    { symbol: "DLOOP", address: "0x05B366778566e93abfB8e4A9B794e4ad006446b4" },
    { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" }, // Sepolia USDC
    { symbol: "WBTC", address: "0xCA063A2AB07491eE991dCecb456D1265f842b568" }  // Sepolia WBTC
  ];

  // Create a new proposal
  const createProposal = async (params: CreateProposalParams) => {
    if (!signer || !isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Creating proposal with parameters:', params);
      
      // This function is mainly used as a backend service call now
      // The actual blockchain transaction happens in create-proposal-modal.tsx
      // This ensures the UI database stays in sync with blockchain proposals
      
      // Make a backend API call to store the proposal in our database
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create proposal in database');
      }
      
      toast({
        title: 'Proposal Recorded',
        description: 'Your proposal has been recorded in our database.',
      });
      
      // Refetch proposals to update the UI
      refetch();
      
      return true;
    } catch (error: any) {
      console.error('Error creating proposal in database:', error);
      toast({
        title: 'Proposal Recording Failed',
        description: error.message || 'There was an error recording your proposal. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vote on a proposal
  const voteOnProposal = useMutation({
    mutationFn: async ({ proposalId, support }: { proposalId: number, support: boolean }) => {
      if (!signer || !isConnected) {
        throw new Error('Please connect your wallet first.');
      }
      
      const assetDAO = getContract('AssetDAO', signer);
      const tx = await assetDAO.castVote(proposalId, support);
      await tx.wait();
      
      return { proposalId, success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Vote Cast',
        description: 'Your vote has been cast successfully.',
      });
      refetch();
      return true;
    },
    onError: (error: Error) => {
      toast({
        title: 'Vote Failed',
        description: error.message || 'There was an error casting your vote. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Execute a proposal
  const executeProposal = useMutation({
    mutationFn: async (proposalId: number) => {
      if (!signer || !isConnected) {
        throw new Error('Please connect your wallet first.');
      }
      
      const assetDAO = getContract('AssetDAO', signer);
      const tx = await assetDAO.executeProposal(proposalId);
      await tx.wait();
      
      return { proposalId, success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Proposal Executed',
        description: 'The proposal has been executed successfully.',
      });
      refetch();
      return true;
    },
    onError: (error: Error) => {
      toast({
        title: 'Execution Failed',
        description: error.message || 'There was an error executing the proposal. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Cancel a proposal
  const cancelProposal = useMutation({
    mutationFn: async (proposalId: number) => {
      if (!signer || !isConnected) {
        throw new Error('Please connect your wallet first.');
      }
      
      const assetDAO = getContract('AssetDAO', signer);
      const tx = await assetDAO.cancelProposal(proposalId);
      await tx.wait();
      
      return { proposalId, success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Proposal Canceled',
        description: 'The proposal has been canceled successfully.',
      });
      refetch();
      return true;
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'There was an error canceling the proposal. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const getProposalStatus = useCallback((proposal: any): Proposal['status'] => {
    if (proposal.executed) return 'executed';
    if (proposal.canceled) return 'failed';
    
    const now = Date.now();
    const endTime = proposal.votingEnds.toNumber() * 1000;
    
    if (now < endTime) return 'active';
    
    const forVotes = parseFloat(ethers.formatEther(proposal.forVotes));
    const againstVotes = parseFloat(ethers.formatEther(proposal.againstVotes));
    
    return forVotes > againstVotes ? 'passed' : 'failed';
  }, []);

  // Protocol DAO proposal voting (mock implementation, would use contract in production)
  const voteOnProtocolProposal = async (proposalId: number, support: boolean) => {
    if (!signer || !isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return { success: false };
    }
    
    try {
      // In a real implementation, would call contract method
      // const protocolDAO = getContract('ProtocolDAO', signer);
      // const tx = await protocolDAO.castVote(proposalId, support);
      // await tx.wait();
      
      // Mock successful vote
      toast({
        title: 'Vote Cast',
        description: 'Your vote has been cast successfully on protocol proposal.',
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error voting on protocol proposal:', error);
      toast({
        title: 'Vote Failed',
        description: error.message || 'There was an error casting your vote. Please try again.',
        variant: 'destructive',
      });
      return { success: false };
    }
  };
  
  // Protocol DAO proposal execution (mock implementation, would use contract in production)
  const executeProtocolProposal = async (proposalId: number) => {
    if (!signer || !isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return { success: false };
    }
    
    try {
      // In a real implementation, would call contract method
      // const protocolDAO = getContract('ProtocolDAO', signer);
      // const tx = await protocolDAO.executeProposal(proposalId);
      // await tx.wait();
      
      // Mock successful execution
      toast({
        title: 'Proposal Executed',
        description: 'The protocol proposal has been executed successfully.',
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error executing protocol proposal:', error);
      toast({
        title: 'Execution Failed',
        description: error.message || 'There was an error executing the proposal. Please try again.',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  return {
    // Asset DAO
    proposals: proposals || [],
    createProposal,
    isSubmitting,
    voteOnProposal: voteOnProposal.mutateAsync,
    executeProposal: executeProposal.mutateAsync,
    cancelProposal: cancelProposal.mutateAsync,
    isVoting: voteOnProposal.isPending,
    isExecuting: executeProposal.isPending,
    isCanceling: cancelProposal.isPending,
    refetchProposals: refetch,
    
    // Protocol DAO
    protocolProposals: protocolProposals || [],
    protocolMetrics,
    isLoading: isLoading || protocolLoading,
    error: error || protocolError,
    voteOnProtocolProposal,
    executeProtocolProposal,
  };
};