/**
 * RealTime Proposal Card Component
 * 
 * An enhanced version of the proposal card with real-time updates,
 * improved token resolution, and the enhanced proposal type system.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useQueryProposalVoting } from '@/hooks/query';
import { useTokenInfo, useTokenAmount } from '@/hooks/useEnhancedTokenInfo';
import { useProposalEvents } from '@/hooks/useRealTimeEvents';
import { 
  ProposalStatus, 
  ProposalType, 
  toProposalStatus, 
  toProposalType
} from '@/types/proposals';
import { Proposal } from '@/types';
import { RealTimeProposalCardProps, EnhancedProposal } from './types';
import { TokenChain } from '@/services/enhancedTokenService';
// Import event types as needed for real-time updates
import { useFeatureFlag } from '@/config/feature-flags';
import toast from 'react-hot-toast';

// Using types imported from './types'

/**
 * RealTime Proposal Card Component
 * 
 * This component extends the proposal card with real-time updates
 * for votes, token values, and status changes.
 */
export function RealTimeProposalCard({
  proposal,
  onActionComplete,
  onRefresh,
  implementation,
  expanded = false,
  realTimeUpdates = true,
  chain = TokenChain.ETHEREUM,
  className = ''
}: RealTimeProposalCardProps) {
  // State for optimistic UI updates
  const [localProposal, setLocalProposal] = useState<EnhancedProposal>(() => {
    // Convert the incoming proposal to our EnhancedProposal type
    const enhancedProposal: EnhancedProposal = {
      // Default values and type coercion
      id: proposal.id,
      title: proposal.title || '',
      description: proposal.description || '',
      proposer: proposal.proposer || '',
      token: proposal.token || '',
      amount: proposal.amount || '0',
      status: proposal.status || ProposalStatus.ACTIVE,
      type: proposal.type || ProposalType.OTHER,
      createdAt: typeof proposal.createdAt === 'number' ? proposal.createdAt : 0,
      endTime: typeof proposal.endTime === 'number' ? proposal.endTime : 0,
      endsIn: 'endsIn' in proposal ? proposal.endsIn : '',
      
      // Required for AssetProposal compatibility
      canceled: 'canceled' in proposal ? Boolean(proposal.canceled) : false,
      executed: 'executed' in proposal ? Boolean(proposal.executed) : false,
      executionTime: 'executionTime' in proposal ? proposal.executionTime : undefined,
      metadata: 'metadata' in proposal ? proposal.metadata : {},
      
      // Additional properties for real-time updates
      hasVoted: 'hasVoted' in proposal ? Boolean(proposal.hasVoted) : false,
      vote: 'vote' in proposal ? Boolean(proposal.vote) : false,
      forVotes: 'forVotes' in proposal ? proposal.forVotes : 0,
      againstVotes: 'againstVotes' in proposal ? proposal.againstVotes : 0
    };
    
    return enhancedProposal;
  });
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [hasRealTimeUpdate, setHasRealTimeUpdate] = useState(false);
  
  // Get feature flags
  const useWagmiFlag = useFeatureFlag('useWagmiProposals');
  const resolvedImplementation = implementation || (useWagmiFlag ? 'wagmi' : 'ethers');
  
  // Use enhanced token resolution
  const { token, symbol } = useTokenInfo(
    proposal.token,
    { chain }
  );
  
  // Format token amount with proper decimals
  const { formattedAmount } = useTokenAmount(
    proposal.amount,
    proposal.token,
    { 
      decimals: token?.decimals || 18,
      includeSymbol: true,
      chain
    }
  );
  
  // Use optimized voting hook
  const {
    voteOnProposal,
    isVoting
  } = useQueryProposalVoting({
    implementation: resolvedImplementation,
    showNotifications: true,
    autoInvalidateQueries: true
  });
  
  // Subscribe to this specific proposal's events if real-time updates are enabled
  const {
    voteEvents
    // isSubscribed is available but not currently used
  } = useProposalEvents({
    proposalId: proposal.id,
    includeVotes: true,
    implementation: resolvedImplementation,
    enabled: realTimeUpdates,
    onVoteCast: (event) => {
      // Update local proposal state with new vote counts
      if (event.data && event.data.proposalId === proposal.id.toString()) {
        // Show real-time update indicator
        setHasRealTimeUpdate(true);
        
        // Update local proposal state optimistically
        setLocalProposal((prev) => {
          const forVotes = typeof prev.forVotes === 'string'
            ? parseInt(prev.forVotes, 10)
            : prev.forVotes;
            
          const againstVotes = typeof prev.againstVotes === 'string'
            ? parseInt(prev.againstVotes, 10)
            : prev.againstVotes;
          
          const voteValue = event.data.support;
          const voteAmount = parseInt(event.data.votes, 10) || 1;
          
          return {
            ...prev,
            forVotes: voteValue ? forVotes + voteAmount : forVotes,
            againstVotes: !voteValue ? againstVotes + voteAmount : againstVotes,
            // If this user voted, update hasVoted
            hasVoted: event.data.voter === window.ethereum?.selectedAddress ? true : prev.hasVoted,
            vote: event.data.voter === window.ethereum?.selectedAddress ? voteValue : prev.vote
          };
        });
        
        // Clear update indicator after 3 seconds
        setTimeout(() => {
          setHasRealTimeUpdate(false);
        }, 3000);
      }
    },
    onProposalExecuted: (event) => {
      // Update local proposal state if executed
      if (event.data && event.data.proposalId === proposal.id.toString()) {
        // Show real-time update indicator
        setHasRealTimeUpdate(true);
        
        // Update local proposal state
        setLocalProposal(prev => ({
          ...prev,
          executed: true,
          status: ProposalStatus.EXECUTED
        }));
        
        // Show toast notification
        toast.success(`Proposal ${proposal.id} has been executed!`);
        
        // Refresh parent component if needed
        if (onRefresh) {
          onRefresh();
        }
        
        // Clear update indicator after 3 seconds
        setTimeout(() => {
          setHasRealTimeUpdate(false);
        }, 3000);
      }
    }
  });
  
  // Handle vote action
  const handleVote = useCallback((vote: boolean) => {
    voteOnProposal({
      // Type cast to satisfy the voteOnProposal API which expects a specific type
      proposal: localProposal as unknown as Proposal,
      vote
    }, {
      onSuccess: () => {
        // Update local proposal state optimistically
        setLocalProposal(prev => ({
          ...prev,
          hasVoted: true,
          vote
        }));
        
        // Call parent callbacks
        if (onActionComplete) onActionComplete();
        if (onRefresh) onRefresh();
      }
    });
  }, [localProposal, voteOnProposal, onActionComplete, onRefresh]);
  
  // Handle execute action
  const handleExecute = useCallback(() => {
    // This would call the execute function from a hook
    // For now, we'll just simulate it with a toast
    toast.success('Executing proposal...');
    
    // Update local proposal state optimistically
    setLocalProposal(prev => ({
      ...prev,
      executed: true,
      status: ProposalStatus.EXECUTED
    }));
    
    // Call parent callbacks
    if (onActionComplete) onActionComplete();
    if (onRefresh) onRefresh();
  }, [onActionComplete, onRefresh]);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Update local proposal when parent proposal changes
  useEffect(() => {
    // Convert the incoming proposal to our EnhancedProposal type
    const enhancedProposal: EnhancedProposal = {
      // Default values and type coercion
      id: proposal.id,
      title: proposal.title || '',
      description: proposal.description || '',
      proposer: proposal.proposer || '',
      token: proposal.token || '',
      amount: proposal.amount || '0',
      status: proposal.status || ProposalStatus.ACTIVE,
      type: proposal.type || ProposalType.OTHER,
      createdAt: typeof proposal.createdAt === 'number' ? proposal.createdAt : 0,
      endTime: typeof proposal.endTime === 'number' ? proposal.endTime : 0,
      endsIn: 'endsIn' in proposal ? proposal.endsIn : '',
      
      // Required for AssetProposal compatibility
      canceled: 'canceled' in proposal ? Boolean(proposal.canceled) : false,
      executed: 'executed' in proposal ? Boolean(proposal.executed) : false,
      executionTime: 'executionTime' in proposal ? proposal.executionTime : undefined,
      metadata: 'metadata' in proposal ? proposal.metadata : {},
      
      // Additional properties for real-time updates
      hasVoted: 'hasVoted' in proposal ? Boolean(proposal.hasVoted) : false,
      vote: 'vote' in proposal ? Boolean(proposal.vote) : false,
      forVotes: 'forVotes' in proposal ? proposal.forVotes : 0,
      againstVotes: 'againstVotes' in proposal ? proposal.againstVotes : 0
    };
    
    setLocalProposal(enhancedProposal);
  }, [proposal]);
  
  // Determine proposal status class
  const getStatusClass = () => {
    const status = typeof localProposal.status === 'string'
      ? toProposalStatus(localProposal.status)
      : localProposal.status;
      
    switch (status) {
      case ProposalStatus.ACTIVE:
        return 'status-active';
      case ProposalStatus.PASSED:
        return 'status-passed';
      case ProposalStatus.FAILED:
        return 'status-failed';
      case ProposalStatus.EXECUTED:
        return 'status-executed';
      case ProposalStatus.CANCELED:
        return 'status-canceled';
      default:
        return '';
    }
  };
  
  // Determine proposal type display
  const getProposalTypeDisplay = () => {
    const type = typeof localProposal.type === 'string'
      ? toProposalType(localProposal.type)
      : localProposal.type;
      
    switch (type) {
      case ProposalType.INVEST:
        return 'Invest';
      case ProposalType.DIVEST:
        return 'Divest';
      case ProposalType.GOVERNANCE:
        return 'Governance';
      case ProposalType.UPGRADE:
        return 'Protocol Upgrade';
      case ProposalType.TREASURY:
        return 'Treasury';
      case ProposalType.EMERGENCY:
        return 'Emergency';
      case ProposalType.OTHER:
        return 'Other';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className={`
      proposal-card 
      ${getStatusClass()} 
      ${isExpanded ? 'expanded' : ''} 
      ${hasRealTimeUpdate ? 'real-time-update' : ''}
      ${className}
    `}>
      {/* Real-time indicator */}
      {hasRealTimeUpdate && (
        <div className="real-time-indicator">
          <span className="pulse-dot"></span>
          <span>Live Update</span>
        </div>
      )}
      
      {/* Card header */}
      <div className="card-header">
        <div className="proposal-id">#{localProposal.id.toString()}</div>
        <div className="proposal-type">{getProposalTypeDisplay()}</div>
        <div className="proposal-status">{localProposal.status}</div>
      </div>
      
      {/* Card body */}
      <div className="card-body">
        <h3 className="proposal-title">{localProposal.title}</h3>
        
        <div className="proposal-details">
          <div className="detail-row">
            <span className="detail-label">Proposer:</span>
            <span className="detail-value address">{localProposal.proposer}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-value amount">
              {formattedAmount || `${localProposal.amount} ${symbol || localProposal.token}`}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Ends In:</span>
            <span className="detail-value">{localProposal.endsIn}</span>
          </div>
          
          {/* Vote counts */}
          <div className="vote-bars">
            <div className="vote-row">
              <span className="vote-type for">For</span>
              <div className="vote-bar">
                <div 
                  className="vote-progress for"
                  style={{ 
                    width: `${getTotalVotes() > 0 ? (getForVotes() / getTotalVotes()) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <span className="vote-count">{getForVotes()}</span>
            </div>
            
            <div className="vote-row">
              <span className="vote-type against">Against</span>
              <div className="vote-bar">
                <div 
                  className="vote-progress against"
                  style={{ 
                    width: `${getTotalVotes() > 0 ? (getAgainstVotes() / getTotalVotes()) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <span className="vote-count">{getAgainstVotes()}</span>
            </div>
          </div>
        </div>
        
        {/* Expanded content */}
        {isExpanded && (
          <div className="expanded-content">
            <div className="proposal-description">{localProposal.description}</div>
            
            <div className="advanced-details">
              <div className="detail-row">
                <span className="detail-label">Created At:</span>
                <span className="detail-value">
                  {new Date(localProposal.createdAt * 1000).toLocaleString()}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">End Time:</span>
                <span className="detail-value">
                  {new Date(localProposal.endTime * 1000).toLocaleString()}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Token:</span>
                <span className="detail-value">
                  {token ? `${token.symbol} (${token.name})` : localProposal.token}
                </span>
              </div>
              
              {/* Real-time events if available */}
              {realTimeUpdates && voteEvents.length > 0 && (
                <div className="real-time-events">
                  <h4>Recent Votes</h4>
                  <ul className="event-list">
                    {voteEvents.slice(-3).map((event, index) => (
                      <li key={index} className="event-item">
                        <span className="event-address">{truncateAddress(event.data.voter)}</span>
                        <span className={`event-vote ${event.data.support ? 'for' : 'against'}`}>
                          {event.data.support ? 'For' : 'Against'}
                        </span>
                        <span className="event-amount">{event.data.votes} votes</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Card footer */}
      <div className="card-footer">
        {/* Show voting buttons if proposal is active */}
        {localProposal.status === ProposalStatus.ACTIVE && !localProposal.hasVoted && (
          <div className="voting-buttons">
            <button 
              className="vote-button for"
              onClick={() => handleVote(true)}
              disabled={isVoting}
            >
              Vote For
            </button>
            <button 
              className="vote-button against"
              onClick={() => handleVote(false)}
              disabled={isVoting}
            >
              Vote Against
            </button>
          </div>
        )}
        
        {/* Show user's vote if they've voted */}
        {localProposal.hasVoted && (
          <div className="user-vote">
            <span>Your vote: </span>
            <span className={`vote-value ${localProposal.vote ? 'for' : 'against'}`}>
              {localProposal.vote ? 'For' : 'Against'}
            </span>
          </div>
        )}
        
        {/* Show execute button if proposal has passed but not executed */}
        {localProposal.status === ProposalStatus.PASSED && !localProposal.executed && (
          <button 
            className="execute-button"
            onClick={handleExecute}
          >
            Execute Proposal
          </button>
        )}
        
        {/* Toggle expanded view button */}
        <button 
          className="toggle-expand-button"
          onClick={toggleExpanded}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>
    </div>
  );
  
  // Helper functions
  function getForVotes(): number {
    return typeof localProposal.forVotes === 'string'
      ? parseInt(localProposal.forVotes, 10)
      : localProposal.forVotes as number;
  }
  
  function getAgainstVotes(): number {
    return typeof localProposal.againstVotes === 'string'
      ? parseInt(localProposal.againstVotes, 10)
      : localProposal.againstVotes as number;
  }
  
  function getTotalVotes(): number {
    return getForVotes() + getAgainstVotes();
  }
  
  function truncateAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
