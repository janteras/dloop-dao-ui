import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProposals } from "@/hooks/useProposals";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { ProposalType } from "@/types";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProposalModal = ({ isOpen, onClose }: CreateProposalModalProps) => {
  const { isConnected } = useWallet();
  const { createProposal, isSubmitting } = useProposals();
  const { toast } = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProposalType>("invest");
  const [token, setToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("3");
  const [titleError, setTitleError] = useState("");

  const supportedTokens = ["USDC", "WBTC", "PAXG"];
  
  // Generate intelligent default title and description based on selections
  useEffect(() => {
    if (isOpen && amount && token) {
      const actionVerb = type === "invest" ? "Add" : "Remove";
      const defaultTitle = `${actionVerb} ${amount} ${token} to the DAO`;
      
      // Only update the title if it's empty or matches previous defaults
      if (!title || (title.startsWith("Add ") || title.startsWith("Remove "))) {
        setTitle(defaultTitle);
      }
      
      // Generate a meaningful description if empty or matches previous defaults
      if (!description || 
          description.includes("will improve the long term value") ||
          description.includes("will help rebalance the portfolio")) {
        let defaultDesc = "";
        
        if (type === "invest") {
          defaultDesc = `Adding ${amount} ${token} to the DAO will improve the long term value of the D-AI token by increasing the treasury's diversification and potential yield generation capabilities.`;
        } else {
          defaultDesc = `Removing ${amount} ${token} from the DAO will help rebalance the portfolio and provide liquidity for more strategic opportunities in the current market conditions.`;
        }
        
        setDescription(defaultDesc);
      }
    }
  }, [isOpen, type, token, amount]);
  
  // Focus on title field when dialog opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      // Brief timeout to ensure the modal is fully rendered
      setTimeout(() => {
        titleInputRef.current?.focus();
        // Select the content to make it easier to replace
        titleInputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("invest");
    setToken("USDC");
    setAmount("");
    setDuration("3");
    setTitleError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateTitle = (value: string) => {
    if (!value.trim()) {
      setTitleError("Title is required");
      return false;
    }
    if (value.length < 5) {
      setTitleError("Title must be at least 5 characters");
      return false;
    }
    if (value.length > 100) {
      setTitleError("Title must be less than 100 characters");
      return false;
    }
    setTitleError("");
    return true;
  };

  // Handle title change with validation
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    validateTitle(newTitle);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a proposal.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate title explicitly before submission
    if (!validateTitle(title)) {
      titleInputRef.current?.focus();
      return;
    }
    
    if (!description || !amount || !token || !duration) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await createProposal({
        title,
        description,
        type,
        amount: parseFloat(amount),
        token,
        duration: parseInt(duration),
      });
      
      toast({
        title: "Proposal Created",
        description: "Your proposal has been successfully submitted.",
      });
      
      handleClose();
    } catch (error) {
      toast({
        title: "Error Creating Proposal",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-dark-gray text-white border-gray max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Create New Proposal</DialogTitle>
          <DialogDescription className="text-gray">
            Submit a proposal to {type === "invest" ? "add assets to" : "remove assets from"} the DAO.
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="default" className="bg-primary/10 border-primary/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Proposal Tips</AlertTitle>
          <AlertDescription className="text-sm">
            For the best chance of approval, provide clear details about why this {type === "invest" ? "investment" : "withdrawal"} will 
            benefit the DAO. The default title and description will update as you select options below.
          </AlertDescription>
        </Alert>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="title" className="text-gray">Proposal Title</Label>
              {titleError && (
                <span className="text-destructive text-xs">{titleError}</span>
              )}
            </div>
            <Input
              id="title"
              ref={titleInputRef}
              value={title}
              onChange={handleTitleChange}
              onBlur={() => validateTitle(title)}
              className={`bg-dark-bg border-gray text-white focus-visible:ring-accent ${
                titleError ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
              placeholder="E.g., Add 10 WBTC to the DAO"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-gray">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-dark-bg border-gray text-white focus-visible:ring-accent min-h-[120px]"
              placeholder="Explain why this proposal benefits the DAO and D-AI token holders..."
            />
            <p className="text-xs text-gray mt-1">
              Provide context about market conditions, expected benefits, and any risks.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type" className="text-gray">Proposal Type</Label>
              <Select 
                value={type} 
                onValueChange={(value) => setType(value as ProposalType)}
              >
                <SelectTrigger id="type" className="bg-dark-bg border-gray text-white focus:ring-accent">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-dark-bg border-gray text-white">
                  <SelectItem value="invest">Invest</SelectItem>
                  <SelectItem value="divest">Divest</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray mt-1">
                {type === "invest" 
                  ? "Invest: Add assets to the DAO treasury"
                  : "Divest: Remove assets from the DAO treasury"}
              </p>
            </div>
            
            <div>
              <Label htmlFor="token" className="text-gray">Asset</Label>
              <Select value={token} onValueChange={setToken}>
                <SelectTrigger id="token" className="bg-dark-bg border-gray text-white focus:ring-accent">
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent className="bg-dark-bg border-gray text-white">
                  {supportedTokens.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                  <SelectItem value="new">Add New Asset...</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="amount" className="text-gray">Amount</Label>
            <div className="flex">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-dark-bg border-gray text-white focus-visible:ring-accent rounded-r-none"
                placeholder="0.00"
                min="0.01"
                step="0.01"
              />
              <div className="bg-dark-bg border border-l-0 border-gray rounded-r-lg px-4 flex items-center">
                <span className="text-white font-medium">{token}</span>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="duration" className="text-gray">Voting Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration" className="bg-dark-bg border-gray text-white focus:ring-accent">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="bg-dark-bg border-gray text-white">
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="5">5 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray mt-1">
              The proposal will automatically close after this period
            </p>
          </div>
          
          <DialogFooter className="pt-4 border-t border-gray">
            <Button
              type="button"
              variant="outline"
              className="bg-dark-bg border-gray text-white hover:border-accent"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-accent text-dark-bg hover:bg-darker-accent"
              disabled={isSubmitting || !isConnected || !!titleError}
            >
              {isSubmitting ? "Submitting..." : "Submit Proposal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProposalModal;
