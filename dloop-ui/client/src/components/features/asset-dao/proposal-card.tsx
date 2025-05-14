import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Proposal, ProposalStatus } from "@/types";
import { useWallet } from "@/components/features/wallet/simplified-wallet-provider";
import { useToast } from "@/hooks/use-toast";
import { SocialShare } from "@/components/features/shared/social-share";
import { 
  Clock, 
  Check, 
  X, 
  ChevronRight, 
  AlertTriangle, 
  ExternalLink, 
  Ban,
  AlertCircle,
  Share2
} from "lucide-react";
// Removed tooltip imports as they were causing issues
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
import { VoteRequirementsCheck } from "./vote-requirements-check";

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
const getStatusText = (status: ProposalStatus | undefined, executed: boolean): string => {
  if (executed) return "Executed";
  if (!status) return "Unknown";
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
      // Import the service and use it directly
      const { AssetDAOService } = await import('@/services/assetDaoService');
      
      // First set the transaction hash to null to clear any previous values
      setTxHash(null);
      
      toast({
        title: "Voting in progress",
        description: "Your vote is being processed on the blockchain.",
      });
      
      // Use the service method which tries both vote and castVote functions
      const receipt = await AssetDAOService.voteOnProposal(signer, proposal.id, support);
      
      // Set the transaction hash from the receipt
      if (receipt && receipt.hash) {
        setTxHash(receipt.hash);
      }
      
      toast({
        title: "Vote Submitted",
        description: `You have successfully voted ${support ? "FOR" : "AGAINST"} the proposal.`,
      });
      
      // Refresh proposal data
      onRefresh();
    } catch (error: any) {
      console.error("Voting error details:", error);
      
      // Improved error handling with more specific messages
      let errorMessage = "An error occurred while submitting your vote.";
      
      if (error.message.includes("execution reverted")) {
        // Check for common reverted reasons
        if (error.message.includes("already voted")) {
          errorMessage = "You have already voted on this proposal.";
        } else if (error.message.includes("voting period")) {
          errorMessage = "The voting period has ended for this proposal.";
        } else if (error.message.includes("voting power")) {
          errorMessage = "You don't have enough voting power. Make sure you have delegated tokens.";
        }
      } else if (error.message.includes("user rejected")) {
        errorMessage = "You rejected the transaction.";
      } else if (error.message.includes("gas")) {
        errorMessage = "Transaction failed due to gas estimation issues. Please try again.";
      }
      
      toast({
        title: "Voting Failed",
        description: errorMessage,
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
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] group/card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl relative inline-block group/title">
              {proposal.title}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 group-hover/title:w-full"></span>
            </CardTitle>
            <CardDescription className="mt-1 transition-colors duration-300 group-hover/card:text-muted-foreground/80">
              Proposed by: {shortenAddress(proposal.proposer)}
            </CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(proposal.status)} className="ml-2 transition-all duration-300 group-hover/card:scale-110">
            {getStatusText(proposal.status, proposal.executed)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {/* Proposal Details */}
        <div className="mb-4 text-sm">
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {proposal.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-muted-foreground mb-1">Type</p>
              <p className="font-medium capitalize">{proposal.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Amount</p>
              <p className="font-medium">
                {formatNumber(proposal.amount, 2)} {proposal.token}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Created</p>
              <p className="font-medium">
                {new Date(proposal.createdAt * 1000).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">
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
            <div className="flex justify-between mb-1 group/for">
              <p className="font-medium text-sm">
                For <span className="text-muted-foreground transition-colors duration-300 group-hover/for:text-green-500/80">({formatNumber(forPercentage, 0)}%)</span>
              </p>
              <p className="text-green-500 transition-all duration-300 group-hover/for:scale-110 group-hover/for:font-medium">
                {formatNumber(proposal.forVotes, 0)} votes
              </p>
            </div>
            <div className="h-2 mb-2 bg-secondary rounded-full overflow-hidden group/forbar transition-all duration-300 hover:h-3">
              <div 
                className="h-full bg-green-500 transition-all duration-500 group-hover/forbar:bg-green-400" 
                style={{ width: `${forPercentage}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between mb-1 group/against">
              <p className="font-medium text-sm">
                Against <span className="text-muted-foreground transition-colors duration-300 group-hover/against:text-red-500/80">({formatNumber(againstPercentage, 0)}%)</span>
              </p>
              <p className="text-red-500 transition-all duration-300 group-hover/against:scale-110 group-hover/against:font-medium">
                {formatNumber(proposal.againstVotes, 0)} votes
              </p>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden group/againstbar transition-all duration-300 hover:h-3">
              <div 
                className="h-full bg-red-500 transition-all duration-500 group-hover/againstbar:bg-red-400" 
                style={{ width: `${againstPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Transaction Hash Link (if available) */}
        {txHash && (
          <div className="flex items-center justify-between rounded-lg bg-secondary p-3 mb-3">
            <span className="text-sm text-muted-foreground">Transaction:</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm flex items-center"
            >
              {shortenAddress(txHash, 8)}
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </a>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col bg-secondary p-4 border-t border-border">
        {canVote && (
          <div className="mb-4">
            <VoteRequirementsCheck />
          </div>
        )}
        
        {canVote ? (
          <div className="flex space-x-2 w-full">
            <Button
              variant="outline"
              className="flex-1 border-green-500 text-green-500 hover:bg-green-500/10 transition-all duration-300 hover:shadow-md hover:shadow-green-500/10 group"
              onClick={() => handleVote(true)}
              disabled={isVoting}
            >
              <Check className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-125" /> 
              <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">
                Vote For
                <span className="absolute -bottom-px left-0 w-0 h-0.5 bg-green-500/60 transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10 transition-all duration-300 hover:shadow-md hover:shadow-red-500/10 group"
              onClick={() => handleVote(false)}
              disabled={isVoting}
            >
              <X className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-125" /> 
              <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">
                Vote Against
                <span className="absolute -bottom-px left-0 w-0 h-0.5 bg-red-500/60 transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Button>
          </div>
        ) : canExecute ? (
          <Button
            className="w-full bg-accent text-dark-bg hover:bg-darker-accent transition-all duration-300 hover:shadow-md group relative overflow-hidden"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-pulse"></span>
            {isExecuting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" /> 
                <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">Execute Proposal</span>
              </>
            )}
          </Button>
        ) : proposal.executed ? (
          <Button variant="secondary" className="w-full transition-all duration-300 hover:opacity-90 group" disabled>
            <Check className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" /> 
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">Proposal Executed</span>
          </Button>
        ) : proposal.status === "failed" ? (
          <Button variant="destructive" className="w-full transition-all duration-300 hover:opacity-90 group" disabled>
            <AlertTriangle className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" /> 
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">Proposal Failed</span>
          </Button>
        ) : (
          <Button variant="outline" className="w-full transition-all duration-300 hover:opacity-90 group" disabled>
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">
              {proposal.status === "active" ? "Voting in Progress" : "Voting Ended"}
            </span>
          </Button>
        )}
        
        {/* Social Share Component */}
        <div className="mt-3 pt-3 border-t border-border flex justify-end">
          <SocialShare
            title={`D-Loop Governance: ${proposal.title}`}
            description={proposal.description}
            url={`${window.location.origin}/asset-dao/proposals/${proposal.id}`}
            compact={true}
            size="sm"
            variant="ghost"
            platforms={['twitter', 'linkedin', 'copy']}
          />
        </div>
        
        {/* Cancel Proposal Button */}
        {canCancel && (
          <div className="mt-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              className="w-full text-orange-500 border-orange-500/50 hover:bg-orange-500/10 transition-all duration-300 hover:shadow-md group"
              onClick={() => setIsCancelDialogOpen(true)}
            >
              <Ban className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" /> 
              <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">
                Cancel Proposal
                <span className="absolute -bottom-px left-0 w-0 h-0.5 bg-orange-500/60 transition-all duration-300 group-hover:w-full"></span>
              </span>
            </Button>
          </div>
        )}
        
        {/* Cancel Proposal Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent className="modal-content">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                Cancel Proposal
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Are you sure you want to cancel this proposal? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-4 border border-border rounded-md bg-secondary my-4">
              <h4 className="font-medium mb-1">{proposal.title}</h4>
              <p className="text-sm text-muted-foreground">{proposal.description}</p>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="sm:flex-1 transition-all duration-300 hover:bg-secondary/80 group"
                onClick={() => setIsCancelDialogOpen(false)}
              >
                <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">Keep Proposal</span>
              </Button>
              <Button 
                variant="destructive" 
                className="sm:flex-1 transition-all duration-300 hover:bg-destructive/90 group relative overflow-hidden"
                onClick={handleCancel}
                disabled={isCanceling}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-destructive/0 via-destructive/30 to-destructive/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-pulse"></span>
                {isCanceling ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Canceling...</span>
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" /> 
                    <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">Yes, Cancel Proposal</span>
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