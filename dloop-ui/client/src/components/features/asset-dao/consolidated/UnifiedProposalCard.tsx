import { useState } from "react";
import { ethers } from "ethers";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Proposal, ProposalStatus } from "@/types";
import { ProposalType } from "@/services/enhanced-assetDaoService";
import { useWallet } from "@/components/features/wallet/simplified-wallet-provider";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Check, 
  X, 
  ChevronRight, 
  AlertTriangle, 
  ExternalLink, 
  Copy,
  Share2
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { shortenAddress, formatCurrency, formatNumber, timeRemaining, copyToClipboard } from "@/lib/utils";
import { AssetDAOContract } from "@/lib/contracts";
import { VoteRequirementsCheck } from "../vote-requirements-check";
import { TokenSymbolResolver } from "@/services/tokenSymbolService";
import toast from "react-hot-toast";

// Improved proposal type mapping that handles both the old string-based types
// and the new enum-based types for backward compatibility
const getProposalTypeDisplay = (proposalType: ProposalType | number | string): string => {
  // For undefined or null values
  if (proposalType === undefined || proposalType === null) {
    return "Unknown";
  }
  
  // Handle different input types for backward compatibility
  const typeValue = typeof proposalType === 'string' 
    ? proposalType.toLowerCase() 
    : typeof proposalType === 'number' 
      ? proposalType 
      : -1;
  
  // Map numeric types to string display values
  if (typeof typeValue === 'number') {
    switch (typeValue) {
      case 0:
      case ProposalType.Investment:
        return "Invest";
      case 1:
      case ProposalType.Divestment:
        return "Divest";
      case 2:
      case ProposalType.ParameterChange:
        return "Parameter Change";
      default:
        return "Other";
    }
  }
  
  // Handle string types for backward compatibility
  if (typeValue === 'investment' || typeValue === 'invest' || typeValue === '0') {
    return "Invest";
  } else if (typeValue === 'divestment' || typeValue === 'divest' || typeValue === '1') {
    return "Divest";
  } else if (typeValue === 'parameterchange' || typeValue === 'parameter' || typeValue === '2') {
    return "Parameter Change";
  } else if (typeof proposalType === 'object') {
    // In case proposal type is passed as an enum object, try to extract numeric value
    try {
      const numericValue = Number(proposalType);
      if (!isNaN(numericValue)) {
        switch (numericValue) {
          case 0: return "Invest";
          case 1: return "Divest";
          case 2: return "Parameter Change";
          default: return "Other";
        }
      }
    } catch (e) {
      console.warn("Error converting proposal type:", e);
    }
  }
  
  return "Other";
};

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

// Helper function to get badge color for proposal type
const getProposalTypeBadgeColor = (proposalType: ProposalType | number | string): string => {
  const typeDisplay = getProposalTypeDisplay(proposalType);
  
  switch (typeDisplay) {
    case "Invest":
      return "bg-green-900/20 text-green-500";
    case "Divest":
      return "bg-orange-900/20 text-orange-500";
    case "Parameter Change":
      return "bg-blue-900/20 text-blue-500";
    default:
      return "bg-gray-900/20 text-gray-500";
  }
};

interface UnifiedProposalCardProps {
  proposal: Proposal;
  onRefresh: () => void;
  listView?: boolean; // Optional prop to switch between card and list view
}

