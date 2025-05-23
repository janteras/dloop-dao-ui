/**
 * Unified Proposal Voting Component
 * 
 * This component provides a consistent interface for voting on proposals
 * while supporting both Ethers and Wagmi implementations through the unified AssetDAO contract hook.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';
import { Web3Implementation } from '@/types/web3-types';
import { useUnifiedWallet } from '@/hooks/unified';
import { toast } from '@/components/ui/use-toast';

export interface UnifiedProposalVotingProps {
  /**
   * Proposal ID to vote on
   */
  proposalId: number;
  
  /**
   * Flag to indicate if user has already voted
   */
  hasVoted?: boolean;
  
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: Web3Implementation;
  
  /**
   * Custom size for the voting buttons
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Callback when voting is completed
   */
  onVoteComplete?: (proposalId: number, support: boolean) => void;
  
  /**
   * Show toasts for voting results
   */
  showToasts?: boolean;
}

/**
 * Unified component for voting on proposals with consistent behavior
 * regardless of which implementation (Ethers or Wagmi) is being used
 */
export const UnifiedProposalVoting: React.FC<UnifiedProposalVotingProps> = (props) => {
  const {
    proposalId,
    hasVoted = false,
    implementation,
    size = 'md',
    className = '',
    onVoteComplete,
    showToasts = true
  } = props;
  
  // State for loading indicators
  const [isVotingYes, setIsVotingYes] = useState(false);
  const [isVotingNo, setIsVotingNo] = useState(false);
  
  // Use unified hooks
  const { isConnected, address } = useUnifiedWallet({ implementation });
  const { voteOnProposal, implementation: actualImplementation } = useUnifiedAssetDaoContract({ 
    implementation 
  });
  
  // Button size classes
  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base'
  };
  
  // Handle voting yes
  const handleVoteYes = async () => {
    if (!isConnected || hasVoted) return;
    
    setIsVotingYes(true);
    try {
      await voteOnProposal(proposalId, true);
      
      if (showToasts) {
        toast({
          title: "Vote Submitted",
          description: "You have successfully voted YES on this proposal",
          variant: "default",
        });
      }
      
      if (onVoteComplete) {
        onVoteComplete(proposalId, true);
      }
    } catch (error) {
      console.error('Error voting YES:', error);
      
      if (showToasts) {
        toast({
          title: "Vote Failed",
          description: error instanceof Error ? error.message : "Failed to submit your vote",
          variant: "destructive",
        });
      }
    } finally {
      setIsVotingYes(false);
    }
  };
  
  // Handle voting no
  const handleVoteNo = async () => {
    if (!isConnected || hasVoted) return;
    
    setIsVotingNo(true);
    try {
      await voteOnProposal(proposalId, false);
      
      if (showToasts) {
        toast({
          title: "Vote Submitted",
          description: "You have successfully voted NO on this proposal",
          variant: "default",
        });
      }
      
      if (onVoteComplete) {
        onVoteComplete(proposalId, false);
      }
    } catch (error) {
      console.error('Error voting NO:', error);
      
      if (showToasts) {
        toast({
          title: "Vote Failed",
          description: error instanceof Error ? error.message : "Failed to submit your vote",
          variant: "destructive",
        });
      }
    } finally {
      setIsVotingNo(false);
    }
  };
  
  // Implementation-specific attributes for telemetry
  const dataAttributes = {
    'data-implementation': actualImplementation
  };
  
  return (
    <div className={`flex space-x-2 ${className}`} {...dataAttributes}>
      <Button
        variant="outline"
        size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default'}
        onClick={handleVoteYes}
        disabled={!isConnected || hasVoted || isVotingYes || isVotingNo}
        className={`${sizeClasses[size]} ${hasVoted ? 'opacity-50' : ''}`}
      >
        {isVotingYes ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ThumbsUp className="mr-2 h-4 w-4" />
        )}
        Vote Yes
      </Button>
      
      <Button
        variant="outline"
        size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default'}
        onClick={handleVoteNo}
        disabled={!isConnected || hasVoted || isVotingYes || isVotingNo}
        className={`${sizeClasses[size]} ${hasVoted ? 'opacity-50' : ''}`}
      >
        {isVotingNo ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ThumbsDown className="mr-2 h-4 w-4" />
        )}
        Vote No
      </Button>
      
      {hasVoted && (
        <span className="text-sm text-gray-500 flex items-center">
          You have already voted on this proposal
        </span>
      )}
    </div>
  );
};

export default UnifiedProposalVoting;
