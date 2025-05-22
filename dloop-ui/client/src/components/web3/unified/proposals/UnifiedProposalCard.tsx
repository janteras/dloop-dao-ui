import React from 'react';
import { BaseComponentProps, Web3ComponentProps } from '@/components/Component.interface';
import { Proposal, ProposalStatus } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/atoms/Button/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TokenDisplay } from '@/components/web3/unified/tokens/TokenDisplay';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, Check, X, Clock, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { cn } from '@/lib/utils';
import { useFeatureFlag } from '@/config/feature-flags';
import { useProposalVoting } from '@/hooks/useUnifiedProposals';
import { mapContractTypeToUI } from '@/lib/proposalTypeMapping';

export interface UnifiedProposalCardProps extends BaseComponentProps, Web3ComponentProps {
  /** Proposal data */
  proposal: Proposal;
  /** Callback when a vote is cast */
  onVote?: (proposalId: number, support: boolean) => void;
  /** Callback when proposal is executed */
  onExecute?: (proposalId: number) => void;
  /** Callback after any action is completed */
  onActionComplete?: () => void;
  /** Whether to show full proposal details */
  expanded?: boolean;
  /** Whether this is a preview/placeholder card */
  isPlaceholder?: boolean;
}

/**
 * Unified proposal card component that works with both implementations
 * Includes responsive design for different screen sizes
 */
