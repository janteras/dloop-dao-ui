import React, { useState } from "react";
import { useWagmiProposalList } from "@/hooks/useWagmiProposals";
import { WagmiProposalCard } from "@/components/assetdao/WagmiProposalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWagmiWallet } from "@/hooks/useWagmiWallet";
import { Plus, Search, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProposalStatus, ProposalType, Proposal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { WagmiCreateProposalModal } from "@/components/assetdao/WagmiCreateProposalModal";
import { WalletConnectBanner } from "@/components/features/wallet/wallet-connect-banner";

// Filters interface
interface ProposalFilters {
  status: ProposalStatus | "all";
  type: ProposalType | "all";
  search: string;
}

export function WagmiProposalExplorer() {
  // Get proposals data and wallet status using Wagmi hooks
  const { proposals, isLoading, error, refetch, usingFallback } = useWagmiProposalList();
  const { isConnected } = useWagmiWallet();
  const { toast } = useToast();

  // State for filters and modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<ProposalFilters>({
    status: "all",
    type: "all",
    search: "",
  });
  const [activeTab, setActiveTab] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Handle refreshing proposals
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Refreshed",
        description: "Proposal list has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh proposals",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle create proposal button click
  const handleCreateProposal = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create proposals",
        variant: "destructive",
      });
      return;
    }
    setIsModalOpen(true);
  };

  // Filter proposals based on current filters
  const filteredProposals = React.useMemo(() => {
    if (!proposals) return [];

    return proposals.filter((proposal) => {
      // Filter by status
      const statusMatch = 
        filters.status === "all" || 
        proposal.status.toLowerCase() === filters.status.toLowerCase();

      // Filter by type
      const typeMatch = 
        filters.type === "all" || 
        proposal.type === filters.type;

      // Filter by search term
      const searchMatch = 
        !filters.search || 
        proposal.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        proposal.description.toLowerCase().includes(filters.search.toLowerCase());

      return statusMatch && typeMatch && searchMatch;
    });
  }, [proposals, filters]);

  // Group proposals by status for tabs
  const proposalsByStatus = React.useMemo(() => {
    if (!proposals) return { all: [], active: [], passed: [], executed: [], failed: [] };

    const grouped = {
      all: [...proposals],
      active: proposals.filter(p => p.status === 'active'),
      passed: proposals.filter(p => p.status === 'passed'),
      executed: proposals.filter(p => p.status === 'executed'),
      failed: proposals.filter(p => p.status === 'failed')
    };

    // Log proposal counts by tab for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Debug - Proposal counts by tab:');
      console.log(`All: ${grouped.all.length}, Active: ${grouped.active.length}, Passed: ${grouped.passed.length}, Executed: ${grouped.executed.length}, Failed: ${grouped.failed.length}`);

      // Check if specific proposals are in expected tabs
      if (grouped.all.length > 0) {
        const testProposalId = grouped.all[0].id;
        const inActiveTab = grouped.active.some(p => p.id === testProposalId);
        console.log(`Debug - Proposal #${testProposalId} in Active tab: ${inActiveTab}`);
      }
    }

    return grouped;
  }, [proposals]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update status filter to match tab
    if (value !== 'all') {
      setFilters(prev => ({ ...prev, status: value as ProposalStatus }));
    } else {
      setFilters(prev => ({ ...prev, status: 'all' }));
    }
  };

  // Get proposals for current tab
  const currentTabProposals = React.useMemo(() => {
    if (activeTab === 'all') {
      return filteredProposals;
    }
    return filteredProposals.filter(p => p.status === activeTab);
  }, [filteredProposals, activeTab]);

  // Handle successful proposal creation
  const handleProposalCreated = () => {
    setIsModalOpen(false);
    handleRefresh();
  };

    // If wallet is not connected, show wallet connect banner
    if (!isConnected) {
      return (
        <div className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <h2 className="text-2xl font-bold text-white">Proposals</h2>
          </div>
          <WalletConnectBanner />
        </div>
      );
    }

  return (
    <div className="w-full space-y-6">
      {/* Header with create button */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Proposals</h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing || isLoading}
          >
            {refreshing ? <Spinner size="sm" /> : <RefreshCw size={16} />}
            <span className="ml-2">Refresh</span>
          </Button>

          <Button 
            onClick={handleCreateProposal} 
            disabled={!isConnected}
            size="sm"
          >
            <Plus size={16} />
            <span className="ml-2">Create Proposal</span>
          </Button>
        </div>
      </div>

      {/* Fallback indicator if using placeholder data */}
      {usingFallback && (
        <Alert className="bg-yellow-900/20 border-yellow-600 text-yellow-300">
          <AlertTitle>Using Fallback Data</AlertTitle>
          <AlertDescription>
            Some contract calls failed and we're showing placeholder data. This will be replaced with real data when the contract is available.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search proposals..."
            className="pl-10"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="w-full sm:w-48">
          <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as ProposalType | 'all' }))}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="invest">Investment</SelectItem>
              <SelectItem value="divest">Divestment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs and content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            All <span className="ml-2 rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium">
              {proposalsByStatus.all.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active <span className="ml-2 rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium">
              {proposalsByStatus.active.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="passed">
            Passed <span className="ml-2 rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium">
              {proposalsByStatus.passed.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="executed">
            Executed <span className="ml-2 rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium">
              {proposalsByStatus.executed.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed <span className="ml-2 rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-medium">
              {proposalsByStatus.failed.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
              <span className="ml-3 text-gray-400">Loading proposals...</span>
            </div>
          ) : error ? (
            <Alert className="bg-destructive/20 border-destructive text-destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{String(error)}</AlertDescription>
            </Alert>
          ) : currentTabProposals.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-xl font-medium mb-2">No proposals found</h3>
              <p className="text-gray-400">
                {filters.search || filters.type !== 'all' 
                  ? "Try adjusting your filters to see more results." 
                  : `No ${activeTab !== 'all' ? activeTab : ''} proposals available.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentTabProposals.map((proposal) => (
                <WagmiProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onActionComplete={handleRefresh}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Proposal Modal */}
      <WagmiCreateProposalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleProposalCreated}
      />
    </div>
  );
}