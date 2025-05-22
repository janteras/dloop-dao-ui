/**
 * Enhanced Unified Proposal Voting Hook
 * 
 * This hook provides a consistent interface for voting on proposals
 * with enhanced telemetry, error handling, and implementation switching.
 * It follows the unified contract access pattern established for the migration.
 */

import { useCallback, useState } from 'react';
import { useFeatureFlag } from '@/config/feature-flags';
import { useProposalVoting } from '@/hooks/useUnifiedProposals';
import { useWagmiProposalVoting } from '@/hooks/useWagmiProposals';
import { processContractError } from '@/services/errorHandling';
import { createTelemetryData, TelemetryData } from '@/components/common/factory';
import toast from 'react-hot-toast';

export interface VoteParams {
  proposalId: number;
  support: boolean;
}

export interface VoteResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export enum VoteStatus {
  IDLE = 'idle',
  VOTING = 'voting',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface UnifiedProposalVotingOptions {
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: 'ethers' | 'wagmi';
  
  /**
   * Callback for implementation-specific telemetry
   */
  onTelemetry?: (data: TelemetryData) => void;
  
  /**
   * Contract address for the proposal contract
   */
  contractAddress?: string;
  
  /**
   * Whether to show toast notifications for voting actions
   */
  showToasts?: boolean;
}

export interface UnifiedVotingResult {
  /**
   * Function to vote on a proposal
   */
  voteOnProposal: (params: VoteParams) => Promise<VoteResult>;
  
  /**
   * Current voting status
   */
  status: VoteStatus;
  
  /**
   * Last vote result
   */
  lastVoteResult: VoteResult | null;
  
  /**
   * Error message if any
   */
  error: string | null;
  
  /**
   * Implementation details for telemetry and debugging
   */
  implementation: 'ethers' | 'wagmi';
}

/**
 * Enhanced unified hook for voting on proposals with telemetry
 */
export function useUnifiedProposalVoting(options: UnifiedProposalVotingOptions = {}): UnifiedVotingResult {
  // Determine which implementation to use based on feature flags or explicit choice
  const useWagmiFlag = useFeatureFlag('useWagmiVoting');
  const useWagmiImpl = options.implementation === 'wagmi' || (options.implementation !== 'ethers' && useWagmiFlag);
  
  // State for tracking voting status
  const [status, setStatus] = useState<VoteStatus>(VoteStatus.IDLE);
  const [lastVoteResult, setLastVoteResult] = useState<VoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get the appropriate implementation
  const ethersVoting = useProposalVoting(options.contractAddress);
  const wagmiVoting = useWagmiProposalVoting();
  
  // Enhanced vote function with telemetry
  const voteOnProposal = useCallback(async ({ proposalId, support }: VoteParams): Promise<VoteResult> => {
    setStatus(VoteStatus.VOTING);
    setError(null);
    
    const startTime = performance.now();
    
    // Send telemetry for vote start
    if (options.onTelemetry) {
      options.onTelemetry(createTelemetryData(
        useWagmiImpl ? 'wagmi' : 'ethers',
        'useUnifiedProposalVoting',
        'pending',
        {
          action: 'vote',
          metadata: {
            proposalId,
            support,
            startTime,
            contractAddress: options.contractAddress
          }
        }
      ));
    }
    
    try {
      // Call the implementation-specific vote function
      let result: VoteResult;
      
      if (useWagmiImpl) {
        result = await wagmiVoting.voteOnProposal(proposalId, support);
      } else {
        // Handle both function signature formats (backward compatibility)
        if (typeof ethersVoting.castVote === 'function') {
          result = await ethersVoting.castVote({ proposalId, support });
        } else {
          // @ts-ignore - Fall back to old format
          result = await ethersVoting.castVote(proposalId, support);
        }
      }
      
      // Calculate performance metrics
      const duration = performance.now() - startTime;
      
      // Show success toast if enabled
      if (options.showToasts !== false) {
        toast.success(`Successfully voted ${support ? 'for' : 'against'} proposal ${proposalId}`);
      }
      
      // Send telemetry for successful vote
      if (options.onTelemetry) {
        options.onTelemetry(createTelemetryData(
          useWagmiImpl ? 'wagmi' : 'ethers',
          'useUnifiedProposalVoting',
          'success',
          {
            action: 'vote',
            duration,
            metadata: {
              proposalId,
              support,
              txHash: result.txHash,
              contractAddress: options.contractAddress
            }
          }
        ));
      }
      
      // Update state
      setStatus(VoteStatus.SUCCESS);
      setLastVoteResult(result);
      
      return result;
    } catch (err) {
      // Process error through centralized error handler
      const contractError = processContractError(err, {
        component: 'useUnifiedProposalVoting',
        method: 'voteOnProposal',
        implementation: useWagmiImpl ? 'wagmi' : 'ethers',
        args: [{ proposalId, support }],
        metadata: { contractAddress: options.contractAddress }
      }, {
        showToast: options.showToasts !== false,
        onTelemetry: options.onTelemetry
      });
      
      // Update state
      const errorMessage = contractError.details || contractError.message;
      setStatus(VoteStatus.ERROR);
      setError(errorMessage);
      
      const errorResult: VoteResult = {
        success: false,
        error: errorMessage
      };
      
      setLastVoteResult(errorResult);
      return errorResult;
    }
  }, [
    useWagmiImpl, 
    ethersVoting, 
    wagmiVoting, 
    options.contractAddress, 
    options.onTelemetry,
    options.showToasts
  ]);
  
  return {
    voteOnProposal,
    status,
    lastVoteResult,
    error,
    implementation: useWagmiImpl ? 'wagmi' : 'ethers'
  };
}
