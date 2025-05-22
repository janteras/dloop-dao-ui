/**
 * Unified AssetDAO Component
 * 
 * This component provides a consistent interface for the AssetDAO section
 * while supporting both Ethers and Wagmi implementations under the hood.
 * It uses the factory pattern to dynamically select the appropriate implementation.
 */

import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { createImplementationComponent, TelemetryData } from '@/components/common/factory';
import { useUnifiedProposalList } from '@/hooks/unified';
import UnifiedProposalCard from './UnifiedProposalCard';
import { ProposalStatus, ProposalType } from '@/types';
import { useUnifiedWallet } from '@/hooks/unified';
import UnifiedCreateProposalModal from './UnifiedCreateProposalModal';

export interface UnifiedAssetDAOProps {
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: 'ethers' | 'wagmi';
  
  /**
   * Callback for implementation-specific telemetry
   */
  onTelemetry?: (data: TelemetryData) => void;
  
  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Unified AssetDAO component that provides a consistent interface
 * regardless of which implementation (Ethers or Wagmi) is being used
 */
export const UnifiedAssetDAO: React.FC<UnifiedAssetDAOProps> = (props) => {
  const {
    implementation,
    onTelemetry,
    className
  } = props;
  
  // State for component
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProposalStatus>("active");
  const [typeFilter, setTypeFilter] = useState<ProposalType | "all">("all");
  
  // Use unified hooks
  const { isConnected } = useUnifiedWallet({ implementation });
  const { 
    proposals = [], 
    isLoading = false, 
    error = null, 
    refetch 
  } = useUnifiedProposalList({ 
    implementation,
    onTelemetry,
    status: activeTab,
    type: typeFilter === "all" ? undefined : typeFilter
  });
  
  // Filter proposals based on status and type
  const filteredProposals = proposals.filter(proposal => {
    const statusMatch = proposal.status.toLowerCase() === activeTab;
    const typeMatch = typeFilter === "all" || proposal.type === typeFilter;
    return statusMatch && typeMatch;
  });
  
  // Handler for refreshing proposals
  const handleRefresh = useCallback(() => {
    if (typeof refetch === 'function') {
      refetch();
      
      // Track telemetry for manual refresh
      if (onTelemetry) {
        onTelemetry({
          implementation: implementation || 'ethers',
          component: 'UnifiedAssetDAO',
          action: 'manualRefresh',
          status: 'success',
          timestamp: Date.now(),
          metadata: {
            activeTab,
            typeFilter
          }
        });
      }
    }
  }, [refetch, onTelemetry, implementation, activeTab, typeFilter]);
  
  return (
    <section className={`page-transition ${className || ''}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">AssetDAO Proposals</h1>
        
        <Button 
          className="bg-accent text-dark-bg font-medium hover:bg-darker-accent transition-colors btn-hover-effect btn-active-effect"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!isConnected}
        >
          Create New Proposal
        </Button>
      </div>
      
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-dark-bg border border-dark-gray rounded-md">
          <div className="flex p-1">
            {['active', 'passed', 'failed', 'executed'].map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status as ProposalStatus)}
                className={`px-3 py-1.5 text-sm font-medium rounded-sm ${activeTab === status 
                  ? 'bg-accent text-dark-bg' 
                  : 'text-gray hover:bg-dark-gray hover:text-white'}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative">
          <Select defaultValue="all" onValueChange={(value) => setTypeFilter(value as ProposalType | "all")}>
            <SelectTrigger className="bg-dark-gray border border-gray text-white focus:border-accent w-[140px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-dark-gray border border-gray text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="invest">Invest</SelectItem>
              <SelectItem value="divest">Divest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {implementation && (
          <div className="flex items-center ml-auto">
            <span className="text-xs px-2 py-1 bg-purple-900/50 text-purple-400 border border-purple-700/50 rounded-full mr-2">
              {implementation === 'wagmi' ? 'Wagmi' : 'Ethers'}
            </span>
          </div>
        )}
      </div>
      
      {/* Loading and Error States */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
          <span className="ml-3 text-gray">Loading proposals...</span>
        </div>
      ) : error ? (
        <div className="text-warning-red text-center py-8">
          <p>{String(error)}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={handleRefresh}
          >
            Retry
          </Button>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl text-white mb-2">No {activeTab} proposals found</h3>
          <p className="text-gray">
            {activeTab === "active" 
              ? "There are no active proposals at this time. Create a new proposal to get started."
              : `No ${activeTab} proposals match the current filters.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProposals.map((proposal) => (
            <UnifiedProposalCard
              key={proposal.id}
              proposal={proposal}
              onRefresh={handleRefresh}
              implementation={implementation}
              onTelemetry={onTelemetry}
            />
          ))}
        </div>
      )}
      
      {/* Create Proposal Modal */}
      {isCreateModalOpen && (
        <UnifiedCreateProposalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            handleRefresh();
          }}
          implementation={implementation}
          onTelemetry={onTelemetry}
        />
      )}
    </section>
  );
};



export default UnifiedAssetDAO;
