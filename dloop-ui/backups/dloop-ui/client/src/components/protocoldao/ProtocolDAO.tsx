import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from "@/components/features/wallet/simplified-wallet-provider";
import { ProposalStatus, ProtocolProposal } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CreateProtocolProposalModal } from "./CreateProtocolProposalModal";

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
        return 'bg-accent/20 text-accent';
      case 'passed':
        return 'bg-green-500/20 text-green-500';
      case 'failed':
        return 'bg-warning-red/20 text-warning-red';
      case 'executed':
        return 'bg-blue-500/20 text-blue-500';
      default:
        return 'bg-gray/20 text-gray';
    }
  };

  return (
    <section className="page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Protocol DAO</h1>
        
        <Button 
          className="bg-accent text-dark-bg font-medium hover:bg-darker-accent transition-colors btn-hover-effect btn-active-effect"
          onClick={() => {
            console.log("Create Proposal button clicked, setting isCreating to true");
            setIsCreating(true);
          }}
          disabled={!isConnected}
        >
          Create Proposal
        </Button>
      </div>
      
      {/* Protocol Proposal Creation Modal */}
      {isCreating && (
        <CreateProtocolProposalModal
          isOpen={isCreating}
          onClose={() => {
            console.log("Modal onClose callback triggered");
            setIsCreating(false);
          }}
        />
      )}
      
      {/* Key Protocol Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray mb-2">Total Value Locked</h2>
            <div className="text-3xl font-bold text-white mono">
              ${protocolMetrics?.tvl?.toLocaleString() || '0'}
            </div>
            <div className="mt-2 text-sm text-gray flex items-center">
              <span className="text-accent mr-1">↑ {protocolMetrics?.tvlChange || '0'}%</span>
              <span>since last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray mb-2">DLOOP Price</h2>
            <div className="text-3xl font-bold text-white mono">
              ${protocolMetrics?.dloopPrice?.toFixed(2) || '0.00'}
            </div>
            <div className="mt-2 text-sm text-gray flex items-center">
              <span className={`mr-1 ${protocolMetrics?.priceChange && protocolMetrics.priceChange >= 0 ? 'text-accent' : 'text-warning-red'}`}>
                {protocolMetrics?.priceChange && protocolMetrics.priceChange >= 0 ? '↑' : '↓'} 
                {Math.abs(protocolMetrics?.priceChange || 0)}%
              </span>
              <span>24h change</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray mb-2">Active Participants</h2>
            <div className="text-3xl font-bold text-white mono">
              {protocolMetrics?.activeParticipants || '0'}
            </div>
            <div className="mt-2 text-sm text-gray flex items-center">
              <span className="text-accent mr-1">↑ {protocolMetrics?.newParticipants || '0'}</span>
              <span>new this week</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* ProtocolDAO Proposals */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Protocol Governance Proposals</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : proposalsError ? (
            <div className="text-center py-12">
              <h3 className="text-xl text-warning-red mb-2">Error Loading Proposals</h3>
              <p className="text-gray">{proposalsError.message}</p>
            </div>
          ) : !protocolProposals || protocolProposals.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl text-white mb-2">No protocol proposals found</h3>
              <p className="text-gray">There are no protocol governance proposals at this time.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {protocolProposals.map((proposal) => (
                <div key={proposal.id} className="border border-gray rounded-xl p-5 hover:border-accent transition-colors">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                    <div className="mb-3 md:mb-0">
                      <h3 className="text-lg font-medium text-white">{proposal.title}</h3>
                      <p className="text-sm text-gray mt-1">{proposal.description}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadgeClass(proposal.status)}`}>
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray">ID: {proposal.id}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray">Proposer</span>
                        <span className="text-white font-medium mono truncate max-w-[200px]">
                          {proposal.proposer}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray">Proposed</span>
                        <span className="text-white font-medium">
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray">
                          {proposal.status === 'active' ? 'Ends' : 
                           proposal.status === 'executed' ? 'Executed' : 'Ended'}
                        </span>
                        <span className="text-white font-medium">
                          {proposal.status === 'active' 
                            ? proposal.endsAt 
                            : new Date(proposal.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {proposal.details.map((detail, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray">{detail.label}</span>
                          <span className={detail.isHighlighted ? 'text-accent font-medium' : 'text-white font-medium'}>
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray">
                        {proposal.status === 'active' ? 'Votes' : 'Final Result'}
                      </span>
                      <span className="text-sm text-white">
                        {proposal.forVotes}% Yes ({proposal.voteCount.toLocaleString()} DLOOP)
                      </span>
                    </div>
                    <div className="w-full bg-dark-bg rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${
                        proposal.status === 'passed' ? 'bg-green-500' :
                        proposal.status === 'failed' ? 'bg-warning-red' :
                        proposal.status === 'executed' ? 'bg-blue-500' : 'bg-accent'
                      }`} style={{ width: `${proposal.forVotes}%` }}></div>
                    </div>
                  </div>
                  
                  {proposal.status === 'active' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        className="bg-accent text-dark-bg font-medium hover:bg-darker-accent"
                        onClick={() => handleVote(proposal.id, true)}
                        disabled={votingOnId === proposal.id || !isConnected}
                      >
                        {votingOnId === proposal.id ? '...' : 'Yes'}
                      </Button>
                      <Button 
                        variant="outline"
                        className="bg-dark-bg text-gray border border-gray font-medium hover:border-warning-red hover:text-warning-red"
                        onClick={() => handleVote(proposal.id, false)}
                        disabled={votingOnId === proposal.id || !isConnected}
                      >
                        {votingOnId === proposal.id ? '...' : 'No'}
                      </Button>
                    </div>
                  ) : proposal.status === 'passed' ? (
                    <Button 
                      className="w-full bg-accent text-dark-bg font-medium hover:bg-darker-accent"
                      onClick={() => handleExecute(proposal.id)}
                      disabled={executingId === proposal.id || !isConnected}
                    >
                      {executingId === proposal.id ? 'Executing...' : 'Execute Proposal'}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full bg-dark-bg text-gray border border-gray font-medium cursor-not-allowed"
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
    </section>
  );
};

export default ProtocolDAO;
