
/**
 * Wagmi Proposal Hooks
 * 
 * This file contains hooks for interacting with proposals using wagmi.
 * These hooks provide a similar interface to our existing proposals code
 * while leveraging wagmi's optimized React hooks under the hood.
 */
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { ASSET_DAO_ADDRESS, ASSET_DAO_ABI } from '@/config/contracts';
import { Proposal as ProposalType, ProposalStatus } from '@/types';
import toast from 'react-hot-toast';

interface ContractProposal {
  id: bigint;
  proposalType: number;
  assetAddress: string;
  amount: bigint;
  description: string;
  proposer: string;
  createdAt: bigint;
  votingEnds: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  status: number;
  executed: boolean;
}

export const useWagmiProposals = () => {
  const { address } = useAccount();

  // Get proposal count from contract
  const { data: proposalCount, isLoading: isLoadingCount } = useReadContract({
    address: ASSET_DAO_ADDRESS as `0x${string}`,
    abi: ASSET_DAO_ABI,
    functionName: 'getProposalCount',
  });

  // Fetch all proposals from contract
  const { data: proposals, isLoading: isLoadingProposals, error } = useQuery({
    queryKey: ['wagmi-proposals', proposalCount],
    queryFn: async () => {
      if (!proposalCount || proposalCount === 0n) return [];

      const proposalPromises = [];
      for (let i = 1; i <= Number(proposalCount); i++) {
        proposalPromises.push(
          fetch(`/api/proposals/${i}`)
            .then(res => res.json())
            .catch(err => {
              console.error(`Failed to fetch proposal ${i}:`, err);
              return null;
            })
        );
      }

      const results = await Promise.all(proposalPromises);
      return results.filter(Boolean) as ContractProposal[];
    },
    enabled: !!proposalCount && proposalCount > 0n,
    staleTime: 30000, // 30 seconds
  });

  return {
    proposals: proposals || [],
    isLoading: isLoadingCount || isLoadingProposals,
    error,
    proposalCount: proposalCount ? Number(proposalCount) : 0,
  };
};

/**
 * Hook for listing proposals with wagmi
 */
export function useWagmiProposalList() {
  const { address } = useAccount();
  
  // Get proposal count
  const { data: proposalCount } = useReadContract({
    address: ASSET_DAO_ADDRESS as `0x${string}`,
    abi: ASSET_DAO_ABI,
    functionName: 'getProposalCount',
  });

  // Fetch proposals with proper contract integration
  const { data: proposals, isLoading, error, refetch } = useQuery({
    queryKey: ['proposal-list', proposalCount],
    queryFn: async () => {
      if (!proposalCount || proposalCount === 0n) return [];
      
      const proposalData = [];
      for (let i = 1; i <= Number(proposalCount); i++) {
        try {
          const response = await fetch(`/api/proposals/${i}`);
          if (response.ok) {
            const proposal = await response.json();
            proposalData.push(proposal);
          }
        } catch (error) {
          console.error(`Error fetching proposal ${i}:`, error);
        }
      }
      return proposalData;
    },
    enabled: !!proposalCount && proposalCount > 0n,
  });
  
  // Convert proposals to our app's format
  const formattedProposals: ProposalType[] = (proposals || []).map(proposal => ({
    id: proposal.id,
    title: `Proposal #${proposal.id}`,
    description: proposal.description,
    proposer: proposal.proposer,
    type: proposal.proposalType === 0 ? 'invest' : 'divest',
    token: 'ETH', // Default token, should be determined from contract
    amount: Number(formatEther(proposal.amount)),
    status: mapProposalState(proposal.status),
    forVotes: Number(formatEther(proposal.yesVotes)),
    againstVotes: Number(formatEther(proposal.noVotes)),
    endsIn: getTimeRemaining(new Date(Number(proposal.votingEnds) * 1000)),
    endTimeISO: new Date(Number(proposal.votingEnds) * 1000).toISOString(),
  }));
  
  return {
    proposals: formattedProposals,
    isLoading,
    error: error ? String(error) : null,
    totalCount: proposalCount ? Number(proposalCount) : 0,
    refetch,
  };
}

/**
 * Hook for voting on proposals with wagmi
 */
export function useWagmiProposalVoting() {
  const { address } = useAccount();
  const { writeContract, isPending, error } = useWriteContract();
  
  const voteOnProposal = useCallback(async (proposalId: number, support: boolean) => {
    if (!address) {
      toast.error('Please connect your wallet');
      throw new Error('Wallet not connected');
    }
    
    try {
      const hash = await writeContract({
        address: ASSET_DAO_ADDRESS as `0x${string}`,
        abi: ASSET_DAO_ABI,
        functionName: 'vote',
        args: [BigInt(proposalId), support],
      });
      
      toast.success(`Successfully voted ${support ? 'for' : 'against'} proposal ${proposalId}`);
      return hash;
    } catch (error) {
      console.error('Error voting on proposal:', error);
      toast.error(
        error instanceof Error 
          ? `Failed to vote: ${error.message}` 
          : 'Failed to vote on proposal'
      );
      throw error;
    }
  }, [address, writeContract]);
  
  return {
    voteOnProposal,
    isVoting: isPending,
    error: error ? String(error) : null,
  };
}

/**
 * Hook for executing proposals with wagmi
 */
export function useWagmiProposalExecution() {
  const { address } = useAccount();
  const { writeContract, isPending, error } = useWriteContract();
  
  const execute = useCallback(async (proposalId: number) => {
    if (!address) {
      toast.error('Please connect your wallet');
      throw new Error('Wallet not connected');
    }
    
    try {
      const hash = await writeContract({
        address: ASSET_DAO_ADDRESS as `0x${string}`,
        abi: ASSET_DAO_ABI,
        functionName: 'executeProposal',
        args: [BigInt(proposalId)],
      });
      
      toast.success(`Successfully executed proposal ${proposalId}`);
      return hash;
    } catch (error) {
      console.error('Error executing proposal:', error);
      toast.error(
        error instanceof Error 
          ? `Failed to execute: ${error.message}` 
          : 'Failed to execute proposal'
      );
      throw error;
    }
  }, [address, writeContract]);
  
  return {
    executeProposal: execute,
    isExecuting: isPending,
    error: error ? String(error) : null,
  };
}

/**
 * Helper function to map blockchain proposal state to UI status
 */
function mapProposalState(state: number): ProposalStatus {
  switch (state) {
    case 0: // Pending
      return 'active';
    case 1: // Active
      return 'active';
    case 2: // Canceled
      return 'failed';
    case 3: // Defeated
      return 'failed';
    case 4: // Succeeded
      return 'passed';
    case 5: // Queued
      return 'passed';
    case 6: // Expired
      return 'failed';
    case 7: // Executed
      return 'executed';
    default:
      return 'active';
  }
}

/**
 * Helper function to format time remaining in a human-readable format
 */
function getTimeRemaining(endTime: Date): string {
  const now = new Date();
  const remaining = endTime.getTime() - now.getTime();
  
  if (remaining <= 0) {
    return 'Ended';
  }
  
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else {
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }
}

export default useWagmiProposals;
