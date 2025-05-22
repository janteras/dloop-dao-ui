/**
 * Dynamic ProposalCard Component
 * 
 * A dynamically loaded wrapper around the UnifiedProposalCard component
 * that includes optimistic UI updates and React Query integration.
 */

import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueryProposalVoting } from '@/hooks/query';
import { UnifiedProposalCard } from '../unified/UnifiedProposalCard';
import { Proposal } from '@/types';
import { TelemetryData } from '@/components/common/factory';

/**
 * Fallback loading component
 */
const ProposalCardLoadingFallback = () => (
  <div className="proposal-card-skeleton">
    <div className="skeleton-header"></div>
    <div className="skeleton-body">
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
    </div>
    <div className="skeleton-footer"></div>
  </div>
);

/**
 * Error fallback component
 */
const ProposalCardErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="proposal-card-error">
    <h3>Error loading proposal</h3>
    <p>{error.message}</p>
    <button onClick={resetErrorBoundary}>Retry</button>
  </div>
);

/**
 * DynamicProposalCard props
 */
interface DynamicProposalCardProps {
  /**
   * Proposal data to display
   */
  proposal: Proposal;
  
  /**
   * Callback after successful actions (vote, execute)
   */
  onActionComplete?: () => void;
  
  /**
   * Callback for refreshing the parent component
   */
  onRefresh?: () => void;
  
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: 'ethers' | 'wagmi';
  
  /**
   * Whether to show the expanded view with more details
   */
  expanded?: boolean;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Callback for implementation-specific telemetry
   */
  onTelemetry?: (data: TelemetryData) => void;
  
  /**
   * Whether to use optimistic UI updates
   */
  optimisticUpdates?: boolean;
}

/**
 * Dynamic ProposalCard Component
 * 
 * This component wraps the UnifiedProposalCard in Suspense and ErrorBoundary
 * and adds optimistic UI updates with React Query.
 */
export function DynamicProposalCard({
  proposal,
  onActionComplete,
  onRefresh,
  implementation,
  expanded = false,
  className = '',
  onTelemetry,
  optimisticUpdates = true
}: DynamicProposalCardProps) {
  // Track optimistic UI state
  const [optimisticState, setOptimisticState] = useState({
    hasVoted: false,
    voteValue: false,
    isExecuted: proposal.status === 'executed'
  });
  
  // Use React Query hooks for voting
  const { voteOnProposal, isVoting } = useQueryProposalVoting({
    implementation,
    onTelemetry,
    showNotifications: true,
    autoInvalidateQueries: true
  });
  
  // Handle vote with optimistic updates
  const handleVote = async (proposalId: string, vote: boolean) => {
    if (optimisticUpdates) {
      // Apply optimistic update
      setOptimisticState({
        ...optimisticState,
        hasVoted: true,
        voteValue: vote
      });
    }
    
    // Execute the actual vote
    voteOnProposal({
      proposal,
      vote
    }, {
      onSuccess: () => {
        if (onActionComplete) onActionComplete();
        if (onRefresh) onRefresh();
      },
      onError: () => {
        // Revert optimistic update on error
        if (optimisticUpdates) {
          setOptimisticState({
            ...optimisticState,
            hasVoted: false
          });
        }
      }
    });
  };
  
  // Apply optimistic UI updates to the proposal if enabled
  const enhancedProposal = optimisticUpdates && optimisticState.hasVoted
    ? {
        ...proposal,
        hasVoted: true,
        vote: optimisticState.voteValue,
        status: optimisticState.isExecuted ? 'executed' : proposal.status
      }
    : proposal;
  
  return (
    <ErrorBoundary FallbackComponent={ProposalCardErrorFallback}>
      <Suspense fallback={<ProposalCardLoadingFallback />}>
        <UnifiedProposalCard
          proposal={enhancedProposal}
          onActionComplete={onActionComplete}
          onRefresh={onRefresh}
          implementation={implementation}
          expanded={expanded}
          className={`${className} ${isVoting ? 'is-voting' : ''}`}
          onTelemetry={onTelemetry}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
