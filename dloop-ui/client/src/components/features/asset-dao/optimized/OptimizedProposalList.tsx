/**
 * Optimized Proposal List Component using React Query
 * 
 * Benefits:
 * - Automatic caching and refetching
 * - Loading and error states handled by React Query
 * - Optimized rendering with React.memo
 * - Request batching for efficient data fetching
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useProposalsQuery, useProposalVoteMutation, useProposalExecuteMutation, PaginationOptions, ProposalFilters } from '@/hooks/query/useAssetDaoQueries';
import { useUnifiedWallet } from '@/hooks/unified';
import { Proposal, ProposalState, ProposalType } from '@/services/enhanced-assetDaoService';
import { TokenSymbolResolver } from '@/services/tokenSymbolResolver';
import { NotificationService } from '@/services/notificationService';

// Types
interface OptimizedProposalListProps {
  paginationOptions?: PaginationOptions;
  filters?: ProposalFilters;
  onLoad?: (proposals: Proposal[]) => void;
  onActionComplete?: () => void;
  implementation?: 'ethers' | 'wagmi';
}

interface ProposalCardProps {
  proposal: Proposal;
  onVote: (proposalId: number, support: boolean | null) => void;
  onExecute: (proposalId: number) => void;
  disabled?: boolean;
}

// Optimized ProposalCard with React.memo to prevent unnecessary re-renders
const ProposalCard = React.memo(({ proposal, onVote, onExecute, disabled }: ProposalCardProps) => {
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  
  // Fetch token symbol only once when component mounts
  React.useEffect(() => {
    const fetchTokenSymbol = async () => {
      if (proposal.token) {
        try {
          const symbol = await TokenSymbolResolver.getTokenSymbol(proposal.token);
          setTokenSymbol(symbol);
        } catch (error) {
          console.error('Error fetching token symbol:', error);
          setTokenSymbol('UNKNOWN');
        }
      }
    };
    
    fetchTokenSymbol();
  }, [proposal.token]);
  
  // Format date for better display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="proposal-card border rounded p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{proposal.title}</h3>
        <span className={`badge ${proposal.state === ProposalState.Active ? 'bg-green-500' : 'bg-gray-500'} text-white px-2 py-1 rounded-full text-xs`}>
          {ProposalState[proposal.state]}
        </span>
      </div>
      
      <p className="text-gray-600 mt-2 line-clamp-2">{proposal.description}</p>
      
      <div className="mt-3 text-sm text-gray-500">
        <div className="flex justify-between">
          <span>Proposer: {proposal.proposer.substring(0, 6)}...{proposal.proposer.substring(38)}</span>
          <span>Created: {formatDate(proposal.createdAt)}</span>
        </div>
        
        {proposal.amount && (
          <div className="mt-1">
            Amount: {proposal.amount.toLocaleString()} {tokenSymbol || '...'}
          </div>
        )}
        
        <div className="mt-1">
          Type: {ProposalType[proposal.type]}
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <div className="voting-stats text-sm">
          <span className="text-green-600 mr-3">Yes: {proposal.yesVotes}</span>
          <span className="text-red-600 mr-3">No: {proposal.noVotes}</span>
          <span className="text-gray-500">Abstain: {proposal.abstainVotes}</span>
        </div>
        
        <div className="flex space-x-2">
          {proposal.state === ProposalState.Active && (
            <>
              <button 
                onClick={() => onVote(proposal.id, true)} 
                disabled={disabled}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Yes
              </button>
              <button 
                onClick={() => onVote(proposal.id, false)} 
                disabled={disabled}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                No
              </button>
              <button 
                onClick={() => onVote(proposal.id, null)} 
                disabled={disabled}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Abstain
              </button>
            </>
          )}
          
          {proposal.state === ProposalState.Succeeded && (
            <button 
              onClick={() => onExecute(proposal.id)} 
              disabled={disabled}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Execute
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

ProposalCard.displayName = 'ProposalCard';

// Main component using React Query
export const OptimizedProposalList: React.FC<OptimizedProposalListProps> = ({
  paginationOptions = { limit: 10, offset: 0 },
  filters = {},
  onLoad,
  onActionComplete,
  implementation
}) => {
  const { isConnected } = useUnifiedWallet();
  const [currentPage, setCurrentPage] = useState(0);
  
  // Calculate current pagination based on page
  const currentPagination = useMemo(() => {
    const limit = paginationOptions.limit || 10;
    return {
      limit,
      offset: currentPage * limit
    };
  }, [currentPage, paginationOptions.limit]);
  
  // React Query hooks
  const { 
    data: proposals, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useProposalsQuery(currentPagination, filters);
  
  const voteMutation = useProposalVoteMutation();
  const executeMutation = useProposalExecuteMutation();
  
  // Callback handlers (memoized to prevent unnecessary re-renders)
  const handleVote = useCallback(async (proposalId: number, support: boolean | null) => {
    if (!isConnected) {
      NotificationService.error('Please connect your wallet to vote');
      return;
    }
    
    try {
      await voteMutation.mutateAsync({ proposalId, support });
      onActionComplete?.();
    } catch (error) {
      console.error('Error voting on proposal:', error);
    }
  }, [voteMutation, isConnected, onActionComplete]);
  
  const handleExecute = useCallback(async (proposalId: number) => {
    if (!isConnected) {
      NotificationService.error('Please connect your wallet to execute the proposal');
      return;
    }
    
    try {
      await executeMutation.mutateAsync(proposalId);
      onActionComplete?.();
    } catch (error) {
      console.error('Error executing proposal:', error);
    }
  }, [executeMutation, isConnected, onActionComplete]);
  
  // Call onLoad callback when proposals are loaded
  React.useEffect(() => {
    if (proposals && onLoad) {
      onLoad(proposals);
    }
  }, [proposals, onLoad]);
  
  // Handle pagination
  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);
  
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);
  
  // Implementation info display
  const implementationInfo = useMemo(() => (
    <div className="text-xs text-gray-500 mb-2">
      Using {implementation || 'default'} implementation
    </div>
  ), [implementation]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="p-4">
        {implementationInfo}
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <p className="text-center mt-4">Loading proposals...</p>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="p-4">
        {implementationInfo}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error: {(error as Error)?.message || 'An unknown error occurred'}
              </p>
              <button
                className="mt-2 text-sm text-red-600 hover:text-red-500"
                onClick={() => refetch()}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!proposals || proposals.length === 0) {
    return (
      <div className="p-4">
        {implementationInfo}
        <div className="text-center py-8 bg-gray-50 rounded">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals found</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no proposals matching your filters.
          </p>
        </div>
      </div>
    );
  }
  
  // Success state with proposal list
  return (
    <div className="p-4">
      {implementationInfo}
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Proposals</h2>
        <p className="text-sm text-gray-500">
          Showing {proposals.length} proposal(s)
        </p>
      </div>
      
      <div className="proposal-list space-y-4">
        {proposals.map(proposal => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onVote={handleVote}
            onExecute={handleExecute}
            disabled={voteMutation.isLoading || executeMutation.isLoading}
          />
        ))}
      </div>
      
      <div className="pagination flex justify-between mt-4">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
        >
          Previous
        </button>
        
        <span className="py-2">
          Page {currentPage + 1}
        </span>
        
        <button
          onClick={handleNextPage}
          disabled={proposals.length < (paginationOptions.limit || 10)}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      
      {/* Show loading indicator during mutations */}
      {(voteMutation.isLoading || executeMutation.isLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <svg className="animate-spin h-5 w-5 text-blue-500 mr-3 inline" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Transaction in progress...</span>
          </div>
        </div>
      )}
    </div>
  );
};
