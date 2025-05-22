/**
 * WagmiProposalList Component
 * 
 * A demonstration component that uses the new wagmi hooks to display and interact with
 * AssetDAO proposals. This component shows the improved developer experience and code maintainability
 * that comes from using wagmi's React hooks-based approach.
 */

import React, { useState } from 'react';
import { useProposals, useVoteOnProposal, useExecuteProposal } from '@/hooks/useAssetDaoContract';
import { UnifiedProposalCard } from './consolidated/UnifiedProposalCard';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/components/features/wallet/wagmi-provider';

export default function WagmiProposalList() {
  const [page, setPage] = useState(0);
  const pageSize = 5;
  
  // Use the new wagmi-based hooks
  const { proposals, isLoading, error, refetch, totalCount } = useProposals({ 
    limit: pageSize, 
    offset: page * pageSize 
  });
  
  const { voteOnProposal, isLoading: isVoting } = useVoteOnProposal();
  const { executeProposal, isLoading: isExecuting } = useExecuteProposal();
  const { isConnected } = useWallet();
  
  // Handle voting on a proposal
  const handleVote = async (proposalId: number, support: boolean) => {
    try {
      await voteOnProposal(proposalId, support);
      // Refetch proposals after voting
      refetch();
    } catch (error) {
      console.error('Error voting on proposal:', error);
    }
  };
  
  // Handle executing a proposal
  const handleExecute = async (proposalId: number) => {
    try {
      await executeProposal(proposalId);
      // Refetch proposals after execution
      refetch();
    } catch (error) {
      console.error('Error executing proposal:', error);
    }
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const canGoBack = page > 0;
  const canGoForward = page < totalPages - 1;
  
  if (error) {
    return <div className="text-red-500">Error: Failed to load proposals</div>;
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">AssetDAO Proposals</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          {proposals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No proposals found
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <UnifiedProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onRefresh={refetch}
                  onVote={handleVote}
                  onExecute={handleExecute}
                  isVoting={isVoting}
                  isExecuting={isExecuting}
                />
              ))}
            </div>
          )}
          
          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-4">
            <div>
              Showing page {page + 1} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={!canGoBack}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setPage(p => p + 1)}
                disabled={!canGoForward}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
      
      {!isConnected && (
        <div className="bg-yellow-100 p-4 rounded-md mt-4">
          <p className="text-yellow-700">
            Connect your wallet to vote on or execute proposals.
          </p>
        </div>
      )}
    </div>
  );
}
