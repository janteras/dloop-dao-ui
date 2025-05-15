import { useState } from "react";
import { useProposals } from "@/hooks/useProposals";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateProposalModal from "./CreateProposalModal";
import ProposalCard from "./ProposalCard";
import { ProposalStatus, ProposalType } from "@/types";

const AssetDAO = () => {
  const { isConnected } = useWallet();
  const { proposals, isLoading, error, voteOnProposal, executeProposal } = useProposals();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProposalStatus>("active");
  const [typeFilter, setTypeFilter] = useState<ProposalType | "all">("all");

  const filteredProposals = proposals.filter(proposal => {
    const statusMatch = proposal.status.toLowerCase() === activeTab;
    const typeMatch = typeFilter === "all" || proposal.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const handleVote = async (proposalId: number, support: boolean) => {
    await voteOnProposal(proposalId, support);
  };

  const handleExecute = async (proposalId: number) => {
    await executeProposal(proposalId);
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
        <Tabs defaultValue="active" className="w-auto" onValueChange={(value) => setActiveTab(value as ProposalStatus)}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="passed">Passed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
            <TabsTrigger value="executed">Executed</TabsTrigger>
          </TabsList>
        </Tabs>
        
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
      
      {/* Proposals List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h3 className="text-xl text-warning-red mb-2">Error Loading Proposals</h3>
          <p className="text-gray">{error}</p>
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
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onVote={handleVote}
              onExecute={handleExecute}
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
