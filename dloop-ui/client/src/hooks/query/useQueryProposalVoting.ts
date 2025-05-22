/**
 * React Query Proposal Voting Hooks
 * 
 * Optimized mutation hooks for proposal voting with React Query while
 * maintaining the unified contract access pattern.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useFeatureFlag } from '@/config/feature-flags';
import { processContractError } from '@/services/errorHandling';
import { Proposal } from '@/types';
import { useVoteOnProposal } from '@/hooks/useVoteOnProposal';
import { useWagmiProposalVoting } from '@/hooks/useWagmiProposalVoting';
import { proposalKeys } from '@/lib/query/config';
import { createTelemetryData, TelemetryData } from '@/components/common/factory';
import toast from 'react-hot-toast';

/**
 * Options for proposal voting
 */
export interface ProposalVotingOptions {
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: 'ethers' | 'wagmi';
  
  /**
   * Callback for implementation-specific telemetry
   */
  onTelemetry?: (data: TelemetryData) => void;
  
  /**
   * Whether to automatically invalidate proposal queries after voting
   */
  autoInvalidateQueries?: boolean;
  
  /**
   * Whether to show toast notifications for voting events
   */
  showNotifications?: boolean;
}

/**
 * Parameters for voting on a proposal
 */
export interface VoteParams {
  /**
   * Proposal to vote on
   */
  proposal: Proposal;
  
  /**
   * Vote value (true = for, false = against)
   */
  vote: boolean;
}

/**
 * Result of a voting operation
 */
export interface VoteResult {
  /**
   * Whether the vote was successful
   */
  success: boolean;
  
  /**
   * Transaction hash if available
   */
  txHash?: string;
  
  /**
   * Error message if any occurred
   */
  error?: string;
}

/**
 * React Query hook for proposal voting with implementation switching
 * 
 * This hook leverages React Query's mutation capabilities for improved
 * performance, state management, and optimistic updates.
 */
export function useQueryProposalVoting(options: ProposalVotingOptions = {}) {
  const queryClient = useQueryClient();
  
  // Determine which implementation to use
  const useWagmiFlag = useFeatureFlag('useWagmiProposalVoting');
  const useWagmiImpl = options.implementation === 'wagmi' || (options.implementation !== 'ethers' && useWagmiFlag);
  
  // Get implementation-specific voting hooks
  const ethersVoting = useVoteOnProposal();
  const wagmiVoting = useWagmiProposalVoting();
  
  // Define the vote function based on implementation
  const voteOnProposal = useCallback(async ({ proposal, vote }: VoteParams): Promise<VoteResult> => {
    const startTime = performance.now();
    const implementationUsed = useWagmiImpl ? 'wagmi' : 'ethers';
    
    // Send telemetry for vote start
    if (options.onTelemetry) {
      options.onTelemetry(createTelemetryData(
        implementationUsed,
        'useQueryProposalVoting',
        'pending',
        {
          action: 'vote',
          metadata: {
            startTime,
            proposalId: proposal.id,
            vote
          }
        }
      ));
    }
    
    try {
      let result: VoteResult;
      
      // Execute the vote with the appropriate implementation
      if (implementationUsed === 'wagmi') {
        result = await wagmiVoting.voteOnProposal(proposal, vote);
      } else {
        result = await ethersVoting(proposal.id, vote);
      }
      
      // Calculate performance and send telemetry
      const duration = performance.now() - startTime;
      if (options.onTelemetry) {
        options.onTelemetry(createTelemetryData(
          implementationUsed,
          'useQueryProposalVoting',
          result.success ? 'success' : 'error',
          {
            action: 'vote',
            duration,
            metadata: {
              proposalId: proposal.id,
              vote,
              txHash: result.txHash,
              error: result.error
            }
          }
        ));
      }
      
      // Show success notification if enabled
      if (options.showNotifications !== false && result.success) {
        toast.success(
          `Successfully voted ${vote ? 'for' : 'against'} proposal ${proposal.id}`,
          { id: `vote-${proposal.id}` }
        );
      }
      
      return result;
    } catch (error) {
      // Process any errors
      const processedError = processContractError(error, {
        component: 'useQueryProposalVoting',
        method: 'voteOnProposal',
        implementation: implementationUsed,
        metadata: { 
          proposalId: proposal.id,
          vote
        }
      }, {
        onTelemetry: options.onTelemetry
      });
      
      // Show error notification if enabled
      if (options.showNotifications !== false) {
        toast.error(
          processedError.userMessage || 'Failed to vote on proposal',
          { id: `vote-error-${proposal.id}` }
        );
      }
      
      // Return error result
      return {
        success: false,
        error: processedError.userMessage || 'Unknown error occurred'
      };
    }
  }, [useWagmiImpl, ethersVoting, wagmiVoting, options]);
  
  // Use React Query mutation for optimized voting
  const mutation = useMutation({
    mutationFn: voteOnProposal,
    onSuccess: (result, variables) => {
      // Show success notification
      if (options.showNotifications !== false && result.success) {
        toast.success(
          `Successfully voted ${variables.vote ? 'for' : 'against'} proposal ${variables.proposal.id}`,
          { id: `vote-${variables.proposal.id}` }
        );
      }
      
      // Invalidate proposal queries to refresh data
      if (options.autoInvalidateQueries !== false && result.success) {
        queryClient.invalidateQueries({
          queryKey: proposalKeys.all(),
        });
      }
    },
    onError: (error, variables) => {
      // Show error notification
      if (options.showNotifications !== false) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to vote on proposal',
          { id: `vote-error-${variables.proposal.id}` }
        );
      }
    }
  });
  
  return {
    voteOnProposal: mutation.mutate,
    voteOnProposalAsync: mutation.mutateAsync,
    isVoting: mutation.isPending,
    error: mutation.error,
    implementation: useWagmiImpl ? 'wagmi' : 'ethers',
    reset: mutation.reset
  };
}

