import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useWagmiWallet } from "@/hooks/useWagmiWallet";
import { useCreateProposal } from "@/hooks/useAssetDaoContract";
import { ProposalType } from "@/services/enhanced-assetDaoService";
import toast from "react-hot-toast";

// Define supported tokens
const TOKENS = [
  { id: "0xd093d7331448766923fe7ab270a9f6bce63cefda", symbol: "USDC", name: "USD Coin", decimals: 6 },
  { id: "0x9c3c9283d3e44854697cd22d3faa240cfb032889", symbol: "WBTC", name: "Wrapped Bitcoin", decimals: 8 },
  { id: "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f", symbol: "DLOOP", name: "D-Loop Token", decimals: 18 },
];

interface WagmiCreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WagmiCreateProposalModal = ({ isOpen, onClose, onSuccess }: WagmiCreateProposalModalProps) => {
  const { isConnected } = useWagmiWallet();
  const { createProposal, isPending, isConfirming } = useCreateProposal();
  const isLoading = isPending || isConfirming;

  // Form state
  const [formData, setFormData] = useState({
    type: "0", // Default to investment (0)
    token: TOKENS[0].id,
    amount: "",
    description: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validate inputs
    if (!formData.token || !formData.amount || !formData.description) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      // Convert amount to proper format
      const selectedToken = TOKENS.find(t => t.id === formData.token);
      if (!selectedToken) {
        toast.error("Invalid token selected");
        return;
      }

      // Create the proposal
      await createProposal({
        token: formData.token as `0x${string}`,
        amount: formData.amount,
        description: formData.description,
        proposalType: Number(formData.type) as ProposalType,
      });

      toast.success("Proposal created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error creating proposal:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to create proposal: ${errorMessage}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dark-bg border-dark-gray text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create New Proposal</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new investment or divestment proposal for the DAO to vote on.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="type">Proposal Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange("type", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-dark-bg text-white border-dark-gray">
                <SelectValue placeholder="Select proposal type" />
              </SelectTrigger>
              <SelectContent className="bg-dark-bg text-white border-dark-gray">
                <SelectItem value="0">Investment</SelectItem>
                <SelectItem value="1">Divestment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Select
              value={formData.token}
              onValueChange={(value) => handleChange("token", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-dark-bg text-white border-dark-gray">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent className="bg-dark-bg text-white border-dark-gray">
                {TOKENS.map((token) => (
                  <SelectItem key={token.id} value={token.id}>
                    {token.symbol} - {token.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              className="bg-dark-bg text-white border-dark-gray"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter proposal description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="bg-dark-bg text-white border-dark-gray min-h-[100px]"
              disabled={isLoading}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-dark-gray"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !isConnected}>
              {isLoading ? "Creating..." : "Create Proposal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


