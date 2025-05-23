/**
 * Wagmi Asset DAO Contract Service
 * 
 * Provides Wagmi-specific implementation for interacting with the AssetDAO smart contract
 * using the Wagmi hooks-based approach for React integration.
 */

import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  type Address
} from 'wagmi';
import { 
  parseEther, 
  formatEther, 
  type TransactionReceipt 
} from 'viem';
import { sepolia } from 'viem/chains';
import { ProposalType, ProposalState, type ProposalDetails } from '@/services/enhanced-assetDaoService';
import { TokenSymbolResolver } from '@/services/tokenSymbolService';
import { Web3Error, Web3ErrorType } from '@/types/web3-types';
import { assetDaoAbi } from '@/lib/contract-configs';
import { useMemo } from 'react';

/**
 * Options for the Asset DAO Contract Service
 */
export interface AssetDaoServiceOptions {
  contractAddress: Address;
  chainId?: number;
}

/**
 * WagmiAssetDaoContractService provides methods for interacting with 
 * the AssetDAO contract using Wagmi hooks
 */
export class WagmiAssetDaoContractService {
  private readonly contractAddress: Address;
  private readonly chainId: number;

  /**
   * Create a new instance of the WagmiAssetDaoContractService
   * @param options Service configuration options
   */
  constructor(options: AssetDaoServiceOptions) {
    this.contractAddress = options.contractAddress;
    this.chainId = options.chainId || sepolia.id;
  }

