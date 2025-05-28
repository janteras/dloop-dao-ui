import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWagmiProposals } from '@/hooks/useWagmiProposals';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { WalletConnectBanner } from '@/components/features/wallet/wallet-connect-banner';
import { WagmiCreateProposalModal } from './WagmiCreateProposalModal';
import { WagmiProposalCard } from './WagmiProposalCard';
import { Spinner } from '@/components/ui/spinner';
import { ProposalStatus } from '@/types';

export default function WagmiAssetDAO() {
  const { proposals, isLoading, error, refetch } = useWagmiProposals();
  const { isConnected } = useWallet();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProposalStatus>('active');

  // Filter proposals by status
  const filteredProposals = proposals?.filter(proposal => 
    activeTab === 'active' || proposal.status === activeTab
  ) || [];

  const handleActionComplete = () => {
    refetch();
  };

  // If wallet is not connected, show wallet connect banner
  if (!isConnected) {
    return (
      <section className="page-transition">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">AssetDAO Proposals (Wagmi)</h1>
          <WalletConnectBanner />
        </div>
      </section>
    );
  }

  return (
    <section className="page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">AssetDAO Proposals (Wagmi)</h1>

        <Button 
          className="bg-accent text-dark-bg font-medium hover:bg-darker-accent transition-colors"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={!isConnected}
        >
          Create New Proposal
        </Button>
      </div>
      
      {/* Proposal Status Tabs */}
      <div className="inline-flex items-center space-x-4 mb-6">
        <Button
          variant={activeTab === 'active' ? 'default' : 'outline'}
          onClick={() => setActiveTab('active')}
        >
          Active
        </Button>
        <Button
          variant={activeTab === 'passed' ? 'default' : 'outline'}
          onClick={() => setActiveTab('passed')}
        >
          Passed
        </Button>
        <Button
          variant={activeTab === 'rejected' ? 'default' : 'outline'}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner className="h-12 w-12" />
        </div>
      ) : error ? (
        <div className="text-center p-8 border border-warning-red/30 rounded-lg bg-warning-red/10">
          <h3 className="text-xl font-semibold text-warning-red mb-2">Error Loading Proposals</h3>
          <p className="text-gray-300">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="text-center p-8 border border-dark-gray rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">No Proposals Yet</h3>
          <p className="text-gray mb-4">Be the first to create a proposal for the Asset DAO</p>
          
          <Button 
            variant="default" 
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!isConnected}
          >
            Create Proposal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProposals.map((proposal) => (
            <WagmiProposalCard
              key={proposal.id}
              proposal={proposal}
              onActionComplete={handleActionComplete}
            />
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <WagmiCreateProposalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
        />
      )}
    </section>
  );
}