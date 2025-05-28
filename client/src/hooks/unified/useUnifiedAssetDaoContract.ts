/**
 * Unified Asset DAO Contract Hook
 * 
 * This hook provides a consistent interface for interacting with the Asset DAO contract
 * using either Ethers.js or Wagmi implementations based on feature flags.
 */

import { useCallback, useMemo } from 'react';
import { useAppConfig, MigrationFeatureFlag } from '@/config/app-config';
import { Web3Implementation } from '@/types/web3-types';
import { useUnifiedContract, ContractReadResult, ContractWriteResult } from '@/hooks/useUnifiedContract';
import { assetDaoContract, assetDaoAbi } from '@/lib/contract-configs';
import { ProposalType, ProposalState, ProposalDetails } from '@/services/enhanced-assetDaoService';
import { useMigrationTelemetry } from '@/hooks/useMigrationTelemetry';
import { formatEther, parseEther } from 'viem';

/**
 * Options for the useUnifiedAssetDaoContract hook
 */
export interface AssetDaoContractOptions {
  implementation?: Web3Implementation;
  contractAddress?: string;
}

/**
 * Unified AssetDAO contract hook that provides a consistent interface for interacting
 * with the AssetDAO contract using either Ethers or Wagmi based on feature flags
 */
export function useUnifiedAssetDaoContract(options: AssetDaoContractOptions = {}) {
  // Check if we should use Wagmi implementation based on feature flag
  const useWagmiFlag = useAppConfig((state) => state.featureFlags[MigrationFeatureFlag.ASSET_DAO]);
  const markComponentMigrated = useAppConfig((state) => state.markComponentMigrated);
  
  // Resolve which implementation to use
  const resolvedImplementation = options.implementation || (useWagmiFlag ? 'wagmi' : 'ethers');
  
  // Setup telemetry for performance tracking
  const telemetry = useMigrationTelemetry({
    component: 'AssetDaoContract',
    implementation: resolvedImplementation
  });
  
  // Mark this component as being migrated
  useMemo(() => {
    markComponentMigrated('AssetDaoContract');
  }, [markComponentMigrated]);

  // Get contract address from options or default
  const contractAddress = options.contractAddress || assetDaoContract.address;
  
  // Use the unified contract hook for the base functionality
  const { read, write, implementation } = useUnifiedContract(contractAddress, assetDaoAbi);

  /**
   * Helper function to map proposal data from contract to application format
   */
  const mapProposalFromContract = useCallback((proposal: any, proposalState?: number): ProposalDetails => {
    // Determine the proposal state
    let state = ProposalState.Active;
    
    if (proposalState !== undefined) {
      state = proposalState as ProposalState;
    } else {
      // If no state provided, infer from proposal data
      if (proposal.executed) {
        state = ProposalState.Executed;
      } else if (proposal.canceled) {
        state = ProposalState.Canceled;
      }
    }

    // Calculate dates based on blocks (placeholder implementation)
    const currentTimestamp = Date.now();
    const createdAt = new Date(currentTimestamp - 86400000); // Assume created 1 day ago as placeholder
    const votingEnds = new Date(currentTimestamp + 86400000); // Assume ends 1 day from now as placeholder
    
    // Parse amount with proper decimal handling
    const amountNumber = proposal.amount ? Number(formatEther(proposal.amount.toString())) : 0;
    
    return {
      id: Number(proposal.id),
      title: proposal.title || `Proposal #${proposal.id}`,
      description: proposal.description || '',
      proposer: proposal.proposer,
      amount: amountNumber,
      token: proposal.token,
      type: Number(proposal.proposalType),
      state,
      createdAt,
      votingEnds,
      yesVotes: Number(proposal.yesVotes || 0),
      noVotes: Number(proposal.noVotes || 0),
      abstainVotes: Number(proposal.abstainVotes || 0),
      executed: Boolean(proposal.executed),
      canceled: Boolean(proposal.canceled),
    };
  }, []);

  /**
   * Get a proposal by ID
   */
  const getProposal = useCallback(async (proposalId: number): Promise<ContractReadResult<ProposalDetails>> => {
    const startTime = performance.now();
    
    try {
      const proposal = await read<any>('getProposal', [proposalId]);
      const proposalState = await read<number>('getProposalState', [proposalId]);
      
      const endTime = performance.now();
      telemetry.recordSuccess('getProposal', endTime - startTime);
      
      if (!proposal) return null;
      
      return mapProposalFromContract(proposal, proposalState);
    } catch (error) {
      const endTime = performance.now();
      telemetry.recordError('getProposal', error, endTime - startTime);
      throw error;
    }
  }, [read, mapProposalFromContract, telemetry]);

  /**
   * Get all proposals with pagination
   */
  const getProposals = useCallback(async (
    options: { limit?: number; offset?: number; status?: ProposalState; type?: ProposalType | 'all' } = {}
  ): Promise<ContractReadResult<ProposalDetails[]>> => {
    const startTime = performance.now();
    
    try {
      // Get the total count of proposals
      const proposalCount = await read<number>('getProposalCount');
      
      if (!proposalCount) return [];
      
      // Setup pagination
      const limit = options.limit || 10;
      const offset = options.offset || 0;
      const endIndex = Math.min(offset + limit, Number(proposalCount));
      
      // Fetch all proposals in the range
      const proposalPromises = [];
      for (let i = offset; i < endIndex; i++) {
        proposalPromises.push(getProposal(i));
      }
      
      const proposals = await Promise.all(proposalPromises);
      
      // Filter by status and type if specified
      const filteredProposals = proposals.filter(proposal => {
        if (!proposal) return false;
        
        let includeStatus = true;
        let includeType = true;
        
        if (options.status !== undefined) {
          includeStatus = proposal.state === options.status;
        }
        
        if (options.type !== undefined && options.type !== 'all') {
          includeType = proposal.type === options.type;
        }
        
        return includeStatus && includeType;
      });
      
      const endTime = performance.now();
      telemetry.recordSuccess('getProposals', endTime - startTime);
      
      return filteredProposals as ProposalDetails[];
    } catch (error) {
      const endTime = performance.now();
      telemetry.recordError('getProposals', error, endTime - startTime);
      throw error;
    }
  }, [read, getProposal, telemetry]);

  /**
   * Check if a user has voted on a proposal
   */
  const hasVoted = useCallback(async (
    proposalId: number, 
    address: string
  ): Promise<ContractReadResult<boolean>> => {
    const startTime = performance.now();
    
    try {
      const result = await read<boolean>('hasVoted', [proposalId, address]);
      
      const endTime = performance.now();
      telemetry.recordSuccess('hasVoted', endTime - startTime);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      telemetry.recordError('hasVoted', error, endTime - startTime);
      throw error;
    }
  }, [read, telemetry]);

  /**
   * Vote on a proposal
   */
  const voteOnProposal = useCallback(async (
    proposalId: number, 
    support: boolean,
    reason?: string
  ): Promise<ContractWriteResult> => {
    const startTime = performance.now();
    
    try {
      const args = reason ? [proposalId, support, reason] : [proposalId, support];
      const result = await write('vote', args);
      
      const endTime = performance.now();
      telemetry.recordSuccess('voteOnProposal', endTime - startTime);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      telemetry.recordError('voteOnProposal', error, endTime - startTime);
      throw error;
    }
  }, [write, telemetry]);

  /**
   * Execute a proposal
   */
  const executeProposal = useCallback(async (
    proposalId: number
  ): Promise<ContractWriteResult> => {
    const startTime = performance.now();
    
    try {
      const result = await write('executeProposal', [proposalId]);
      
      const endTime = performance.now();
      telemetry.recordSuccess('executeProposal', endTime - startTime);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      telemetry.recordError('executeProposal', error, endTime - startTime);
      throw error;
    }
  }, [write, telemetry]);

  /**
   * Create a new proposal
   */
  const createProposal = useCallback(async (
    title: string,
    description: string,
    proposalType: ProposalType,
    token: string,
    amount: number
  ): Promise<ContractWriteResult> => {
    const startTime = performance.now();
    
    try {
      // Convert amount to proper format
      const amountInWei = parseEther(amount.toString());
      
      const result = await write('createProposal', [
        title,
        description,
        proposalType,
        token,
        amountInWei
      ]);
      
      const endTime = performance.now();
      telemetry.recordSuccess('createProposal', endTime - startTime);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      telemetry.recordError('createProposal', error, endTime - startTime);
      throw error;
    }
  }, [write, telemetry]);

  /**
   * Get governance parameters
   */
  const getGovernanceParams = useCallback(async (): Promise<ContractReadResult<{
    quorum: number;
    votingPeriod: number;
    executionDelay: number;
  }>> => {
    const startTime = performance.now();
    
    try {
      const [quorum, votingPeriod, executionDelay] = await Promise.all([
        read<number>('quorum'),
        read<number>('votingPeriod'),
        read<number>('executionDelay')
      ]);
      
      const endTime = performance.now();
      telemetry.recordSuccess('getGovernanceParams', endTime - startTime);
      
      return {
        quorum: Number(quorum),
        votingPeriod: Number(votingPeriod),
        executionDelay: Number(executionDelay)
      };
    } catch (error) {
      const endTime = performance.now();
      telemetry.recordError('getGovernanceParams', error, endTime - startTime);
      throw error;
    }
  }, [read, telemetry]);

  // Return the combined interface with consistent methods regardless of implementation
  return {
    getProposal,
    getProposals,
    hasVoted,
    voteOnProposal,
    executeProposal,
    createProposal,
    getGovernanceParams,
    // Include implementation details for telemetry and status indicators
    implementation,
    telemetry: telemetry.data
  };
}
