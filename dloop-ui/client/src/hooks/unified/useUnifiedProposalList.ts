/**
 * Enhanced Unified Proposal List Hook
 * 
 * This hook provides a consistent interface for fetching proposal lists
 * with enhanced telemetry, error handling, and implementation switching.
 * It follows the unified contract access pattern established for the migration.
 */

import { useCallback, useState, useEffect } from 'react';
import { useFeatureFlag } from '@/config/feature-flags';
import { useProposals } from '@/hooks/useProposals';
import { useWagmiProposalList } from '@/hooks/useWagmiProposals';
import { Proposal } from '@/types';
import { processContractError } from '@/services/errorHandling';
import { createTelemetryData, TelemetryData } from '@/components/common/factory';

export interface UnifiedProposalListOptions {
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
  status?: string;
  
  /**
   * Filter by proposal type
   */
  type?: string;
  
  /**
   * Number of proposals to fetch
   */
  limit?: number;
  
  /**
   * Page offset for pagination
   */
  offset?: number;
}

export interface UnifiedProposalListResult {
  /**
   * List of proposals
   */
  proposals: Proposal[];
  
  /**
   * Loading state
   */
  isLoading: boolean;
  
  /**
   * Error message if any
   */
  error: string | null;
  
  /**
   * Total count of proposals
   */
  totalCount?: number;
  
  /**
   * Function to refresh the proposal list
   */
  refetch: () => void;
  
  /**
   * Implementation details for telemetry and debugging
   */
  implementation: 'ethers' | 'wagmi';
  
  /**
   * Implementation-specific metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Enhanced unified hook for fetching proposal lists with telemetry
 */
export function useUnifiedProposalList(options: UnifiedProposalListOptions = {}): UnifiedProposalListResult {
  // Determine which implementation to use based on feature flags or explicit choice
  const useWagmiFlag = useFeatureFlag('useWagmiProposals');
  const useWagmiImpl = options.implementation === 'wagmi' || (options.implementation !== 'ethers' && useWagmiFlag);
  
  // Fetch data using the appropriate implementation
  const ethersResult = useProposals();
  const wagmiResult = useWagmiProposalList();
  
  // Track implementation-specific performance
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    loadStartTime?: number;
    loadDuration?: number;
    errorCount: number;
    successCount: number;
  }>({
    errorCount: 0,
    successCount: 0
  });
  
  // Implementation-specific result processing
  const result = useWagmiImpl ? wagmiResult : ethersResult;
  
  // Standardize the return interface
  const proposals = result.proposals || [];
  const isLoading = result.isLoading || false;
  const error = result.error || null;
  const totalCount = 'totalCount' in result ? result.totalCount : proposals.length;
  
  // Enhanced refetch function with telemetry
  const refetch = useCallback(() => {
    const startTime = performance.now();
    setPerformanceMetrics(prev => ({ ...prev, loadStartTime: startTime }));
    
    // Send telemetry for refetch start
    if (options.onTelemetry) {
      options.onTelemetry(createTelemetryData(
        useWagmiImpl ? 'wagmi' : 'ethers',
        'useUnifiedProposalList',
        'pending',
        {
          action: 'refetch',
          metadata: {
            startTime,
            options
          }
        }
      ));
    }
    
    // Call the implementation-specific refetch function
    try {
      if (typeof result.refetch === 'function') {
        result.refetch();
      }
    } catch (error) {
      // Process any errors that occur during refetch
      processContractError(error, {
        component: 'useUnifiedProposalList',
        method: 'refetch',
        implementation: useWagmiImpl ? 'wagmi' : 'ethers',
        metadata: { options }
      }, {
        onTelemetry: options.onTelemetry
      });
      
      setPerformanceMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        loadDuration: performance.now() - (prev.loadStartTime || performance.now())
      }));
    }
  }, [result.refetch, useWagmiImpl, options]);
  
  // Track loading completion
  useEffect(() => {
    if (performanceMetrics.loadStartTime && !isLoading) {
      const loadDuration = performance.now() - performanceMetrics.loadStartTime;
      
      // Send telemetry for load completion
      if (options.onTelemetry) {
        options.onTelemetry(createTelemetryData(
          useWagmiImpl ? 'wagmi' : 'ethers',
          'useUnifiedProposalList',
          error ? 'error' : 'success',
          {
            action: 'load',
            duration: loadDuration,
            metadata: {
              proposalCount: proposals.length,
              totalCount,
              error
            }
          }
        ));
      }
      
      setPerformanceMetrics(prev => ({
        ...prev,
        loadDuration,
        successCount: error ? prev.successCount : prev.successCount + 1,
        errorCount: error ? prev.errorCount + 1 : prev.errorCount,
        loadStartTime: undefined
      }));
    }
  }, [isLoading, error, proposals.length, performanceMetrics.loadStartTime, options.onTelemetry, useWagmiImpl, totalCount]);
  
  // Initialize loading tracking
  useEffect(() => {
    if (isLoading && !performanceMetrics.loadStartTime) {
      setPerformanceMetrics(prev => ({
        ...prev,
        loadStartTime: performance.now()
      }));
    }
  }, [isLoading, performanceMetrics.loadStartTime]);
  
  return {
    proposals,
    isLoading,
    error,
    totalCount,
    refetch,
    implementation: useWagmiImpl ? 'wagmi' : 'ethers',
    metadata: {
      performanceMetrics,
      implementationSpecific: result.metadata
    }
  };
}
