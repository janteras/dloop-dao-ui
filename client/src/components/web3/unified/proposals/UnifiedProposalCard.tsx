import React, { useState, useEffect } from 'react';
import { BaseComponentProps, Web3ComponentProps } from '@/components/Component.interface';
import { Proposal, ProposalStatus } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Import the proposal helper functions directly
import { getTokenSymbol as resolveTokenSymbol, formatAmount, mapContractTypeToUI } from '@/utils/proposal-helpers';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TokenDisplay } from '@/components/web3/unified/tokens/TokenDisplay';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, Check, X, Clock, AlertCircle, Copy, Coins, CircleDot, Play } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { cn, shortenAddress } from '@/lib/utils';
import { useFeatureFlag } from '@/config/feature-flags';
import { EnhancedAssetDAOService } from '@/services/enhanced-assetDaoService';
import { useProposalVoting } from '@/hooks/useUnifiedProposals';
import { CountdownTimer } from '@/components/features/shared/countdown-timer';
import { useDloopTokenCheck } from '@/hooks/useDloopTokenCheck';
import toast from 'react-hot-toast';
import { ADDRESSES } from '@/config/contracts';
import styles from './UnifiedProposalCard.module.css';
import { motion } from 'framer-motion';
import { Clock as ClockIcon, CheckCircle, XCircle, CircleDashed } from 'lucide-react';
import { ethers } from 'ethers';
import { extractVoteCounts, calculateVotingStats, validateVotingStatus } from '@/utils/vote-helpers';
import { VotingStatusDiagnostics } from './VotingStatusDiagnostics';
import { useNetworkValidation } from '@/hooks/useNetworkValidation';
import NetworkValidationWrapper from '@/components/features/wallet/NetworkValidationWrapper';


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
const UnifiedProposalCard: React.FC<UnifiedProposalCardProps> = ({
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

  // Get wallet connection and user address
  const { isConnected, address } = useUnifiedWallet();
  const { isCorrectNetwork } = useNetworkValidation();

  // Check if current user is the proposer
  const isProposer = address && proposal.proposer && 
    address.toLowerCase() === proposal.proposer.toLowerCase();

  // Check if the user has DLOOP tokens in their wallet
  const { hasDloopTokens, isCheckingBalance, checkHasDloopTokens } = useDloopTokenCheck();

  // Local state for component interactions
  const [isVoting, setIsVoting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copyingAddress, setCopyingAddress] = useState<string | null>(null);
  const [voteStatus, setVoteStatus] = useState<{ hasVoted: boolean; support?: boolean }>({ hasVoted: false });
  const [isCheckingVote, setIsCheckingVote] = useState(false);

  // Wrapper function to get correct token symbol
  const getTokenSymbol = React.useCallback((address: string) => {
    if (!address || address.trim() === '') return 'UNKNOWN';

    // Extract token symbol from proposal title or description if available
    const titleMatch = proposal.title?.match(/\b(USDC|WBTC|ETH|DLOOP)\b/i);
    const descMatch = proposal.description?.match(/\b(USDC|WBTC|ETH|DLOOP)\b/i);

    if (titleMatch) return titleMatch[1].toUpperCase();
    if (descMatch) return descMatch[1].toUpperCase();

    // Handle known token addresses explicitly
    const normalizedAddress = address.toLowerCase();
    if (normalizedAddress === '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238') {
      return 'USDC';
    } else if (normalizedAddress === '0xca063a2ab0ab07491ee991dcecb456d1265f842b568') {
      return 'WBTC';
    }

    // Use the general token symbol resolver
    return resolveTokenSymbol(address);
  }, [proposal.title, proposal.description]);

  // Use the voting hook for this proposal with the correct contract address
  const { castVote, executeProposal } = useProposalVoting(ADDRESSES.AssetDAO);

  // Create a wrapped version of castVote that has additional safeguards
  const voteOnProposal = async (params: { proposalId: number; support: boolean }) => {
    // Add a final check before calling the actual contract method
    if (isProposer) {
      console.error('Prevented contract call - user is proposer');
      throw new Error('You cannot vote on your own proposal');
    }

    if (voteStatus.hasVoted) {
      console.error('Prevented contract call - user already voted');
      throw new Error(`You have already voted on this proposal`);
    }

    // If we pass all checks, call the actual contract method
    return await castVote(params);
  };

  // Check if the current user has already voted on this proposal
  useEffect(() => {
    if (!isConnected || !address || !proposal.id) return;

    const checkUserVoteStatus = async () => {
      setIsCheckingVote(true);
      try {
        // Use the provider from ethers or wagmi depending on feature flag
        const provider = window.ethereum ? new ethers.BrowserProvider(window.ethereum) : null;
        if (!provider) return;

        // Check if the user has already voted
        const result = await EnhancedAssetDAOService.checkVotingStatus(
          provider,
          proposal.id,
          address
        );

        const validatedStatus = validateVotingStatus(result);
        setVoteStatus(validatedStatus);

        // If debugging is needed, log the result
        if (process.env.NODE_ENV === 'development') {
          console.log(`Voting status for proposal ${proposal.id}:`, {
            hasVoted: validatedStatus.hasVoted,
            support: validatedStatus.support,
            isProposer,
            userAddress: address,
            proposerAddress: proposal.proposer,
            rawResult: result
          });
        }
      } catch (error) {
        console.error('Error checking vote status:', error);
      } finally {
        setIsCheckingVote(false);
      }
    };

    checkUserVoteStatus();
  }, [isConnected, address, proposal.id, isProposer, proposal.proposer]);

  // Simple deadline check without relying on formattedDeadline (which is defined later)
  const hasDeadlinePassed = React.useMemo(() => {
    if (!proposal.deadline) {
      // If we have a creation date, check if the standard voting period has passed
      if (proposal.createdAt) {
        try {
          const createdDate = new Date(proposal.createdAt);
          const votingPeriod = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
          const estimatedEnd = new Date(createdDate.getTime() + votingPeriod);
          return new Date() > estimatedEnd;
        } catch (error) {
          // If we can't parse the date, assume not passed for safety
          return false;
        }
      }

      // If we can't determine, default to what the API says
      return false;
    }

    try {
      const deadlineDate = new Date(proposal.deadline);
      return new Date() > deadlineDate;
    } catch (error) {
      console.warn('Invalid deadline format:', proposal.deadline);
      return false;
    }
  }, [proposal.deadline, proposal.createdAt]);

  // Status indicators - with corrected active status that respects deadline
  const isPassed = proposal.status === 'passed';
  const isActiveByStatus = proposal.status === 'active';
  const isActive = isActiveByStatus && !hasDeadlinePassed; // Only active if status is active AND deadline hasn't passed
  const isExecuted = proposal.status === 'executed';
  const isFailed = proposal.status === 'failed' || (isActiveByStatus && hasDeadlinePassed); // Consider failed if active but deadline passed
  const isCanceled = proposal.status === 'canceled';

  // Handle copying address to clipboard
  const handleCopyAddress = React.useCallback((address: string) => {
    navigator.clipboard.writeText(address)
      .then(() => {
        setCopyingAddress(address);
        toast.success('Address copied to clipboard');
        const timeoutId = setTimeout(() => setCopyingAddress(null), 2000);
        return () => clearTimeout(timeoutId);
      })
      .catch(err => {
        console.error('Failed to copy address', err);
        toast.error('Failed to copy address');
      });
  }, []);

  // Handle voting for this proposal
  const handleVote = async (support: boolean) => {
    // Early validation to prevent MetaMask from being triggered unnecessarily
    if (!isConnected) {
      toast.error('Please connect your wallet to vote on this proposal');
      return false;
    }

    if (!onVote) {
      console.error('No vote handler available');
      return false;
    }

    // Check if the user has any DLOOP tokens
    if (!checkHasDloopTokens()) {
      toast.error('You need DLOOP tokens to vote on this proposal');
      return false;
    }

    if (isProposer) {
      toast.error('You cannot vote on your own proposal');
      return false;
    }

    if (voteStatus.hasVoted) {
      toast.error(`You have already voted ${voteStatus.support ? 'For' : 'Against'} this proposal`);
      return false;
    }

    // If we reach here, the user can vote, so proceed with the voting process
    setIsVoting(true);
    try {
      // Check if we have the voteOnProposal function from the hook
      if (typeof voteOnProposal === 'function') {
        // Use the built-in voteOnProposal from the hook
        await voteOnProposal({ proposalId: proposal.id, support });

        // Update local vote status immediately
        setVoteStatus({ hasVoted: true, support });

        // Call callbacks
        if (onVote) onVote(proposal.id, support);
        if (onActionComplete) onActionComplete();

        // Show success message with specific proposal ID
        toast.success(`Successfully voted ${support ? 'For' : 'Against'} proposal #${proposal.id}`);
        return true;
      } else {
        // Fall back to the onVote callback if voteOnProposal is not available
        if (onVote) {
          await onVote(proposal.id, support);

          // Update local vote status
          setVoteStatus({ hasVoted: true, support });

          if (onActionComplete) onActionComplete();
          toast.success(`Successfully voted ${support ? 'For' : 'Against'} proposal #${proposal.id}`);
          return true;
        } else {
          throw new Error('Voting functionality is not available');
        }
      }
    } catch (error) {
      console.error('Error voting on proposal:', error);
      // Only show error toast if it's not already handled by the contract service
      if (!(error instanceof Error && error.message.includes('Smart Contract Error'))) {
        toast.error('Failed to submit vote. Please try again.');
      }
      return false;
    } finally {
      setIsVoting(false);
    }
  };

  // Handle executing this proposal
  const handleExecute = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to execute this proposal');
      return;
    }

    if (!proposal.readyToExecute) {
      toast.error('This proposal is not ready for execution');
      return;
    }

    setIsExecuting(true);
    try {
      // Call the contract's executeProposal function
      if (typeof executeProposal === 'function') {
        await executeProposal(proposal.id);
        toast.success(`Proposal #${proposal.id} executed successfully!`);
      } else if (onExecute) {
        await onExecute(proposal.id);
        toast.success(`Proposal #${proposal.id} executed successfully!`);
      } else {
        throw new Error('Execution functionality not available');
      }

      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error('Error executing proposal:', error);
      toast.error('Failed to execute proposal. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };

// Calculate vote data with proper conversion
  const voteData = React.useMemo(() => {
    // Direct extraction from proposal with proper number conversion
    let rawForVotes = 0;
    let rawAgainstVotes = 0;

    // Handle different data formats
    if (typeof proposal.forVotes === 'string') {
      rawForVotes = parseFloat(proposal.forVotes) || 0;
    } else if (typeof proposal.forVotes === 'number') {
      rawForVotes = proposal.forVotes;
    } else if (typeof proposal.forVotes === 'bigint') {
      rawForVotes = Number(proposal.forVotes);
    }

    if (typeof proposal.againstVotes === 'string') {
      rawAgainstVotes = parseFloat(proposal.againstVotes) || 0;
    } else if (typeof proposal.againstVotes === 'number') {
      rawAgainstVotes = proposal.againstVotes;
    } else if (typeof proposal.againstVotes === 'bigint') {
      rawAgainstVotes = Number(proposal.againstVotes);
    }

    const totalVotes = rawForVotes + rawAgainstVotes;
    const forPercentage = totalVotes > 0 ? (rawForVotes / totalVotes) * 100 : 0;
    const againstPercentage = totalVotes > 0 ? (rawAgainstVotes / totalVotes) * 100 : 0;

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`Proposal ${proposal.id} vote calculation:`, {
        original: { forVotes: proposal.forVotes, againstVotes: proposal.againstVotes },
        converted: { rawForVotes, rawAgainstVotes },
        calculated: { forPercentage, againstPercentage, totalVotes }
      });
    }

    return {
      forVotes: rawForVotes,
      againstVotes: rawAgainstVotes,
      totalVotes,
      forPercentage,
      againstPercentage
    };
  }, [proposal.forVotes, proposal.againstVotes, proposal.id]);

  const { forPercentage, againstPercentage, totalVotes, forVotes, againstVotes } = voteData;

  // Format the deadline date with fallback to estimated time
  const formattedDeadline = React.useMemo(() => {
    // Try to use deadline directly if available
    if (proposal.deadline) {
      try {
        const date = new Date(proposal.deadline);
        if (!isNaN(date.getTime())) {
          return formatDistanceToNow(date, { addSuffix: true });
        }
      } catch (error) {
        console.warn('Invalid deadline format:', proposal.deadline);
      }
    }

    // Try to get deadline from createdAt + standard voting period
    if (proposal.createdAt) {
      try {
        const createdDate = new Date(proposal.createdAt);
        if (!isNaN(createdDate.getTime())) {
          // Assume standard 3-day voting period
          const estimatedEnd = new Date(createdDate.getTime() + (3 * 24 * 60 * 60 * 1000));
          return formatDistanceToNow(estimatedEnd, { addSuffix: true }) + ' (est.)';
        }
      } catch (error) {
        console.warn('Invalid createdAt format:', proposal.createdAt);
      }
    }

    // If we can't determine the deadline, return a more informative message
    return 'No deadline info';
  }, [proposal.deadline, proposal.createdAt]);

  // Get status badge styling - now respects actual status including deadline
  const getStatusBadge = () => {
    if (isActiveByStatus && hasDeadlinePassed) {
      return { 
        color: 'status-failed',
        icon: <X className="h-3 w-3" />,
        label: 'Failed'
      };
    }

    // Dynamically determine status
    const status = proposal.status.toLowerCase();

    if (status === 'active') {
      return {
        color: 'status-active',
        icon: <Clock className="h-3 w-3" />,
        label: 'Active'
      };
    } else if (status === 'passed') {
      return {
        color: 'status-passed',
        icon: <Check className="h-3 w-3" />,
        label: 'Passed'
      };
    } else if (status === 'failed') {
      return {
        color: 'status-failed',
        icon: <X className="h-3 w-3" />,
        label: 'Failed'
      };
    } else if (status === 'executed') {
      return {
        color: 'status-executed',
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Executed'
      };
    }

    // Default status
    return {
      color: 'ghost',
      icon: <CircleDashed className="h-3 w-3" />,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    };
  };



  // Reset any test backgrounds and ensure proper card styling
  const cardClasses = "bg-surface border-border hover:border-accent hover:shadow-lg transition-all duration-300 ease-out";

  // Helper function to check if proposal can be executed
  const canExecuteProposal = (proposal: any): boolean => {
    // Must be in passed status
    if (proposal.status !== 'passed') return false;
    
    // Must not already be executed
    if (proposal.executed) return false;
    
    // Check quorum (100,000 DLOOP minimum)
    const forVotes = parseFloat(proposal.forVotes || '0');
    const againstVotes = parseFloat(proposal.againstVotes || '0');
    const totalVotes = forVotes + againstVotes;
    
    // Must meet quorum and have majority support
    const meetsQuorum = totalVotes >= 100000;
    const hasMajority = forVotes > againstVotes;
    
    if (!meetsQuorum || !hasMajority) return false;
    
    // Check timelock period - proposals can only be executed after voting ends + execution delay
    if (proposal.deadline) {
      try {
        const votingEndTime = new Date(proposal.deadline).getTime();
        const now = new Date().getTime();
        const executionDelay = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds (default from docs)
        
        // Proposal can only be executed after voting ends + execution delay
        const canExecuteAfter = votingEndTime + executionDelay;
        
        if (now < canExecuteAfter) {
          console.log(`Proposal ${proposal.id} cannot be executed yet. Timelock expires: ${new Date(canExecuteAfter).toLocaleString()}`);
          return false;
        }
      } catch (error) {
        console.warn('Error checking timelock for proposal:', proposal.id, error);
        return false;
      }
    }
    
    return true;
  };

  // Get proposal type for Badge component
  const getProposalType = (proposal: Proposal): "invest" | "divest" | "parameter" => {
    // Add comprehensive debugging for proposal type determination
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔍 Proposal #${proposal.id} Type Analysis`);
      console.log('Raw proposal data:', {
        id: proposal.id,
        type: proposal.type,
        typeOf: typeof proposal.type,
        title: proposal.title,
        description: proposal.description?.substring(0, 100)
      });
    }

    // Enhanced contract type mapping with content validation
    const enhancedType = mapContractTypeToUI(proposal.type, {
      title: proposal.title,
      description: proposal.description
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Enhanced contract type mapping: ${proposal.type} -> ${enhancedType}`);
      console.log(`✅ Final determination: ${enhancedType.toUpperCase()}`);

      // Additional verification logging
      if (proposal.title?.toLowerCase().includes('invest') && enhancedType === 'divest') {
        console.warn(`🚨 POTENTIAL MAPPING ERROR: Title contains 'invest' but mapped to 'divest'`);
      }
      if (proposal.title?.toLowerCase().includes('remove') && enhancedType === 'invest') {
        console.warn(`🚨 POTENTIAL MAPPING ERROR: Title contains 'remove' but mapped to 'invest'`);
      }
    }

    // Check for parameter changes as a special case
    const titleLower = proposal.title?.toLowerCase() || '';
    const descLower = proposal.description?.toLowerCase() || '';
    if (titleLower.includes('parameter') || descLower.includes('parameter change')) {
      return 'parameter';
    }

    return enhancedType as "invest" | "divest";
  };

  // Get status variant for Badge component
  const getStatusVariant = (status: string, isActiveStatus: boolean, hasDeadlinePassed: boolean) => {
    // Override for active proposals with passed deadlines
    if (isActiveStatus && hasDeadlinePassed) {
      return 'status-failed' as const;
    }

    const statusLower = status.toLowerCase();

    switch (statusLower) {
      case 'active': return 'status-active' as const;
      case 'passed': return 'status-passed' as const;
      case 'failed': return 'status-failed' as const;
      case 'executed': return 'status-executed' as const;
      default: return 'ghost' as const;
    }
  };

  // Get proposal type badge styling (for backward compatibility)
  const getTypeBadge = () => {
    const type = getProposalType(proposal);
    const label = type === 'invest' ? 'Invest' : type === 'divest' ? 'Divest' : 'Parameter';

    return {
      color: type as const,
      label
    };
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

  // Helper function to map proposal types to Badge variants
  const getProposalTypeBadgeVariant = (proposalType: any): string => {
    // First determine the proposal type
    let proposalTypeStr = '';

    if (typeof proposalType === 'string') {
        proposalTypeStr = proposalType.toLowerCase();
    } else if (typeof proposalType === 'number') {
        // Assuming 0 for Invest and 1 for Divest
        proposalTypeStr = proposalType === 0 ? 'invest' : 'divest';
    } else if (proposalType) {
        proposalTypeStr = proposalType.toString().toLowerCase();
    }

    // Then map to the appropriate semantic variant
    switch (proposalTypeStr) {
      case 'invest': return 'proposal-invest';
      case 'divest': return 'proposal-divest';
      case 'parameter': return 'proposal-parameter';
      default: return 'proposal-invest';
    }

    // No need for the old switch statement anymore
  };


  // Helper function to get status badge with semantic colors
  const getStatusBadgeComponent = (status: ProposalStatus | undefined, executed: boolean) => {
    let statusText = 'Unknown';
    if (status) {
      statusText = status.toString();
    }

    if (executed) {
        statusText = 'Executed';
    }

    let variant = "ghost";

    switch (statusText.toLowerCase()) {
      case "active":
        variant = "status-active" as const;
        break;
      case "passed":
        variant = "status-passed" as const;
        break;
      case "failed":
        variant = "status-failed" as const;
        break;
      case "executed":
        variant = "status-executed" as const;
        break;
      default:
        variant = "ghost" as const;
    }

    return (
      <Badge variant={variant} size="lg">
        {statusText}
      </Badge>
    );
  };

  // Get proposal type display text
  const getProposalTypeDisplay = (proposalType: any): string => {
    if (typeof proposalType === 'string') {
      return proposalType;
    } else if (typeof proposalType === 'number') {
      return proposalType === 0 ? 'Invest' : 'Divest';
    }
    return 'Unknown';
  };

  // Function to derive status text, same as before
  const getStatusText = (status: ProposalStatus | undefined, executed: boolean) => {
    if (executed) return "Executed";
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Get badge info for rendering
  const statusBadge = getStatusBadge();
  const typeBadge = getTypeBadge();

  return (
    <motion.div 
      className={cn(styles.proposalCard)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
    <NetworkValidationWrapper showAlert={false}>
      <div className={styles.proposalHeader}>
      <CardHeader className="space-y-3">
        <div className="flex justify-between items-start w-full">
          <div className="flex-1">
            <h3 className={styles.proposalTitle} role="heading" aria-level={3}>
              {proposal.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge variant={getProposalTypeBadgeVariant(getProposalType(proposal)) as any} size="lg">
              {typeBadge.label}
            </Badge>
            <Badge 
              variant={getStatusVariant(proposal.status, isActiveByStatus, hasDeadlinePassed)}
              size="lg"
              className="flex items-center gap-1"
            >
              {statusBadge.icon}
              {statusBadge.label}
            </Badge>
          </div>
        </div>

        <div className="text-muted-foreground text-sm">
          Proposed by: {proposal.proposer?.startsWith('AI.Gov') 
            ? proposal.proposer 
            : shortenAddress(proposal.proposer || '')
          }
          {!proposal.proposer?.startsWith('AI.Gov') && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-auto p-1 text-muted-foreground hover:text-primary" 
              onClick={() => handleCopyAddress(proposal.proposer || '')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>

        <p className={cn(styles.proposalDescription, "text-sm mt-2")}>
          {proposal.description}
        </p>
      </CardHeader>
        {/* Proposer with copy functionality */}
         {/*
         <div className="flex justify-between text-sm">
            <span className="text-gray-400">Proposed by</span>
            <span className="text-foreground font-medium mono flex items-center">
              {proposal.proposer?.startsWith('AI.Gov') 
                ? proposal.proposer 
                : (
                  <div className="flex items-center">
                    {shortenAddress(proposal.proposer || '')}
                    <button 
                      onClick={() => handleCopyAddress(proposal.proposer || '')}
                      className="ml-1 p-1 rounded-full hover:bg-gray-800 transition-colors"
                    >
                      {copyingAddress === proposal.proposer ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-400" />
                      )}
                    </button>
                  </div>
                )
              }
            </span>
          </div>
        {proposal.description && (
          <p className={styles.proposalDescription}>{proposal.description}</p>
        )}
        */}
      </div>

      <CardContent className="px-6 pb-4">
        {/* Asset and Amount Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col space-y-1">
            <span className="text-muted-foreground text-xs">Asset</span>
            <span className="text-foreground text-sm font-medium">
              {/* Use consistent token symbol with Investment Amount field */}
              {(() => {
                // Try to extract from title or description
                const titleMatch = proposal.title?.match(/\b(USDC|WBTC|ETH|DLOOP)\b/i);
                const descMatch = proposal.description?.match(/\b(USDC|WBTC|ETH|DLOOP)\b/i);

                if (titleMatch) return titleMatch[1].toUpperCase();
                if (descMatch) return descMatch[1].toUpperCase();

                return getTokenSymbol(proposal.token?.toString() || '');
              })()}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-muted-foreground text-xs">
              {proposal.type === 'invest' ? 'Investment Amount' : 'Withdrawal Amount'}
            </span>
            <span className="text-foreground text-sm font-medium">
              {/* Extract amount from proposal title if missing */}
              {(() => {
                if (proposal.amount && proposal.amount !== '0') {
                  return `${formatAmount(proposal.amount)} ${getTokenSymbol(proposal.token?.toString() || '')}`;
                }

                // Try to extract from title or description
                const titleMatch = proposal.title?.match(/\b(\d+)\s*(USDC|WBTC|ETH|DLOOP)\b/i);
                const descMatch = proposal.description?.match(/\b(\d+)\s*(USDC|WBTC|ETH|DLOOP)\b/i);

                if (titleMatch) {
                  return `${titleMatch[1]} ${titleMatch[2].toUpperCase()}`;
                } else if (descMatch) {
                  return `${descMatch[1]} ${descMatch[2].toUpperCase()}`;
                }

                return `1 ${getTokenSymbol(proposal.token?.toString() || '')}`;
              })()}
            </span>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Type</span>
            <span className={`font-medium capitalize ${proposal.type === 'invest' ? 'text-green-500' : 'text-orange-500'}`}>
              {/* Use the actual proposal type */}
              {proposal.type === 'invest' || proposal.type === 'Investment' || proposal.type === 0 ? 'Invest' : 'Divest'}
            </span>
          </div>

          {/* Countdown for active proposals, or result for inactive ones */}
          {isActive ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ends</span>
                <span className="text-foreground font-medium">{formattedDeadline}</span>
              </div>
              {proposal.deadline && (
                <div className="mt-2 text-sm border border-dark-gray rounded-md p-2 bg-gray-900/30 transition-all duration-300 hover:border-accent/30">
                  <CountdownTimer 
                    endTime={proposal.deadline}
                    className="w-full"
                    onComplete={() => console.log(`Proposal ${proposal.id} voting has ended`)}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Result</span>
              <span className="text-foreground font-medium">
                {proposal.forVotes ? `${Number(proposal.forVotes) / (Number(proposal.forVotes) + Number(proposal.againstVotes)) * 100}%` : '0%'} Yes
              </span>
            </div>
          )}
        </div>

        {/* Voting Progress Section - Full Width */}
        <div className="space-y-4 w-full">
          {/* Quorum Progress */}
          <div className="w-full">
            <div className="relative h-2 bg-muted/20 dark:bg-muted/10 rounded-full overflow-hidden w-full shadow-inner">
              <motion.div 
                className={`absolute left-0 top-0 h-full rounded-full ${
                  proposal.quorumMet 
                    ? 'bg-green-500/80 dark:bg-green-500/90' 
                    : 'bg-blue-500/80 dark:bg-blue-500/90'
                }`}
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(Math.max(isNaN(totalVotes) ? 0 : (totalVotes / 100000) * 100, 0), 100)}%` 
                }}
                transition={{ 
                  duration: 1, 
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.05
                }}
                key={`quorum-${proposal.id}-${totalVotes}`}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span className={proposal.quorumMet ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                Quorum Progress: {totalVotes.toLocaleString()} / 100,000 DLOOP 
                {proposal.quorumMet && ' ✓'}
              </span>
              {!proposal.quorumMet && totalVotes < 1000000 && (
                <span>{(100000 - totalVotes).toLocaleString()} more needed</span>
              )}
            </div>
          </div>

          {/* For Votes */}
          <div className="w-full">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-sm font-medium text-emerald-500 dark:text-emerald-400">
                For ({forPercentage > 0 ? Math.round(forPercentage) : 0}%)
              </span>
              <span className="text-xs text-emerald-500/70 dark:text-emerald-400/70">
                {Math.round(forVotes).toLocaleString()} DLOOP
              </span>
            </div>

            <div className="relative h-3 bg-muted/20 dark:bg-muted/10 rounded-full overflow-hidden w-full shadow-inner">
              <motion.div 
                className="absolute left-0 top-0 h-full rounded-full bg-emerald-500/80 dark:bg-emerald-500/90"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(Math.max(isNaN(forPercentage) ? 0 : forPercentage, 0), 100)}%` 
                }}
                transition={{ 
                  duration: 1, 
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.1
                }}
                key={`for-${proposal.id}-${forVotes}`}
              />
            </div>
          </div>

          {/* Against Votes */}
          <div className="w-full">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-sm font-medium text-red-500 dark:text-red-400">
                Against ({againstPercentage > 0 ? Math.round(againstPercentage) : 0}%)
              </span>
              <span className="text-xs text-red-500/70 dark:text-red-400/70">
                {Math.round(againstVotes).toLocaleString()} DLOOP
              </span>
            </div>

            <div className="relative h-3 bg-muted/20 dark:bg-muted/10 rounded-full overflow-hidden w-full shadow-inner">
              <motion.div 
                className="absolute left-0 top-0 h-full rounded-full bg-red-500/80 dark:bg-red-500/90"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${Math.min(Math.max(isNaN(againstPercentage) ? 0 : againstPercentage, 0), 100)}%`
                }}
                transition={{ 
                  duration: 1, 
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.3
                }}
                key={`against-${proposal.id}-${againstVotes}`}
              />
            </div>
          </div>
        </div>
      </CardContent>      {/* Action Buttons */}
      <CardFooter className="px-6 pt-0">
        <div className="bg-muted/30 p-4 rounded-lg w-full">
          {/* Show execution button for passed proposals */}
          {canExecuteProposal(proposal) ? (
            <div className="w-full">
              <div className="mb-3 px-4 py-2.5 rounded-md text-sm bg-green-50 border border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
                <div className="flex items-center">
                  <span className="flex-shrink-0 text-green-600 dark:text-green-400 mr-2">
                    <CheckCircle size={16} />
                  </span>
                  <span>This proposal has passed and is ready for execution!</span>
                </div>
              </div>
              <Button 
                variant="default"
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium transition-all duration-200"
                onClick={handleExecute}
                disabled={isExecuting || !isConnected || !isCorrectNetwork}
                aria-label={`Execute proposal ${proposal.id}: ${proposal.title}`}
              >
                <Play className="w-4 h-4 mr-2" />
                {isExecuting ? 'Executing...' : 'Execute Proposal'}
              </Button>
            </div>
          ) : proposal.status === 'passed' && !proposal.executed ? (
            <div className="w-full">
              <div className="mb-3 px-4 py-2.5 rounded-md text-sm bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
                <div className="flex items-center">
                  <span className="flex-shrink-0 text-amber-600 dark:text-amber-400 mr-2">
                    <Clock size={16} />
                  </span>
                  <div>
                    <div>This proposal has passed but is in timelock period.</div>
                    {proposal.deadline && (
                      <div className="text-xs mt-1 opacity-75">
                        Execution available: {(() => {
                          try {
                            const votingEndTime = new Date(proposal.deadline).getTime();
                            const executionDelay = 2 * 24 * 60 * 60 * 1000; // 2 days
                            const canExecuteAfter = votingEndTime + executionDelay;
                            return new Date(canExecuteAfter).toLocaleString();
                          } catch {
                            return 'After timelock period';
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline"
                className="w-full h-12 opacity-50 cursor-not-allowed"
                disabled={true}
                aria-label="Proposal in timelock period"
              >
                <Clock className="w-4 h-4 mr-2" />
                Timelock Period Active
              </Button>
            </div>
          ) : proposal.status === 'active' ? (
            <>
              {/* Show message when user can't vote */}
              {isConnected && (isProposer || voteStatus.hasVoted || (!isCheckingBalance && !hasDloopTokens)) && (
                <div className="mb-3 px-4 py-2.5 rounded-md text-sm bg-muted/50 border border-muted-foreground/10 text-muted-foreground/90 dark:text-muted-foreground/80">
                  {isProposer ? (
                    <div className="flex items-center">
                      <span className="flex-shrink-0 text-amber-500 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                      </span>
                      <span>You cannot vote on your own proposal</span>
                    </div>
                  ) : voteStatus.hasVoted ? (
                    <div className="flex items-center">
                      <span className="flex-shrink-0 text-blue-500 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                      <span>You have already voted <span className={voteStatus.support ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>{ voteStatus.support ? 'For' : 'Against' }</span> this proposal</span>
                    </div>
                  ) : !hasDloopTokens ? (
                    <div className="flex items-center">
                      <span className="flex-shrink-0 text-purple-500 mr-2">
                        <Coins size={16} />
                      </span>
                      <span>
                        You need <span className="text-purple-400 font-medium">DLOOP</span> tokens to vote on this proposal
                        <a href="/delegations" className="ml-2 text-purple-400 underline hover:text-purple-300 transition-colors duration-200">Get tokens</a>
                      </span>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className={`flex-1 h-12 transition-all duration-200 ${isProposer || voteStatus.hasVoted || (!isCheckingBalance && !hasDloopTokens) || !isCorrectNetwork ? 
                    'opacity-70 cursor-not-allowed border-muted-foreground/20 text-muted-foreground/60 dark:border-muted-foreground/20 dark:text-muted-foreground/40' : 
                    'border-green-500/50 text-green-600 hover:bg-green-50 hover:border-green-500 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300'}`}
                  onClick={() => handleVote(true)}
                  disabled={isVoting || !isConnected || isProposer || voteStatus.hasVoted || (!isCheckingBalance && !hasDloopTokens) || !isCorrectNetwork}
                  aria-label={`Vote in favor of proposal ${proposal.id}: ${proposal.title}`}
                  aria-describedby={`proposal-${proposal.id}-description`}
                  title={isProposer ? 'You cannot vote on your own proposal' : 
                        voteStatus.hasVoted ? `You have already voted ${voteStatus.support ? 'For' : 'Against'} this proposal` : 
                        !isConnected ? 'Please connect your wallet to vote' : 
                        !hasDloopTokens ? 'You need DLOOP tokens to vote on this proposal' :
                        !isCorrectNetwork ? 'Please connect to Sepolia Testnet' :
                        'Vote in favor of this proposal'}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isVoting ? 'Voting...' : 'Vote For'}
                </Button>
                <Button 
                  variant="outline"
                  className={`flex-1 h-12 transition-all duration-200 ${isProposer || voteStatus.hasVoted || (!isCheckingBalance && !hasDloopTokens) || !isCorrectNetwork ? 
                    'opacity-70 cursor-not-allowed border-muted-foreground/20 text-muted-foreground/60 dark:border-muted-foreground/20 dark:text-muted-foreground/40' : 
                    'border-red-500/50 text-red-600 hover:bg-red-50 hover:border-red-500 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300'}`}
                  onClick={() => handleVote(false)}
                  disabled={isVoting || !isConnected || isProposer || voteStatus.hasVoted || (!isCheckingBalance && !hasDloopTokens) || !isCorrectNetwork}
                  aria-label={`Vote against proposal ${proposal.id}: ${proposal.title}`}
                  aria-describedby={`proposal-${proposal.id}-description`}
                  title={isProposer ? 'You cannot vote on your own proposal' : 
                        voteStatus.hasVoted ? `You have already voted ${voteStatus.support ? 'For' : 'Against'} this proposal` : 
                        !isConnected ? 'Please connect your wallet to vote' : 
                        !hasDloopTokens ? 'You need DLOOP tokens to vote on this proposal' :
                        !isCorrectNetwork ? 'Please connect to Sepolia Testnet' :
                        'Vote against this proposal'}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {isVoting ? 'Voting...' : 'Vote Against'}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </CardFooter>
      </NetworkValidationWrapper>


      {isPlaceholder && (
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-yellow-900/20 text-yellow-500 text-xs">
            Preview
          </Badge>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Skeleton version of the proposal card for loading states
 */
export const ProposalCardSkeleton: React.FC<BaseComponentProps> = ({
  className = '',
  ...props
}) => {
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
            <Skeleton className="h-4 w-16"/>
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

export default UnifiedProposalCard;