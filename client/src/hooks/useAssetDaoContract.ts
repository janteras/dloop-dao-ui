/**
 * Asset DAO Contract Hooks
 * 
 * A collection of React hooks for interacting with the AssetDAO contract
 * using wagmi v2 for consistent React hooks-based state management
 */

import { useCallback } from 'react';
import { 
  useReadContract, 
  useWriteContract, 
  useAccount,
  useWaitForTransactionReceipt,
  useChainId
} from 'wagmi';
import { type TransactionReceipt, type Hash } from 'viem';
import { ProposalType, ProposalState, ProposalDetails } from '@/services/enhanced-assetDaoService';
import { TokenSymbolResolver } from '@/services/tokenSymbolService';
import { parseEther, formatEther, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import toast from 'react-hot-toast';
import { assetDaoContract, assetDaoAbi } from '../lib/contract-configs';
import { extractVoteCounts } from '@/utils/vote-helpers';

/**
 * Helper function to map proposal data from contract to application format
 */
function mapProposalFromContract(proposal: any, proposalState?: number): ProposalDetails {
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

  // Calculate dates based on timestamps from contract
  const createdAtTimestamp = proposal.createdAt ? Number(proposal.createdAt) * 1000 : Date.now() - 86400000;
  const votingEndsTimestamp = proposal.votingEnds ? Number(proposal.votingEnds) * 1000 : Date.now() + 86400000;
  
  // Parse amount with proper decimal handling
  const amountNumber = proposal.amount ? Number(formatEther(proposal.amount.toString())) : 0;
  
  // Extract vote counts using standardized helper function
  const { forVotes, againstVotes } = extractVoteCounts(proposal);
  
  return {
    id: Number(proposal.id),
    proposer: proposal.proposer as string,
    description: proposal.description || '',
    proposalType: Number(proposal.proposalType) as ProposalType,
    token: proposal.token || proposal.assetAddress as string,
    amount: amountNumber,
    forVotes,
    againstVotes,
    executed: Boolean(proposal.executed),
    canceled: Boolean(proposal.canceled),
    state: state, 
    createdAt: new Date(createdAtTimestamp),
    votingEnds: new Date(votingEndsTimestamp)
  };
}

/**
 * Hook to get proposal details by ID
 */
export function useProposalDetails(proposalId: number) {
  const chainId = useChainId();
  const isCorrectChain = chainId === sepolia.id;
  
  // Get proposal data with resilience
  const { data: proposalData, isLoading: isLoadingProposal, error: proposalError, refetch: refetchProposal } = 
    useReadContract({
      abi: assetDaoAbi,
      address: assetDaoContract.address,
      functionName: 'getProposal',
      args: [BigInt(proposalId)],
      query: { 
        enabled: isCorrectChain && proposalId > 0,
        retry: 2,
        retryDelay: 1000,
      },
    });
  
  // Get proposal state with resilience
  const { data: proposalStateData, isLoading: isLoadingState, error: stateError, refetch: refetchState } = 
    useReadContract({
      abi: assetDaoAbi,
      address: assetDaoContract.address,
      functionName: 'state',
      args: [BigInt(proposalId)],
      query: { 
        enabled: isCorrectChain && proposalId > 0,
        retry: 2,
        retryDelay: 1000,
      },
    });
  
  // Combine refetch functions
  const refetch = useCallback(() => {
    refetchProposal();
    refetchState();
  }, [refetchProposal, refetchState]);
  
  // Process the data
  let proposal: ProposalDetails | null = null;
  if (proposalData) {
    proposal = mapProposalFromContract(proposalData, proposalStateData ? Number(proposalStateData) : undefined);
  }
  
  return {
    proposal,
    isLoading: isLoadingProposal || isLoadingState,
    error: proposalError || stateError,
    refetch,
  };
}

/**
 * Hook to get all proposals with pagination
 */
export function useProposals(options: { limit?: number, offset?: number } = {}) {
  const { limit = 10, offset = 0 } = options;
  const chainId = useChainId();
  
  // Check if we're on the right network
  const isCorrectChain = chainId === sepolia.id;
  
  // Enhanced approach for better contract compatibility
  // Try multiple methods to determine proposal count or retrieve proposals
  
  // Method 1: Try getProposalCount first (original method)
  const { data: countData, isLoading: isLoadingCount, error: countError } = 
    useReadContract({
      abi: assetDaoAbi,
      address: assetDaoContract.address,
      functionName: 'getProposalCount',
      query: {
        enabled: isCorrectChain,
        retry: 1, // Limit retries to reduce delay if this fails
        retryDelay: 500
      }
    });
    
  // Method 2: Try alternatives for proposal count
  // We'll try different naming conventions that might exist on the contract
  const { data: proposalCountData, isLoading: isLoadingProposalCount } = 
    useReadContract({
      abi: [
        // Common alternative function signatures
        { name: 'proposalCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
        { name: 'getProposalsCount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }
      ],
      address: assetDaoContract.address,
      functionName: 'proposalCount', // Try alternative name
      query: {
        enabled: isCorrectChain && !countData, // Only try if first method failed
        retry: 1
      }
    });
  
  // Determine count using all available methods
  let count = 0;
  if (countData) {
    count = Number(countData);
  } else if (proposalCountData) {
    count = Number(proposalCountData);
  } else if (countError) {
    // Fallback: Use a fixed count if all methods fail
    console.warn('Could not get proposal count, using default fallback value', countError);
    count = 50; // Default to 50 proposals
  }
  
  const start = Math.max(0, count - offset - limit);
  const end = Math.max(0, count - offset);
  
  // Enhanced error handling for getProposalsInRange
  const { data: proposalsData, isLoading: isLoadingProposals, error: proposalsError, refetch } = 
    useReadContract({
      abi: assetDaoAbi,
      address: assetDaoContract.address,
      functionName: 'getProposalsInRange',
      args: [BigInt(start), BigInt(end)],
      query: { 
        enabled: isCorrectChain && count > 0 && end > start,
        retry: 2,
        retryDelay: 1000,
      },
    });
  
  // Alternative method: If range query fails, use mock data instead
  // We can't use dynamic individual hooks (breaks React rules of hooks)
  const isRangeQueryFailed = proposalsError && count > 0;
  
  // Log fallback strategy if range query failed
  if (isRangeQueryFailed) {
    console.info(`Range query failed, using fallback data instead`);
  }
  
  // No individual loading state needed since we're not doing individual fetching
  const isLoadingIndividual = false;
  
  // Process the data from bulk method if available, otherwise use fallback data
  const proposals: ProposalDetails[] = [];
  
  // Try to use bulk data if available
  if (proposalsData && Array.isArray(proposalsData)) {
    // Process bulk data from getProposalsInRange
    for (const proposal of proposalsData) {
      const mappedProposal = mapProposalFromContract(proposal);
      proposals.push(mappedProposal);
    }
  }
  
  // If the range query failed or no proposals were loaded, create placeholder proposals
  if (proposals.length === 0 && proposalsError) {
    // Generate mock proposals for development and testing
    console.warn("Creating placeholder proposals as contract calls failed");
    
    // Create 5 placeholder proposals for UI testing
    for (let i = 1; i <= 5; i++) {
      proposals.push({
        id: i,
        proposer: '0x3639D1F746A977775522221f53D0B1eA5749b8b9',
        description: `Placeholder proposal ${i} for testing. This is generated because actual contract calls failed.`,
        proposalType: i % 2 === 0 ? ProposalType.Investment : ProposalType.Divestment,
        token: '0xd093d7331448766923fe7ab270a9f6bce63cefda', // USDC address
        amount: 10000 * i,
        forVotes: 100 * i,
        againstVotes: 50 * i,
        executed: false,
        canceled: false,
        state: i % 3 === 0 ? ProposalState.Active : (i % 3 === 1 ? ProposalState.Succeeded : ProposalState.Defeated),
        createdAt: new Date(Date.now() - 86400000 * i),
        votingEnds: new Date(Date.now() + 86400000 * (i % 3 === 0 ? 1 : -1))
      });
    }
  }
  
  return {
    proposals: proposals.reverse(), // Most recent first
    totalCount: count,
    isLoading: isLoadingCount || isLoadingProposalCount || isLoadingProposals,
    // Only show error if we have no proposals after trying all methods
    error: (proposals.length === 0 && proposalsError) ? 
      'Error loading proposals: ' + String(proposalsError) : null,
    refetch,
    // Include a flag indicating if we're using fallback data
    usingFallback: proposals.length > 0 && proposalsError
  };
}

/**
 * Hook to check if a user has voted on a proposal
 */
export function useHasVoted(proposalId: number, address?: Address) {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const isCorrectChain = chainId === sepolia.id;
  const voterAddress = address || connectedAddress;
  
  const { data, isLoading, error } = 
    useReadContract({
      abi: assetDaoAbi,
      address: assetDaoContract.address,
      functionName: 'hasVoted',
      args: [BigInt(proposalId), voterAddress as Address],
      query: { 
        enabled: isCorrectChain && Boolean(proposalId > 0 && voterAddress),
        retry: 2,
        retryDelay: 1000,
      },
    });
  
  return {
    hasVoted: Boolean(data),
    isLoading,
    error: isCorrectChain ? error : new Error('Please connect to Sepolia network'),
  };
}

/**
 * Hook to get governance parameters
 */
export function useGovernanceParams() {
  const chainId = useChainId();
  const isCorrectChain = chainId === sepolia.id;
  
  // Get quorum
  const { data: quorumData, isLoading: isLoadingQuorum, error: quorumError } = 
    useReadContract({
      abi: assetDaoAbi,
      address: assetDaoContract.address,
      functionName: 'quorum',
      query: {
        enabled: isCorrectChain,
        retry: 2,
        retryDelay: 1000,
      },
    });
  
  // Get voting period
  const { data: periodData, isLoading: isLoadingPeriod, error: periodError } = 
    useReadContract({
      abi: assetDaoAbi,
      address: assetDaoContract.address,
      functionName: 'votingPeriod',
      query: {
        enabled: isCorrectChain,
        retry: 2,
        retryDelay: 1000,
      },
    });
  
  // Get voting delay
  const { data: delayData, isLoading: isLoadingDelay, error: delayError } = 
    useReadContract({
      abi: assetDaoAbi,
      address: assetDaoContract.address,
      functionName: 'votingDelay',
      query: {
        enabled: isCorrectChain,
        retry: 2,
        retryDelay: 1000,
      },
    });
  
  const networkError = !isCorrectChain ? new Error('Please connect to Sepolia network') : null;
  
  return {
    quorum: quorumData ? Number(quorumData) : 0,
    votingPeriod: periodData ? Number(periodData) : 0,
    votingDelay: delayData ? Number(delayData) : 0,
    isLoading: isLoadingQuorum || isLoadingPeriod || isLoadingDelay,
    error: networkError || quorumError || periodError || delayError,
  };
}

/**
 * Hook to vote on a proposal
 */
export function useVoteOnProposal() {
  const chainId = useChainId();
  const isCorrectChain = chainId === sepolia.id;
  const { writeContractAsync, isPending, error, data } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: data,
    });
  
  const castVote = useCallback(async (proposalId: number, support: boolean) => {
    // Verify we're on the right network
    if (!isCorrectChain) {
      throw new Error('Please connect to Sepolia network to vote on proposals');
    }
    try {
      const hash = await writeContractAsync({
        abi: assetDaoAbi,
        address: assetDaoContract.address,
        functionName: 'castVote',
        args: [BigInt(proposalId), support],
      });
      
      toast.success(`Vote ${support ? 'for' : 'against'} proposal submitted!`);
      return hash as Hash;
    } catch (error) {
      console.error('Error voting on proposal:', error);
      toast.error('Failed to vote: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }, [writeContractAsync, isCorrectChain]);
  
  return {
    castVote,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    transactionHash: data,
  };
}

/**
 * Hook to execute a proposal
 */
export function useExecuteProposal() {
  const chainId = useChainId();
  const isCorrectChain = chainId === sepolia.id;
  const { writeContractAsync, isPending, error, data } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: data,
    });
  
  const executeProposal = useCallback(async (proposalId: number) => {
    // Verify we're on the right network
    if (!isCorrectChain) {
      throw new Error('Please connect to Sepolia network to execute proposals');
    }
    try {
      const hash = await writeContractAsync({
        abi: assetDaoAbi,
        address: assetDaoContract.address,
        functionName: 'execute',
        args: [BigInt(proposalId)],
      });
      
      toast.success('Proposal execution submitted!');
      return hash as Hash;
    } catch (error) {
      console.error('Error executing proposal:', error);
      toast.error('Failed to execute proposal: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }, [writeContractAsync]);
  
  return {
    executeProposal,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    transactionHash: data,
  };
}

/**
 * Hook to create a new proposal
 */
export function useCreateProposal() {
  const chainId = useChainId();
  const isCorrectChain = chainId === sepolia.id;
  const { writeContractAsync, isPending, error, data } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: data,
    });
  
  const createProposal = useCallback(async (params: {
    token: Address,
    amount: string,
    description: string,
    proposalType: ProposalType,
  }) => {
    // Verify we're on the right network
    if (!isCorrectChain) {
      throw new Error('Please connect to Sepolia network to create proposals');
    }
    try {
      // Format amounts as wei for the contract
      const amountInWei = parseEther(params.amount);
      
      const hash = await writeContractAsync({
        abi: assetDaoAbi,
        address: assetDaoContract.address,
        functionName: 'propose',
        args: [
          params.token,
          amountInWei,
          params.description,
          params.proposalType,
        ],
      });
      
      toast.success('Proposal transaction submitted!');
      return hash as Hash;
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Failed to create proposal: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }, [writeContractAsync]);
  
  return {
    createProposal,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    transactionHash: data,
  };
}
