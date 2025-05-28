/**
 * Unified Proposal List Component
 * 
 * This component provides a consistent interface for displaying AssetDAO proposals
 * while supporting both Ethers and Wagmi implementations under the hood through
 * the unified AssetDAO contract hook.
 */

import React, { useState, useCallback } from 'react';
import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';
import { UnifiedProposalCard } from './UnifiedProposalCard';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Web3Implementation } from '@/types/web3-types';
import { ProposalDetails } from '@/services/enhanced-assetDaoService';
import { useUnifiedWallet } from '@/hooks/unified';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export interface UnifiedProposalListProps {
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: Web3Implementation;
  
  /**
   * Filter by proposal status
   */
  status?: string;
  
  /**
   * Filter by proposal type
   */
  type?: number | 'all';
  
  /**
   * Items per page
   */
  pageSize?: number;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Callback when proposals are loaded
   */
  onLoad?: (proposals: ProposalDetails[]) => void;
  
  /**
   * Callback when proposal actions are completed
   */
  onActionComplete?: () => void;
}

/**
 * Unified ProposalList component that provides a consistent interface
 * for displaying and interacting with AssetDAO proposals
 */
export const UnifiedProposalList: React.FC<UnifiedProposalListProps> = (props) => {
  const {
    implementation,
    status,
    type,
    pageSize = 5,
    className = '',
    onLoad,
    onActionComplete
  } = props;
  
  // State for pagination
  const [page, setPage] = useState(0);
  
  // Use the unified hooks
  const { isConnected } = useUnifiedWallet({ implementation });
  const { 
    getProposals, 
    voteOnProposal, 
    executeProposal, 
    implementation: actualImplementation,
    telemetry 
  } = useUnifiedAssetDaoContract({ implementation });
  
  // State for loading proposals
  const [proposals, setProposals] = useState<ProposalDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load proposals when page changes
  React.useEffect(() => {
    const fetchProposals = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const options: any = {
          limit: pageSize,
          offset: page * pageSize
        };
        
        if (status) {
          options.status = status;
        }
        
        if (type && type !== 'all') {
          options.type = type;
        }
        
        const result = await getProposals(options);
        
        if (result) {
          setProposals(result);
          setTotalCount(result.length); // This is a placeholder until we have a proper count method
          
          if (onLoad) {
            onLoad(result);
          }
        } else {
          setProposals([]);
          setTotalCount(0);
        }
      } catch (err) {
        console.error('Error fetching proposals:', err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching proposals');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProposals();
  }, [page, pageSize, status, type, getProposals, onLoad]);
  
  // Handle voting on a proposal
  const handleVote = useCallback(async (proposalId: number, support: boolean) => {
    try {
      await voteOnProposal(proposalId, support);
      
      // Refetch proposals after voting
      const options: any = {
        limit: pageSize,
        offset: page * pageSize
      };
      
      if (status) {
        options.status = status;
      }
      
      if (type && type !== 'all') {
        options.type = type;
      }
      
      const result = await getProposals(options);
      
      if (result) {
        setProposals(result);
      }
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (err) {
      console.error('Error voting on proposal:', err);
      setError(err instanceof Error ? err.message : 'Unknown error voting on proposal');
    }
  }, [voteOnProposal, getProposals, page, pageSize, status, type, onActionComplete]);
  
  // Handle executing a proposal
  const handleExecute = useCallback(async (proposalId: number) => {
    try {
      await executeProposal(proposalId);
      
      // Refetch proposals after execution
      const options: any = {
        limit: pageSize,
        offset: page * pageSize
      };
      
      if (status) {
        options.status = status;
      }
      
      if (type && type !== 'all') {
        options.type = type;
      }
      
      const result = await getProposals(options);
      
      if (result) {
        setProposals(result);
      }
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (err) {
      console.error('Error executing proposal:', err);
      setError(err instanceof Error ? err.message : 'Unknown error executing proposal');
    }
  }, [executeProposal, getProposals, page, pageSize, status, type, onActionComplete]);
  
  // Handle page change
  const handlePreviousPage = useCallback(() => {
    if (page > 0) {
      setPage(page - 1);
    }
  }, [page]);
  
  const handleNextPage = useCallback(() => {
    if ((page + 1) * pageSize < totalCount) {
      setPage(page + 1);
    }
  }, [page, pageSize, totalCount]);
  
  // Implementation indicator styles
  const implementationIndicatorStyle = {
    ethers: 'bg-blue-100 text-blue-800 border-blue-300',
    wagmi: 'bg-green-100 text-green-800 border-green-300'
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Implementation indicator */}
      <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center border ${
        actualImplementation === 'wagmi' ? implementationIndicatorStyle.wagmi : implementationIndicatorStyle.ethers
      }`}>
        Using {actualImplementation} implementation
        {telemetry?.responseTime && (
          <span className="ml-2 text-xs opacity-75">
            ({Math.round(telemetry.responseTime)}ms)
          </span>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner className="w-8 h-8" />
          <span className="ml-2">Loading proposals...</span>
        </div>
      ) : (
        <>
          {/* Proposals */}
          {proposals.length === 0 ? (
            <div className="text-center py-8 border rounded-md bg-gray-50">
              <p className="text-gray-500">No proposals found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <UnifiedProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onVote={handleVote}
                  onExecute={handleExecute}
                  implementation={implementation}
                />
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {proposals.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {page + 1}
                {totalCount > 0 && ` of ${Math.ceil(totalCount / pageSize)}`}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={(page + 1) * pageSize >= totalCount}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UnifiedProposalList;