export const UnifiedProposalCard: React.FC<UnifiedProposalCardProps> = ({
  proposal,
  onVote,
  onExecute,
  onActionComplete,
  expanded = false,
  className = '',
  isPlaceholder = false,
  useWagmi: propUseWagmi,
  ...props
}) => {
  // Use feature flag to determine implementation
  const useWagmiProposals = useFeatureFlag('useWagmiProposals');
  // Allow prop to override for testing
  const useWagmi = propUseWagmi !== undefined ? propUseWagmi : useWagmiProposals;
  
  // Get wallet connection
  const { isConnected } = useUnifiedWallet();
  
  // Get proposal voting functionality
  const { voteOnProposal, executeProposal, isVoting, isExecuting } = useProposalVoting(useWagmi);
  
  // Handle voting
  const handleVote = async (support: boolean) => {
    if (!isConnected) return;
    
    try {
      await voteOnProposal(proposal.id, support);
      if (onVote) onVote(proposal.id, support);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error voting on proposal:', error);
    }
  };
  
  // Handle execution
  const handleExecute = async () => {
    if (!isConnected) return;
    
    try {
      await executeProposal(proposal.id);
      if (onExecute) onExecute(proposal.id);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error executing proposal:', error);
    }
  };
  
  // Calculate vote percentages
  const forPercentage = React.useMemo(() => {
    const total = proposal.forVotes + proposal.againstVotes;
    if (total === 0) return 0;
    return (proposal.forVotes / total) * 100;
  }, [proposal.forVotes, proposal.againstVotes]);
  
  // Format the deadline date
  const formattedDeadline = React.useMemo(() => {
    if (!proposal.deadline) return 'Unknown';
    
    try {
      const date = new Date(proposal.deadline);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  }, [proposal.deadline]);
  
  // Get status badge styling
  const getStatusBadge = () => {
    const status = proposal.status.toLowerCase() as ProposalStatus;
    
    switch (status) {
      case 'active':
        return { 
          color: 'bg-blue-900/20 text-blue-400 border-blue-800/30',
          icon: <Clock className="h-3 w-3 mr-1" /> 
        };
      case 'passed':
        return { 
          color: 'bg-green-900/20 text-green-400 border-green-800/30',
          icon: <Check className="h-3 w-3 mr-1" /> 
        };
      case 'failed':
        return { 
          color: 'bg-red-900/20 text-red-400 border-red-800/30',
          icon: <X className="h-3 w-3 mr-1" /> 
        };
      case 'executed':
        return { 
          color: 'bg-purple-900/20 text-purple-400 border-purple-800/30',
          icon: <Check className="h-3 w-3 mr-1" /> 
        };
      default:
        return { 
          color: 'bg-gray-900/20 text-gray-400 border-gray-800/30',
          icon: <AlertCircle className="h-3 w-3 mr-1" /> 
        };
    }
  };
  
  // Get proposal type badge styling
  const getTypeBadge = () => {
    const type = mapContractTypeToUI(proposal.type as any);
    
    switch (type) {
      case 'invest':
        return { 
          color: 'bg-green-900/20 text-green-400 border-green-800/30',
          label: 'Investment'
        };
      case 'divest':
        return { 
          color: 'bg-orange-900/20 text-orange-400 border-orange-800/30',
          label: 'Divestment'
        };
      default:
        return { 
          color: 'bg-gray-900/20 text-gray-400 border-gray-800/30',
          label: 'Other'
        };
    }
  };
  
  // If placeholder, add styling to indicate it's not real data
  const placeholderClasses = isPlaceholder ? 'border-dashed border-gray-700/50' : '';
  
  // Card styles based on status
  const statusClasses = {
    active: 'border-blue-900/30',
    passed: 'border-green-900/30',
    failed: 'border-red-900/30',
    executed: 'border-purple-900/30',
  };
  
  const statusClass = statusClasses[proposal.status.toLowerCase() as ProposalStatus] || '';
  
  return (
    <Card 
      className={cn(
        'overflow-hidden transition-all duration-200 hover:border-accent/50',
        statusClass,
        placeholderClasses,
        className
      )} 
      {...props}
    >
      {/* Card Header with Title and Badges */}
      <CardHeader className="space-y-2 pb-2">
        <div className="flex justify-between items-start">
          <Badge className={getTypeBadge().color}>
            {getTypeBadge().label}
          </Badge>
          
          <Badge className={getStatusBadge().color}>
            <span className="flex items-center">
              {getStatusBadge().icon}
              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
            </span>
          </Badge>
        </div>
        
        <h3 className="text-lg font-medium text-white leading-tight">
          {isPlaceholder && <span className="text-gray-400">[Preview] </span>}
          {proposal.title}
        </h3>
      </CardHeader>
      
      {/* Card Content */}
      <CardContent className="space-y-4 text-sm">
        {/* Token and Amount */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-gray-400 text-xs">
              {proposal.type === 'invest' ? 'Investment' : 'Divestment'}
            </p>
            <TokenDisplay 
              tokenAddress={proposal.token.toString()}
              amount={proposal.amount}
              showIcon
              showSymbol
              showName
              size="sm"
            />
          </div>
          
          {/* Deadline */}
          <div className="text-right">
            <p className="text-gray-400 text-xs">Deadline</p>
            <p className="text-white">{formattedDeadline}</p>
          </div>
        </div>
        
        {/* Description (if expanded) */}
        {expanded && (
          <div className="mt-2">
            <p className="text-gray-300 text-sm">{proposal.description}</p>
          </div>
        )}
        
        {/* Voting Progress */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-green-400">For ({proposal.forVotes.toLocaleString()})</span>
            <span className="text-red-400">Against ({proposal.againstVotes.toLocaleString()})</span>
          </div>
          <div className="relative h-2 w-full bg-dark-gray rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600"
              style={{ width: `${forPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Proposer Info */}
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>Proposer</span>
          <span className="font-mono">
            {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
          </span>
        </div>
      </CardContent>
      
      {/* Card Footer with Actions */}
      <CardFooter className="pt-2 pb-4 flex gap-2">
        {proposal.status === 'active' && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-green-900/10 border-green-800/30 hover:bg-green-900/20 text-green-400"
              onClick={() => handleVote(true)}
              isLoading={isVoting}
              disabled={!isConnected || isVoting || isExecuting}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              For
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-red-900/10 border-red-800/30 hover:bg-red-900/20 text-red-400"
              onClick={() => handleVote(false)}
              isLoading={isVoting}
              disabled={!isConnected || isVoting || isExecuting}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Against
            </Button>
          </>
        )}
        
        {proposal.status === 'passed' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-purple-900/10 border-purple-800/30 hover:bg-purple-900/20 text-purple-400"
            onClick={handleExecute}
            isLoading={isExecuting}
            disabled={!isConnected || isExecuting}
          >
            <Check className="h-4 w-4 mr-1" />
            Execute
          </Button>
        )}
        
        {(proposal.status === 'executed' || proposal.status === 'failed') && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled
          >
            {proposal.status === 'executed' ? 'Executed' : 'Failed'}
          </Button>
        )}
      </CardFooter>
      
      {isPlaceholder && (
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-yellow-900/20 text-yellow-500 text-xs">
            Preview
          </Badge>
        </div>
      )}
    </Card>
  );
};

/**
 * Skeleton version of the proposal card for loading states
 */
export const ProposalCardSkeleton: React.FC<BaseComponentProps> = ({ className, ...props }) => {
  return (
    <Card className={cn('', className)} {...props}>
      <CardHeader className="space-y-2 pb-2">
        <div className="flex justify-between items-start">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        
        <Skeleton className="h-6 w-4/5" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-28" />
          </div>
          
          <div className="text-right">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 pb-4 flex gap-2">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
};
