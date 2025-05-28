/**
 * Unified AssetDAO Component Types
 * 
 * This file contains shared TypeScript interfaces for the unified AssetDAO components
 * to ensure consistent typing across implementations.
 */

import { Proposal, ProposalStatus, ProposalType } from '@/types';
import { TelemetryData } from '@/components/common/factory';

/**
 * Base props interface for implementation-specific components
 */
export interface BaseImplementationProps {
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: 'ethers' | 'wagmi';
  
  /**
   * Callback for implementation-specific telemetry
   */
  onTelemetry?: (data: TelemetryData) => void;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Props for the UnifiedProposalCard component
 */
export interface UnifiedProposalCardProps extends BaseImplementationProps {
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
   * Whether to show the expanded view with more details
   */
  expanded?: boolean;
}

/**
 * Props for the UnifiedAssetDAO component
 */
export interface UnifiedAssetDAOProps extends BaseImplementationProps {
  /**
   * Initial active tab (proposal status filter)
   */
  initialTab?: ProposalStatus;
  
  /**
   * Initial type filter
   */
  initialTypeFilter?: ProposalType | 'all';
}

/**
 * Props for the UnifiedCreateProposalModal component
 */
export interface UnifiedCreateProposalModalProps extends BaseImplementationProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  
  /**
   * Callback when the modal is closed
   */
  onClose: () => void;
  
  /**
   * Callback after successful proposal creation
   */
  onSuccess?: () => void;
}

/**
 * Telemetry event types for tracking migration metrics
 */
export enum TelemetryEventType {
  PROPOSAL_LIST_LOAD = 'proposal_list_load',
  PROPOSAL_VOTE = 'proposal_vote',
  PROPOSAL_EXECUTE = 'proposal_execute',
  PROPOSAL_CREATE = 'proposal_create',
  IMPLEMENTATION_SWITCH = 'implementation_switch'
}

/**
 * Vote response interface for consistent handling
 */
export interface VoteResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Execute proposal response interface
 */
export interface ExecuteResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}
