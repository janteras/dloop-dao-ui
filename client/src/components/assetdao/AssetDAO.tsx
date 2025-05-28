import { useState } from "react";
import { useProposals } from "@/hooks/useProposals";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import CreateProposalModal from "./CreateProposalModal";
import { UnifiedProposalCard } from "@/components/features/asset-dao/consolidated";
import { ProposalStatus, ProposalType } from "@/types";
import { CheckCircle, Clock, XCircle, Zap, Settings } from 'lucide-react';
import DataSourceMonitor from '@/components/features/asset-dao/diagnostics/DataSourceMonitor';
import { VoteVerificationWidget } from '@/components/features/asset-dao/diagnostics/VoteVerificationWidget';
import { LocalStorageAudit } from '@/components/features/asset-dao/diagnostics/LocalStorageAudit';
import { ComprehensiveAssetDAOAudit } from '@/components/features/asset-dao/diagnostics/ComprehensiveAssetDAOAudit';
import { AutoInvestigationSummary } from '@/components/features/asset-dao/diagnostics/AutoInvestigationSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletConnectBanner } from '@/components/features/wallet/wallet-connect-banner';

const AssetDAO = () => {

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

    // If wallet is not connected, show wallet connect banner
    if (!isConnected) {
      return (
        <section className="page-transition">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-6">AssetDAO Proposals</h1>
            <WalletConnectBanner />
          </div>
        </section>
      );
    }

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

      <Tabs defaultValue="overview" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="create">Create Proposal</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="investigation">Investigation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Auto Investigation Summary */}
          <AutoInvestigationSummary />

          {/* Portfolio Overview */}
        </TabsContent>

        <TabsContent value="proposals" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          {/* Create Proposal Form or Component */}
          <CreateProposalModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
          />
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <DataSourceMonitor />
            <VoteVerificationWidget />
            <LocalStorageAudit />
          </div>
        </TabsContent>

        <TabsContent value="investigation" className="space-y-6">
          <ComprehensiveAssetDAOAudit />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default AssetDAO;