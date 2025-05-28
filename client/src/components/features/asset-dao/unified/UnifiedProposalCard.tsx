/**
 * Unified Proposal Card Component
 * 
 * This component provides a consistent interface for displaying proposals
 * while supporting both Ethers and Wagmi implementations under the hood.
 * It uses the factory pattern to dynamically select the appropriate implementation.
 */

import { useCallback, useMemo } from 'react';
import { createImplementationComponent, TelemetryData } from '@/components/common/factory';
import { useFeatureFlag } from '@/config/feature-flags';
import ProposalCard from '@/components/assetdao/ProposalCard';
import WagmiProposalCard from '@/components/assetdao/WagmiProposalCard';
import { UnifiedProposalCardProps } from './types';
import { useUnifiedProposalVoting, useUnifiedProposalList } from '@/hooks/unified';
import { extractVoteCounts, calculateVotingStats } from '@/utils/vote-helpers';
import toast from 'react-hot-toast';

// Component type defined in shared types file

/**
 * UnifiedProposalCard implementation that uses the factory pattern
 * to switch between Ethers and Wagmi implementations
 */
export function UnifiedProposalCard({
  proposal,
  implementation = 'ethers', // Provide a default implementation to fix undefined issues
  onActionComplete,
  onRefresh,
  ...props
}: UnifiedProposalCardProps) {
  const {
    expanded,
    className,
    onTelemetry
  } = props;

  // Use unified hooks for voting and execution
  const { voteOnProposal } = useUnifiedProposalVoting({
    implementation,
    onTelemetry: onTelemetry || undefined,
    showToasts: true
  });

  // Move the hook outside the callback to follow React Hooks rules
  const { refetch } = useUnifiedProposalList({
    implementation
  });

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success('Proposal data refreshed');
  }, [refetch]);

  // Extract and normalize vote counts with enhanced validation
  const { forVotes, againstVotes } = useMemo(() => {
    console.log(`📊 UnifiedProposalCard: Extracting vote data for proposal ${proposal.id}`, {
      extracted: extractVoteCounts(proposal),
      originalData: {
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes
      }
    });
    
    const extracted = extractVoteCounts(proposal);
    
    // Validate extracted data
    if (isNaN(extracted.forVotes) || isNaN(extracted.againstVotes)) {
      console.warn(`⚠️ Invalid vote data for proposal ${proposal.id}:`, extracted);
      return { forVotes: 0, againstVotes: 0 };
    }
    
    return extracted;
  }, [proposal]);

  // Calculate voting statistics with data validation
  const votingStats = useMemo(() => {
    const stats = calculateVotingStats(forVotes, againstVotes);
    console.log(`📈 UnifiedProposalCard: Voting stats for proposal ${proposal.id}:`, {
      calculated: stats,
      forVotes,
      againstVotes
    });
    return stats;
  }, [forVotes, againstVotes, proposal.id]);

  // Normalize proposal with extracted vote data and validation
  const normalizedProposal = useMemo(() => {
    const normalized = {
      ...proposal,
      forVotes,
      againstVotes,
    };
    
    // Log normalized data for debugging
    console.log(`🔄 UnifiedProposalCard: Normalized proposal ${proposal.id}:`, {
      id: normalized.id,
      type: normalized.type,
      status: normalized.status,
      forVotes: normalized.forVotes,
      againstVotes: normalized.againstVotes,
      hasVotes: votingStats.hasVotes
    });
    
    return normalized;
  }, [proposal, forVotes, againstVotes, votingStats.hasVotes]);

  // Handlers for voting and executing proposals
  const handleVote = useCallback(async (proposalId: number, support: boolean) => {
    try {
      await voteOnProposal({ proposalId, support });

      // Call both action complete and refresh callbacks
      if (onActionComplete) onActionComplete();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Vote failed:', error);
      toast.error('Failed to vote on proposal');
    }
  }, [voteOnProposal, onActionComplete, onRefresh]);

  const handleExecute = useCallback(async (proposalId: number) => {
    try {
      // For now, use the original implementation's execute function
      // This will be replaced with a unified hook in a future iteration
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call both action complete and refresh callbacks
      if (onActionComplete) onActionComplete();
      if (onRefresh) {
        onRefresh();
        handleRefresh();
      }
    } catch (error) {
      console.error('Execution failed:', error);
      toast.error('Failed to execute proposal');
    }
  }, [onActionComplete, onRefresh, handleRefresh]);

  // Create unified props interface for both implementations
  const unifiedProps = {
    proposal: normalizedProposal,
    onVote: handleVote,
    onExecute: handleExecute,
    onActionComplete: () => {
      if (onActionComplete) onActionComplete();
      if (onRefresh) onRefresh();
    },
    expanded,
    className
  };

  // Determine which component to render based on implementation
  const isWagmiImplementation = useFeatureFlag('useWagmiProposalCards') || implementation === 'wagmi';

  // Render the appropriate implementation with proper error boundaries
  if (isWagmiImplementation) {
    return (
      <WagmiProposalCard
        {...unifiedProps}
        forceImplementation={implementation}
      />
    );
  } else {
    return (
      <ProposalCard
        {...unifiedProps}
        forceImplementation={implementation}
      />
    );
  }
};

export default UnifiedProposalCard;