/**
 * Optimized Proposal Detail Component using React Query
 * 
 * Benefits:
 * - Automatic caching and refetching
 * - Optimized rendering with useMemo and useCallback
 * - Request batching for efficient data fetching
 * - Built-in loading and error states
 */

import React, { useMemo, useCallback } from 'react';
import { 
  useProposalQuery, 
  useProposalVoteMutation, 
  useProposalExecuteMutation,
  useHasVotedQuery
} from '@/hooks/query/useAssetDaoQueries';
import { useUnifiedWallet } from '@/hooks/unified';
import { ProposalState, ProposalType } from '@/services/enhanced-assetDaoService';
import { TokenSymbolResolver } from '@/services/tokenSymbolResolver';
import { NotificationService } from '@/services/notificationService';

// Types
interface OptimizedProposalDetailProps {
  proposalId: number;
  onVote?: (proposalId: number, support: boolean | null, txHash: string) => void;
  onExecute?: (proposalId: number, txHash: string) => void;
  showVotingHistory?: boolean;
  showTelemetry?: boolean;
  implementation?: 'ethers' | 'wagmi';
}

export const OptimizedProposalDetail: React.FC<OptimizedProposalDetailProps> = ({
  proposalId,
  onVote,
  onExecute,
  showVotingHistory = false,
  showTelemetry = false,
  implementation
}) => {
  const { address, isConnected } = useUnifiedWallet();
  
  // React Query hooks
  const { 
    data: proposal, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useProposalQuery(proposalId);
  
  const { 
    data: hasVoted 
  } = useHasVotedQuery(proposalId, address, isConnected);
  
  const voteMutation = useProposalVoteMutation();
  const executeMutation = useProposalExecuteMutation();
  
  // Token symbol resolution
  const [tokenSymbol, setTokenSymbol] = React.useState<string | null>(null);
  const [tokenDecimals, setTokenDecimals] = React.useState<number>(18);
  
  // Fetch token details when proposal data is available
  React.useEffect(() => {
    const fetchTokenDetails = async () => {
      if (proposal?.token) {
        try {
          const [symbol, decimals] = await Promise.all([
            TokenSymbolResolver.getTokenSymbol(proposal.token),
            TokenSymbolResolver.getTokenDecimals(proposal.token)
          ]);
          
          setTokenSymbol(symbol);
          setTokenDecimals(decimals);
        } catch (error) {
          console.error('Error fetching token details:', error);
          setTokenSymbol('UNKNOWN');
        }
      }
    };
    
    fetchTokenDetails();
  }, [proposal?.token]);
  
  // Format amount with proper decimals
  const formattedAmount = useMemo(() => {
    if (!proposal?.amount) return null;
    
    const divisor = Math.pow(10, tokenDecimals);
    const value = Number(proposal.amount) / divisor;
    
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: tokenDecimals
    }).format(value);
  }, [proposal?.amount, tokenDecimals]);
  
  // Format date for better display
  const formatDate = useCallback((date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  
  // Calculate voting progress
  const votingProgress = useMemo(() => {
    if (!proposal) return { yesPercent: 0, noPercent: 0, abstainPercent: 0 };
    
    const total = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
    if (total === 0) return { yesPercent: 0, noPercent: 0, abstainPercent: 0 };
    
    return {
      yesPercent: (proposal.yesVotes / total) * 100,
      noPercent: (proposal.noVotes / total) * 100,
      abstainPercent: (proposal.abstainVotes / total) * 100
    };
  }, [proposal]);
  
  // Vote handlers
  const handleVote = useCallback(async (support: boolean | null) => {
    if (!isConnected) {
      NotificationService.error('Please connect your wallet to vote');
      return;
    }
    
    if (hasVoted) {
      NotificationService.error('You have already voted on this proposal');
      return;
    }
    
    try {
      const result = await voteMutation.mutateAsync({ proposalId, support });
      onVote?.(proposalId, support, result.tx);
    } catch (error) {
      console.error('Error voting on proposal:', error);
    }
  }, [proposalId, voteMutation, isConnected, hasVoted, onVote]);
  
  // Execute handler
  const handleExecute = useCallback(async () => {
    if (!isConnected) {
      NotificationService.error('Please connect your wallet to execute the proposal');
      return;
    }
    
    try {
      const result = await executeMutation.mutateAsync(proposalId);
      onExecute?.(proposalId, result.tx);
    } catch (error) {
      console.error('Error executing proposal:', error);
    }
  }, [proposalId, executeMutation, isConnected, onExecute]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <p className="text-center mt-4">Loading proposal...</p>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error loading proposal: {(error as Error)?.message || 'An unknown error occurred'}
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
  
  // Not found state
  if (!proposal) {
    return (
      <div className="p-4">
        <div className="text-center py-8 bg-gray-50 rounded">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Proposal not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The proposal with ID {proposalId} does not exist or was deleted.
          </p>
        </div>
      </div>
    );
  }
  
  // Success state with proposal details
  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Implementation info */}
      <div className="text-xs text-gray-500 mb-2">
        Using {implementation || 'default'} implementation
      </div>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">{proposal.title}</h1>
        <span className={`badge ${proposal.state === ProposalState.Active ? 'bg-green-500' : 'bg-gray-500'} text-white px-2 py-1 rounded-full text-sm`}>
          {ProposalState[proposal.state]}
        </span>
      </div>
      
      {/* Metadata */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Proposer</p>
            <p className="font-medium">{proposal.proposer}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Type</p>
            <p className="font-medium">{ProposalType[proposal.type]}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">{formatDate(proposal.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Voting Ends</p>
            <p className="font-medium">{formatDate(proposal.votingEnds)}</p>
          </div>
          {proposal.amount && tokenSymbol && (
            <div className="col-span-1 md:col-span-2">
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">{formattedAmount} {tokenSymbol}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Description */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Description</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-4 whitespace-pre-wrap">
          {proposal.description}
        </div>
      </div>
      
      {/* Voting Progress */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Voting Progress</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Yes: {proposal.yesVotes}</span>
            <span>No: {proposal.noVotes}</span>
            <span>Abstain: {proposal.abstainVotes}</span>
          </div>
          
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div className="flex h-full">
              <div 
                className="bg-green-500 h-full" 
                style={{ width: `${votingProgress.yesPercent}%` }}
              ></div>
              <div 
                className="bg-red-500 h-full" 
                style={{ width: `${votingProgress.noPercent}%` }}
              ></div>
              <div 
                className="bg-gray-400 h-full" 
                style={{ width: `${votingProgress.abstainPercent}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{votingProgress.yesPercent.toFixed(1)}%</span>
            <span>{votingProgress.noPercent.toFixed(1)}%</span>
            <span>{votingProgress.abstainPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Actions</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {/* Voting Section */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">Vote on this proposal</h3>
            
            {hasVoted && (
              <div className="text-sm text-blue-600 mb-2">
                You have already voted on this proposal
              </div>
            )}
            
            {proposal.state !== ProposalState.Active && (
              <div className="text-sm text-amber-600 mb-2">
                Voting is closed for this proposal
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleVote(true)}
                disabled={!isConnected || hasVoted || proposal.state !== ProposalState.Active || voteMutation.isLoading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Vote Yes
              </button>
              <button
                onClick={() => handleVote(false)}
                disabled={!isConnected || hasVoted || proposal.state !== ProposalState.Active || voteMutation.isLoading}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Vote No
              </button>
              <button
                onClick={() => handleVote(null)}
                disabled={!isConnected || hasVoted || proposal.state !== ProposalState.Active || voteMutation.isLoading}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Abstain
              </button>
            </div>
            
            {!isConnected && (
              <div className="text-sm text-gray-600 mt-2">
                Connect your wallet to vote
              </div>
            )}
          </div>
          
          {/* Execution Section */}
          <div>
            <h3 className="font-medium mb-2">Execute proposal</h3>
            
            {proposal.state !== ProposalState.Succeeded && (
              <div className="text-sm text-amber-600 mb-2">
                {proposal.state === ProposalState.Active ? (
                  "Proposal is still active and cannot be executed yet"
                ) : proposal.state === ProposalState.Executed ? (
                  "Proposal has already been executed"
                ) : (
                  "Proposal cannot be executed in its current state"
                )}
              </div>
            )}
            
            <button
              onClick={handleExecute}
              disabled={
                !isConnected || 
                proposal.state !== ProposalState.Succeeded || 
                executeMutation.isLoading
              }
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Execute Proposal
            </button>
            
            {!isConnected && (
              <div className="text-sm text-gray-600 mt-2">
                Connect your wallet to execute
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Transaction History */}
      {showVotingHistory && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Voting History</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Transaction history will be loaded here...
            </p>
          </div>
        </div>
      )}
      
      {/* Telemetry */}
      {showTelemetry && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Performance Metrics</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-500">Implementation:</div>
              <div>{implementation || 'default'}</div>
              
              <div className="text-gray-500">Cache Status:</div>
              <div>{proposal._cacheStatus || 'Fresh data'}</div>
              
              <div className="text-gray-500">Request Time:</div>
              <div>{proposal._requestTime || 'N/A'} ms</div>
              
              <div className="text-gray-500">Last Updated:</div>
              <div>{proposal._lastUpdated ? new Date(proposal._lastUpdated).toLocaleTimeString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {(voteMutation.isLoading || executeMutation.isLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <svg className="animate-spin h-5 w-5 text-blue-500 mr-3 inline" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>
              {voteMutation.isLoading ? 'Submitting vote...' : 'Executing proposal...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