export function UnifiedProposalCard({ proposal, onRefresh, listView = false }: UnifiedProposalCardProps) {
  const { isConnected, signer, address } = useWallet();
  const { toast: toastHandler } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  
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
  
  // Handle address copying with visual feedback
  const handleCopyAddress = async (addressToCopy: string) => {
    setIsCopying(true);
    const success = await copyToClipboard(addressToCopy);
    
    if (success) {
      toast.success("Address copied to clipboard", {
        duration: 2000,
        position: "bottom-center",
      });
    } else {
      toast.error("Failed to copy address", {
        duration: 2000,
        position: "bottom-center",
      });
    }
    
    setTimeout(() => setIsCopying(false), 1000);
  };
  
  // Function to vote on a proposal
  const handleVote = async (support: boolean) => {
    if (!isConnected || !signer) {
      toastHandler({
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
      
      toastHandler({
        title: "Voting in progress",
        description: "Your vote is being processed on the blockchain.",
      });
      
      // Use the service method which tries both vote and castVote functions
      const receipt = await AssetDAOService.voteOnProposal(signer, proposal.id, support);
      
      // Set the transaction hash from the receipt
      if (receipt && receipt.hash) {
        setTxHash(receipt.hash);
      }
      
      toastHandler({
        title: "Vote Submitted",
        description: `You have successfully voted ${support ? "FOR" : "AGAINST"} the proposal.`,
      });
      
      // Refresh proposal data
      onRefresh();
    } catch (error: any) {
      console.error("Voting error details:", error);
      
      // Improved error handling with more specific messages
      let errorMessage = "An error occurred while submitting your vote.";
      
      if (error.message) {
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
      }
      
      toastHandler({
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
      toastHandler({
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
      
      toastHandler({
        title: "Execution in progress",
        description: "The proposal execution is being processed on the blockchain.",
      });
      
      await tx.wait();
      
      toastHandler({
        title: "Proposal Executed",
        description: "The proposal has been successfully executed.",
      });
      
      // Refresh proposal data
      onRefresh();
    } catch (error: any) {
      toastHandler({
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
      toastHandler({
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
      
      toastHandler({
        title: "Cancellation in progress",
        description: "The proposal cancellation is being processed on the blockchain.",
      });
      
      await tx.wait();
      
      toastHandler({
        title: "Proposal Canceled",
        description: "The proposal has been successfully canceled.",
      });
      
      // Close dialog and refresh proposal data
      setIsCancelDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      toastHandler({
        title: "Cancellation Failed",
        description: error.message || "An error occurred while canceling the proposal.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  // Resolve token symbol using the dedicated service
  const tokenSymbol = TokenSymbolResolver.getTokenSymbol(proposal.token);

  // Return the list view or card view based on the listView prop
  if (listView) {
    return (
      <div className="border border-border rounded-lg p-3 mb-2 hover:bg-accent/5 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge variant={getStatusBadgeVariant(proposal.status)} className="whitespace-nowrap">
              {getStatusText(proposal.status, proposal.executed)}
            </Badge>
            <Badge variant="outline" className={`${getProposalTypeBadgeColor(proposal.type)} whitespace-nowrap`}>
              {getProposalTypeDisplay(proposal.type)}
            </Badge>
            <span className="font-medium truncate">{proposal.title}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-sm">
              <span className="text-muted-foreground mr-1">By:</span>
              <div className="flex items-center space-x-1">
                <span className="font-mono">
                  {proposal.proposer.startsWith('AI.Gov') 
                    ? proposal.proposer 
                    : shortenAddress(proposal.proposer)
                  }
                </span>
                {!proposal.proposer.startsWith('AI.Gov') && (
                  <button 
                    onClick={() => handleCopyAddress(proposal.proposer)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isCopying ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  // Default card view
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
              Proposed by: 
              <span className="ml-1 inline-flex items-center">
                {proposal.proposer.startsWith('AI.Gov') 
                  ? proposal.proposer 
                  : shortenAddress(proposal.proposer)
                }
                {!proposal.proposer.startsWith('AI.Gov') && (
                  <button 
                    onClick={() => handleCopyAddress(proposal.proposer)}
                    className="ml-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isCopying ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                )}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getProposalTypeBadgeColor(proposal.type)}>
              {getProposalTypeDisplay(proposal.type)}
            </Badge>
            <Badge variant={getStatusBadgeVariant(proposal.status)} className="transition-all duration-300 group-hover/card:scale-110">
              {getStatusText(proposal.status, proposal.executed)}
            </Badge>
          </div>
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
              <p className="font-medium capitalize">{getProposalTypeDisplay(proposal.type)}</p>
            </div>
            {/* Clean separation between amount and token display */}
            <div>
              <p className="text-muted-foreground mb-1">Amount</p>
              <p className="font-medium">
                {formatNumber(proposal.amount, 2)} {/* Display formatted amount */}
              </p>
            </div>
            {/* Display resolved token symbol separately */}
            <div>
              <p className="text-muted-foreground mb-1">Token</p>
              <p className="font-medium">{tokenSymbol}</p>
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
              <>Executing...</>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Execute Proposal
              </>
            )}
          </Button>
        ) : canCancel ? (
          <>
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full transition-all duration-300 hover:shadow-md group"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" /> Cancel Proposal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Proposal</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel this proposal? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-destructive font-medium">Proposal ID: {proposal.id}</p>
                  <p className="text-sm text-muted-foreground">{proposal.title}</p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCancelDialogOpen(false)}
                    disabled={isCanceling}
                  >
                    Nevermind
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={isCanceling}
                  >
                    {isCanceling ? "Canceling..." : "Yes, Cancel It"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <Button
            className="w-full" 
            variant="outline" 
            disabled
          >
            {proposal.status === "executed" ? "Executed" : "Failed"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
