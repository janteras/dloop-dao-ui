import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProposals } from "@/hooks/useProposals";
import { useWallet } from "@/components/features/wallet/simplified-wallet-provider";
import { useToast } from "@/hooks/use-toast";
import { ProposalType } from "@/types";
import { Loader2, AlertCircle, Info as InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AssetDAOContract } from "@/lib/contracts";
import { ADDRESSES } from "@/config/contracts";
import { shortenAddress } from "@/lib/utils";

// Form validation schema
const proposalFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description cannot exceed 2000 characters"),
  type: z.enum(["invest", "divest"] as const),
  token: z.string().min(1, "Please select an asset"),
  amount: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Amount must be a positive number" }
  ),
  duration: z.string().refine(
    (val) => ["3", "5", "7", "14"].includes(val),
    { message: "Please select a valid duration" }
  ),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProposalModal({ isOpen, onClose }: CreateProposalModalProps) {
  const { isConnected, address, signer } = useWallet();
  const { createProposal, isSubmitting } = useProposals();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  // Use a union literal type directly to prevent TypeScript comparison issues
  const [step, setStep] = useState<'form' | 'submitting' | 'confirmation'>('form');

  // Define supported tokens with their Sepolia testnet addresses
  // These are configured to match the actual deployed token addresses on Sepolia
  const supportedTokens = [
    // For divestment proposals only (DLOOP isn't supported by Chainlink for investment proposals)
    { symbol: "DLOOP", address: "0x05B366778566e93abfB8e4A9B794e4ad006446b4", supportedTypes: ["divest"] },
    // Tokens with price feeds that can be used for both investment and divestment
    { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", supportedTypes: ["invest", "divest"] }, // Sepolia USDC
    { symbol: "WBTC", address: "0xCA063A2AB07491eE991dCecb456D1265f842b568", supportedTypes: ["invest", "divest"] }  // Sepolia WBTC
  ];

  // Log available token addresses for debugging
  useEffect(() => {
    console.log('Available tokens for proposals:', supportedTokens);
  }, []);

  // Initialize form with default values
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "invest",
      token: "USDC", // Default to USDC since it's supported for invest proposals
      amount: "",
      duration: "3",
    },
  });

  // Watch proposal type to filter available tokens
  const proposalType = form.watch("type");

  const resetForm = () => {
    form.reset();
    setError(null);
    setTransactionHash(null);
    setStep('form');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const onSubmit = async (data: ProposalFormValues) => {
    if (!isConnected || !signer) {
      setError("Please connect your wallet to create a proposal");
      return;
    }

    try {
      setStep('submitting');
      setError(null);

      // For direct contract interaction
      if (signer) {
        const assetDAOContract = AssetDAOContract(signer);

        // Prepare the proposal parameters
        const selectedToken = supportedTokens.find(t => t.symbol === data.token);

        if (!selectedToken) {
          throw new Error("Invalid token selected");
        }

        // Check if this token is supported for the selected proposal type
        if (!selectedToken.supportedTypes.includes(data.type)) {
          throw new Error(`${data.token} is not supported for ${data.type === 'invest' ? 'investment' : 'divestment'} proposals. DLOOP tokens can only be used in divestment proposals.`);
        }

        const tokenAddress = selectedToken.address;

        // Log the parameters for debugging
        console.log('Creating proposal with params:', {
          description: `${data.title}\n\n${data.description}`,
          tokenAddress,
          amount: data.amount
        });

        // Convert amount to wei format for blockchain
        // Check if we're using the correct decimals based on token type
        // Different tokens have different decimal places
        let amountInWei;
        if (data.token === "DLOOP" || data.token === "ETH") {
          // 18 decimals for DLOOP and ETH
          amountInWei = ethers.parseEther(data.amount);
        } else if (data.token === "USDC") {
          // 6 decimals for USDC
          amountInWei = ethers.parseUnits(data.amount, 6);
        } else {
          // Default to 18 decimals for other tokens
          amountInWei = ethers.parseEther(data.amount);
        }

        console.log(`Converting ${data.amount} ${data.token} to wei: ${amountInWei.toString()}`);

        // Create the proposal on-chain using the correct method based on proposal type
        let tx;

        // Format description to be shorter and more concise for blockchain storage
        // This helps avoid potential issues with gas costs or string size limits
        let descriptionText = data.title; 
        if (data.description && data.description.length > 0) {
          // Limit description length to avoid excessive gas costs
          const maxDescriptionLength = 500;
          const truncatedDescription = data.description.length > maxDescriptionLength 
            ? data.description.substring(0, maxDescriptionLength) + "..." 
            : data.description;

          descriptionText = `${data.title}\n\n${truncatedDescription}`;
        }

        console.log('Final proposal description:', descriptionText);

        try {
          // Check balance and approval for the selected token
          if (data.type === 'invest') {
            try {
              // Create an instance of the token contract with expanded functionality
              const tokenContract = new ethers.Contract(
                tokenAddress,
                [
                  // Basic ERC20 functions
                  "function approve(address spender, uint256 amount) returns (bool)",
                  "function allowance(address owner, address spender) view returns (uint256)",
                  "function balanceOf(address owner) view returns (uint256)",
                  "function decimals() view returns (uint8)",
                  "function symbol() view returns (string)"
                ],
                signer
              );

              // First check if the user has sufficient token balance
              const balance = await tokenContract.balanceOf(address);
              console.log(`User balance for ${data.token}:`, ethers.formatUnits(balance, await tokenContract.decimals()));

              if (balance < amountInWei) {
                throw new Error(`Insufficient ${data.token} balance. You need ${data.amount} ${data.token} to create this proposal.`);
              }

              // Then check if the AssetDAO contract has sufficient allowance
              const currentAllowance = await tokenContract.allowance(address, ADDRESSES.AssetDAO);
              console.log('Current allowance:', ethers.formatUnits(currentAllowance, await tokenContract.decimals()));

              // If the allowance is less than the amount needed, approve it
              if (currentAllowance < amountInWei) {
                console.log('Approving tokens for AssetDAO contract...');

                // Display a helpful message to the user
                toast({
                  title: "Token Approval Required",
                  description: `Approving ${data.amount} ${data.token} for use by the AssetDAO contract. Please confirm this transaction in your wallet.`,
                });

                const approveTx = await tokenContract.approve(
                  ADDRESSES.AssetDAO,
                  amountInWei,
                  { gasLimit: 300000 }
                );

                // Wait for approval transaction to be mined
                setTransactionHash(approveTx.hash);

                toast({
                  title: "Approval Transaction Submitted",
                  description: `Your approval transaction has been submitted. Waiting for confirmation...`,
                });

                const approvalReceipt = await approveTx.wait();

                if (approvalReceipt.status === 0) {
                  throw new Error("Token approval transaction failed");
                }

                console.log('Token approval successful');
                toast({
                  title: "Token Approval Successful",
                  description: `Your ${data.token} tokens have been approved for the proposal.`,
                });
              }
            } catch (approvalError: any) {
              console.error('Error with token balance or approval:', approvalError);

              // Inform the user about the specific issue
              if (approvalError.message.includes("insufficient")) {
                throw new Error(`You don't have enough ${data.token} tokens for this proposal.`);
              } else if (approvalError.message.includes("user rejected")) {
                throw new Error("You rejected the token approval. The proposal cannot be created without approving the tokens.");
              } else {
                throw new Error(`Token approval error: ${approvalError.message}`);
              }
            }
          }

          // Define transaction options with explicitly higher gas limit to avoid estimation issues
          const txOptions = {
            gasLimit: 1000000, // Explicit higher gas limit
          };

          if (data.type === 'invest') {
            // For invest proposals
            console.log('Calling createInvestProposal with:', {
              description: descriptionText,
              tokenAddress,
              amountInWei: amountInWei.toString(),
              txOptions
            });

            tx = await assetDAOContract.createInvestProposal(
              descriptionText,
              tokenAddress,
              amountInWei,
              txOptions
            );
          } else {
            // For divest proposals
            console.log('Calling createDivestProposal with:', {
              description: descriptionText,
              tokenAddress,
              amountInWei: amountInWei.toString(),
              txOptions
            });

            tx = await assetDAOContract.createDivestProposal(
              descriptionText,
              tokenAddress,
              amountInWei,
              txOptions
            );
          }
        } catch (contractError: any) {
          console.error('Contract interaction error:', contractError);

          // Provide more detailed error info
          const errorMessage = contractError.message || 'Unknown contract error';

          // Enhanced error logging for contract debugging
          console.log('Full contract error details:', {
            message: contractError.message,
            code: contractError.code,
            errorArgs: contractError.errorArgs,
            errorName: contractError.errorName,
            errorSignature: contractError.errorSignature,
            reason: contractError.reason,
            receipt: contractError.receipt,
            transaction: contractError.transaction
          });

          // Handle different types of errors more specifically
          if (errorMessage.includes('missing revert data')) {
            // This is typically a silent revert from the contract - check if user has permission
            throw new Error(
              "Transaction failed: The contract rejected the proposal. Common causes include: 1) Insufficient DLOOP token balance (for voting power), 2) You already have an active proposal, or 3) The token amount exceeds treasury limits."
            );
          } else if (errorMessage.includes('gas required exceeds allowance') || 
              errorMessage.includes('execution reverted')) {
            // Try to extract the reason from the error if available
            const reasonMatch = errorMessage.match(/reason="([^"]+)"/);
            const reason = reasonMatch ? reasonMatch[1] : 'Unknown reason';

            // Check for common governance errors in the reason text
            if (reason.includes("not enough voting power") || reason.toLowerCase().includes("insufficient")) {
              throw new Error(
                `Proposal creation failed: You don't have enough DLOOP tokens staked in the DAO to create this proposal. You need to have DLOOP tokens staked for voting power.`
              );
            } else if (reason.includes("proposal already exists") || reason.includes("active proposal")) {
              throw new Error(
                `You already have an active proposal. You cannot create another proposal until your current one is finalized.`
              );
            } else if (reason.includes("amount exceeds") || reason.includes("treasury") || reason.includes("limit")) {
              throw new Error(
                `The proposal amount exceeds the allowed limits for the treasury. Please try a smaller amount or a different token.`
              );
            } else {
              throw new Error(
                `Transaction would fail: ${reason}. Make sure you have enough ETH for gas and the contract allows this proposal.`
              );
            }
          } else if (errorMessage.includes('user rejected transaction')) {
            throw new Error("Transaction was rejected in your wallet.");
          } else if (errorMessage.includes('insufficient funds')) {
            throw new Error("You don't have enough ETH to cover gas fees for this transaction.");
          } else if (errorMessage.includes('nonce too high') || errorMessage.includes('nonce has already been used')) {
            throw new Error("Wallet nonce issue. Please try refreshing the page and reconnecting your wallet.");
          } else if (errorMessage.includes('network changed') || errorMessage.includes('chain') || errorMessage.includes('network')) {
            throw new Error("Network connection issue. Please make sure you're connected to Sepolia testnet.");
          }

          throw contractError;
        }

        // Show transaction hash immediately
        setTransactionHash(tx.hash);

        // Wait for transaction confirmation with better error handling
        try {
          const receipt = await tx.wait();

          // Check if transaction was successful
          if (receipt.status === 0) {
            throw new Error("Transaction failed on the blockchain");
          }

          // Update UI for success
          setStep('confirmation');
          console.log("Transaction confirmed with receipt:", receipt);
        } catch (receiptError: any) {
          console.error("Transaction failed during confirmation:", receiptError);
          throw new Error("Transaction was mined but failed. Please check Etherscan for details.");
        }

        // Show success toast
        toast({
          title: "Proposal Created Successfully",
          description: `Your ${data.type} proposal for ${data.amount} ${data.token} has been created.`,
        });

        // Also create it in our database for UI purposes
        await createProposal({
          title: data.title,
          description: data.description,
          type: data.type as ProposalType,
          amount: parseFloat(data.amount),
          token: data.token,
          duration: parseInt(data.duration),
        });
      }
    } catch (error: any) {
      setStep('form');
      setError(error.message || "Failed to create proposal. Please try again.");

      toast({
        title: "Error Creating Proposal",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // If not connected, show a warning
  if (!isConnected && step === 'form') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-dark-gray text-white border-gray max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Connect Wallet</DialogTitle>
            <DialogDescription className="text-gray">
              You need to connect your wallet to create a proposal.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive" className="bg-destructive/20 border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Connected</AlertTitle>
            <AlertDescription>
              Please connect your wallet to the Sepolia testnet to continue.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Submitting step to show transaction is in progress
  if (step === 'submitting') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-dark-gray text-white border-gray max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Submitting Transaction</DialogTitle>
            <DialogDescription className="text-gray">
              Your proposal is being submitted to the blockchain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />

            {transactionHash ? (
              <Alert variant="default" className="bg-primary/20 border-primary">
                <AlertTitle>Transaction Submitted</AlertTitle>
                <AlertDescription className="overflow-auto">
                  Transaction Hash: <a 
                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline break-all"
                  >
                    {shortenAddress(transactionHash, 8)}
                  </a>
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-sm text-gray">Please confirm the transaction in your wallet...</p>
            )}

            <p className="text-sm text-gray">
              This may take a minute. Please don't close this window.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmation step after successful submission
  if (step === 'confirmation' && transactionHash) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="bg-dark-gray text-white border-gray max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Proposal Created!</DialogTitle>
            <DialogDescription className="text-gray">
              Your proposal has been successfully submitted to the blockchain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="default" className="bg-green-600/20 border-green-600">
              <AlertTitle>Transaction Confirmed</AlertTitle>
              <AlertDescription className="overflow-auto">
                Transaction Hash: <a 
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline break-all"
                >
                  {shortenAddress(transactionHash, 8)}
                </a>
              </AlertDescription>
            </Alert>

            <p className="text-sm text-gray">
              Your proposal will now be available for voting. You can track its status on the proposals page.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Main form
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Proposal</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submit a proposal to {form.watch("type") === "invest" ? "add assets to" : "remove assets from"} the DAO.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="bg-primary/10 border-primary/20">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Important Information</AlertTitle>
          <AlertDescription className="text-sm">
            To create a proposal, you need to have DLOOP tokens staked in the DAO for voting power. 
            {form.watch("type") === "invest" 
              ? " For investment proposals, you'll also need to hold the selected token and approve it for the DAO contract."
              : " For divestment proposals, you're requesting to withdraw assets from the DAO treasury."
            }
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive" className="bg-destructive/20 border-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="form-group">
                  <FormLabel>Proposal Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="E.g., Increase WBTC Allocation"
                    />
                  </FormControl>
                  <FormDescription className="text-muted-foreground">
                    Clearly state the purpose of your proposal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="form-group">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[100px]"
                      placeholder="Provide details about why this proposal is beneficial for the DAO..."
                    />
                  </FormControl>
                  <FormDescription className="text-muted-foreground">
                    Include rationale, expected impact, and any relevant data
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="form-group">
                    <FormLabel>Proposal Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="invest">Invest (Add Assets)</SelectItem>
                        <SelectItem value="divest">Divest (Remove Assets)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-muted-foreground">
                      {field.value === "invest" 
                        ? "Add new assets to the DAO treasury" 
                        : "Remove assets from the DAO treasury"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem className="form-group">
                    <FormLabel>Asset</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supportedTokens
                          .filter(t => t.supportedTypes.includes(proposalType))
                          .map((t) => (
                            <SelectItem key={t.symbol} value={t.symbol}>{t.symbol}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-muted-foreground">
                      Select the digital asset for this proposal
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="form-group">
                  <FormLabel>Amount</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        className="rounded-r-none"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </FormControl>
                    <div className="bg-[hsl(var(--input))] border border-l-0 border-[hsl(var(--input-border))] rounded-r-lg px-4 flex items-center">
                      <span className="text-[hsl(var(--input-foreground))] font-medium">{form.watch("token")}</span>
                    </div>
                  </div>
                  <FormDescription className="text-muted-foreground">
                    {form.watch("type") === "invest" 
                      ? "Amount of assets to add to the DAO treasury" 
                      : "Amount of assets to remove from the DAO treasury"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem className="form-group">
                  <FormLabel>Voting Duration</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-muted-foreground">
                    How long the voting period will last
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 border-t border-[hsl(var(--border))]">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={step as string === 'submitting'}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="default"
                className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]"
                disabled={(step as string === 'submitting') || !isConnected}
              >
                {(step as string === 'submitting') ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Proposal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}