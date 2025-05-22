import { useState } from "react";
import { useProposals } from "@/hooks/useProposals";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import CreateProposalModal from "./CreateProposalModal";
import { UnifiedProposalCard } from "@/components/features/asset-dao/consolidated";
import { ProposalStatus, ProposalType } from "@/types";
import WagmiAssetDAO from "./WagmiAssetDAO";

const AssetDAO = () => {
  // State for toggling between original and Wagmi implementations
  const [useWagmi, setUseWagmi] = useState(false);
  
  // If using Wagmi implementation, render the WagmiAssetDAO component
  if (useWagmi) {
    return (
      <div className="page-transition">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">AssetDAO Proposals</h1>
          <div className="flex items-center space-x-2">
            <Switch 
              id="wagmi-mode" 
              checked={useWagmi} 
              onCheckedChange={setUseWagmi} 
            />
            <Label htmlFor="wagmi-mode" className="cursor-pointer text-sm text-gray-400">
              Using Wagmi
            </Label>
          </div>
        </div>
        <WagmiAssetDAO />
      </div>
    );
  }
  
  // Original implementation
  const { isConnected } = useWallet();
  const { proposals = [], isLoading, error, voteOnProposal, executeProposal } = useProposals();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProposalStatus>("active");
  const [typeFilter, setTypeFilter] = useState<ProposalType | "all">("all");

  const filteredProposals = proposals.filter(proposal => {
    const statusMatch = proposal.status.toLowerCase() === activeTab;
    const typeMatch = typeFilter === "all" || proposal.type === typeFilter;
    return statusMatch && typeMatch;
  });

  // Updated to handle both function signature formats
  const handleVote = async (proposalId: number, support: boolean) => {
    // Check if voteOnProposal expects an object or separate parameters
    if (typeof voteOnProposal === 'function') {
      try {
        // Try the new format (object parameter)
        await voteOnProposal({ proposalId, support } as any);
      } catch (e) {
        // Fall back to the old format (separate parameters)
        await voteOnProposal(proposalId, support);
      }
    }
  };

  const handleExecute = async (proposalId: number) => {
    if (typeof executeProposal === 'function') {
      try {
        // Try the new format (object parameter)
        await executeProposal({ proposalId } as any);
      } catch (e) {
        // Fall back to the old format
        await executeProposal(proposalId);
      }
    }
  };
  
  const handleRefresh = () => {
    // If there's a refetch function, use it
    if (typeof (useProposals as any).refetch === 'function') {
      (useProposals as any).refetch();
    }
  };

  return (
    <section className="page-transition">
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
      </div>
      
      {/* Loading and Error States */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
          <span className="ml-3 text-gray">Loading proposals...</span>
        </div>
      ) : error ? (
        <div className="text-warning-red text-center py-8">{String(error)}</div>
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
            />
          ))}
        </div>
      )}
      
      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </section>
  );
};

export default AssetDAO;
