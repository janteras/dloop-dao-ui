/**
 * Wagmi Proposal Hooks
 * 
 * This file contains hooks for interacting with proposals using wagmi.
 * These hooks provide a similar interface to our existing proposals code
 * while leveraging wagmi's optimized React hooks under the hood.
 */

import { useCallback } from 'react';
import { useProposals, useVoteOnProposal, useExecuteProposal } from '@/hooks/useAssetDaoContract';
import { useWagmiWallet } from './useWagmiWallet';
import { Proposal, ProposalStatus } from '@/types';
import toast from 'react-hot-toast';

/**
 * Hook for listing proposals with wagmi
 */
export function useWagmiProposalList() {
  const { proposals, isLoading, error, totalCount, refetch } = useProposals({ limit: 10 });
  
  // Convert proposals to our app's format
  const formattedProposals: Proposal[] = proposals.map(proposal => ({
    id: proposal.id,
    title: `Proposal #${proposal.id}`,
    description: proposal.description,
    proposer: proposal.proposer,
    type: proposal.proposalType === 0 ? 'invest' : 'divest',
    token: proposal.tokenSymbol || 'ETH',
    amount: Number(proposal.amount),
    status: mapProposalState(proposal.state),
    forVotes: proposal.forVotes,
    againstVotes: proposal.againstVotes,
    endsIn: proposal.votingEnds ? getTimeRemaining(proposal.votingEnds) : '',
    endTimeISO: proposal.votingEnds?.toISOString(),
  }));
  
  return {
    proposals: formattedProposals,
    isLoading,
    error: error ? String(error) : null,
    totalCount,
    refetch,
  };
}

/**
 * Hook for voting on proposals with wagmi
 */
export function useWagmiProposalVoting() {
  const { castVote, isPending, isConfirming, error } = useVoteOnProposal();
  const { isConnected } = useWagmiWallet();
  
  const voteOnProposal = useCallback(async (proposalId: number, support: boolean) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      throw new Error('Wallet not connected');
    }
    
    try {
      await castVote(proposalId, support);
      toast.success(`Successfully voted ${support ? 'for' : 'against'} proposal ${proposalId}`);
      return true;
    } catch (error) {
      console.error('Error voting on proposal:', error);
      toast.error(
        error instanceof Error 
          ? `Failed to vote: ${error.message}` 
          : 'Failed to vote on proposal'
      );
      throw error;
    }
  }, [isConnected, castVote]);
  
  return {
    voteOnProposal,
    isVoting: isPending || isConfirming,
    error: error ? String(error) : null,
  };
}

/**
 * Hook for executing proposals with wagmi
 */
export function useWagmiProposalExecution() {
  const { executeProposal, isPending, isConfirming, error } = useExecuteProposal();
  const { isConnected } = useWagmiWallet();
  
  const execute = useCallback(async (proposalId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      throw new Error('Wallet not connected');
    }
    
    try {
      await executeProposal(proposalId);
      toast.success(`Successfully executed proposal ${proposalId}`);
      return true;
    } catch (error) {
      console.error('Error executing proposal:', error);
      toast.error(
        error instanceof Error 
          ? `Failed to execute: ${error.message}` 
          : 'Failed to execute proposal'
      );
      throw error;
    }
  }, [isConnected, executeProposal]);
  
  return {
    executeProposal: execute,
    isExecuting: isPending || isConfirming,
    error: error ? String(error) : null,
  };
}

/**
 * Helper function to map blockchain proposal state to UI status
 */
function mapProposalState(state: number): ProposalStatus {
  switch (state) {
    case 1: // Active
      return 'active';
    case 3: // Succeeded
      return 'passed';
    case 2: // Defeated
    case 6: // Expired
    case 7: // Canceled
      return 'failed';
    case 5: // Executed
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
