/**
 * React Query hooks for AssetDAO components
 * 
 * Provides caching, automatic refetching, and optimized state management
 * for AssetDAO contract interactions
 */

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useUnifiedAssetDaoContract } from '../unified/useUnifiedAssetDaoContract';
import { ProposalState, ProposalType } from '@/services/enhanced-assetDaoService';
import { NotificationService } from '@/services/notificationService';

// Query keys for cache management
export const ASSET_DAO_KEYS = {
  all: ['assetDao'] as const,
  proposals: () => [...ASSET_DAO_KEYS.all, 'proposals'] as const,
  proposal: (id: number) => [...ASSET_DAO_KEYS.proposals(), id] as const,
  votes: (address: string) => [...ASSET_DAO_KEYS.all, 'votes', address] as const,
  stats: () => [...ASSET_DAO_KEYS.all, 'stats'] as const,
};

// Options for pagination
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

// Filters for proposal queries
export interface ProposalFilters {
  states?: ProposalState[];
  types?: ProposalType[];
  proposer?: string;
  executed?: boolean;
  canceled?: boolean;
}

/**
 * Hook for querying proposals with React Query
 */
export function useProposalsQuery(
  options: PaginationOptions = {},
  filters: ProposalFilters = {},
  enabled = true
) {
  const { getProposals, implementation } = useUnifiedAssetDaoContract();
  
  return useQuery(
    [...ASSET_DAO_KEYS.proposals(), options, filters],
    async () => {
      const proposals = await getProposals({
        limit: options.limit,
        offset: options.offset,
        ...filters
      });
      return proposals;
    },
    {
      enabled,
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      onError: (error) => {
        console.error('Error fetching proposals:', error);
        NotificationService.error('Failed to load proposals');
      },
      meta: {
        implementation
      }
    }
  );
}

/**
 * Hook for querying a single proposal with React Query
 */
export function useProposalQuery(proposalId: number, enabled = true) {
  const { getProposal, implementation } = useUnifiedAssetDaoContract();
  
  return useQuery(
    ASSET_DAO_KEYS.proposal(proposalId),
    async () => {
      const proposal = await getProposal(proposalId);
      return proposal;
    },
    {
      enabled,
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      onError: (error) => {
        console.error(`Error fetching proposal ${proposalId}:`, error);
        NotificationService.error('Failed to load proposal details');
      },
      meta: {
        implementation
      }
    }
  );
}

/**
 * Hook for voting on proposals with React Query
 */
export function useProposalVoteMutation() {
  const queryClient = useQueryClient();
  const { voteOnProposal, implementation } = useUnifiedAssetDaoContract();
  
  return useMutation(
    async ({ proposalId, support }: { proposalId: number; support: boolean | null }) => {
      const tx = await voteOnProposal(proposalId, support);
      return { proposalId, tx };
    },
    {
      onSuccess: ({ proposalId, tx }) => {
        // Invalidate relevant queries to trigger refetch
        queryClient.invalidateQueries(ASSET_DAO_KEYS.proposal(proposalId));
        queryClient.invalidateQueries(ASSET_DAO_KEYS.proposals());
        
        NotificationService.success(
          'Vote submitted successfully',
          `Transaction: ${tx.slice(0, 10)}...`
        );
      },
      onError: (error) => {
        console.error('Error voting on proposal:', error);
        NotificationService.error('Failed to submit vote');
      },
      meta: {
        implementation
      }
    }
  );
}

/**
 * Hook for executing proposals with React Query
 */
export function useProposalExecuteMutation() {
  const queryClient = useQueryClient();
  const { executeProposal, implementation } = useUnifiedAssetDaoContract();
  
  return useMutation(
    async (proposalId: number) => {
      const tx = await executeProposal(proposalId);
      return { proposalId, tx };
    },
    {
      onSuccess: ({ proposalId, tx }) => {
        // Invalidate relevant queries to trigger refetch
        queryClient.invalidateQueries(ASSET_DAO_KEYS.proposal(proposalId));
        queryClient.invalidateQueries(ASSET_DAO_KEYS.proposals());
        
        NotificationService.success(
          'Proposal executed successfully',
          `Transaction: ${tx.slice(0, 10)}...`
        );
      },
      onError: (error) => {
        console.error('Error executing proposal:', error);
        NotificationService.error('Failed to execute proposal');
      },
      meta: {
        implementation
      }
    }
  );
}

/**
 * Hook for querying if a user has voted on a proposal
 */
export function useHasVotedQuery(proposalId: number, userAddress?: string, enabled = true) {
  const { hasVoted, implementation } = useUnifiedAssetDaoContract();
  
  return useQuery(
    [...ASSET_DAO_KEYS.votes(userAddress || 'unknown'), proposalId],
    async () => {
      if (!userAddress) return false;
      return await hasVoted(proposalId, userAddress);
    },
    {
      enabled: enabled && !!userAddress,
      staleTime: 60000, // 1 minute
      cacheTime: 300000, // 5 minutes
      meta: {
        implementation
      }
    }
  );
}

/**
 * Hook for querying AssetDAO stats
 */
export function useAssetDaoStatsQuery(enabled = true) {
  const { getStats, implementation } = useUnifiedAssetDaoContract();
  
  return useQuery(
    ASSET_DAO_KEYS.stats(),
    async () => {
      return await getStats();
    },
    {
      enabled,
      staleTime: 60000, // 1 minute
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: true,
      meta: {
        implementation
      }
    }
  );
}

/**
 * Hook for batch querying multiple proposals by ID
 */
export function useBatchProposalsQuery(proposalIds: number[], enabled = true) {
  const { getProposals, implementation } = useUnifiedAssetDaoContract();
  
  return useQuery(
    [...ASSET_DAO_KEYS.proposals(), { ids: proposalIds }],
    async () => {
      if (!proposalIds.length) return [];
      
      // Batch request all proposals in a single call
      const proposals = await getProposals({
        ids: proposalIds
      });
      
      return proposals;
    },
    {
      enabled: enabled && proposalIds.length > 0,
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      meta: {
        implementation
      }
    }
  );
}
