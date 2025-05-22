/**
 * Optimized AssetDAO Container Component
 * 
 * An optimized version of the AssetDAO component that uses React Query
 * for improved data fetching, caching, and state management.
 */

import { useState, useCallback, useEffect } from 'react';
import { useQueryProposals, useQueryProposalVoting } from '@/hooks/query';
import { UnifiedProposalCard } from '../unified/UnifiedProposalCard';
import { UnifiedCreateProposalModal } from '../unified/UnifiedCreateProposalModal';
import { ProposalStatus, ProposalType } from '@/types';
import { useFeatureFlag } from '@/config/feature-flags';
import { createTelemetryData } from '@/components/common/factory';

interface OptimizedAssetDAOProps {
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
}

/**
 * Optimized AssetDAO Container Component
 * 
 * This component uses React Query for data fetching with several optimizations:
 * - Efficient caching and state management
 * - Automatic background refreshing
 * - Optimistic UI updates
 * - Error handling with retry
 * - Implementation switching with graceful fallbacks
 */
export function OptimizedAssetDAO({
  initialTab = 'active',
  initialTypeFilter = 'all',
  implementation,
  className = ''
}: OptimizedAssetDAOProps) {
  // State for filters and modals
  const [activeTab, setActiveTab] = useState<ProposalStatus>(initialTab);
  const [typeFilter, setTypeFilter] = useState<ProposalType | 'all'>(initialTypeFilter);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Track telemetry data
  const [telemetryEvents, setTelemetryEvents] = useState<any[]>([]);
  
  // Get feature flags
  const useWagmiFlag = useFeatureFlag('useWagmiProposals');
  const resolvedImplementation = implementation || (useWagmiFlag ? 'wagmi' : 'ethers');
  
  // Telemetry callback
  const handleTelemetry = useCallback((data: any) => {
    setTelemetryEvents(prev => [...prev, {
      timestamp: new Date().toISOString(),
      ...data
    }]);
  }, []);
  
  // Fetch proposals using React Query
  const { 
    proposals, 
    isLoading, 
    error, 
    totalCount, 
    refetch,
    implementation: activeImplementation,
    performanceMetrics
  } = useQueryProposals({
    implementation: resolvedImplementation,
    status: activeTab,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    onTelemetry: handleTelemetry,
  });
  
  // Use optimized voting hook
  const { 
    voteOnProposal, 
    isVoting 
  } = useQueryProposalVoting({
    implementation: resolvedImplementation,
    onTelemetry: handleTelemetry,
    showNotifications: true,
    autoInvalidateQueries: true,
  });
  
  // Handle tab change
  const handleTabChange = useCallback((tab: ProposalStatus) => {
    setActiveTab(tab);
    
    // Track tab change telemetry
    handleTelemetry(createTelemetryData(
      activeImplementation,
      'OptimizedAssetDAO',
      'info',
      {
        action: 'tab_change',
        metadata: {
          previousTab: activeTab,
          newTab: tab
        }
      }
    ));
  }, [activeTab, activeImplementation, handleTelemetry]);
  
  // Handle filter change
  const handleFilterChange = useCallback((type: ProposalType | 'all') => {
    setTypeFilter(type);
    
    // Track filter change telemetry
    handleTelemetry(createTelemetryData(
      activeImplementation,
      'OptimizedAssetDAO',
      'info',
      {
        action: 'filter_change',
        metadata: {
          previousFilter: typeFilter,
          newFilter: type
        }
      }
    ));
  }, [typeFilter, activeImplementation, handleTelemetry]);
  
  // Handle modal open/close
  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);
  
  // Handle successful proposal creation
  const handleProposalCreated = useCallback(() => {
    handleCloseCreateModal();
    refetch();
    
    // Track proposal creation telemetry
    handleTelemetry(createTelemetryData(
      activeImplementation,
      'OptimizedAssetDAO',
      'success',
      {
        action: 'proposal_created',
        metadata: {
          implementation: activeImplementation
        }
      }
    ));
  }, [refetch, activeImplementation, handleTelemetry]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className={`asset-dao-container ${className}`}>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading proposals...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className={`asset-dao-container error-state ${className}`}>
        <div className="error-message">
          <h3>Error loading proposals</h3>
          <p>{error.message}</p>
          <button 
            className="retry-button"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`asset-dao-container ${className}`}>
      {/* Implementation indicator */}
      <div className="implementation-indicator">
        Using: {activeImplementation} implementation
        {performanceMetrics.loadDuration && (
          <span className="performance-metrics">
            Load time: {Math.round(performanceMetrics.loadDuration)}ms
          </span>
        )}
      </div>
      
      {/* Tab navigation */}
      <div className="tabs">
        <button
          className={activeTab === 'active' ? 'active' : ''}
          onClick={() => handleTabChange('active')}
        >
          Active
        </button>
        <button
          className={activeTab === 'executed' ? 'active' : ''}
          onClick={() => handleTabChange('executed')}
        >
          Executed
        </button>
        <button
          className={activeTab === 'cancelled' ? 'active' : ''}
          onClick={() => handleTabChange('cancelled')}
        >
          Cancelled
        </button>
      </div>
      
      {/* Type filters */}
      <div className="type-filters">
        <button
          className={typeFilter === 'all' ? 'active' : ''}
          onClick={() => handleFilterChange('all')}
        >
          All Types
        </button>
        <button
          className={typeFilter === 'invest' ? 'active' : ''}
          onClick={() => handleFilterChange('invest')}
        >
          Invest
        </button>
        <button
          className={typeFilter === 'divest' ? 'active' : ''}
          onClick={() => handleFilterChange('divest')}
        >
          Divest
        </button>
        <button
          className={typeFilter === 'other' ? 'active' : ''}
          onClick={() => handleFilterChange('other')}
        >
          Other
        </button>
      </div>
      
      {/* Action buttons */}
      <div className="actions">
        <button 
          className="create-proposal-button"
          onClick={handleOpenCreateModal}
        >
          Create Proposal
        </button>
        <button 
          className="refresh-button"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>
      
      {/* Proposal cards */}
      {proposals.length > 0 ? (
        <div className="proposal-list">
          {proposals.map(proposal => (
            <UnifiedProposalCard
              key={proposal.id}
              proposal={proposal}
              implementation={resolvedImplementation}
              onActionComplete={refetch}
              onRefresh={refetch}
              onTelemetry={handleTelemetry}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No proposals found for the selected filters.</p>
        </div>
      )}
      
      {/* Create proposal modal */}
      <UnifiedCreateProposalModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={handleProposalCreated}
        implementation={resolvedImplementation}
        onTelemetry={handleTelemetry}
      />
    </div>
  );
}