  /**
   * Helper function to map proposal data from contract to application format
   * @param proposal Raw proposal data from the contract
   * @param proposalState Optional proposal state if known separately
   * @returns Formatted proposal details
   */
  private mapProposalFromContract(proposal: any, proposalState?: number): ProposalDetails {
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
      type: Number(proposal.proposalType || 0),
      state,
      createdAt,
      votingEnds,
      yesVotes: Number(proposal.yesVotes || 0),
      noVotes: Number(proposal.noVotes || 0),
      abstainVotes: Number(proposal.abstainVotes || 0),
      executed: Boolean(proposal.executed),
      canceled: Boolean(proposal.canceled),
    };
  }

  /**
   * Hook to get a proposal by ID
   * @param proposalId The ID of the proposal to retrieve
   * @returns The proposal details and loading state
   */
  useProposalDetails(proposalId: number) {
    // Get the proposal data
    const { data: proposal, isLoading: isLoadingProposal, error: proposalError } = useReadContract({
      address: this.contractAddress,
      abi: assetDaoAbi,
      functionName: 'getProposal',
      args: [BigInt(proposalId)],
      chainId: this.chainId,
    });

    // Get the proposal state
    const { data: proposalState, isLoading: isLoadingState, error: stateError } = useReadContract({
      address: this.contractAddress,
      abi: assetDaoAbi,
      functionName: 'getProposalState',
      args: [BigInt(proposalId)],
      chainId: this.chainId,
      query: {
        enabled: !!proposal, // Only fetch state if proposal exists
      }
    });

    // Process the results
    const mappedProposal = useMemo(() => {
      if (!proposal) return null;
      return this.mapProposalFromContract(proposal, proposalState ? Number(proposalState) : undefined);
    }, [proposal, proposalState]);

    // Consolidate errors
    const error = proposalError || stateError;
    const errorMessage = error ? Web3Error.fromError(error).message : undefined;

    return {
      proposal: mappedProposal,
      isLoading: isLoadingProposal || isLoadingState,
      error: errorMessage,
    };
  }

  /**
   * Hook to get all proposals with pagination support
   * @param options Pagination and filtering options
   * @returns List of proposals and loading state
   */
  useProposals(options: { 
    limit?: number; 
    offset?: number; 
    status?: ProposalState;
    type?: ProposalType | 'all';
  } = {}) {
    // Get the total proposal count
    const { data: proposalCount, isLoading: isLoadingCount, error: countError } = useReadContract({
      address: this.contractAddress,
      abi: assetDaoAbi,
      functionName: 'getProposalCount',
      chainId: this.chainId,
    });

    // Calculate how many proposals to fetch based on pagination
    const { limit = 10, offset = 0 } = options;
    const totalCount = proposalCount ? Number(proposalCount) : 0;
    const endIndex = Math.min(offset + limit, totalCount);

    // Setup array to track proposal loading states
    const proposalStates: {
      id: number;
      proposal: any;
      state?: number;
      isLoading: boolean;
      error?: Error;
    }[] = [];

    // Fetch each proposal in range
    for (let i = offset; i < endIndex; i++) {
      const proposalId = i;
      
      // Get proposal data
      const { data: proposal, isLoading: isLoadingProposal, error: proposalError } = useReadContract({
        address: this.contractAddress,
        abi: assetDaoAbi,
        functionName: 'getProposal',
        args: [BigInt(proposalId)],
        chainId: this.chainId,
        query: {
          enabled: totalCount > 0 && proposalId < totalCount,
        }
      });

      // Get proposal state
      const { data: proposalState, isLoading: isLoadingState, error: stateError } = useReadContract({
        address: this.contractAddress,
        abi: assetDaoAbi,
        functionName: 'getProposalState',
        args: [BigInt(proposalId)],
        chainId: this.chainId,
        query: {
          enabled: !!proposal,
        }
      });

      // Add to our tracking array
      proposalStates.push({
        id: proposalId,
        proposal,
        state: proposalState ? Number(proposalState) : undefined,
        isLoading: isLoadingProposal || isLoadingState,
        error: proposalError || stateError,
      });
    }

    // Process and filter the results
    const proposals = useMemo(() => {
      return proposalStates
        .filter(item => item.proposal && !item.error)
        .map(item => this.mapProposalFromContract(item.proposal, item.state))
        .filter(proposal => {
          // Apply status filter if specified
          if (options.status !== undefined) {
            if (proposal.state !== options.status) return false;
          }
          
          // Apply type filter if specified
          if (options.type !== undefined && options.type !== 'all') {
            if (proposal.type !== options.type) return false;
          }
          
          return true;
        });
    }, [proposalStates, options.status, options.type]);

    // Determine overall loading state
    const isLoading = isLoadingCount || proposalStates.some(item => item.isLoading);

    // Collect any errors
    const errors = proposalStates
      .filter(item => item.error)
      .map(item => Web3Error.fromError(item.error).message);

    return {
      proposals,
      isLoading,
      error: countError ? Web3Error.fromError(countError).message : errors.length > 0 ? errors[0] : undefined,
      totalCount,
    };
  }

  /**
   * Hook to check if a user has voted on a proposal
   * @param proposalId The ID of the proposal to check
   * @param address The address of the voter to check
   * @returns Whether the user has voted and loading state
   */
  useHasVoted(proposalId: number, address?: Address) {
    const { data, isLoading, error } = useReadContract({
      address: this.contractAddress,
      abi: assetDaoAbi,
      functionName: 'hasVoted',
      args: [BigInt(proposalId), address as Address],
      chainId: this.chainId,
      query: {
        enabled: !!address,
      }
    });

    return {
      hasVoted: !!data,
      isLoading,
      error: error ? Web3Error.fromError(error).message : undefined,
    };
  }

  /**
   * Hook to get governance parameters
   * @returns Governance parameters and loading state
   */
  useGovernanceParams() {
    // Get quorum
    const { data: quorum, isLoading: isLoadingQuorum, error: quorumError } = useReadContract({
      address: this.contractAddress,
      abi: assetDaoAbi,
      functionName: 'quorum',
      chainId: this.chainId,
    });

    // Get voting period
    const { data: votingPeriod, isLoading: isLoadingVotingPeriod, error: votingPeriodError } = useReadContract({
      address: this.contractAddress,
      abi: assetDaoAbi,
      functionName: 'votingPeriod',
      chainId: this.chainId,
    });

    // Get execution delay
    const { data: executionDelay, isLoading: isLoadingExecutionDelay, error: executionDelayError } = useReadContract({
      address: this.contractAddress,
      abi: assetDaoAbi,
      functionName: 'executionDelay',
      chainId: this.chainId,
    });

    // Consolidate the results
    const params = useMemo(() => {
      if (!quorum || !votingPeriod || !executionDelay) return null;
      
      return {
        quorum: Number(quorum),
        votingPeriod: Number(votingPeriod),
        executionDelay: Number(executionDelay),
      };
    }, [quorum, votingPeriod, executionDelay]);

    // Determine overall loading state
    const isLoading = isLoadingQuorum || isLoadingVotingPeriod || isLoadingExecutionDelay;

    // Collect any errors
    const error = quorumError || votingPeriodError || executionDelayError;

    return {
      params,
      isLoading,
      error: error ? Web3Error.fromError(error).message : undefined,
    };
  }

  /**
   * Hook to vote on a proposal
   * @returns Function to vote on a proposal and transaction state
   */
  useVoteOnProposal() {
    const { writeContractAsync, isPending, error } = useWriteContract();

    // Function to vote on a proposal
    const vote = async (proposalId: number, support: boolean, reason?: string) => {
      try {
        const args = reason 
          ? [BigInt(proposalId), support, reason] 
          : [BigInt(proposalId), support];
        
        const hash = await writeContractAsync({
          address: this.contractAddress,
          abi: assetDaoAbi,
          functionName: 'vote',
          args,
          chainId: this.chainId,
        });
        
        return hash;
      } catch (error) {
        throw Web3Error.fromError(error);
      }
    };

    return {
      vote,
      isPending,
      error: error ? Web3Error.fromError(error).message : undefined,
    };
  }

  /**
   * Hook to execute a proposal
   * @returns Function to execute a proposal and transaction state
   */
  useExecuteProposal() {
    const { writeContractAsync, isPending, error } = useWriteContract();

    // Function to execute a proposal
    const execute = async (proposalId: number) => {
      try {
        const hash = await writeContractAsync({
          address: this.contractAddress,
          abi: assetDaoAbi,
          functionName: 'executeProposal',
          args: [BigInt(proposalId)],
          chainId: this.chainId,
        });
        
        return hash;
      } catch (error) {
        throw Web3Error.fromError(error);
      }
    };

    return {
      execute,
      isPending,
      error: error ? Web3Error.fromError(error).message : undefined,
    };
  }

  /**
   * Hook to create a new proposal
   * @returns Function to create a proposal and transaction state
   */
  useCreateProposal() {
    const { writeContractAsync, isPending, error } = useWriteContract();

    // Function to create a proposal
    const create = async (
      title: string,
      description: string,
      proposalType: ProposalType,
      token: Address,
      amount: number
    ) => {
      try {
        // Convert amount to proper format
        const amountInWei = parseEther(amount.toString());
        
        const hash = await writeContractAsync({
          address: this.contractAddress,
          abi: assetDaoAbi,
          functionName: 'createProposal',
          args: [title, description, BigInt(proposalType), token, amountInWei],
          chainId: this.chainId,
        });
        
        return hash;
      } catch (error) {
        throw Web3Error.fromError(error);
      }
    };

    return {
      create,
      isPending,
      error: error ? Web3Error.fromError(error).message : undefined,
    };
  }
}

/**
 * Create a Wagmi AssetDAO service instance
 * @param contractAddress The address of the AssetDAO contract
 * @param chainId Optional chain ID, defaults to Sepolia
 * @returns AssetDAO service instance
 */
export function createWagmiAssetDaoService(contractAddress: Address, chainId?: number) {
  return new WagmiAssetDaoContractService({
    contractAddress,
    chainId: chainId || sepolia.id,
  });
}
