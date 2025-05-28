import { useState } from "react";
import { ethers } from "ethers";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Proposal, ProposalStatus } from "@/types";
import { useWallet } from "@/components/features/wallet/simplified-wallet-provider";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Check, 
  X, 
  ChevronRight, 
  AlertTriangle, 
  ExternalLink, 
  Ban,
  AlertCircle 
} from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { shortenAddress, formatCurrency, formatNumber, timeRemaining } from "@/lib/utils";
import { AssetDAOContract } from "@/lib/contracts";

// Helper function to get badge variant based on status
const getStatusBadgeVariant = (status: ProposalStatus): "default" | "success" | "destructive" | "outline" | "secondary" => {
  switch (status) {
    case "active":
      return "default";
    case "passed":
      return "success";
    case "failed":
      return "destructive";
    case "executed":
      return "secondary";
    default:
      return "outline";
  }
};

// Helper function to get status text for display
const getStatusText = (status: ProposalStatus, executed: boolean): string => {
  if (executed) return "Executed";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

interface ProposalCardProps {
  proposal: Proposal;
  onRefresh: () => void;
}

export function ProposalCard({ proposal, onRefresh }: ProposalCardProps) {
  const { isConnected, signer, address } = useWallet();
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Calculate voting stats
  const totalVotes = proposal.forVotes + proposal.againstVotes;
  const forPercentage = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0;
  
  // Check if the proposal can be executed (passed but not executed)
  const canExecute = proposal.status === "passed" && !proposal.executed;
  
  // Check if voting is active
  const canVote = proposal.status === "active" && isConnected;
  
  // Check if the proposal can be canceled
  // According to the AssetDAO.md docs: proposal can be canceled by any proposer or admin before execution
  const canCancel = proposal.status === "active" && 
                   !proposal.executed && 
                   !proposal.canceled && 
                   isConnected && 
                   // Verify if the connected wallet is the proposer
                   (address?.toLowerCase() === proposal.proposer.toLowerCase());
  
  // Function to vote on a proposal
  const handleVote = async (support: boolean) => {
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to vote on proposals.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsVoting(true);
      const assetDAOContract = AssetDAOContract(signer);
      
      const tx = await assetDAOContract.castVote(proposal.id, support);
      setTxHash(tx.hash);
      
      toast({
        title: "Voting in progress",
        description: "Your vote is being processed on the blockchain.",
      });
      
      await tx.wait();
      
      toast({
        title: "Vote Submitted",
        description: `You have successfully voted ${support ? "FOR" : "AGAINST"} the proposal.`,
      });
      
      // Refresh proposal data
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Voting Failed",
        description: error.message || "An error occurred while submitting your vote.",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };
  
  // Function to execute a proposal
  const handleExecute = async () => {
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to execute this proposal.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsExecuting(true);
      const assetDAOContract = AssetDAOContract(signer);
      
      const tx = await assetDAOContract.executeProposal(proposal.id);
      setTxHash(tx.hash);
      
      toast({
        title: "Execution in progress",
        description: "The proposal execution is being processed on the blockchain.",
      });
      
      await tx.wait();
      
      toast({
        title: "Proposal Executed",
        description: "The proposal has been successfully executed.",
      });
      
      // Refresh proposal data
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Execution Failed",
        description: error.message || "An error occurred while executing the proposal.",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Function to cancel a proposal
  const handleCancel = async () => {
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to cancel this proposal.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCanceling(true);
      const assetDAOContract = AssetDAOContract(signer);
      
      const tx = await assetDAOContract.cancelProposal(proposal.id);
      setTxHash(tx.hash);
      
      toast({
        title: "Cancellation in progress",
        description: "The proposal cancellation is being processed on the blockchain.",
      });
      
      await tx.wait();
      
      toast({
        title: "Proposal Canceled",
        description: "The proposal has been successfully canceled.",
      });
      
      // Close dialog and refresh proposal data
      setIsCancelDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Cancellation Failed",
        description: error.message || "An error occurred while canceling the proposal.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <Card className="bg-dark-gray border-gray overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-white">{proposal.title}</CardTitle>
            <CardDescription className="text-gray mt-1">
              Proposed by: {shortenAddress(proposal.proposer)}
            </CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(proposal.status)} className="ml-2">
            {getStatusText(proposal.status, proposal.executed)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {/* Proposal Details */}
        <div className="mb-4 text-sm text-white">
          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
            {proposal.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400 mb-1">Type</p>
              <p className="font-medium capitalize">{proposal.type}</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Amount</p>
              <p className="font-medium">
                {formatNumber(proposal.amount, 2)} {proposal.token}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Created</p>
              <p className="font-medium">
                {new Date(proposal.createdAt * 1000).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">
                {proposal.status === "active" ? "Ends In" : "Ended"}
              </p>
              <p className="font-medium">
                {proposal.status === "active" ? (
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" /> {proposal.endsIn}
                  </span>
                ) : (
                  new Date(proposal.endTime * 1000).toLocaleDateString()
                )}
              </p>
            </div>
          </div>
          
          {/* Voting Progress */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <p className="font-medium text-sm">For <span className="text-gray-400">({formatNumber(forPercentage, 0)}%)</span></p>
              <p className="text-green-400">{formatNumber(proposal.forVotes, 0)} votes</p>
            </div>
            <div className="h-2 mb-2 bg-dark-bg rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300" 
                style={{ width: `${forPercentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between mb-1">
              <p className="font-medium text-sm">Against <span className="text-gray-400">({formatNumber(againstPercentage, 0)}%)</span></p>
              <p className="text-red-400">{formatNumber(proposal.againstVotes, 0)} votes</p>
            </div>
            <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-300" 
                style={{ width: `${againstPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Transaction Hash Link (if available) */}
        {txHash && (
          <div className="flex items-center justify-between rounded-lg bg-dark-bg p-3 mb-3">
            <span className="text-sm text-gray-400">Transaction:</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm flex items-center"
            >
              {shortenAddress(txHash, 8)}
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </a>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col bg-dark-bg p-4 border-t border-gray">
        {canVote ? (
          <div className="flex space-x-2 w-full">
            <Button
              variant="outline"
              className="flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
              onClick={() => handleVote(true)}
              disabled={isVoting}
            >
              <Check className="mr-2 h-4 w-4" /> Vote For
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
              onClick={() => handleVote(false)}
              disabled={isVoting}
            >
              <X className="mr-2 h-4 w-4" /> Vote Against
            </Button>
          </div>
        ) : canExecute ? (
          <Button
            className="w-full bg-accent text-dark-bg hover:bg-darker-accent"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Executing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Execute Proposal
              </>
            )}
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex w-full">
                  {proposal.executed ? (
                    <Button variant="secondary" className="w-full" disabled>
                      <Check className="mr-2 h-4 w-4" /> Proposal Executed
                    </Button>
                  ) : proposal.status === "failed" ? (
                    <Button variant="destructive" className="w-full" disabled>
                      <AlertTriangle className="mr-2 h-4 w-4" /> Proposal Failed
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      {proposal.status === "active" ? "Voting in Progress" : "Voting Ended"}
                    </Button>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {proposal.executed 
                  ? "This proposal has already been executed" 
                  : proposal.status === "failed"
                  ? "This proposal did not receive enough votes to pass"
                  : proposal.status === "active"
                  ? "Voting is still in progress for this proposal"
                  : "Waiting for execution"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Cancel Proposal Button */}
        {canCancel && (
          <div className="mt-3 pt-3 border-t border-gray">
            <Button
              variant="outline"
              className="w-full text-orange-500 border-orange-500/50 hover:bg-orange-500/10"
              onClick={() => setIsCancelDialogOpen(true)}
            >
              <Ban className="mr-2 h-4 w-4" /> Cancel Proposal
            </Button>
          </div>
        )}
        
        {/* Cancel Proposal Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent className="bg-dark-gray border-gray text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                Cancel Proposal
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to cancel this proposal? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-4 border border-gray-700 rounded-md bg-dark-bg my-4">
              <h4 className="font-medium mb-1">{proposal.title}</h4>
              <p className="text-sm text-gray-400">{proposal.description}</p>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="sm:flex-1"
                onClick={() => setIsCancelDialogOpen(false)}
              >
                Keep Proposal
              </Button>
              <Button 
                variant="destructive" 
                className="sm:flex-1"
                onClick={handleCancel}
                disabled={isCanceling}
              >
                {isCanceling ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Canceling...
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" /> 
                    Yes, Cancel Proposal
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}