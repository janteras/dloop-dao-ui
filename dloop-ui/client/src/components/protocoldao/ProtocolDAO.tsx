import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/components/features/wallet/simplified-wallet-provider";
import { ProposalStatus, ProtocolProposal } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CreateProtocolProposalModal } from "./CreateProtocolProposalModal";
import { PageContainer } from "@/components/layout/PageContainer";
import { SocialShare } from "@/components/features/shared/social-share";
import { CountdownTimer } from "@/components/features/shared/countdown-timer";

interface ProtocolMetrics {
  tvl: number;
  tvlChange: number;
  dloopPrice: number;
  priceChange: number;
  activeParticipants: number;
  newParticipants: number;
}

const ProtocolDAO = () => {
  const { isConnected } = useWallet();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  console.log("Current isCreating state:", isCreating);
  const [votingOnId, setVotingOnId] = useState<number | null>(null);
  const [executingId, setExecutingId] = useState<number | null>(null);
  
  // Fetch protocol metrics
  const { 
    data: protocolMetrics,
    isLoading: metricsLoading
  } = useQuery<ProtocolMetrics>({
    queryKey: ['protocol-metrics'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/protocol/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch protocol metrics');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching protocol metrics:', error);
        return null;
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Fetch protocol proposals
  const {
    data: protocolProposals,
    isLoading: proposalsLoading,
    error: proposalsError
  } = useQuery<ProtocolProposal[]>({
    queryKey: ['protocol-proposals'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/protocol/proposals');
        if (!response.ok) {
          throw new Error('Failed to fetch protocol proposals');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching protocol proposals:', error);
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });
  
  const isLoading = metricsLoading || proposalsLoading;
  
  // Vote on a protocol proposal
  const handleVote = async (proposalId: number, support: boolean) => {
    if (!isConnected) return;
    
    setVotingOnId(proposalId);
    try {
      // In a real implementation, would call contract method
      // This is a mock implementation
      toast({
        title: 'Vote Cast',
        description: 'Your vote has been cast successfully on protocol proposal.',
      });
    } catch (error: any) {
      console.error('Error voting on protocol proposal:', error);
      toast({
        title: 'Vote Failed',
        description: error.message || 'There was an error casting your vote. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVotingOnId(null);
    }
  };

  // Execute a protocol proposal
  const handleExecute = async (proposalId: number) => {
    if (!isConnected) return;
    
    setExecutingId(proposalId);
    try {
      // In a real implementation, would call contract method
      // This is a mock implementation
      toast({
        title: 'Proposal Executed',
        description: 'The protocol proposal has been executed successfully.',
      });
    } catch (error: any) {
      console.error('Error executing protocol proposal:', error);
      toast({
        title: 'Execution Failed',
        description: error.message || 'There was an error executing the proposal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExecutingId(null);
    }
  };

  const getStatusBadgeClass = (status: ProposalStatus) => {
    switch (status) {
      case 'active':
        return 'bg-primary/20 text-primary';
      case 'passed':
        return 'bg-green-500/20 text-green-500';
      case 'failed':
        return 'bg-destructive/20 text-destructive';
      case 'executed':
        return 'bg-blue-500/20 text-blue-500';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <section className="page-transition">
      <PageContainer>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold relative inline-block group">
            Protocol DAO
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/80 transition-all duration-500 group-hover:w-full"></span>
          </h1>
          
          <Button 
            className="bg-primary text-primary-foreground font-medium transition-all duration-300 hover:shadow-md hover:bg-primary/90 relative overflow-hidden group"
            onClick={() => {
              console.log("Create Proposal button clicked, setting isCreating to true");
              setIsCreating(true);
            }}
            disabled={!isConnected}
          >
            <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">Create Proposal</span>
            <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-pulse"></span>
          </Button>
        </div>
      
        {/* Protocol Proposal Creation Modal */}
        <CreateProtocolProposalModal
          isOpen={isCreating}
          onClose={() => {
            console.log("Modal onClose callback triggered");
            setIsCreating(false);
          }}
        />
        
        {/* Key Protocol Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="metric-card transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] group">
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-muted-foreground mb-2 group-hover:text-foreground transition-colors duration-300">
                <span className="relative">
                  Total Value Locked
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/40 transition-all duration-500 group-hover:w-full"></span>
                </span>
              </h2>
              <div className="text-3xl font-bold mono transition-all duration-300 group-hover:text-primary group-hover:scale-[1.02]">
                ${protocolMetrics?.tvl?.toLocaleString() || '0'}
              </div>
              <div className="mt-2 text-sm text-muted-foreground flex items-center">
                <span className="text-primary mr-1 transition-all duration-300 group-hover:scale-110 group-hover:font-bold">↑ {protocolMetrics?.tvlChange || '0'}%</span>
                <span>since last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="metric-card transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] group">
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-muted-foreground mb-2 group-hover:text-foreground transition-colors duration-300">
                <span className="relative">
                  DLOOP Price
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/40 transition-all duration-500 group-hover:w-full"></span>
                </span>
              </h2>
              <div className="text-3xl font-bold mono transition-all duration-300 group-hover:text-primary group-hover:scale-[1.02]">
                ${protocolMetrics?.dloopPrice?.toFixed(2) || '0.00'}
              </div>
              <div className="mt-2 text-sm text-muted-foreground flex items-center">
                <span 
                  className={`mr-1 transition-all duration-300 group-hover:scale-110 group-hover:font-bold
                    ${protocolMetrics?.priceChange && protocolMetrics.priceChange >= 0 
                      ? 'text-primary group-hover:text-green-500' 
                      : 'text-destructive group-hover:text-red-400'}`
                  }
                >
                  {protocolMetrics?.priceChange && protocolMetrics.priceChange >= 0 ? '↑' : '↓'} 
                  {Math.abs(protocolMetrics?.priceChange || 0)}%
                </span>
                <span>24h change</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="metric-card transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] group">
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-muted-foreground mb-2 group-hover:text-foreground transition-colors duration-300">
                <span className="relative">
                  Active Participants
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/40 transition-all duration-500 group-hover:w-full"></span>
                </span>
              </h2>
              <div className="text-3xl font-bold mono transition-all duration-300 group-hover:text-primary group-hover:scale-[1.02]">
                {protocolMetrics?.activeParticipants || '0'}
              </div>
              <div className="mt-2 text-sm text-muted-foreground flex items-center">
                <span className="text-primary mr-1 transition-all duration-300 group-hover:scale-110 group-hover:font-bold">↑ {protocolMetrics?.newParticipants || '0'}</span>
                <span>new this week</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* ProtocolDAO Proposals */}
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6 relative inline-block group">
              Protocol Governance Proposals
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/60 transition-all duration-500 group-hover:w-full"></span>
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : proposalsError ? (
              <div className="text-center py-12">
                <h3 className="text-xl text-destructive mb-2">Error Loading Proposals</h3>
                <p className="text-muted-foreground">{proposalsError.message}</p>
              </div>
            ) : !protocolProposals || protocolProposals.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl mb-2">No protocol proposals found</h3>
                <p className="text-muted-foreground">There are no protocol governance proposals at this time.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {protocolProposals.map((proposal) => (
                  <div 
                    key={proposal.id} 
                    className="border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all duration-300 group/proposal relative overflow-hidden"
                  >
                    {/* Subtle gradient background on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/proposal:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 relative">
                      <div className="mb-3 md:mb-0">
                        <h3 className="text-lg font-medium transition-colors duration-300 group-hover/proposal:text-primary">{proposal.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 transition-colors duration-300 group-hover/proposal:text-muted-foreground/80">{proposal.description}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs px-2 py-0.5 rounded transition-all duration-300 group-hover/proposal:scale-105 ${getStatusBadgeClass(proposal.status)}`}>
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">ID: {proposal.id}</span>
                        <SocialShare 
                          title={`D-Loop Protocol Proposal: ${proposal.title}`}
                          url={`${window.location.origin}/protocoldao?proposal=${proposal.id}`}
                          description={`Check out this Protocol DAO proposal: ${proposal.description}`}
                          platforms={['twitter', 'linkedin', 'copy']}
                          size="icon"
                          compact={true}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 relative">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm group/item transition-all duration-300 hover:translate-x-1">
                          <span className="text-muted-foreground">Proposer</span>
                          <span className="font-medium mono truncate max-w-[200px] transition-colors duration-300 group-hover/item:text-primary">
                            {proposal.proposer}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm group/item transition-all duration-300 hover:translate-x-1">
                          <span className="text-muted-foreground">Proposed</span>
                          <span className="font-medium transition-colors duration-300 group-hover/item:text-primary">
                            {new Date(proposal.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm group/item transition-all duration-300 hover:translate-x-1">
                          <span className="text-muted-foreground">
                            {proposal.status === 'active' ? 'Ends' : 
                             proposal.status === 'executed' ? 'Executed' : 'Ended'}
                          </span>
                          <span className="font-medium transition-colors duration-300 group-hover/item:text-primary">
                            {proposal.status === 'active' 
                              ? proposal.endsAt 
                              : new Date(proposal.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Add countdown timer for active proposals */}
                        {proposal.status === 'active' && proposal.endTimeISO && (
                          <div className="mt-2 text-sm border border-border rounded-md p-2 bg-secondary/30 transition-all duration-300 group-hover/item:border-primary/30">
                            <CountdownTimer 
                              endTime={proposal.endTimeISO}
                              className="w-full"
                              onComplete={() => console.log(`Proposal ${proposal.id} voting has ended`)}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {proposal.details.map((detail, i) => (
                          <div key={i} className="flex justify-between text-sm group/detail transition-all duration-300 hover:translate-x-1">
                            <span className="text-muted-foreground">{detail.label}</span>
                            <span className={`${detail.isHighlighted ? 'text-primary font-medium' : 'font-medium'} transition-colors duration-300 group-hover/detail:text-primary/90`}>
                              {detail.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4 relative">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">
                          {proposal.status === 'active' ? 'Votes' : 'Final Result'}
                        </span>
                        <span className="text-sm font-medium transition-all duration-300 group-hover/proposal:text-primary group-hover/proposal:font-semibold">
                          {proposal.forVotes}% Yes ({proposal.voteCount.toLocaleString()} DLOOP)
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2.5 transition-all duration-300 group-hover/proposal:h-3">
                        <div className={`rounded-full transition-all duration-500 ${
                          proposal.status === 'passed' ? 'bg-green-500 group-hover/proposal:bg-green-400' :
                          proposal.status === 'failed' ? 'bg-destructive group-hover/proposal:bg-destructive/80' :
                          proposal.status === 'executed' ? 'bg-blue-500 group-hover/proposal:bg-blue-400' : 'bg-primary group-hover/proposal:bg-primary/80'
                        }`} 
                        style={{ 
                          width: `${proposal.forVotes}%`,
                          height: '100%'
                        }}></div>
                      </div>
                    </div>
                    
                    {proposal.status === 'active' ? (
                      <div className="grid grid-cols-2 gap-3 relative">
                        <Button 
                          className="bg-primary text-primary-foreground font-medium transition-all duration-300 hover:bg-primary/90 hover:shadow-sm"
                          onClick={() => handleVote(proposal.id, true)}
                          disabled={votingOnId === proposal.id || !isConnected}
                        >
                          {votingOnId === proposal.id ? '...' : 'Yes'}
                        </Button>
                        <Button 
                          variant="outline"
                          className="font-medium transition-all duration-300 hover:bg-muted/50 hover:border-primary/30"
                          onClick={() => handleVote(proposal.id, false)}
                          disabled={votingOnId === proposal.id || !isConnected}
                        >
                          {votingOnId === proposal.id ? '...' : 'No'}
                        </Button>
                      </div>
                    ) : proposal.status === 'passed' ? (
                      <Button 
                        className="w-full bg-primary text-primary-foreground font-medium relative overflow-hidden group-hover/proposal:shadow-md transition-all duration-300"
                        onClick={() => handleExecute(proposal.id)}
                        disabled={executingId === proposal.id || !isConnected}
                      >
                        <span className="relative z-10">
                          {executingId === proposal.id ? 'Executing...' : 'Execute Proposal'}
                        </span>
                        <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-0 group-hover/proposal:opacity-100 transition-opacity duration-500 group-hover/proposal:animate-pulse"></span>
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full font-medium cursor-not-allowed transition-all duration-300 group-hover/proposal:bg-muted/30"
                        disabled
                      >
                        {proposal.status === 'executed' ? 'Execution Complete' : 'Failed'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </section>
  );
};

export default ProtocolDAO;
