import { useState } from "react";
import { useProposals } from "@/hooks/useProposals";
import { ProposalCard } from "./proposal-card";
import { CreateProposalModal } from "./create-proposal-modal";
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

// Filters interface
interface ProposalFilters {
  status: ProposalStatus | "all";
  type: ProposalType | "all";
  search: string;
}

export function ProposalExplorer() {
  // Get proposals data and wallet status
  const { proposals, isLoading, error, refetchProposals } = useProposals();
  const { isConnected } = useWallet();
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
    await refetchProposals();
    setRefreshing(false);
    
    toast({
      title: "Proposals Refreshed",
      description: "The proposal list has been updated.",
    });
  };
  
  // Filter proposals based on current filters
  const filteredProposals = proposals
    ? proposals.filter((p: any) => {
        // Tab filter (status filter)
        if (activeTab !== "all" && p.status !== activeTab) return false;
        
        // Type filter
        if (filters.type !== "all" && p.type !== filters.type) return false;
        
        // Search filter (title and description)
        if (filters.search && !p.title.toLowerCase().includes(filters.search.toLowerCase()) && 
            !p.description.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        
        return true;
      })
    : [];
  
  // Calculate tab counts  
  const statusCounts = proposals?.reduce((counts: Record<string, number>, proposal: any) => {
    counts[proposal.status] = (counts[proposal.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>) || {};
  
  const allCount = proposals?.length || 0;
  const activeCount = statusCounts.active || 0;
  const passedCount = statusCounts.passed || 0;
  const executedCount = statusCounts.executed || 0;
  const failedCount = statusCounts.failed || 0;
  
  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Asset DAO Proposals</h2>
          <p className="text-gray">View, vote, and create proposals for asset management.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <ConnectionIndicator className="hidden md:flex mr-2" />
          
          <Button
            variant="outline"
            size="sm"
            className="bg-dark-bg border-gray text-white hover:border-accent"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-accent text-dark-bg hover:bg-darker-accent"
            disabled={!isConnected}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Proposal
          </Button>
        </div>
      </div>
      
      {/* Filter and search controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray" />
          <Input
            placeholder="Search proposals..."
            className="pl-10 bg-dark-bg border-gray text-white focus-visible:ring-accent"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        
        <div className="flex gap-2">
          <Select 
            value={filters.type} 
            onValueChange={(value) => setFilters({ ...filters, type: value as ProposalType | "all" })}
          >
            <SelectTrigger className="w-[180px] bg-dark-bg border-gray text-white focus:ring-accent">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-dark-bg border-gray text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="invest">Invest</SelectItem>
              <SelectItem value="divest">Divest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Tabs for status filtering */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-dark-bg border border-gray rounded-lg p-1 w-full overflow-x-auto flex-nowrap">
          <TabsTrigger 
            value="all" 
            className="flex-1 data-[state=active]:bg-dark-gray data-[state=active]:text-white"
          >
            All <span className="ml-1.5 text-xs bg-dark-gray px-1.5 py-0.5 rounded-full">{allCount}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="active" 
            className="flex-1 data-[state=active]:bg-dark-gray data-[state=active]:text-white"
          >
            Active <span className="ml-1.5 text-xs bg-dark-gray px-1.5 py-0.5 rounded-full">{activeCount}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="passed" 
            className="flex-1 data-[state=active]:bg-dark-gray data-[state=active]:text-white"
          >
            Passed <span className="ml-1.5 text-xs bg-dark-gray px-1.5 py-0.5 rounded-full">{passedCount}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="executed" 
            className="flex-1 data-[state=active]:bg-dark-gray data-[state=active]:text-white"
          >
            Executed <span className="ml-1.5 text-xs bg-dark-gray px-1.5 py-0.5 rounded-full">{executedCount}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="failed" 
            className="flex-1 data-[state=active]:bg-dark-gray data-[state=active]:text-white"
          >
            Failed <span className="ml-1.5 text-xs bg-dark-gray px-1.5 py-0.5 rounded-full">{failedCount}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {/* Error state */}
          {error && (
            <Alert variant="destructive" className="mb-6 bg-destructive/20 border-destructive">
              <AlertTitle>Error loading proposals</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "An unknown error occurred"}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && filteredProposals.length === 0 && (
            <div className="text-center py-12 border border-dashed border-gray rounded-lg">
              <h3 className="text-xl font-medium text-white mb-2">No proposals found</h3>
              <p className="text-gray mb-6">
                {filters.search || filters.type !== "all" 
                  ? "Try adjusting your filters to see more results"
                  : "Be the first to submit a proposal for this DAO"}
              </p>
              
              {isConnected && (
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-accent text-dark-bg hover:bg-darker-accent"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Proposal
                </Button>
              )}
            </div>
          )}
          
          {/* Proposals list */}
          {!isLoading && filteredProposals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProposals.map((proposal: any) => (
                <ProposalCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Create Proposal Modal */}
      <CreateProposalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}