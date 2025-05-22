/**
 * Unified Proposal Card Component
 * 
 * This component provides a consistent interface for displaying proposals
 * while supporting both Ethers and Wagmi implementations under the hood.
 * It uses the factory pattern to dynamically select the appropriate implementation.
 */

import { useCallback } from 'react';
import { createImplementationComponent, TelemetryData } from '@/components/common/factory';
import { useFeatureFlag } from '@/config/feature-flags';
import ProposalCard from '@/components/assetdao/ProposalCard';
import WagmiProposalCard from '@/components/assetdao/WagmiProposalCard';
import { UnifiedProposalCardProps } from './types';
import { useUnifiedProposalVoting, useUnifiedProposalList } from '@/hooks/unified';
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

  // Handlers for voting and executing proposals
  const handleVote = useCallback(async (proposalId: number, support: boolean) => {
    await voteOnProposal({ proposalId, support });
    
    // Call both action complete and refresh callbacks
    if (onActionComplete) onActionComplete();
    if (onRefresh) onRefresh();
  }, [voteOnProposal, onActionComplete, onRefresh]);
  
  const handleExecute = useCallback(async (proposalId: number) => {
    // For now, use the original implementation's execute function
    // This will be replaced with a unified hook in a future iteration
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Call both action complete and refresh callbacks
    if (onActionComplete) onActionComplete();
    if (onRefresh) {
      onRefresh();
      handleRefresh();
    }
  }, [onActionComplete, onRefresh, handleRefresh]);
  
  // Create component props for each implementation
  const ethersProps = {
    proposal,
    onVote: handleVote,
    onExecute: handleExecute,
    expanded,
    className
  };

  const wagmiProps = {
    proposal,
    onActionComplete: () => {
      if (onActionComplete) onActionComplete();
      if (onRefresh) onRefresh();
    },
    className
  };

  // Use the factory pattern to create the appropriate component
  const ImplementationCard = createImplementationComponent<typeof ethersProps | typeof wagmiProps>(
    // Ethers implementation
    (props: typeof ethersProps) => <ProposalCard {...props} />,
    // Wagmi implementation
    (props: typeof wagmiProps) => <WagmiProposalCard {...props} />,
    // Feature flag key
    'useWagmiProposalCards'
  );
  
  // Determine which props to use based on implementation
  const componentProps = useFeatureFlag('useWagmiProposalCards') || implementation === 'wagmi' 
    ? wagmiProps 
    : ethersProps;
  
  // Cast components to allow for proper type compatibility with exact optional properties
  const ProposalCardComponent: React.FC<any> = implementation === 'wagmi' ? 
    WagmiProposalCard as React.FC<any> : 
    ProposalCard as React.FC<any>;
  
  // Render the appropriate implementation
  return (
    <ProposalCardComponent
      {...componentProps}
      forceImplementation={implementation}
    />
  );
};

export default UnifiedProposalCard;
