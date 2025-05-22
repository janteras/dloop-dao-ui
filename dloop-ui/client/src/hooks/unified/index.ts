/**
 * Unified Hooks
 * 
 * This file exports all unified hooks to simplify imports
 * and maintain a clean module structure.
 */

export { useUnifiedProposalList } from './useUnifiedProposalList';
export type { UnifiedProposalListOptions, UnifiedProposalListResult } from './useUnifiedProposalList';

export { useUnifiedProposalVoting } from './useUnifiedProposalVoting';
export type { 
  UnifiedProposalVotingOptions,
  UnifiedVotingResult,
  VoteParams,
  VoteResult,
  VoteStatus
} from './useUnifiedProposalVoting';

export { useUnifiedWallet } from './useUnifiedWallet';
export type { UnifiedWalletOptions, UnifiedWalletResult } from './useUnifiedWallet';
