/**
 * Unified Contract Interfaces
 * 
 * Provides a consistent interface for contract interactions regardless of implementation.
 * This allows for seamless switching between Ethers and Wagmi implementations
 * during the migration process.
 */

import { AssetDaoProposal } from '@/services/wagmi/enhancedAssetDaoContractService';

/**
 * Base contract implementation type
 */
export type ContractImplementation = 'ethers' | 'wagmi' | 'hybrid';

/**
 * Implementation details for telemetry and status indicators
 */
export interface ImplementationDetails {
  name: string;
  implementation: ContractImplementation;
  responseTime?: number;
  lastUpdated?: number;
  status: 'active' | 'error' | 'migrating' | 'deprecated';
  errorCount?: number;
  successCount?: number;
}

/**
 * Base hook return type for all unified contract hooks
 */
export interface UnifiedHookBase {
  isLoading: boolean;
  error: Error | null;
  implementation: ContractImplementation;
  implementationDetails?: ImplementationDetails;
}

/**
 * Proposal list hook return type
 */
export interface UnifiedProposalListResult extends UnifiedHookBase {
  proposals: AssetDaoProposal[];
  refetch: () => void;
}

/**
 * Single proposal hook return type
 */
export interface UnifiedProposalResult extends UnifiedHookBase {
  proposal: AssetDaoProposal | null;
  refetch: () => void;
}

/**
 * Proposal creation parameters and result
 */
export interface UnifiedProposalCreationParams {
  title: string;
  description: string;
  token: string;
  amount: string;
  type: number;
}

export interface UnifiedProposalCreationResult extends UnifiedHookBase {
  submit: (params: UnifiedProposalCreationParams) => Promise<string | null>;
  isSubmitting: boolean;
  txHash: string | null;
}

/**
 * Voting hook return type
 */
export interface UnifiedVotingStatus extends UnifiedHookBase {
  hasVoted: boolean;
  support?: boolean;
  votes?: string;
  refetch: () => void;
}

export interface UnifiedVotingAction extends UnifiedHookBase {
  vote: (proposalId: number, support: boolean) => Promise<string | null>;
  isVoting: boolean;
  txHash: string | null;
}

/**
 * Proposal state hook return type
 */
export interface UnifiedProposalState extends UnifiedHookBase {
  state: AssetDaoProposal['status'] | null;
  refetch: () => void;
}

/**
 * Unified AssetDao contract interface
 */
export interface UnifiedAssetDaoContract {
  implementation: ContractImplementation;
  useGetAllProposals: () => UnifiedProposalListResult;
  useGetProposal: (proposalId: number) => UnifiedProposalResult;
  useCreateProposal: () => { createProposal: (params: UnifiedProposalCreationParams) => UnifiedProposalCreationResult };
  useVoteOnProposal: () => { voteOnProposal: (proposalId: number, support: boolean) => UnifiedVotingAction };
  useCheckVotingStatus: (proposalId: number, voter?: string) => UnifiedVotingStatus;
  useProposalState: (proposalId: number) => UnifiedProposalState;
  useProposalEvents?: (callback: (event: any) => void) => void;
}
