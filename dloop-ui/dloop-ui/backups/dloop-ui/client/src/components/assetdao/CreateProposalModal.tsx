import { useState } from "react";
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

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProposalModal = ({ isOpen, onClose }: CreateProposalModalProps) => {
  const { isConnected } = useWallet();
  const { createProposal, isCreating } = useProposals();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProposalType>("invest");
  const [token, setToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("3");

  const supportedTokens = ["USDC", "WBTC", "PAXG"];
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("invest");
    setToken("USDC");
    setAmount("");
    setDuration("3");
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
    
    if (!title || !description || !amount || !token || !duration) {
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
            Submit a proposal to invest or divest assets in the DAO.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-gray">Proposal Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-dark-bg border-gray text-white focus-visible:ring-accent"
              placeholder="E.g., Increase WBTC Allocation"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-gray">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-dark-bg border-gray text-white focus-visible:ring-accent min-h-[100px]"
              placeholder="Provide details about the proposal..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type" className="text-gray">Proposal Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as ProposalType)}>
                <SelectTrigger id="type" className="bg-dark-bg border-gray text-white focus:ring-accent">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-dark-bg border-gray text-white">
                  <SelectItem value="invest">Invest</SelectItem>
                  <SelectItem value="divest">Divest</SelectItem>
                </SelectContent>
              </Select>
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
                min="0"
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
              disabled={isCreating || !isConnected}
            >
              {isCreating ? "Submitting..." : "Submit Proposal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProposalModal;
