/**
 * React Query Proposal Hooks
 * 
 * Optimized data fetching for proposals using React Query while
 * maintaining the unified contract access pattern.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useFeatureFlag } from '@/config/feature-flags';
import { processContractError } from '@/services/errorHandling';
import { Proposal, ProposalStatus, ProposalType } from '@/types';
import { useProposals } from '@/hooks/useProposals';
import { useWagmiProposalList } from '@/hooks/useWagmiProposals';
import { proposalKeys, STALE_TIMES } from '@/lib/query/config';
import { createTelemetryData, TelemetryData } from '@/components/common/factory';

/**
 * Options for the proposal query
 */
export interface ProposalQueryOptions {
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: 'ethers' | 'wagmi';
  
  /**
   * Callback for implementation-specific telemetry
   */
  onTelemetry?: (data: TelemetryData) => void;
  
  /**
   * Filter by proposal status
   */
  status?: ProposalStatus;
  
  /**
   * Filter by proposal type
   */
  type?: ProposalType | 'all';
  
  /**
   * Whether to enable the query
   */
  enabled?: boolean;
  
  /**
   * Number of proposals to fetch
   */
  limit?: number;
  
  /**
   * Page offset for pagination
   */
  offset?: number;
}

/**
 * Proposal query result with implementation-specific metadata
 */
export interface ProposalQueryResult {
  /**
   * List of proposals
   */
  proposals: Proposal[];
  
  /**
   * Whether the query is loading
   */
  isLoading: boolean;
  
  /**
   * Error if any occurred
   */
  error: Error | null;
  
  /**
   * Total number of proposals (for pagination)
   */
  totalCount: number;
  
  /**
   * Function to refresh the proposals
   */
  refetch: () => void;
  
  /**
   * The implementation that was used
   */
  implementation: 'ethers' | 'wagmi';
  
  /**
   * Implementation-specific metadata
   */
  metadata?: Record<string, any>;
  
  /**
   * Performance metrics for the query
   */
  performanceMetrics: {
    loadDuration?: number;
    errorCount: number;
    successCount: number;
  };
}

/**
 * Fetch proposal data using React Query with implementation switching
 * 
 * This hook maintains the unified contract access pattern while leveraging
 * React Query for improved caching, performance, and state management.
 */
