/**
 * Enhanced AssetDAO Contract Service
 * 
 * Complete Wagmi implementation for AssetDAO contract interactions,
 * providing a production-ready service with comprehensive error handling,
 * telemetry, and type safety.
 */

import { 
  useContractRead, 
  useContractWrite, 
  useContractEvent, 
  useAccount, 
  Address, 
  useNetwork,
  usePrepareContractWrite
} from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { useState, useEffect, useCallback } from 'react';
import { assetDaoABI } from '@/constants/abis/assetDaoABI';
import { getTokenSymbol, formatAmount, mapContractTypeToUI } from '@/utils/proposal-helpers';
import { useAppConfig } from '@/config/app-config';
import { UnifiedAssetDaoContract } from '@/types/unified-contracts';

// TypeScript interfaces for contract data
export interface AssetDaoProposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  type: 'invest' | 'divest';
  token: string;
  amount: string;
  forVotes: string;
  againstVotes: string;
  status: 'active' | 'passed' | 'failed' | 'executed' | 'canceled';
  executed: boolean;
  canceled: boolean;
  createdAt: string;
  deadline: string;
  quorumReached: boolean;
}

export interface AssetDaoProposalVote {
  proposalId: number;
  voter: string;
  support: boolean;
  votes: string;
  timestamp: string;
}

export interface AssetDaoCreateProposalParams {
  title: string;
  description: string;
  token: string;
  amount: string;
  type: number; // 0 = invest, 1 = divest
}

export interface AssetDaoServiceOptions {
  contractAddress: Address;
  chainId?: number;
  enableTelemetry?: boolean;
}

/**
 * Enhanced AssetDAO Contract Service
 * Provides a comprehensive Wagmi implementation for interacting with the AssetDAO contract
 */
