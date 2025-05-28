/**
 * Dynamic AssetDAO Component
 * 
 * A dynamically loaded wrapper around the OptimizedAssetDAO component
 * that includes error boundaries and loading indicators.
 */

import { Suspense, useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryProvider } from '@/lib/query/provider';
import { OptimizedAssetDAO } from '../optimized/OptimizedAssetDAO';
import { ProposalStatus, ProposalType } from '@/types';
import { preloadProposalCard, preloadCreateProposalModal } from './preload';

/**
 * Fallback loading component
 */
const AssetDAOLoadingFallback = () => (
  <div className="asset-dao-loading">
    <div className="loading-spinner"></div>
    <p>Loading AssetDAO components...</p>
  </div>
);

/**
 * Error boundary fallback component
 */
const AssetDAOErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="asset-dao-error">
    <h3>Error loading AssetDAO</h3>
    <p>{error.message}</p>
    <button onClick={resetErrorBoundary}>Retry</button>
  </div>
);

/**
 * DynamicAssetDAO props
 */
interface DynamicAssetDAOProps {
  /**
   * Initial active tab (proposal status filter)
   */
  initialTab?: ProposalStatus;
  
  /**
   * Initial type filter
   */
  initialTypeFilter?: ProposalType | 'all';
  
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: 'ethers' | 'wagmi';
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Whether to preload additional components on mount
   */
  preloadComponents?: boolean;
}

/**
 * Dynamic AssetDAO Component
 * 
 * This component wraps the OptimizedAssetDAO in Suspense and ErrorBoundary
 * to handle the async loading state and potential errors.
 */
export function DynamicAssetDAO({
  initialTab = 'active',
  initialTypeFilter = 'all',
  implementation,
  className = '',
  preloadComponents = true
}: DynamicAssetDAOProps) {
  // Preload related components when component mounts
  useEffect(() => {
    if (preloadComponents) {
      // Use a small delay to ensure this doesn't compete with initial render
      const timer = setTimeout(() => {
        // Start preloading other components
        preloadProposalCard();
        preloadCreateProposalModal();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [preloadComponents]);
  
  return (
    <ErrorBoundary
      FallbackComponent={AssetDAOErrorFallback}
      onReset={() => {
        // Reset component state when error boundary is reset
        window.location.reload();
      }}
    >
      <Suspense fallback={<AssetDAOLoadingFallback />}>
        <QueryProvider>
          <OptimizedAssetDAO
            initialTab={initialTab}
            initialTypeFilter={initialTypeFilter}
            implementation={implementation}
            className={className}
          />
        </QueryProvider>
      </Suspense>
    </ErrorBoundary>
  );
}