export function useQueryProposals(options: ProposalQueryOptions = {}): ProposalQueryResult {
  const queryClient = useQueryClient();
  
  // Determine which implementation to use based on feature flags or explicit choice
  const useWagmiFlag = useFeatureFlag('useWagmiProposals');
  const useWagmiImpl = options.implementation === 'wagmi' || (options.implementation !== 'ethers' && useWagmiFlag);
  
  // Create implementation-specific fetcher with fallback capabilities
  const fetchProposals = useCallback(async () => {
    const startTime = performance.now();
    let implementationUsed = useWagmiImpl ? 'wagmi' : 'ethers';
    let fallbackAttempted = false;
    
    // Send telemetry for fetch start
    if (options.onTelemetry) {
      options.onTelemetry(createTelemetryData(
        implementationUsed,
        'useQueryProposals',
        'pending',
        {
          action: 'fetch',
          metadata: {
            startTime,
            options
          }
        }
      ));
    }
    
    // Define the fetch function based on implementation
    const fetchWithImplementation = async (implementation: 'ethers' | 'wagmi') => {
      if (implementation === 'wagmi') {
        // Create a snapshot of the hook result
        const result = useWagmiProposalList();
        
        // Filter proposals based on options
        const filteredProposals = options.status
          ? result.proposals.filter(p => p.status === options.status)
          : result.proposals;
          
        return {
          proposals: filteredProposals,
          totalCount: result.proposals.length,
          metadata: { source: 'wagmi' }
        };
      } else {
        // Create a snapshot of the hook result
        const result = useProposals();
        
        // Filter proposals based on options
        const filteredProposals = options.status
          ? result.proposals.filter(p => p.status === options.status)
          : result.proposals;
          
        return {
          proposals: filteredProposals,
          totalCount: result.proposals.length,
          metadata: { source: 'ethers' }
        };
      }
    };
    
    try {
      // Try the primary implementation
      const result = await fetchWithImplementation(implementationUsed);
      
      // Calculate performance and send telemetry
      const loadDuration = performance.now() - startTime;
      if (options.onTelemetry) {
        options.onTelemetry(createTelemetryData(
          implementationUsed,
          'useQueryProposals',
          'success',
          {
            action: 'fetch',
            duration: loadDuration,
            metadata: {
              proposalCount: result.proposals.length,
              totalCount: result.totalCount,
              fallbackUsed: fallbackAttempted
            }
          }
        ));
      }
      
      return result;
    } catch (error) {
      // If primary implementation fails and we haven't tried fallback yet
      if (!fallbackAttempted && !options.implementation) {
        fallbackAttempted = true;
        implementationUsed = implementationUsed === 'wagmi' ? 'ethers' : 'wagmi';
        
        // Log fallback attempt
        if (options.onTelemetry) {
          options.onTelemetry(createTelemetryData(
            implementationUsed,
            'useQueryProposals',
            'pending',
            {
              action: 'fallback',
              metadata: {
                originalError: error instanceof Error ? error.message : 'Unknown error',
                fallbackImplementation: implementationUsed
              }
            }
          ));
        }
        
        try {
          // Try fallback implementation
          const fallbackResult = await fetchWithImplementation(implementationUsed);
          
          // Calculate performance and send telemetry for successful fallback
          const loadDuration = performance.now() - startTime;
          if (options.onTelemetry) {
            options.onTelemetry(createTelemetryData(
              implementationUsed,
              'useQueryProposals',
              'success',
              {
                action: 'fetch',
                duration: loadDuration,
                metadata: {
                  proposalCount: fallbackResult.proposals.length,
                  totalCount: fallbackResult.totalCount,
                  fallbackUsed: true
                }
              }
            ));
          }
          
          return fallbackResult;
        } catch (fallbackError) {
          // Both implementations failed, process the original error
          processContractError(error, {
            component: 'useQueryProposals',
            method: 'fetch',
            implementation: useWagmiImpl ? 'wagmi' : 'ethers',
            metadata: { 
              options,
              fallbackAttempted,
              fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error'
            }
          }, {
            onTelemetry: options.onTelemetry
          });
          
          // Rethrow to let React Query handle it
          throw error;
        }
      } else {
        // Process error without fallback attempt
        processContractError(error, {
          component: 'useQueryProposals',
          method: 'fetch',
          implementation: implementationUsed,
          metadata: { options }
        }, {
          onTelemetry: options.onTelemetry
        });
        
        // Rethrow to let React Query handle it
        throw error;
      }
    }
  }, [useWagmiImpl, options]);
  
  // Use React Query to fetch proposals
  const queryResult = useQuery({
    queryKey: proposalKeys.list({
      implementation: useWagmiImpl ? 'wagmi' : 'ethers',
      status: options.status,
      type: options.type,
      limit: options.limit,
      offset: options.offset
    }),
    queryFn: fetchProposals,
    staleTime: STALE_TIMES.PROPOSALS,
    enabled: options.enabled !== false,
    // Add special handling for the getProposalCount error
    retry: (failureCount, error) => {
      if (error instanceof Error && 
          error.message.includes('getProposalCount')) {
        // Only retry once for this specific issue
        return failureCount < 1;
      }
      // Default to React Query's retry policy (from config)
      return failureCount < 3;
    }
  });
  
  // Extract performance metrics from React Query
  const performanceMetrics = {
    loadDuration: queryResult.dataUpdatedAt - queryResult.dataFetchedAt > 0 
      ? queryResult.dataUpdatedAt - queryResult.dataFetchedAt 
      : undefined,
    errorCount: queryResult.failureCount,
    successCount: queryResult.failureCount === 0 && queryResult.data ? 1 : 0,
  };
  
  // Return standardized result that matches our unified interface
  return {
    proposals: queryResult.data?.proposals || [],
    isLoading: queryResult.isLoading,
    error: queryResult.error instanceof Error ? queryResult.error : null,
    totalCount: queryResult.data?.totalCount || 0,
    refetch: queryResult.refetch,
    implementation: useWagmiImpl ? 'wagmi' : 'ethers',
    metadata: queryResult.data?.metadata,
    performanceMetrics
  };
}
