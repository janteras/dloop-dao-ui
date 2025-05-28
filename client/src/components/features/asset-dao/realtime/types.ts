/**
 * Type definitions for the real-time components
 */

import { ReactNode } from 'react';
import { ProposalStatus, ProposalType, AssetProposal } from '@/types/proposals';
import { TokenChain } from '@/services/enhancedTokenService';
import { Proposal } from '@/types';

/**
 * Props for the RealTimeAssetDAO component
 */
export interface RealTimeAssetDAOProps {
  /**
   * Initial active tab (proposal status filter)
   */
  initialTab?: ProposalStatus | string;
  
  /**
   * Initial type filter
   */
  initialTypeFilter?: ProposalType | string | 'all';
  
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: 'ethers' | 'wagmi';
  
  /**
   * Whether to use real-time updates
   */
  realTimeUpdates?: boolean;
  
  /**
   * WebSocket URL for real-time events
   */
  wsUrl?: string;
  
  /**
   * Chain to use for token resolution
   */
  chain?: TokenChain;
  
  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Children elements
   */
  children?: ReactNode;
}

/**
 * Real-time indicator state
 */
export interface RealTimeIndicator {
  active: boolean;
  lastUpdate: number;
  eventType?: string;
}

/**
 * Metrics state for tracking performance
 */
export interface RealTimeMetrics {
  eventsReceived: number;
  proposalCreatedEvents: number;
  voteEvents: number;
  averageUpdateTime: number;
  lastRefreshTime: number;
}

/**
 * Extended proposal interface that combines properties from both Proposal and AssetProposal
 */
export interface EnhancedProposal {
  id: string | number;
  title: string;
  description?: string;
  proposer: string;
  token: string;
  amount: string | number;
  status: string;
  type: string;
  createdAt: number;
  endTime: number;
  endsIn: string;
  forVotes: string | number;
  againstVotes: string | number;
  canceled: boolean;
  executed: boolean;
  executionTime?: number | undefined;
  metadata?: Record<string, unknown> | undefined;
  
  // Additional properties for real-time updates
  hasVoted: boolean;
  vote?: unknown | undefined;
}

/**
 * Props for the RealTimeProposalCard component
 */
export interface RealTimeProposalCardProps {
  /**
   * Proposal data to display
   */
  proposal: Proposal | AssetProposal | EnhancedProposal;
  
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
   * Whether to use real-time updates
   */
  realTimeUpdates?: boolean;
  
  /**
   * Chain to use for token resolution
   */
  chain?: TokenChain;
  
  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Children elements
   */
  children?: ReactNode;
}
