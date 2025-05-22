import { useState } from "react";
import { Button } from "@/components/ui/button";
import WagmiProposalCard from "./WagmiProposalCard";
import { useWagmiWallet } from "@/hooks/useWagmiWallet";
import { useWagmiProposalList } from "@/hooks/useWagmiProposals";
import { PlusIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import WagmiCreateProposalModal from "./WagmiCreateProposalModal"; // Using the Wagmi-compatible modal

/**
 * Wagmi-compatible Asset DAO component
 * This component uses wagmi hooks for wallet connection and contract interactions
 * while maintaining the same UI and functionality as the original AssetDAO component
 */
const WagmiAssetDAO = () => {
  const { isConnected } = useWagmiWallet();
  const { proposals, isLoading, error, refetch } = useWagmiProposalList();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleActionComplete = () => {
    // Refetch proposals after a successful action
    refetch();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">Asset DAO</h1>
          <span className="ml-3 text-xs px-2 py-1 bg-purple-900/50 text-purple-400 border border-purple-700/50 rounded-full">
            Wagmi Migration
          </span>
        </div>
        {isConnected && (
          <Button
            variant="default"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            New Proposal
          </Button>
        )}
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
      ) : proposals.length === 0 ? (
        <div className="text-center p-8 border border-dark-gray rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">No Proposals Yet</h3>
          <p className="text-gray mb-4">Be the first to create a proposal for the Asset DAO</p>
          {isConnected ? (
            <Button 
              variant="default" 
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Proposal
            </Button>
          ) : (
            <p className="text-sm text-gray">Connect your wallet to create proposals</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map((proposal) => (
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
    </div>
  );
};

export default WagmiAssetDAO;
