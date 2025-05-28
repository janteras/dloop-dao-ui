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
import { Loader2, AlertCircle, Info as InfoIcon, Activity, ChevronRight, ChevronLeft, Check, DollarSign, Calculator } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AssetDAOContract } from '../../../types/contracts';
import { ADDRESSES } from "@/config/contracts";
import { shortenAddress } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { getContract } from "@/lib/contracts";

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

interface EnhancedProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'type' | 'assets' | 'details' | 'review' | 'confirmation' | 'submitting';

export function EnhancedProposalModal({ isOpen, onClose }: EnhancedProposalModalProps) {
  // Debug log to confirm component version
  console.log("EnhancedProposalModal loaded - Latest version with smart title and description generation");
  const { isConnected, address, signer } = useWallet();
  const { createProposal, isSubmitting } = useProposals();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [step, setStep] = useState<WizardStep>('type');
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [gasPrice, setGasPrice] = useState<string | null>(null);

  // Define supported tokens with their Sepolia testnet addresses
  // These are configured to match the actual deployed token addresses on Sepolia
  // These are configured to match the actual deployed token addresses on Sepolia
  // IMPORTANT: According to business requirements, DLOOP should not be available for any proposal type
  const supportedTokens = [
    // DLOOP is defined but not available for any proposal type according to requirements
    { symbol: "DLOOP", address: "0x05B366778566e93abfB8e4A9B794e4ad006446b4", supportedTypes: [] },
    // Tokens with price feeds that can be used for both investment and divestment
    { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", supportedTypes: ["invest", "divest"] }, // Sepolia USDC
    { symbol: "WBTC", address: "0xCA063A2AB07491eE991dCecb456D1265f842b568", supportedTypes: ["invest", "divest"] }  // Sepolia WBTC
  ];

  // Log available token addresses for debugging
  useEffect(() => {
    console.log('Available tokens for proposals:', supportedTokens);
  }, []);

  // Initialize form with default values and smart suggestions
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      title: "", // Will be dynamically set based on selected token
      description: "",
      type: "invest",
      token: "",
      amount: "",
      duration: "3",
    },
    mode: "onChange", // Enable real-time validation
  });

  // Watch proposal type to filter available tokens
  const proposalType = form.watch("type");
  const selectedToken = form.watch("token");
  const proposalAmount = form.watch("amount");

  // Get available tokens based on proposal type
  // Only include tokens that explicitly support the current proposal type
  const availableTokens = supportedTokens.filter(token => 
    token.supportedTypes && 
    token.supportedTypes.length > 0 && 
    token.supportedTypes.includes(proposalType)
  );

  // Log available tokens for the current proposal type for debugging
  useEffect(() => {
    if (isOpen) {
      console.log(`Available tokens for ${proposalType} proposals:`, availableTokens.map(t => t.symbol));
    }
  }, [isOpen, proposalType, availableTokens]);

  // Generate intelligent default title based on proposal type, token, and amount
  useEffect(() => {
    // Only update if we have a selected token
    if (selectedToken) {
      let defaultTitle;

      // If amount is provided, create a more specific title with the amount
      if (proposalAmount && parseFloat(proposalAmount) > 0) {
        const action = proposalType === 'invest' ? 'Add' : 'Remove';
        defaultTitle = `${action} ${proposalAmount} ${selectedToken} to the DAO`;
      } else {
        // Default title without amount
        defaultTitle = `${proposalType === 'invest' ? 'Invest in' : 'Divest from'} ${selectedToken}`;
      }

      // Only update if the title is empty or matches a previous default format
      const currentTitle = form.getValues('title');
      const previousDefaultTitle = `${proposalType === 'invest' ? 'Invest in' : 'Divest from'} ${selectedToken === 'DLOOP' ? 'USDC' : 'DLOOP'}`;
      const previousDefaultWithAmount = /^(Add|Remove) \d+\.?\d* (USDC|WBTC|DLOOP|PAXG) to the DAO$/;

      if (!currentTitle || 
          currentTitle === previousDefaultTitle || 
          previousDefaultWithAmount.test(currentTitle)) {
        form.setValue('title', defaultTitle, { shouldValidate: true });
      }
    }
  }, [selectedToken, proposalType, proposalAmount]);

  // Generate default description based on proposal type, token, and amount
  useEffect(() => {
    if (selectedToken && proposalAmount && parseFloat(proposalAmount) > 0) {
      // Get current description value
      const currentDescription = form.getValues('description');

      // Only update if empty or matches a previously generated description
      const defaultDescriptionRegex = /^(I propose to (invest|divest) \d+\.?\d* [A-Z]+ (into|from) the DAO treasury|This proposal seeks to (add|remove) \d+\.?\d* [A-Z]+ (to|from) our asset portfolio)/;

      if (!currentDescription || defaultDescriptionRegex.test(currentDescription)) {
        // Generate a more detailed description with rationale
        let defaultDescription = '';
        const tokenData = supportedTokens.find(t => t.symbol === selectedToken);

        if (proposalType === 'invest') {
          defaultDescription = `I propose to invest ${proposalAmount} ${selectedToken} into the DAO treasury.\n\n`;

          // Add token-specific rationale
          if (selectedToken === 'USDC') {
            defaultDescription += `This allocation to USDC will strengthen our stable asset reserves, providing better liquidity options for future investments and reducing portfolio volatility.`;
          } else if (selectedToken === 'WBTC') {
            defaultDescription += `Adding WBTC exposure to our portfolio will help preserve value against inflation and provide non-correlated assets for long-term treasury growth.`;
          } else if (selectedToken === 'PAXG') {
            defaultDescription += `Gold-backed PAXG will serve as a hedge against market uncertainty and diversify our treasury with a traditional store of value.`;
          } else {
            defaultDescription += `This investment will diversify our treasury and position us for future growth opportunities.`;
          }
        } else {
          defaultDescription = `This proposal seeks to remove ${proposalAmount} ${selectedToken} from our asset portfolio.\n\n`;

          // Add token-specific rationale for divestment
          if (selectedToken === 'USDC') {
            defaultDescription += `Reducing our USDC position will allow us to deploy capital into higher-yielding assets while maintaining sufficient reserves for operational needs.`;
          } else if (selectedToken === 'WBTC') {
            defaultDescription += `Divesting from WBTC at this time allows us to realize gains and rebalance our portfolio in response to current market conditions.`;
          } else if (selectedToken === 'DLOOP') {
            defaultDescription += `This strategic reduction in DLOOP holdings will help fund new initiatives while maintaining appropriate treasury diversity.`;
          } else {
            defaultDescription += `This divestment will help rebalance our treasury and free up capital for other strategic opportunities.`;
          }
        }

        // Set the new description
        form.setValue('description', defaultDescription, { shouldValidate: true });
      }
    }
  }, [selectedToken, proposalType, proposalAmount, form]);

  // Calculate step progress percentage
  const getStepProgress = () => {
    const steps: WizardStep[] = ['type', 'assets', 'details', 'review'];
    const currentIndex = steps.indexOf(step);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  // Reset form and modal state
  const resetForm = () => {
    form.reset();
    setError(null);
    setTransactionHash(null);
    setStep('type');
    setEstimatedGas(null);
    setGasPrice(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Navigate to next step - validate current step first
  const nextStep = async () => {
    let canProceed = true;

    if (step === 'type') {
      // Validate the type field
      const typeResult = await form.trigger('type');
      if (!typeResult) {
        canProceed = false;
      }
    } 
    else if (step === 'details') {
      // Validate title and description
      const titleResult = await form.trigger('title');
      const descriptionResult = await form.trigger('description');
      if (!titleResult || !descriptionResult) {
        canProceed = false;
      }
    }
    else if (step === 'assets') {
      // Validate token and amount
      const tokenResult = await form.trigger('token');
      const amountResult = await form.trigger('amount');
      const durationResult = await form.trigger('duration');
      if (!tokenResult || !amountResult || !durationResult) {
        canProceed = false;
      }
    }

    if (canProceed) {
      if (step === 'type') setStep('assets');
      else if (step === 'assets') setStep('details');
      else if (step === 'details') {
        // Estimate gas before going to review step
        try {
          await estimateProposalGas();
          setStep('review');
        } catch (error) {
          console.error("Failed to estimate gas:", error);
          // Still proceed to review, but without gas estimate
          setStep('review');
        }
      }
      else if (step === 'review') handleSubmitProposal();
    }
  };

  // Go back to previous step
  const prevStep = () => {
    if (step === 'assets') setStep('type');
    else if (step === 'details') setStep('assets');
    else if (step === 'review') setStep('details');
  };

  // Estimate gas for the transaction
  const estimateProposalGas = async () => {
    if (!signer || !selectedToken || !proposalAmount) return;

    try {
      const assetDAOContract = getContract('AssetDAO', signer);
      const token = supportedTokens.find(t => t.symbol === selectedToken);

      if (!token) return;

      // Calculate amount in wei
      let amountInWei;
      if (selectedToken === "DLOOP" || selectedToken === "ETH") {
        amountInWei = ethers.parseEther(proposalAmount);
      } else if (selectedToken === "USDC") {
        amountInWei = ethers.parseUnits(proposalAmount, 6);
      } else {
        amountInWei = ethers.parseEther(proposalAmount);
      }

      // Format description for blockchain storage
      const formattedDescription = `${form.getValues('title')}\n\n${form.getValues('description')}`;

      // Estimate gas based on proposal type using the correct contract function
      let estimatedGasUnits;
      try {
        // According to the AssetDAO ABI, the correct function is createProposal with proposalType parameter
        // ProposalType: Investment = 0, Divestment = 1, ParameterChange = 2
        const proposalTypeValue = proposalType === 'invest' ? 0 : 1; // 0 for invest, 1 for divest

        estimatedGasUnits = await assetDAOContract.createProposal.estimateGas(
          proposalTypeValue,
          token.address,
          amountInWei,
          formattedDescription
        );
      } catch (error) {
        console.error("Gas estimation failed:", error);
        // Default to a reasonable gas limit if estimation fails
        estimatedGasUnits = ethers.toBigInt(1000000); // Set a default gas limit of 1,000,000
      }

      // Get current gas price - using getFeeData instead of getGasPrice
      const feeData = await signer.provider.getFeeData();
      const currentGasPrice = feeData.gasPrice || ethers.parseUnits('5', 'gwei'); // Fallback to 5 gwei if null

      // Calculate estimated transaction cost
      const estimatedCost = currentGasPrice * estimatedGasUnits;

      // Format the values for display
      setGasPrice(ethers.formatUnits(currentGasPrice, 'gwei'));
      setEstimatedGas(ethers.formatEther(estimatedCost));

    } catch (error) {
      console.error("Error estimating gas:", error);
      setGasPrice("Unable to estimate");
      setEstimatedGas("Unable to estimate");
    }
  };

  // Submit the proposal
  const handleSubmitProposal = async () => {
    if (!isConnected || !signer) {
      setError("Please connect your wallet to create a proposal");
      return;
    }

    try {
      setStep('submitting');
      setError(null);

      // For direct contract interaction
      if (signer) {
        const assetDAOContract = getContract('AssetDAO', signer);

        // Prepare the proposal parameters
        const selectedToken = supportedTokens.find(t => t.symbol === form.getValues('token'));

        if (!selectedToken) {
          throw new Error("Invalid token selected");
        }

        // Check if this token is supported for the selected proposal type
        if (!selectedToken.supportedTypes.includes(form.getValues('type'))) {
          throw new Error(`${form.getValues('token')} is not supported for ${form.getValues('type') === 'invest' ? 'investment' : 'divestment'} proposals. DLOOP tokens can only be used in divestment proposals.`);
        }

        const tokenAddress = selectedToken.address;

        // Log the parameters for debugging
        console.log('Creating proposal with params:', {
          description: `${form.getValues('title')}\n\n${form.getValues('description')}`,
          tokenAddress,
          amount: form.getValues('amount')
        });

        // Convert amount to wei format for blockchain
        // Check if we're using the correct decimals based on token type
        // Different tokens have different decimal places
        let amountInWei;
        if (form.getValues('token') === "DLOOP" || form.getValues('token') === "ETH") {
          // 18 decimals for DLOOP and ETH
          amountInWei = ethers.parseEther(form.getValues('amount'));
        } else if (form.getValues('token') === "USDC") {
          // 6 decimals for USDC
          amountInWei = ethers.parseUnits(form.getValues('amount'), 6);
        } else {
          // Default to 18 decimals for other tokens
          amountInWei = ethers.parseEther(form.getValues('amount'));
        }

        console.log(`Converting ${form.getValues('amount')} ${form.getValues('token')} to wei: ${amountInWei.toString()}`);

        // Create the proposal on-chain using the correct method based on proposal type
        let tx;

        // Format description to be shorter and more concise for blockchain storage
        // This helps avoid potential issues with gas costs or string size limits
        let descriptionText = form.getValues('title'); 
        if (form.getValues('description') && form.getValues('description').length > 0) {
          // Limit description length to avoid excessive gas costs
          const maxDescriptionLength = 500;
          const truncatedDescription = form.getValues('description').length > maxDescriptionLength 
            ? form.getValues('description').substring(0, maxDescriptionLength) + "..." 
            : form.getValues('description');

          descriptionText = `${form.getValues('title')}\n\n${truncatedDescription}`;
        }

        console.log('Final proposal description:', descriptionText);

        try {
          // Check balance and approval for the selected token
          if (form.getValues('type') === 'invest') {
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
              console.log(`User balance for ${form.getValues('token')}:`, ethers.formatUnits(balance, await tokenContract.decimals()));

              if (balance < amountInWei) {
                throw new Error(`Insufficient ${form.getValues('token')} balance. You need ${form.getValues('amount')} ${form.getValues('token')} to create this proposal.`);
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
                  description: `Approving ${form.getValues('amount')} ${form.getValues('token')} for use by the AssetDAO contract. Please confirm this transaction in your wallet.`,
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
                  description: `Your ${form.getValues('token')} tokens have been approved for the proposal.`,
                });
              }
            } catch (approvalError: any) {
              console.error('Error with token balance or approval:', approvalError);

              // Inform the user about the specific issue
              if (approvalError.message.includes("insufficient")) {
                throw new Error(`You don't have enough ${form.getValues('token')} tokens for this proposal.`);
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

          // According to the AssetDAO ABI, the correct function is createProposal with proposalType parameter
          // ProposalType: Investment = 0, Divestment = 1, ParameterChange = 2
          const proposalType = form.getValues('type') === 'invest' ? 0 : 1; // 0 for invest, 1 for divest

          if (form.getValues('type') === 'invest') {
            // For invest proposals
            console.log('Calling createProposal with:', {
              proposalType: proposalType,
              tokenAddress,
              amountInWei: amountInWei.toString(),
              description: descriptionText,
              txOptions
            });

            tx = await assetDAOContract.createProposal(
              proposalType, // 0 = Investment
              tokenAddress,
              amountInWei,
              descriptionText,
              txOptions
            );
          } else {
            // For divest proposals
            console.log('Calling createProposal with:', {
              proposalType: proposalType,
              tokenAddress,
              amountInWei: amountInWei.toString(),
              description: descriptionText,
              txOptions
            });

            tx = await assetDAOContract.createProposal(
              proposalType, // 1 = Divestment
              tokenAddress,
              amountInWei,
              descriptionText,
              txOptions
            );
          }

          // Save transaction hash for confirmation
          setTransactionHash(tx.hash);
          console.log('Transaction submitted:', tx.hash);

          // Wait for transaction confirmation
          const receipt = await tx.wait();
          console.log('Transaction confirmed:', receipt);

          if (receipt.status === 0) {
            throw new Error("Transaction failed");
          }

          // Update UI to show confirmation
          setStep('confirmation');

          // Show success toast
          toast({
            title: "Proposal Created Successfully",
            description: `Your ${form.getValues('type') === 'invest' ? 'investment' : 'divestment'} proposal has been created.`,
          });

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
      }
    } catch (error: any) {
      console.error('Failed to create proposal:', error);
      setError(error.message || "Failed to create proposal");
      setStep('review');  // Go back to review step on error

      // Show error toast
      toast({
        title: "Proposal Creation Failed",
        description: error.message || "An error occurred while creating the proposal.",
        variant: "destructive",
      });
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'type':
        return (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Create New Proposal</DialogTitle>
              <DialogDescription>
                Select the type of proposal you want to create.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel>Proposal Type</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                          className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                            field.value === 'invest'
                              ? 'border-primary bg-primary/10'
                              : 'border-accent/20 hover:border-accent/60'
                          }`}
                          onClick={() => form.setValue('type', 'invest')}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Investment Proposal</h3>
                            {field.value === 'invest' && <Check className="h-5 w-5 text-primary" />}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Propose to invest DAO treasury funds into a new digital asset or increase existing asset allocation.
                          </p>
                        </div>

                        <div
                          className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                            field.value === 'divest'
                              ? 'border-primary bg-primary/10'
                              : 'border-accent/20 hover:border-accent/60'
                          }`}
                          onClick={() => form.setValue('type', 'divest')}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Divestment Proposal</h3>
                            {field.value === 'divest' && <Check className="h-5 w-5 text-primary" />}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Propose to sell a portion of assets from the DAO treasury, reducing exposure to a specific asset.
                          </p>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>

            <DialogFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={nextStep} className="gap-2">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Proposal Details</DialogTitle>
              <DialogDescription>
                Provide the basic information for your {proposalType === 'invest' ? 'investment' : 'divestment'} proposal.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposal Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={`${proposalType === 'invest' ? 'Invest in' : 'Divest from'} [Asset]`} 
                          className="shadow-sm dark:shadow-zinc-800"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Create a clear, concise title (5-100 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proposal Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Explain why this proposal should be approved and the expected impact..." 
                          className="min-h-[120px] shadow-sm dark:shadow-zinc-800" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed rationale for your proposal (20-2000 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={nextStep} className="gap-2">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        );

      case 'assets':
        return (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Asset Details</DialogTitle>
              <DialogDescription>
                Specify the asset and amount for your {proposalType === 'invest' ? 'investment' : 'divestment'} proposal.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Asset</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="shadow-sm dark:shadow-zinc-800">
                            <SelectValue placeholder="Select a token" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableTokens.map((token) => (
                            <SelectItem key={token.symbol} value={token.symbol}>
                                                             <div className="flex items-center">
                                <span>{token.symbol}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {shortenAddress(token.address) }
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {proposalType === 'invest' 
                          ? 'Select which asset to add to the treasury' 
                          : 'Select which asset to sell from the treasury'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input 
                            type="text" 
                            inputMode="decimal"
                            pattern="[0-9]*[.,]?[0-9]*"
                            placeholder="0.00" 
                            {...field} 
                            className="rounded-r-none shadow-sm dark:shadow-zinc-800"
                            onChange={(e) => {
                              // Clean input to ensure proper decimal format
                              const value = e.target.value.replace(/[^0-9.]/g, '');
                              // Prevent multiple decimal points
                              const parts = value.split('.');
                              const cleanedValue = parts.length > 1 
                                ? `${parts[0]}.${parts.slice(1).join('')}` 
                                : value;
                              field.onChange(cleanedValue);
                            }}
                          />
                          <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md">
                            {selectedToken || "Token"}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        {proposalType === 'invest' 
                          ? 'The amount to allocate to this asset' 
                          : 'The amount to divest from this asset'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting Duration</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="shadow-sm dark:shadow-zinc-800">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3">3 Days</SelectItem>
                          <SelectItem value="5">5 Days</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="14">14 Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How long the proposal will be open for voting
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={nextStep} className="gap-2">
                Review <ChevronRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Review Proposal</DialogTitle>
              <DialogDescription>
                Review your proposal before submission.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {form.getValues('title')}
                  </CardTitle>
                  <Badge>{proposalType === 'invest' ? 'Investment' : 'Divestment'}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm whitespace-pre-line">{form.getValues('description')}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Asset</h4>
                      <p className="font-medium">{form.getValues('token')}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Amount</h4>
                      <p className="font-medium">{form.getValues('amount')} {form.getValues('token')}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Voting Duration</h4>
                      <p className="font-medium">{form.getValues('duration')} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction cost estimate */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Estimated Transaction Cost</CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Gas Price:</div>
                    <div className="font-medium text-right">{gasPrice ? `${gasPrice} Gwei` : "Calculating..."}</div>

                    <div className="text-muted-foreground">Estimated Cost:</div>
                    <div className="font-medium text-right">{estimatedGas ? `${estimatedGas} ETH` : "Calculating..."}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={nextStep} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting
                  </>
                ) : (
                  <>
                    Submit Proposal
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        );

      case 'submitting':
        return (
          <div className="space-y-6 flex flex-col items-center justify-center py-8">
            <DialogHeader className="text-center">
              <DialogTitle>Creating Your Proposal</DialogTitle>
              <DialogDescription>
                Please wait while we submit your proposal to the blockchain.
              </DialogDescription>
            </DialogHeader>

            <div className="w-[80px] h-[80px] relative flex items-center justify-center">
              <div className="animate-spin h-full w-full border-4 border-t-primary border-l-primary border-b-primary border-r-transparent rounded-full"></div>
              <Activity className="h-10 w-10 text-primary absolute" />
            </div>

            <div className="text-center">
              {transactionHash ? (
                <>
                  <p className="mb-2">Transaction submitted:</p>
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline break-all"
                  >
                    {transactionHash}
                  </a>
                </>
              ) : (
                <p>Waiting for wallet confirmation...</p>
              )}
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-6 flex flex-col items-center justify-center py-8">
            <div className="w-[80px] h-[80px] rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-12 w-12 text-green-600" />
            </div>

            <DialogHeader className="text-center">
              <DialogTitle>Proposal Created Successfully!</DialogTitle>
              <DialogDescription>
                Your {proposalType === 'invest' ? 'investment' : 'divestment'} proposal has been submitted to the DAO.
              </DialogDescription>
            </DialogHeader>

            <div className="text-center space-y-4">
              <p>You can view your proposal on the blockchain:</p>
              <a 
                href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline break-all"
              >
                {transactionHash}
              </a>

              <div className="flex flex-col pt-4 gap-2">
                <Button onClick={handleClose} className="gap-2">
                  <Check className="h-4 w-4" /> Done
                </Button>

                <Button variant="outline" onClick={() => {
                  handleClose();
                  // Ideally would navigate to proposals, but we'll just close for now
                }}>
                  View All Proposals
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {/* Wallet Not Connected Warning */}
      {!isConnected && step === 'type' && (
        <DialogContent className="bg-dark-gray text-white border-gray max-w-md" forceMount>
          <DialogHeader>
            <DialogTitle>Wallet Not Connected</DialogTitle>
            <DialogDescription>
              You need to connect your wallet to create a proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Required</AlertTitle>
              <AlertDescription>
                Please connect your wallet to interact with the DAO.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      )}

      {/* Main Content - only show if not in submitting or confirmation step */}
      {isConnected && (step !== 'submitting' && step !== 'confirmation') && (
        <DialogContent className="sm:max-w-[550px]" forceMount>
          {/* Progress bar for multi-step form */}
          {['type', 'details', 'assets', 'review'].includes(step) && (
            <div className="mb-4">
              <Progress value={getStepProgress()} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span className={step === 'type' ? 'font-medium text-primary' : ''}>Type</span>
                <span className={step === 'details' ? 'font-medium text-primary' : ''}>Details</span>
                <span className={step === 'assets' ? 'font-medium text-primary' : ''}>Assets</span>
                <span className={step === 'review' ? 'font-medium text-primary' : ''}>Review</span>
              </div>
            </div>
          )}

          {renderStepContent()}
        </DialogContent>
      )}

      {/* Submitting Step to show transaction is in progress */}
      {step === 'submitting' && (
        <DialogContent className="bg-dark-gray text-white border-gray max-w-md" forceMount>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-accent" />
            <h2 className="text-xl font-semibold mt-4">Creating Proposal</h2>
            <p className="text-center text-muted-foreground">
              Please wait while your proposal is being submitted to the blockchain.
            </p>
            {transactionHash && (
              <div className="mt-4 text-center">
                <p className="mb-2 text-sm text-muted-foreground">Transaction:</p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline break-all"
                >
                  {transactionHash}
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      )}

      {/* Confirmation step after successful submission */}
      {step === 'confirmation' && transactionHash && (
        <DialogContent className="bg-dark-gray text-white border-gray max-w-md" forceMount>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-500/20 p-3">
              <Check className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-xl font-semibold mt-4">Proposal Created!</h2>
            <p className="text-center text-muted-foreground mt-2 mb-4">
              Your {form.getValues('type') === 'invest' ? 'investment' : 'divestment'} proposal has been created successfully.
            </p>

            <div className="bg-accent/10 rounded-lg p-4 w-full mt-2">
              <p className="font-medium mb-1">{form.getValues('title')}</p>
              <p className="text-sm text-muted-foreground mb-3">
                {form.getValues('amount')} {form.getValues('token')} • {form.getValues('duration')} days voting period
              </p>
              <a
                href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline"
              >
                View on Etherscan →
              </a>
            </div>

            <div className="flex gap-3 mt-6 w-full">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Close
              </Button>
              <Button className="flex-1" onClick={() => {
                handleClose();
                // Redirect to proposals page (would use Link/navigation in a real app)
                // history.push('/proposals');
              }}>
                View All Proposals
              </Button>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

export default EnhancedProposalModal;