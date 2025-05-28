/**
 * RealTime AssetDAO Component
 * 
 * An enhanced version of the AssetDAO component with real-time updates,
 * improved token resolution, and the enhanced proposal type system.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryProposals } from '@/hooks/query';
import { useInitializeRealTimeEvents, useProposalEvents } from '@/hooks/useRealTimeEvents';
import { UnifiedCreateProposalModal } from '../unified/UnifiedCreateProposalModal';
import { TokenChain } from '@/services/enhancedTokenService';
import { 
  ProposalStatus, 
  ProposalType, 
  toProposalStatus, 
  toProposalType
} from '@/types/proposals';
import { useFeatureFlag } from '@/config/feature-flags';
import { RealTimeProposalCard } from './RealTimeProposalCard';
import { RealTimeAssetDAOProps, RealTimeIndicator, RealTimeMetrics } from './types';

// Using types imported from './types'

/**
 * RealTime AssetDAO Component
 * 
 * This component extends the OptimizedAssetDAO with real-time updates,
 * enhanced token resolution, and the improved proposal type system.
 */
export function RealTimeAssetDAO({
  initialTab = ProposalStatus.ACTIVE,
  initialTypeFilter = 'all',
  implementation,
  realTimeUpdates = true,
  wsUrl = 'wss://dloop-events.example.com/websocket',
  chain = TokenChain.ETHEREUM,
  className = ''
}: RealTimeAssetDAOProps) {
  // State for filters and modals
  const [activeTab, setActiveTab] = useState<ProposalStatus>(
    typeof initialTab === 'string' ? toProposalStatus(initialTab) : initialTab
  );
  
  // Define a type that explicitly includes both ProposalType enum and 'all' string literal
  type ProposalTypeFilter = ProposalType | 'all';
  
  const [typeFilter, setTypeFilter] = useState<ProposalTypeFilter>(
    initialTypeFilter === 'all' 
      ? 'all' 
      : toProposalType(initialTypeFilter as string)
  );
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [realtimeIndicator, setRealtimeIndicator] = useState<RealTimeIndicator>({
    active: false,
    lastUpdate: 0
  });
  
  // Track metrics for demo purposes
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    eventsReceived: 0,
    proposalCreatedEvents: 0,
    voteEvents: 0,
    averageUpdateTime: 0,
    lastRefreshTime: 0
  });
  
  // Get feature flags
  const useWagmiFlag = useFeatureFlag('useWagmiProposals');
  const resolvedImplementation = implementation || (useWagmiFlag ? 'wagmi' : 'ethers');
  
  // Initialize real-time events
  const { status: wsStatus } = useInitializeRealTimeEvents({
    wsUrl: realTimeUpdates ? wsUrl : undefined,
    implementation: resolvedImplementation,
    autoConnect: realTimeUpdates
  });
  
  // Fetch proposals using React Query
  const { 
    proposals, 
    isLoading, 
    error, 
    refetch,
    implementation: activeImplementation
  } = useQueryProposals({
    implementation: resolvedImplementation,
    status: activeTab,
    type: typeFilter !== 'all' ? typeFilter as ProposalType : undefined,
  });
  
  // Subscribe to proposal events if real-time updates are enabled
  const {
    isSubscribed: isEventSubscribed
  } = useProposalEvents({
    includeVotes: true,
    implementation: resolvedImplementation,
    enabled: realTimeUpdates,
    onProposalCreated: (_event) => {
      // Show real-time indicator
      setRealtimeIndicator({
        active: true,
        lastUpdate: Date.now(),
        eventType: 'created'
      });
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        eventsReceived: prev.eventsReceived + 1,
        proposalCreatedEvents: prev.proposalCreatedEvents + 1,
        lastRefreshTime: Date.now()
      }));
      
      // Refresh proposals list
      refetch();
      
      // Hide indicator after 3 seconds
      setTimeout(() => {
        setRealtimeIndicator(prev => ({
          ...prev,
          active: false
        }));
      }, 3000);
    },
    onVoteCast: (_event) => {
      // Show real-time indicator
      setRealtimeIndicator({
        active: true,
        lastUpdate: Date.now(),
        eventType: 'vote'
      });
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        eventsReceived: prev.eventsReceived + 1,
        voteEvents: prev.voteEvents + 1,
        lastRefreshTime: Date.now()
      }));
      
      // Refresh proposals list
      refetch();
      
      // Hide indicator after 3 seconds
      setTimeout(() => {
        setRealtimeIndicator(prev => ({
          ...prev,
          active: false
        }));
      }, 3000);
    }
  });
  
  // Calculate average update time
  useEffect(() => {
    if (metrics.lastRefreshTime > 0 && metrics.eventsReceived > 0) {
      const newAverage = metrics.eventsReceived > 1
        ? (metrics.averageUpdateTime * (metrics.eventsReceived - 1) + (Date.now() - metrics.lastRefreshTime)) / metrics.eventsReceived
        : Date.now() - metrics.lastRefreshTime;
      
      setMetrics((prev: RealTimeMetrics) => ({
        ...prev,
        averageUpdateTime: newAverage
      }));
    }
  }, [metrics.lastRefreshTime, metrics.eventsReceived, metrics.averageUpdateTime]);
  
  // Handle tab change
  const handleTabChange = useCallback((tab: ProposalStatus) => {
    setActiveTab(tab);
  }, []);
  
  // Handle filter change
  const handleFilterChange = useCallback((type: ProposalType | 'all') => {
    setTypeFilter(type);
  }, []);
  
  // Handle modal open/close
  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);
  
  // Handle successful proposal creation
  const handleProposalCreated = useCallback(() => {
    handleCloseCreateModal();
    refetch();
    
    // Show real-time indicator
    setRealtimeIndicator({
      active: true,
      lastUpdate: Date.now(),
      eventType: 'created'
    });
    
    // Hide indicator after 3 seconds
    setTimeout(() => {
      setRealtimeIndicator((prev: RealTimeIndicator) => ({
        ...prev,
        active: false
      }));
    }, 3000);
  }, [refetch]);
  
  // Calculate WebSocket status indicator color
  const wsStatusColor = useMemo(() => {
    switch (wsStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }, [wsStatus]);
  
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
      {/* Real-time status indicators */}
      <div className="real-time-indicators">
        <div className="websocket-status">
          <span className="indicator-label">WebSocket:</span>
          <span className={`status-indicator ${wsStatusColor}`}></span>
          <span className="status-text">{wsStatus}</span>
        </div>
        
        <div className="implementation-indicator">
          <span className="indicator-label">Implementation:</span>
          <span className={`implementation-value ${activeImplementation}`}>
            {activeImplementation}
          </span>
        </div>
        
        {realTimeUpdates && (
          <div className="event-metrics">
            <span className="metric">Events: {metrics.eventsReceived}</span>
            <span className="metric">Avg Update: {Math.round(metrics.averageUpdateTime)}ms</span>
          </div>
        )}
        
        {realtimeIndicator.active && (
          <div className="real-time-update-indicator">
            <span className="pulse-dot"></span>
            <span className="update-text">
              Real-time update: {realtimeIndicator.eventType}
            </span>
          </div>
        )}
      </div>
      
      {/* Tab navigation */}
      <div className="tabs">
        <button
          className={activeTab === ProposalStatus.ACTIVE ? 'active' : ''}
          onClick={() => handleTabChange(ProposalStatus.ACTIVE)}
        >
          Active
        </button>
        <button
          className={activeTab === ProposalStatus.PASSED ? 'active' : ''}
          onClick={() => handleTabChange(ProposalStatus.PASSED)}
        >
          Passed
        </button>
        <button
          className={activeTab === ProposalStatus.EXECUTED ? 'active' : ''}
          onClick={() => handleTabChange(ProposalStatus.EXECUTED)}
        >
          Executed
        </button>
        <button
          className={activeTab === ProposalStatus.FAILED ? 'active' : ''}
          onClick={() => handleTabChange(ProposalStatus.FAILED)}
        >
          Failed
        </button>
        <button
          className={activeTab === ProposalStatus.CANCELED ? 'active' : ''}
          onClick={() => handleTabChange(ProposalStatus.CANCELED)}
        >
          Canceled
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
          className={typeFilter === ProposalType.INVEST ? 'active' : ''}
          onClick={() => handleFilterChange(ProposalType.INVEST)}
        >
          Invest
        </button>
        <button
          className={typeFilter === ProposalType.DIVEST ? 'active' : ''}
          onClick={() => handleFilterChange(ProposalType.DIVEST)}
        >
          Divest
        </button>
        <button
          className={typeFilter === ProposalType.GOVERNANCE ? 'active' : ''}
          onClick={() => handleFilterChange(ProposalType.GOVERNANCE)}
        >
          Governance
        </button>
        <button
          className={typeFilter === ProposalType.TREASURY ? 'active' : ''}
          onClick={() => handleFilterChange(ProposalType.TREASURY)}
        >
          Treasury
        </button>
        <button
          className={typeFilter === ProposalType.OTHER ? 'active' : ''}
          onClick={() => handleFilterChange(ProposalType.OTHER)}
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
        
        {realTimeUpdates && (
          <div className="real-time-toggle">
            <span className="real-time-label">Real-time updates</span>
            <span className={`real-time-status ${isEventSubscribed ? 'active' : 'inactive'}`}>
              {isEventSubscribed ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}
      </div>
      
      {/* Proposal cards */}
      {proposals.length > 0 ? (
        <div className="proposal-list">
          {proposals.map(proposal => (
            <RealTimeProposalCard
              key={proposal.id}
              proposal={proposal}
              implementation={resolvedImplementation}
              onActionComplete={refetch}
              onRefresh={refetch}
              chain={chain}
              realTimeUpdates={realTimeUpdates}
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
      />
    </div>
  );
}
