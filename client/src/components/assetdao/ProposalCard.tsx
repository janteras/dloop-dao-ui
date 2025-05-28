import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { Proposal } from "@/types";
import { shortenAddress } from "@/lib/utils";
import { CountdownTimer } from "@/components/features/shared/countdown-timer";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import toast from "react-hot-toast";
import { UnifiedProposalCard } from "@/components/web3/unified/proposals/UnifiedProposalCard";
import { useFeatureFlag } from "@/config/feature-flags";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";

interface ProposalCardProps {
  proposal: Proposal;
  onVote: (proposalId: number, support: boolean) => Promise<void>;
  onExecute: (proposalId: number) => Promise<void>;
  useWagmi?: boolean; // Allow override to use Wagmi implementation
  expanded?: boolean; // Whether to show expanded view
}

const ProposalCard = ({ proposal, onVote, onExecute, useWagmi: propUseWagmi, expanded = false }: ProposalCardProps) => {
  // Check if we should use the unified component based on feature flags
  const useWagmiProposalCards = useFeatureFlag('useWagmiProposalCards');
  
  // If unified card feature is enabled OR explicitly requested via prop, use the unified card
  const shouldUseUnified = useWagmiProposalCards || propUseWagmi !== undefined;
  
  // If we should use the unified component, render that instead
  if (shouldUseUnified) {
    return (
      <UnifiedProposalCard
        proposal={proposal}
        onVote={async (proposalId, support) => {
          await onVote(proposalId, support);
        }}
        onExecute={async (proposalId) => {
          await onExecute(proposalId);
        }}
        expanded={expanded}
        useWagmi={propUseWagmi}
        className="proposal-card border border-dark-gray hover:cursor-pointer"
      />
    );
  }
  
  // Otherwise, use the legacy implementation
  const { isConnected } = useWallet();
  const [isVoting, setIsVoting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copyingAddress, setCopyingAddress] = useState<string | null>(null);

  const handleVote = async (support: boolean) => {
    if (!isConnected) return;
    
    setIsVoting(true);
    try {
      await onVote(proposal.id, support);
    } finally {
      setIsVoting(false);
    }
  };

  const handleExecute = async () => {
    if (!isConnected) return;
    
    setIsExecuting(true);
    try {
      await onExecute(proposal.id);
    } finally {
      setIsExecuting(false);
    }
  };

  const getBadgeColor = () => {
    switch (proposal.status) {
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
    <Card className="proposal-card border border-dark-gray hover:cursor-pointer">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" 
            className={`${proposal.type === 'invest' ? 'bg-green-900/20 text-green-500' : 'bg-orange-900/20 text-orange-500'} mb-2`}>
            {proposal.type === 'invest' ? 'Investment Proposal' : 'Divestment Proposal'}
          </Badge>
          <Badge variant="outline" className={getBadgeColor()}>
            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </Badge>
        </div>
        
        <div className="mb-4">
          <h2 className="text-lg font-medium text-white">{proposal.title}</h2>
          {(expanded || proposal.description.length < 100) && (
            <p className="text-sm text-gray mt-1">{proposal.description}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col space-y-1">
            <span className="text-gray text-xs">Asset</span>
            <span className="text-white text-sm font-medium">{proposal.token}</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-gray text-xs">
              {proposal.type === 'invest' ? 'Investment Amount' : 'Withdrawal Amount'}
            </span>
            <span className="text-white text-sm font-medium">{proposal.amount.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray">Type</span>
            <span className={`font-medium capitalize ${proposal.type === 'invest' ? 'text-green-500' : 'text-orange-500'}`}>
              {proposal.type === 'invest' ? 'Investment' : 'Divestment'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray">Proposer</span>
            <span className="text-white font-medium mono flex items-center">
              {proposal.proposer.startsWith('AI.Gov') 
                ? proposal.proposer 
                : shortenAddress(proposal.proposer)
              }
            </span>
          </div>
          {proposal.status === 'active' ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray">Ends</span>
                <span className="text-white font-medium">{proposal.endsIn}</span>
              </div>
              {proposal.endTimeISO && (
                <div className="mt-2 text-sm border border-dark-gray rounded-md p-2 bg-dark-bg transition-all duration-300 hover:border-accent/30">
                  <CountdownTimer 
                    endTime={proposal.endTimeISO}
                    className="w-full"
                    onComplete={() => console.log(`Proposal ${proposal.id} voting has ended`)}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-gray">Result</span>
              <span className="text-white font-medium">{proposal.forVotes}% Yes</span>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray">Votes</span>
            <span className="text-sm text-white">{proposal.forVotes}% Yes</span>
          </div>
          <Progress 
            value={proposal.forVotes} 
            className={`h-2.5 ${
              proposal.status === 'passed' 
                ? 'bg-green-900' 
                : proposal.status === 'failed' 
                  ? 'bg-red-900' 
                  : 'bg-dark-bg'
            }`} 
          />
        </div>
        
        {proposal.status === 'active' ? (
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="bg-accent text-dark-bg font-medium hover:bg-darker-accent"
              onClick={() => handleVote(true)}
              disabled={isVoting || !isConnected}
            >
              {isVoting ? '...' : (
                <>
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Yes
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              className="bg-dark-bg text-gray border border-gray font-medium hover:border-warning-red hover:text-warning-red"
              onClick={() => handleVote(false)}
              disabled={isVoting || !isConnected}
            >
              {isVoting ? '...' : (
                <>
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  No
                </>
              )}
            </Button>
          </div>
        ) : proposal.status === 'passed' ? (
          <Button 
            className="w-full bg-accent text-dark-bg font-medium hover:bg-darker-accent"
            onClick={handleExecute}
            disabled={isExecuting || !isConnected}
          >
            {isExecuting ? 'Executing...' : 'Execute Proposal'}
          </Button>
        ) : (
          <Button 
            className="w-full" 
            variant="outline" 
            disabled
          >
            {proposal.status === 'executed' ? 'Executed' : 'Failed'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
