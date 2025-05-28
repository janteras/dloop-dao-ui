import React, { useState } from "react";
import { useProposals } from "@/hooks/useProposals";
import UnifiedProposalCard from "@/components/web3/unified/proposals/UnifiedProposalCard";
import { EnhancedProposalModal } from "./enhanced-proposal-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet } from "@/components/features/wallet/simplified-wallet-provider";
import { Plus, Search, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProposalStatus, ProposalType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConnectionIndicator } from "../wallet/connection-indicator";
import { WalletConnectBanner } from "../wallet/wallet-connect-banner";

// Filters interface
interface ProposalFilters {
  status: ProposalStatus | "all";
  type: ProposalType | "all";
  search: string;
}

export function ProposalExplorer() {
  // Get proposals data and wallet status, including the voting functionality
  const { proposals, isLoading, error, refetchProposals, voteOnProposal, executeProposal } = useProposals();
  const { isConnected } = useWallet();
  const { toast } = useToast();

  // State for filters and modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<ProposalFilters>({
    status: "all",
    type: "all",
    search: "",
  });
  const [activeTab, setActiveTab] = useState<string>("active");

  // Debug proposal statuses in console
  React.useEffect(() => {
    if (proposals && proposals.length > 0) {
      console.log('Debug - Proposal statuses:', proposals.map(p => p.status));
      console.log('Active proposals:', proposals.filter(p => p.status === 'active').length);
      console.log('Passed proposals:', proposals.filter(p => p.status === 'passed').length);
      console.log('Executed proposals:', proposals.filter(p => p.status === 'executed').length);
      console.log('Failed proposals:', proposals.filter(p => p.status === 'failed').length);
    } else {
      console.log('Waiting for proposals data to load...');
    }
  }, [proposals]);
  const [refreshing, setRefreshing] = useState(false);

  // Handle refreshing proposals
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchProposals();
    setRefreshing(false);

    toast({
      title: "Proposals Refreshed",
      description: "The proposal list has been updated.",
    });
  };

  // Get filtered proposals for the current tab
  const getFilteredProposalsByStatus = (status: string) => {
    if (!proposals) return [];

    // Apply common filters (search and type)
    const applyCommonFilters = (p: any) => {
      // Type filter
      if (filters.type !== "all" && p.type !== filters.type) return false;

      // Search filter (title and description)
      if (filters.search && !p.title?.toLowerCase().includes(filters.search.toLowerCase()) && 
          !p.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      return true;
    };

    // Helper function to check if quorum is met (100,000 DLOOP minimum)
    const meetsQuorum = (proposal: any) => {
      const forVotes = parseFloat(proposal.forVotes || '0');
      const againstVotes = parseFloat(proposal.againstVotes || '0');
      const totalVotes = forVotes + againstVotes;
      return totalVotes >= 100000; // 100,000 DLOOP quorum requirement
    };

    // Helper function to check if proposal has majority support
    const hasMajority = (proposal: any) => {
      const forVotes = parseFloat(proposal.forVotes || '0');
      const againstVotes = parseFloat(proposal.againstVotes || '0');
      return forVotes > againstVotes;
    };

    // Check if a proposal's deadline has passed
    const hasDeadlinePassed = (proposal: any) => {
      if (!proposal.deadline) {
        // If there's a createdAt date, check if standard voting period has passed
        if (proposal.createdAt) {
          try {
            const createdDate = new Date(proposal.createdAt);
            const votingPeriod = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
            const estimatedEnd = new Date(createdDate.getTime() + votingPeriod);
            return new Date() > estimatedEnd;
          } catch (error) {
            return false;
          }
        }
        return false;
      }

      try {
        const deadlineDate = new Date(proposal.deadline);
        return new Date() > deadlineDate;
      } catch (error) {
        return false;
      }
    };

    // Determine the actual status of each proposal based on quorum and voting rules
    const getActualStatus = (proposal: any) => {
      const isExecuted = proposal.executed || proposal.status?.toLowerCase() === 'executed';
      const isCanceled = proposal.canceled || proposal.status?.toLowerCase() === 'canceled';
      const deadlinePassed = hasDeadlinePassed(proposal);

      // If already executed or canceled, return that status
      if (isExecuted) return 'executed';
      if (isCanceled) return 'canceled';

      // If voting period is still active
      if (!deadlinePassed) {
        return 'active';
      }

      // Voting period has ended, check results
      const quorumMet = meetsQuorum(proposal);
      const majoritySupport = hasMajority(proposal);

      if (!quorumMet) {
        // Failed due to insufficient quorum
        return 'failed';
      }

      if (quorumMet && majoritySupport) {
        // Passed and ready for execution
        return 'passed';
      }

      // Failed due to majority rejection
      return 'failed';
    };

    // First filter all proposals by the common filters
    const allFilteredProposals = proposals.filter(applyCommonFilters);

    // For "all" tab, return all proposals that pass the common filters
    if (status === "all") {
      return allFilteredProposals;
    }

    // Filter proposals based on their calculated actual status
    return allFilteredProposals.filter(p => {
      const actualStatus = getActualStatus(p);
      return actualStatus === status;
    });
  };



  // Calculate tab counts based on our actual distribution
  const allCount = proposals?.length || 0;
  const activeProposalList = getFilteredProposalsByStatus("active");
  const passedProposalList = getFilteredProposalsByStatus("passed");
  const executedProposalList = getFilteredProposalsByStatus("executed");
  const failedProposalList = getFilteredProposalsByStatus("failed");

  // Use the actual counts from our distribution
  const activeCount = activeProposalList.length;
  const passedCount = passedProposalList.length;
  const executedCount = executedProposalList.length;
  const failedCount = failedProposalList.length;

  // Only log counts when we have actual data
  if (proposals && proposals.length > 0) {
    console.log("Debug - Proposal counts by tab:");
    console.log(`All: ${allCount}, Active: ${activeCount}, Passed: ${passedCount}, Executed: ${executedCount}, Failed: ${failedCount}`);
    console.log("Debug - Proposal #53 in Active tab:", activeProposalList.some(p => p.id === 53));

    // Run proposal type analysis and fixing in development
    if (process.env.NODE_ENV === 'development' && proposals.length > 0) {
      Promise.all([
        import('@/debug/proposalTypeAnalyzer'),
        import('@/debug/proposalTypeFixer')
      ]).then(([{ analyzeAllProposals }, { fixAllProposals }]) => {
        console.log('🔍 Running automatic proposal type analysis...');
        analyzeAllProposals(proposals);

        console.log('🔧 Running proposal type fixer...');
        const { fixed, report } = fixAllProposals(proposals);

        console.log('📊 Fix Report:');
        report.forEach(analysis => {
          if (analysis.issues.length > 0) {
            console.warn(`Proposal #${analysis.proposalId}:`, analysis);
          }
        });

        // Store fixed proposals for manual inspection
        (window as any).fixedProposals = fixed;
        (window as any).fixReport = report;

      }).catch(err => {
        console.warn('Could not load proposal type tools:', err);
      });
    }
  }

  

  // If wallet is not connected, show wallet connect banner
  if (!isConnected) {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <h2 className="text-2xl font-bold text-white">Asset DAO Proposals</h2>
        </div>
        <WalletConnectBanner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold relative inline-block group">
            Asset DAO Proposals
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/80 transition-all duration-500 group-hover:w-full"></span>
          </h2>
          <p className="text-gray group-hover:text-gray/90 transition-colors duration-300">View, vote, and create proposals to optimize the D-AI reserve pool.</p>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionIndicator />

          <Button
            variant="outline"
            size="sm"
            className="bg-dark-bg border-gray text-gray-300 hover:text-accent hover:border-accent transition-all duration-300 hover:shadow-sm hover:translate-y-[-1px]"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''} transition-transform duration-300 group-hover:rotate-180`} />
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">Refresh</span>
          </Button>

          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-accent text-dark-bg hover:bg-darker-accent transition-all duration-300 hover:shadow-md hover:translate-y-[-1px] relative overflow-hidden group"
            disabled={!isConnected}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-pulse"></span>
            <Plus className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
            <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">Create Proposal</span>
          </Button>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray transition-colors duration-300 group-focus-within:text-accent" />
          <Input
            placeholder="Search proposals..."
            className="pl-10 bg-dark-bg border-gray text-white focus-visible:ring-accent transition-all duration-300 focus:translate-y-[-1px] focus:shadow-sm"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="flex gap-2">
          <Select 
            value={filters.type} 
            onValueChange={(value) => setFilters({ ...filters, type: value as ProposalType | "all" })}
          >
            <SelectTrigger className="w-[180px] bg-dark-bg border-gray text-gray-300 focus:ring-accent transition-all duration-300 hover:border-accent/70 hover:shadow-sm">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-dark-bg border-gray text-gray-300 animate-in fade-in-80 zoom-in-95">
              <SelectItem value="all" className="transition-colors duration-200 hover:bg-accent/10 focus:bg-accent/20 hover:text-white focus:text-white">All Types</SelectItem>
              <SelectItem value="invest" className="transition-colors duration-200 hover:bg-accent/10 focus:bg-accent/20 hover:text-white focus:text-white">Invest</SelectItem>
              <SelectItem value="divest" className="transition-colors duration-200 hover:bg-accent/10 focus:bg-accent/20 hover:text-white focus:text-white">Divest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs for status filtering */}
      <Tabs defaultValue="active" value={activeTab} className="w-full">
        {/* @ts-ignore - Adding event handler for tab changes */}
        <div onChange={(e) => setActiveTab(e.target.value)} style={{display: 'none'}} />
        <TabsList className="bg-dark-bg border border-gray rounded-lg p-1 w-full overflow-x-auto flex-nowrap">
          <TabsTrigger 
            value="active" 
            className="flex-1 data-[state=active]:bg-dark-gray data-[state=active]:text-white transition-all duration-300 hover:bg-gray/10 data-[state=active]:shadow-sm relative group"
          >
            <span className="relative">
              Active
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 opacity-0 group-hover:opacity-100 data-[state=active]:opacity-100 group-hover:w-full data-[state=active]:w-full"></span>
            </span>
            <span className="ml-1.5 text-xs bg-dark-gray px-1.5 py-0.5 rounded-full transition-transform duration-300 group-hover:scale-110">{activeCount}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="passed" 
            className="flex-1 data-[state=active]:bg-dark-gray data-[state=active]:text-white transition-all duration-300 hover:bg-gray/10 data-[state=active]:shadow-sm relative group"
          >
            <span className="relative">
              Passed
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 opacity-0 group-hover:opacity-100 data-[state=active]:opacity-100 group-hover:w-full data-[state=active]:w-full"></span>
            </span>
            <span className="ml-1.5 text-xs bg-dark-gray px-1.5 py-0.5 rounded-full transition-transform duration-300 group-hover:scale-110">{passedCount}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="executed" 
            className="flex-1 data-[state=active]:bg-dark-gray data-[state=active]:text-white transition-all duration-300 hover:bg-gray/10 data-[state=active]:shadow-sm relative group"
          >
            <span className="relative">
              Executed
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 opacity-0 group-hover:opacity-100 data-[state=active]:opacity-100 group-hover:w-full data-[state=active]:w-full"></span>
            </span>
            <span className="ml-1.5 text-xs bg-dark-gray px-1.5 py-0.5 rounded-full transition-transform duration-300 group-hover:scale-110">{executedCount}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="failed" 
            className="flex-1 data-[state=active]:bg-dark-gray data-[state=active]:text-white transition-all duration-300 hover:bg-gray/10 data-[state=active]:shadow-sm relative group"
          >
            <span className="relative">
              Failed
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 opacity-0 group-hover:opacity-100 data-[state=active]:opacity-100 group-hover:w-full data-[state=active]:w-full"></span>
            </span>
            <span className="ml-1.5 text-xs bg-dark-gray px-1.5 py-0.5 rounded-full transition-transform duration-300 group-hover:scale-110">{failedCount}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            className="flex-1 data-[state=active]:bg-dark-gray data-[state=active]:text-white transition-all duration-300 hover:bg-gray/10 data-[state=active]:shadow-sm relative group"
          >
            <span className="relative">
              All 
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 opacity-0 group-hover:opacity-100 data-[state=active]:opacity-100 group-hover:w-full data-[state=active]:w-full"></span>
            </span>
            <span className="ml-1.5 text-xs bg-dark-gray px-1.5 py-0.5 rounded-full transition-transform duration-300 group-hover:scale-110">{allCount}</span>
          </TabsTrigger>
        </TabsList>

        {/* Active Proposals */}
        <TabsContent value="active" className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-destructive/20 border-destructive">
              <AlertTitle>Error loading proposals</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "An unknown error occurred"}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : proposals?.filter((p: any) => p.status === "active").length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray rounded-lg transition-all duration-500 hover:border-accent/40 hover:shadow-md">
              <h3 className="text-xl font-medium text-white mb-2 relative inline-block group">
                No active proposals
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 group-hover:w-full"></span>
              </h3>
              <p className="text-gray mb-6 transition-colors duration-300 max-w-md mx-auto">
                There are currently no proposals in the voting period
              </p>

              {isConnected && (
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-accent text-dark-bg hover:bg-darker-accent transition-all duration-300 hover:shadow-md hover:translate-y-[-1px] relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-pulse"></span>
                  <Plus className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
                  <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">Create New Proposal</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getFilteredProposalsByStatus("active").map((proposal: any) => (
                <UnifiedProposalCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  onVote={(proposalId, support) => voteOnProposal({ proposalId, support })}
                  onExecute={(proposalId) => executeProposal(proposalId)}
                  onActionComplete={refetchProposals}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Passed Proposals */}
        <TabsContent value="passed" className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-destructive/20 border-destructive">
              <AlertTitle>Error loading proposals</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "An unknown error occurred"}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : proposals?.filter((p: any) => p.status === "passed").length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray rounded-lg transition-all duration-500 hover:border-accent/40 hover:shadow-md">
              <h3 className="text-xl font-medium text-white mb-2 relative inline-block group">
                No passed proposals
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 group-hover:w-full"></span>
              </h3>
              <p className="text-gray mb-6 transition-colors duration-300 max-w-md mx-auto">
                There are currently no proposals that have passed but not yet executed
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getFilteredProposalsByStatus("passed").map((proposal: any) => (
                <UnifiedProposalCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  onVote={(proposalId, support) => voteOnProposal({ proposalId, support })}
                  onExecute={(proposalId) => executeProposal(proposalId)}
                  onActionComplete={refetchProposals}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Executed Proposals */}
        <TabsContent value="executed" className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-destructive/20 border-destructive">
              <AlertTitle>Error loading proposals</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "An unknown error occurred"}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : proposals?.filter((p: any) => p.status === "executed").length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray rounded-lg transition-all duration-500 hover:border-accent/40 hover:shadow-md">
              <h3 className="text-xl font-medium text-white mb-2 relative inline-block group">
                No executed proposals
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 group-hover:w-full"></span>
              </h3>
              <p className="text-gray mb-6 transition-colors duration-300 max-w-md mx-auto">
                There are currently no executed proposals
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getFilteredProposalsByStatus("executed").map((proposal: any) => (
                <UnifiedProposalCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  onVote={(proposalId, support) => voteOnProposal({ proposalId, support })}
                  onExecute={(proposalId) => executeProposal(proposalId)}
                  onActionComplete={refetchProposals}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Failed Proposals */}
        <TabsContent value="failed" className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-destructive/20 border-destructive">
              <AlertTitle>Error loading proposals</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "An unknown error occurred"}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : getFilteredProposalsByStatus("failed").length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray rounded-lg transition-all duration-500 hover:border-accent/40 hover:shadow-md">
              <h3 className="text-xl font-medium text-white mb-2 relative inline-block group">
                No failed proposals
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 group-hover:w-full"></span>
              </h3>
              <p className="text-gray mb-6 transition-colors duration-300 max-w-md mx-auto">
                There are currently no failed or defeated proposals
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getFilteredProposalsByStatus("failed").map((proposal: any) => (
                <UnifiedProposalCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  onVote={(proposalId, support) => voteOnProposal({ proposalId, support })}
                  onExecute={(proposalId) => executeProposal(proposalId)}
                  onActionComplete={refetchProposals}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* All Proposals */}
        <TabsContent value="all" className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-destructive/20 border-destructive">
              <AlertTitle>Error loading proposals</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "An unknown error occurred"}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : getFilteredProposalsByStatus("all").length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray rounded-lg transition-all duration-500 hover:border-accent/40 hover:shadow-md">
              <h3 className="text-xl font-medium text-white mb-2 relative inline-block group">
                No proposals found
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 group-hover:w-full"></span>
              </h3>
              <p className="text-gray mb-6 transition-colors duration-300 max-w-md mx-auto">
                {filters.search || filters.type !== "all" 
                  ? "Try adjusting your filters to see more results"
                  : "Be the first to submit a proposal for this DAO"}
              </p>

              {isConnected && (
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-accent text-dark-bg hover:bg-darker-accent transition-all duration-300 hover:shadow-md hover:translate-y-[-1px] relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-pulse"></span>
                  <Plus className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
                  <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">Create New Proposal</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getFilteredProposalsByStatus("all").map((proposal: any) => (
                <UnifiedProposalCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  onVote={(proposalId, support) => voteOnProposal({ proposalId, support })}
                  onExecute={(proposalId) => executeProposal(proposalId)}
                  onActionComplete={refetchProposals}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Enhanced Proposal Modal */}
      <EnhancedProposalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}