export function useEnhancedAssetDaoContract(
  options: AssetDaoServiceOptions
): UnifiedAssetDaoContract {
  const { contractAddress, chainId = sepolia.id, enableTelemetry = true } = options;
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { recordMetric } = useAppConfig();

  // Internal telemetry recording function
  const recordContractMetric = useCallback((
    functionName: string, 
    status: 'success' | 'error' | 'pending', 
    responseTime?: number,
    error?: Error
  ) => {
    if (!enableTelemetry) return;
    
    recordMetric({
      component: 'AssetDaoContract',
      implementation: 'wagmi',
      function: functionName,
      status,
      responseTime,
      timestamp: Date.now(),
      error: error?.message,
      chainId: chain?.id
    });
  }, [enableTelemetry, recordMetric, chain]);

  /**
   * Get all proposals with efficient batching
   */
  const useGetAllProposals = () => {
    const [proposals, setProposals] = useState<AssetDaoProposal[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    // Get proposal count
    const proposalCountQuery = useContractRead({
      address: contractAddress,
      abi: assetDaoABI,
      functionName: 'getProposalCount',
      chainId,
      enabled: Boolean(contractAddress),
      onSuccess: (data) => {
        recordContractMetric('getProposalCount', 'success');
      },
      onError: (err) => {
        recordContractMetric('getProposalCount', 'error', undefined, err as Error);
        setError(err as Error);
      }
    });

    // Fetch proposals when count is available
    useEffect(() => {
      const fetchProposals = async () => {
        if (!proposalCountQuery.data || !contractAddress) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
          const count = Number(proposalCountQuery.data);
          if (count === 0) {
            setProposals([]);
            setIsLoading(false);
            return;
          }
          
          // Create array of proposal IDs to fetch
          const proposalIds = Array.from({ length: count }, (_, i) => i + 1);
          const startTime = performance.now();
          
          // Fetch proposals in batches of 10
          const batchSize = 10;
          const batchedProposals: AssetDaoProposal[] = [];
          
          for (let i = 0; i < proposalIds.length; i += batchSize) {
            const batch = proposalIds.slice(i, i + batchSize);
            const promises = batch.map(id => fetchProposal(id));
            const results = await Promise.all(promises);
            batchedProposals.push(...results.filter(Boolean) as AssetDaoProposal[]);
          }
          
          setProposals(batchedProposals);
          
          recordContractMetric(
            'getAllProposals', 
            'success', 
            performance.now() - startTime
          );
        } catch (err) {
          console.error('Error fetching proposals:', err);
          setError(err as Error);
          recordContractMetric(
            'getAllProposals', 
            'error', 
            undefined, 
            err as Error
          );
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchProposals();
    }, [proposalCountQuery.data, contractAddress]);

    // Helper function to fetch a single proposal
    const fetchProposal = async (id: number): Promise<AssetDaoProposal | null> => {
      try {
        // Use direct provider call for batching efficiency
        const data = await proposalCountQuery.internal.client.readContract({
          address: contractAddress,
          abi: assetDaoABI,
          functionName: 'getProposal',
          args: [BigNumber.from(id)],
          chainId
        });
        
        return mapProposalData(data, id);
      } catch (err) {
        console.warn(`Error fetching proposal ${id}:`, err);
        return null;
      }
    };

    return {
      proposals,
      isLoading: isLoading || proposalCountQuery.isLoading,
      error,
      refetch: () => {
        proposalCountQuery.refetch();
      }
    };
  };

  /**
   * Get a single proposal by ID
   */
  const useGetProposal = (proposalId: number) => {
    const startTime = performance.now();
    
    const query = useContractRead({
      address: contractAddress,
      abi: assetDaoABI,
      functionName: 'getProposal',
      args: [BigNumber.from(proposalId)],
      chainId,
      enabled: proposalId > 0 && Boolean(contractAddress),
      select: (data) => mapProposalData(data, proposalId),
      onSuccess: () => {
        recordContractMetric(
          'getProposal', 
          'success', 
          performance.now() - startTime
        );
      },
      onError: (err) => {
        recordContractMetric(
          'getProposal', 
          'error', 
          performance.now() - startTime, 
          err as Error
        );
      }
    });
    
    return {
      proposal: query.data,
      isLoading: query.isLoading,
      error: query.error,
      refetch: query.refetch
    };
  };

  /**
   * Create a new proposal
   */
  const useCreateProposal = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    
    // Preparation hook to validate inputs before submitting
    const prepareProposal = (params: AssetDaoCreateProposalParams) => {
      return usePrepareContractWrite({
        address: contractAddress,
        abi: assetDaoABI,
        functionName: 'createProposal',
        args: [
          params.title,
          params.description,
          params.token,
          parseUnits(params.amount, 18),
          BigNumber.from(params.type)
        ],
        chainId,
        enabled: Boolean(
          contractAddress && 
          address &&
          params.title && 
          params.description && 
          params.token
        )
      });
    };
    
    // Write hook with enhanced error handling
    const createProposal = (params: AssetDaoCreateProposalParams) => {
      const startTime = performance.now();
      
      const { config, error: prepareError } = prepareProposal(params);
      
      if (prepareError) {
        setError(prepareError);
        recordContractMetric(
          'createProposal', 
          'error', 
          performance.now() - startTime, 
          prepareError
        );
        return { error: prepareError };
      }
      
      const { writeAsync, error: writeError } = useContractWrite(config);
      
      if (writeError) {
        setError(writeError);
        recordContractMetric(
          'createProposal', 
          'error', 
          performance.now() - startTime, 
          writeError
        );
        return { error: writeError };
      }
      
      const submitProposal = async () => {
        if (!writeAsync) return;
        
        setIsSubmitting(true);
        setError(null);
        
        try {
          recordContractMetric('createProposal', 'pending');
          
          const tx = await writeAsync();
          setTxHash(tx.hash);
          
          await tx.wait();
          
          recordContractMetric(
            'createProposal', 
            'success', 
            performance.now() - startTime
          );
          
          return tx.hash;
        } catch (err) {
          console.error('Error creating proposal:', err);
          setError(err as Error);
          
          recordContractMetric(
            'createProposal', 
            'error', 
            performance.now() - startTime, 
            err as Error
          );
          
          return null;
        } finally {
          setIsSubmitting(false);
        }
      };
      
      return {
        submit: submitProposal,
        isSubmitting,
        txHash,
        error
      };
    };
    
    return { createProposal };
  };

  /**
   * Vote on a proposal
   */
  const useVoteOnProposal = () => {
    const [isVoting, setIsVoting] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);
    
    const prepareVote = (proposalId: number, support: boolean) => {
      return usePrepareContractWrite({
        address: contractAddress,
        abi: assetDaoABI,
        functionName: 'castVote',
        args: [BigNumber.from(proposalId), support],
        chainId,
        enabled: Boolean(contractAddress && address && proposalId > 0)
      });
    };
    
    const voteOnProposal = (proposalId: number, support: boolean) => {
      const startTime = performance.now();
      
      const { config, error: prepareError } = prepareVote(proposalId, support);
      
      if (prepareError) {
        setError(prepareError);
        recordContractMetric(
          'castVote', 
          'error', 
          performance.now() - startTime, 
          prepareError
        );
        return { error: prepareError };
      }
      
      const { writeAsync, error: writeError } = useContractWrite(config);
      
      if (writeError) {
        setError(writeError);
        recordContractMetric(
          'castVote', 
          'error', 
          performance.now() - startTime, 
          writeError
        );
        return { error: writeError };
      }
      
      const submitVote = async () => {
        if (!writeAsync) return;
        
        setIsVoting(true);
        setError(null);
        
        try {
          recordContractMetric('castVote', 'pending');
          
          const tx = await writeAsync();
          setTxHash(tx.hash);
          
          await tx.wait();
          
          recordContractMetric(
            'castVote', 
            'success', 
            performance.now() - startTime
          );
          
          return tx.hash;
        } catch (err) {
          console.error('Error voting on proposal:', err);
          setError(err as Error);
          
          recordContractMetric(
            'castVote', 
            'error', 
            performance.now() - startTime, 
            err as Error
          );
          
          return null;
        } finally {
          setIsVoting(false);
        }
      };
      
      return {
        submit: submitVote,
        isVoting,
        txHash,
        error
      };
    };
    
    return { voteOnProposal };
  };

  /**
   * Check if a user has voted on a proposal
   */
  const useCheckVotingStatus = (proposalId: number, voter: string | undefined) => {
    const startTime = performance.now();
    
    const query = useContractRead({
      address: contractAddress,
      abi: assetDaoABI,
      functionName: 'hasVoted',
      args: [BigNumber.from(proposalId), voter || address],
      chainId,
      enabled: Boolean(contractAddress && (voter || address) && proposalId > 0),
      onSuccess: () => {
        recordContractMetric(
          'hasVoted', 
          'success', 
          performance.now() - startTime
        );
      },
      onError: (err) => {
        recordContractMetric(
          'hasVoted', 
          'error', 
          performance.now() - startTime, 
          err as Error
        );
      }
    });
    
    // Try to get detailed vote info if available
    const detailQuery = useContractRead({
      address: contractAddress,
      abi: assetDaoABI,
      functionName: 'getVoteReceipt',
      args: [BigNumber.from(proposalId), voter || address],
      chainId,
      enabled: Boolean(contractAddress && (voter || address) && proposalId > 0),
      onError: () => {
        // Silent error - this function might not exist on all contracts
      }
    });
    
    return {
      hasVoted: query.data,
      voteInfo: detailQuery.data ? {
        support: detailQuery.data[0],
        votes: formatAmount(detailQuery.data[1])
      } : undefined,
      isLoading: query.isLoading,
      error: query.error,
      refetch: query.refetch
    };
  };

  /**
   * Listen for proposal events
   */
  const useProposalEvents = (callback: (event: any) => void) => {
    useContractEvent({
      address: contractAddress,
      abi: assetDaoABI,
      eventName: 'ProposalCreated',
      listener: (event) => {
        recordContractMetric('ProposalCreated event', 'success');
        callback(event);
      },
      chainId
    });
    
    useContractEvent({
      address: contractAddress,
      abi: assetDaoABI,
      eventName: 'VoteCast',
      listener: (event) => {
        recordContractMetric('VoteCast event', 'success');
        callback(event);
      },
      chainId
    });
    
    useContractEvent({
      address: contractAddress,
      abi: assetDaoABI,
      eventName: 'ProposalExecuted',
      listener: (event) => {
        recordContractMetric('ProposalExecuted event', 'success');
        callback(event);
      },
      chainId
    });
    
    useContractEvent({
      address: contractAddress,
      abi: assetDaoABI,
      eventName: 'ProposalCanceled',
      listener: (event) => {
        recordContractMetric('ProposalCanceled event', 'success');
        callback(event);
      },
      chainId
    });
  };

  /**
   * Get the state of a proposal
   */
  const useProposalState = (proposalId: number) => {
    const startTime = performance.now();
    
    const query = useContractRead({
      address: contractAddress,
      abi: assetDaoABI,
      functionName: 'state',
      args: [BigNumber.from(proposalId)],
      chainId,
      enabled: Boolean(contractAddress && proposalId > 0),
      select: (data) => {
        // Map numeric state to string
        const stateMap: Record<number, AssetDaoProposal['status']> = {
          0: 'active',
          1: 'passed',
          2: 'failed',
          3: 'executed',
          4: 'canceled'
        };
        return stateMap[Number(data)] || 'unknown';
      },
      onSuccess: () => {
        recordContractMetric(
          'proposalState', 
          'success', 
          performance.now() - startTime
        );
      },
      onError: (err) => {
        recordContractMetric(
          'proposalState', 
          'error', 
          performance.now() - startTime, 
          err as Error
        );
      }
    });
    
    return {
      state: query.data,
      isLoading: query.isLoading,
      error: query.error,
      refetch: query.refetch
    };
  };

  /**
   * Helper function to map contract data to API format
   */
  const mapProposalData = (data: any, proposalId: number): AssetDaoProposal => {
    if (!data) {
      throw new Error(`No data returned for proposal ${proposalId}`);
    }
    
    try {
      // Extract data from contract response
      // The exact structure depends on your contract, adjust as needed
      const [
        title,
        description,
        proposer,
        tokenAddress,
        amount,
        forVotes,
        againstVotes,
        executed,
        canceled,
        startBlock,
        endBlock,
        proposalType
      ] = data;
      
      // Map numeric status to string status
      const getStatus = (): AssetDaoProposal['status'] => {
        if (canceled) return 'canceled';
        if (executed) return 'executed';
        
        // Check if deadline has passed
        const now = Date.now();
        const deadline = Number(endBlock) * 1000; // Convert to milliseconds
        
        if (now < deadline) return 'active';
        
        // If deadline passed, check if it passed
        return Number(forVotes) > Number(againstVotes) ? 'passed' : 'failed';
      };
      
      // Format proposal data
      const formattedProposal: AssetDaoProposal = {
        id: proposalId,
        title: title || `Proposal #${proposalId}`,
        description: description || '',
        proposer,
        type: mapContractTypeToUI(proposalType),
        token: tokenAddress,
        amount: formatAmount(amount),
        forVotes: formatAmount(forVotes),
        againstVotes: formatAmount(againstVotes),
        status: getStatus(),
        executed: Boolean(executed),
        canceled: Boolean(canceled),
        createdAt: new Date(Number(startBlock) * 1000).toISOString(),
        deadline: new Date(Number(endBlock) * 1000).toISOString(),
        quorumReached: Number(forVotes) > Number(againstVotes)
      };
      
      return formattedProposal;
    } catch (err) {
      console.error(`Error mapping proposal data for ID ${proposalId}:`, err, data);
      throw new Error(`Failed to map proposal data: ${(err as Error).message}`);
    }
  };

  // Return the unified contract interface
  return {
    useGetAllProposals,
    useGetProposal,
    useCreateProposal,
    useVoteOnProposal,
    useCheckVotingStatus,
    useProposalState,
    useProposalEvents,
    implementation: 'wagmi',
  };
}

export default useEnhancedAssetDaoContract;
