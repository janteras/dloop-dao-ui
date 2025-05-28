import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Proposal } from "@/types";
import { shortenAddress, copyToClipboard } from "@/lib/utils";
import { CountdownTimer } from "@/components/features/shared/countdown-timer";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { calculateVotingStats } from "@/utils/vote-helpers";
import toast from "react-hot-toast";
import { useWagmiWallet } from "@/hooks/useWagmiWallet";
import { useWagmiProposalVoting, useWagmiProposalExecution } from "@/hooks/useWagmiProposals";
import { getTokenInfo, getAmountWithSymbol } from "@/lib/token-utils";
import { mapContractTypeToUI } from "@/lib/proposalTypeMapping";

interface WagmiProposalCardProps {
  proposal: Proposal;
  onActionComplete?: () => void;
}

/**
 * Wagmi-compatible proposal card component
 * This component uses wagmi hooks for wallet connection and contract interactions
 * while maintaining the same UI and functionality as the original ProposalCard
 */
const WagmiProposalCard = ({ proposal, onActionComplete }: WagmiProposalCardProps) => {
  const { isConnected } = useWagmiWallet();
  const { voteOnProposal, isVoting } = useWagmiProposalVoting();
  const { executeProposal, isExecuting } = useWagmiProposalExecution();
  const [copyingAddress, setCopyingAddress] = useState<string | null>(null);

  const handleVote = async (support: boolean) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      await voteOnProposal(proposal.id, support);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      // Error is already handled in the hook with toast
      console.error("Error in vote handler:", error);
    }
  };

  const handleExecute = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      await executeProposal(proposal.id);
      if (onActionComplete) onActionComplete();
    } catch (error) {
      // Error is already handled in the hook with toast
      console.error("Error in execute handler:", error);
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await copyToClipboard(address);
      setCopyingAddress(address);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopyingAddress(null), 2000);
    } catch (error) {
      toast.error("Failed to copy address");
      console.error("Error copying address:", error);
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
          <p className="text-sm text-gray mt-1">{proposal.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col space-y-1">
            <span className="text-gray text-xs">Asset</span>
            <span className="text-white text-sm font-medium">
              {getTokenInfo(proposal.token.toString()).symbol}
            </span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-gray text-xs">
              {proposal.type === 'invest' ? 'Investment Amount' : 'Withdrawal Amount'}
            </span>
            <span className="text-white text-sm font-medium">
              {getAmountWithSymbol(proposal.amount, proposal.token.toString())}
            </span>
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
            <div className="text-white font-medium mono flex items-center">
              {proposal.proposer.startsWith('AI.Gov') 
                ? proposal.proposer 
                : (
                  <>
                    {shortenAddress(proposal.proposer)}
                    <button 
                      onClick={() => handleCopyAddress(proposal.proposer)}
                      className="ml-1 p-1 hover:bg-dark-bg rounded-full transition-all duration-200"
                    >
                      {copyingAddress === proposal.proposer 
                        ? <Check size={14} className="text-green-500" /> 
                        : <Copy size={14} className="text-gray" />
                      }
                    </button>
                  </>
                )
              }
            </div>
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
              variant="destructive" 
              size="sm" 
              onClick={() => handleVote(false)}
              disabled={isVoting || !isConnected}
            >
              {isVoting ? "Voting..." : "Vote No"}
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => handleVote(true)}
              disabled={isVoting || !isConnected}
              className="bg-green-600 hover:bg-green-700"
            >
              {isVoting ? "Voting..." : "Vote Yes"}
            </Button>
          </div>
        ) : proposal.status === 'passed' ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExecute}
            disabled={isExecuting || !isConnected}
            className="w-full"
          >
            {isExecuting ? "Executing..." : "Execute Proposal"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default WagmiProposalCard;