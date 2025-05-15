import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import { Proposal } from "@/types";
import { shortenAddress, copyToClipboard } from "@/lib/utils";
import { CountdownTimer } from "@/components/features/shared/countdown-timer";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProposalCardProps {
  proposal: Proposal;
  onVote: (proposalId: number, support: boolean) => Promise<void>;
  onExecute: (proposalId: number) => Promise<void>;
}

const ProposalCard = ({ proposal, onVote, onExecute }: ProposalCardProps) => {
  const { isConnected } = useWallet();
  const [isVoting, setIsVoting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copyingAddress, setCopyingAddress] = useState<string | null>(null);
  const { create: createToast } = useToast();

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
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-medium text-white">{proposal.title}</h2>
            <p className="text-sm text-gray mt-1">{proposal.description}</p>
          </div>
          <Badge variant="outline" className={getBadgeColor()}>
            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </Badge>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray">Type</span>
            <span className="text-white font-medium capitalize">{proposal.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray">Amount</span>
            <span className="text-white font-medium mono">{proposal.amount.toLocaleString()} {proposal.token}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray">Proposer</span>
            <span className="text-white font-medium mono flex items-center">
              {proposal.proposer.startsWith('AI.Gov') 
                ? proposal.proposer 
                : (
                  <div className="flex items-center space-x-1">
                    <span className="truncate max-w-[120px] overflow-hidden inline-block align-middle">{shortenAddress(proposal.proposer, 6, 4, '....')}</span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setCopyingAddress(proposal.proposer);
                        const success = await copyToClipboard(proposal.proposer);
                        if (success) {
                          createToast({
                            title: "Address copied to clipboard",
                            variant: "default",
                            duration: 2000,
                          });
                          setTimeout(() => setCopyingAddress(null), 1000);
                        }
                      }}
                      className="text-gray hover:text-accent transition-colors ml-1 rounded-md"
                      aria-label="Copy address"
                    >
                      {copyingAddress === proposal.proposer ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )
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
              {isVoting ? '...' : 'Yes'}
            </Button>
            <Button 
              variant="outline"
              className="bg-dark-bg text-gray border border-gray font-medium hover:border-warning-red hover:text-warning-red"
              onClick={() => handleVote(false)}
              disabled={isVoting || !isConnected}
            >
              {isVoting ? '...' : 'No'}
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