/**
 * React Query hook for proposal execution with implementation switching
 */
export function useQueryProposalExecution(options: ProposalVotingOptions = {}) {
  const queryClient = useQueryClient();
  
  // Determine which implementation to use
  const useWagmiFlag = useFeatureFlag('useWagmiProposalExecution');
  const useWagmiImpl = options.implementation === 'wagmi' || (options.implementation !== 'ethers' && useWagmiFlag);
  
  // Define the execute function based on implementation
  const executeProposal = useCallback(async (proposal: Proposal): Promise<VoteResult> => {
    const startTime = performance.now();
    const implementationUsed = useWagmiImpl ? 'wagmi' : 'ethers';
    
    // Send telemetry for execution start
    if (options.onTelemetry) {
      options.onTelemetry(createTelemetryData(
        implementationUsed,
        'useQueryProposalExecution',
        'pending',
        {
          action: 'execute',
          metadata: {
            startTime,
            proposalId: proposal.id
          }
        }
      ));
    }
    
    try {
      let result: VoteResult;
      
      // Execute the proposal with the appropriate implementation
      if (implementationUsed === 'wagmi') {
        // Replace with actual wagmi implementation
        result = { success: false, error: 'Not implemented yet' };
      } else {
        // Replace with actual ethers implementation
        result = { success: false, error: 'Not implemented yet' };
      }
      
      // Calculate performance and send telemetry
      const duration = performance.now() - startTime;
      if (options.onTelemetry) {
        options.onTelemetry(createTelemetryData(
          implementationUsed,
          'useQueryProposalExecution',
          result.success ? 'success' : 'error',
          {
            action: 'execute',
            duration,
            metadata: {
              proposalId: proposal.id,
              txHash: result.txHash,
              error: result.error
            }
          }
        ));
      }
      
      // Show success notification if enabled
      if (options.showNotifications !== false && result.success) {
        toast.success(
          `Successfully executed proposal ${proposal.id}`,
          { id: `execute-${proposal.id}` }
        );
      }
      
      return result;
    } catch (error) {
      // Process any errors
      const processedError = processContractError(error, {
        component: 'useQueryProposalExecution',
        method: 'executeProposal',
        implementation: implementationUsed,
        metadata: { proposalId: proposal.id }
      }, {
        onTelemetry: options.onTelemetry
      });
      
      // Show error notification if enabled
      if (options.showNotifications !== false) {
        toast.error(
          processedError.userMessage || 'Failed to execute proposal',
          { id: `execute-error-${proposal.id}` }
        );
      }
      
      // Return error result
      return {
        success: false,
        error: processedError.userMessage || 'Unknown error occurred'
      };
    }
  }, [useWagmiImpl, options]);
  
  // Use React Query mutation for optimized execution
  const mutation = useMutation({
    mutationFn: executeProposal,
    onSuccess: (result, variables) => {
      // Show success notification
      if (options.showNotifications !== false && result.success) {
        toast.success(
          `Successfully executed proposal ${variables.id}`,
          { id: `execute-${variables.id}` }
        );
      }
      
      // Invalidate proposal queries to refresh data
      if (options.autoInvalidateQueries !== false && result.success) {
        queryClient.invalidateQueries({
          queryKey: proposalKeys.all(),
        });
      }
    },
    onError: (error, variables) => {
      // Show error notification
      if (options.showNotifications !== false) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to execute proposal',
          { id: `execute-error-${variables.id}` }
        );
      }
    }
  });
  
  return {
    executeProposal: mutation.mutate,
    executeProposalAsync: mutation.mutateAsync,
    isExecuting: mutation.isPending,
    error: mutation.error,
    implementation: useWagmiImpl ? 'wagmi' : 'ethers',
    reset: mutation.reset
  };
}
