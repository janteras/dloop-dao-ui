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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@/components/features/wallet/simplified-wallet-provider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Info as InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getContract } from "@/lib/contracts";
import { ADDRESSES } from "@/config/contracts";
import { shortenAddress } from "@/lib/utils";

// Form validation schema
const proposalFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description cannot exceed 2000 characters"),
  proposalType: z.enum(["parameter-update", "token-whitelist", "role-management", "custom-execution"]),
  
  // Parameter Update fields
  parameterType: z.enum(["voting-period", "execution-delay", "quorum"]).optional(),
  parameterValue: z.string().optional(),
  
  // Token Whitelist fields
  tokenAddress: z.string().optional(),
  isWhitelisted: z.boolean().optional(),
  
  // Role Management fields
  roleType: z.enum(["treasury", "admin", "owner"]).optional(),
  newAddress: z.string().optional(),
  
  // Custom Execution fields
  targets: z.string().optional(),
  values: z.string().optional(),
  calldatas: z.string().optional(),
});

// Add conditional validation based on proposalType
const getValidationSchema = (proposalType: string) => {
  if (proposalType === "parameter-update") {
    return proposalFormSchema.refine(
      (data) => !!data.parameterType && !!data.parameterValue,
      {
        message: "Parameter type and value are required for parameter update proposals",
        path: ["parameterType", "parameterValue"],
      }
    );
  } else if (proposalType === "token-whitelist") {
    return proposalFormSchema.refine(
      (data) => !!data.tokenAddress && ethers.isAddress(data.tokenAddress) && data.isWhitelisted !== undefined,
      {
        message: "Valid token address and whitelist status are required for token whitelist proposals",
        path: ["tokenAddress", "isWhitelisted"],
      }
    );
  } else if (proposalType === "role-management") {
    return proposalFormSchema.refine(
      (data) => !!data.roleType && !!data.newAddress && ethers.isAddress(data.newAddress),
      {
        message: "Role type and valid new address are required for role management proposals",
        path: ["roleType", "newAddress"],
      }
    );
  } else if (proposalType === "custom-execution") {
    return proposalFormSchema.refine(
      (data) => !!data.targets && !!data.values && !!data.calldatas,
      {
        message: "Targets, values, and calldatas are required for custom execution proposals",
        path: ["targets", "values", "calldatas"],
      }
    );
  }
  
  return proposalFormSchema;
};

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

interface CreateProtocolProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProtocolProposalModal({ isOpen, onClose }: CreateProtocolProposalModalProps) {
  // Remove excessive logging
  // console.log("Modal props received:", { isOpen, onClose });
  const { isConnected, address, signer } = useWallet();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'submitting' | 'confirmation'>('form');
  
  // Initialize form with default values
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      proposalType: "parameter-update",
      parameterType: "voting-period",
      parameterValue: "",
      tokenAddress: "",
      isWhitelisted: true,
      roleType: "treasury",
      newAddress: "",
      targets: "",
      values: "",
      calldatas: "",
    },
  });
  
  // Watch proposal type to apply conditional validation
  const proposalType = form.watch("proposalType");
  
  // Update validation schema when proposal type changes
  useEffect(() => {
    form.clearErrors();
  }, [proposalType, form]);
  
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
  
  const onSubmit = async (values: any) => {
    // Cast to our specific type
    const data = values as ProposalFormValues;
    
    if (!isConnected || !signer) {
      setError("Please connect your wallet to create a proposal");
      return;
    }
    
    const validationSchema = getValidationSchema(data.proposalType);
    try {
      validationSchema.parse(data);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const fieldErrors = validationError.flatten().fieldErrors;
        const errorMessage = Object.values(fieldErrors).flat()[0] || "Invalid form data";
        setError(errorMessage);
        return;
      }
    }
    
    try {
      setStep('submitting');
      setError(null);
      
      if (signer) {
        // Get Protocol DAO contract
        const protocolDaoContract = getContract('ProtocolDAO', signer);
        
        // Format description for on-chain storage
        let description = `${data.title}\n\n${data.description}`;
        
        // Prepare targets, values, and calldatas arrays based on proposal type
        let targets: string[] = [];
        let values: string[] = [];
        let calldatas: string[] = [];
        
        if (data.proposalType === "parameter-update") {
          if (!data.parameterType || !data.parameterValue) {
            throw new Error("Parameter type and value are required");
          }
          
          // Target the ProtocolDAO contract for parameter updates
          targets = [ADDRESSES.ProtocolDAO];
          values = ["0"]; // No ETH being sent with the call
          
          // Determine which parameter update function to call based on type
          let methodName: string;
          let functionSignature: string;
          let encodedParams: string;
          
          // Convert parameterValue from string to number/BigNumber
          const paramValue = ethers.parseUnits(data.parameterValue, 0); // Parse as integer
          
          switch (data.parameterType) {
            case "voting-period":
              methodName = "updateVotingPeriod";
              functionSignature = "updateVotingPeriod(uint256)";
              encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [paramValue]);
              break;
            case "execution-delay":
              methodName = "updateExecutionDelay";
              functionSignature = "updateExecutionDelay(uint256)";
              encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [paramValue]);
              break;
            case "quorum":
              methodName = "updateQuorum";
              functionSignature = "updateQuorum(uint256)";
              encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [paramValue]);
              break;
            default:
              throw new Error("Invalid parameter type");
          }
          
          // Create function selector (4 bytes) and combine with encoded parameters
          const functionSelector = ethers.id(functionSignature).slice(0, 10); // First 4 bytes of the keccak256 hash
          const encodedFunctionCall = functionSelector + encodedParams.slice(2); // Remove '0x' prefix from params
          calldatas = [encodedFunctionCall];
          
          console.log('Parameter update calldata:', {
            functionSignature,
            functionSelector,
            encodedParams,
            fullCalldata: encodedFunctionCall
          });
          
          // Add parameter details to description for reference
          description += `\n\nParameter: ${data.parameterType}, Value: ${data.parameterValue}`;
        } 
        else if (data.proposalType === "token-whitelist") {
          if (!data.tokenAddress || !ethers.isAddress(data.tokenAddress)) {
            throw new Error("Valid token address is required");
          }
          
          // Target the ProtocolDAO contract for token whitelisting
          targets = [ADDRESSES.ProtocolDAO];
          values = ["0"]; // No ETH being sent with the call
          
          // Encode a call to whitelistToken(address,bool)
          const functionSignature = "whitelistToken(address,bool)";
          const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address", "bool"],
            [data.tokenAddress, data.isWhitelisted]
          );
          
          // Create function selector and combine with encoded parameters
          const functionSelector = ethers.id(functionSignature).slice(0, 10); // First 4 bytes of the hash
          const encodedFunctionCall = functionSelector + encodedParams.slice(2); // Remove '0x' prefix
          calldatas = [encodedFunctionCall];
          
          console.log('Token whitelist calldata:', {
            functionSignature,
            functionSelector,
            encodedParams,
            fullCalldata: encodedFunctionCall
          });
          
          // Add token details to description for reference
          description += `\n\nToken Address: ${data.tokenAddress}, Whitelist Status: ${data.isWhitelisted ? 'Add to whitelist' : 'Remove from whitelist'}`;
        }
        else if (data.proposalType === "role-management") {
          if (!data.roleType || !data.newAddress || !ethers.isAddress(data.newAddress)) {
            throw new Error("Role type and valid address are required");
          }
          
          // Target the ProtocolDAO contract for role management
          targets = [ADDRESSES.ProtocolDAO];
          values = ["0"]; // No ETH being sent with the call
          
          // Determine which role update function to call
          let methodName: string;
          let functionSignature: string;
          let encodedParams: string;
          
          switch (data.roleType) {
            case "treasury":
              methodName = "updateTreasury";
              functionSignature = "updateTreasury(address)";
              encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [data.newAddress]);
              break;
            case "admin":
              methodName = "updateAdmin";
              functionSignature = "updateAdmin(address)";
              encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [data.newAddress]);
              break;
            case "owner":
              methodName = "transferOwnership";
              functionSignature = "transferOwnership(address)";
              encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [data.newAddress]);
              break;
            default:
              throw new Error("Invalid role type");
          }
          
          // Create function selector (4 bytes) and combine with encoded parameters
          const functionSelector = ethers.id(functionSignature).slice(0, 10); // First 4 bytes of the keccak256 hash
          const encodedFunctionCall = functionSelector + encodedParams.slice(2); // Remove '0x' prefix from params
          calldatas = [encodedFunctionCall];
          
          console.log('Role management calldata:', {
            functionSignature,
            functionSelector,
            encodedParams,
            fullCalldata: encodedFunctionCall
          });
          
          // Add role details to description for reference
          description += `\n\nRole: ${data.roleType}, New Address: ${data.newAddress}`;
        }
        else if (data.proposalType === "custom-execution") {
          if (!data.targets || !data.values || !data.calldatas) {
            throw new Error("Targets, values, and calldatas are required for custom execution");
          }
          
          try {
            // Parse the JSON arrays from string inputs
            targets = JSON.parse(data.targets);
            const valuesParsed = JSON.parse(data.values);
            calldatas = JSON.parse(data.calldatas);
            
            // Convert string values to proper format
            values = valuesParsed.map((v: string) => v);
            
            // Validate that all arrays have the same length
            if (targets.length !== values.length || values.length !== calldatas.length) {
              throw new Error("Targets, values, and calldatas arrays must have the same length");
            }
            
            // Validate each target is a valid address
            for (const target of targets) {
              if (!ethers.isAddress(target)) {
                throw new Error(`Invalid target address: ${target}`);
              }
            }
            
            // Add custom execution details to description
            description += `\n\nCustom Execution with ${targets.length} action(s)`;
          } catch (error: any) {
            if (error.message.includes("JSON")) {
              throw new Error("Invalid JSON format in targets, values, or calldatas. Use proper array format, e.g., [\"0x123...\"]");
            }
            throw error;
          }
        }
        
        console.log('Creating protocol proposal:', {
          description,
          targets,
          values,
          calldatas
        });
        
        try {
          // Log the final proposal parameters for debugging
          console.log('Submitting proposal with:', {
            description,
            targets,
            values,
            calldatas,
            proposalType: data.proposalType
          });
          
          // Validate that calldata is properly formatted for every proposal type
          if (calldatas.length === 0) {
            throw new Error("No calldata provided for proposal execution");
          }
          
          // Check that values array uses proper format when needed
          const parsedValues = values.map(v => {
            try {
              return ethers.parseEther(v);
            } catch (err) {
              console.error(`Error parsing value: ${v}`, err);
              toast({
                title: "Value Error",
                description: `Error parsing ETH value: ${v}. Make sure values are valid ETH amounts.`,
                variant: "destructive"
              });
              throw new Error(`Invalid ETH value format: ${v}`);
            }
          });
          
          const tx = await protocolDaoContract.createProposal(
            description,
            targets,
            parsedValues, // Use our validated parsed values
            calldatas,
            { gasLimit: 1000000 } // Set explicit gas limit
          );
          
          setTransactionHash(tx.hash);
          toast({
            title: "Proposal Submitted",
            description: "Your proposal has been submitted to the blockchain.",
          });
          
          // Wait for transaction confirmation
          const receipt = await tx.wait();
          
          if (receipt.status === 0) {
            throw new Error("Transaction failed");
          }
          
          // Success!
          setStep('confirmation');
          toast({
            title: "Proposal Created Successfully",
            description: "Your proposal has been successfully created and is now open for voting.",
          });
        } catch (contractError: any) {
          console.error('Contract interaction error:', contractError);
          
          // Provide more user-friendly error messages
          if (contractError.message.includes('user rejected transaction')) {
            throw new Error("Transaction was rejected in your wallet.");
          } else if (contractError.message.includes('insufficient funds')) {
            throw new Error("You don't have enough ETH to cover gas fees for this transaction.");
          } else if (contractError.message.includes('execution reverted')) {
            // Try to extract the reason from the error
            const reasonMatch = contractError.message.match(/reason="([^"]+)"/);
            const reason = reasonMatch ? reasonMatch[1] : 'Unknown reason';
            
            if (reason.includes("not enough voting power")) {
              throw new Error(
                "You don't have enough DLOOP tokens staked to create this proposal. You need to have DLOOP tokens staked for voting power."
              );
            } else {
              throw new Error(`Transaction would fail: ${reason}`);
            }
          } else {
            throw new Error(`Contract error: ${contractError.message}`);
          }
        }
      }
    } catch (err: any) {
      console.error('Error submitting proposal:', err);
      setError(err.message || "Failed to create proposal");
      setStep('form');
    }
  };
  
  // Show wallet connection prompt if not connected
  if (!isConnected) {
    console.log("Rendering wallet connection dialog");
    return (
      <Dialog open={isOpen} onOpenChange={(open) => {
        console.log("Dialog onOpenChange called with:", open);
        if (!open) handleClose();
      }}>
        <DialogContent className="bg-dark-gray text-white border-gray max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Connect Wallet</DialogTitle>
            <DialogDescription className="text-gray">
              You need to connect your wallet to create a protocol proposal.
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
              Your protocol proposal has been successfully submitted to the blockchain.
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
              Your proposal will now be available for voting by DAO members. You can track its status on the proposals page.
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
  // Remove excessive logging
  // console.log("Rendering main form dialog with isOpen:", isOpen);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log("Main form dialog onOpenChange called with:", open);
      if (!open) handleClose();
    }}>
      <DialogContent className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Protocol Proposal</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submit a governance proposal for the Protocol DAO. This can include adding new assets, upgrading contracts, or adjusting parameters.
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="default" className="bg-primary/10 border-primary/20">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Important Information</AlertTitle>
          <AlertDescription className="text-sm">
            To create a protocol proposal, you need to have DLOOP tokens staked in the DAO for voting power.
            Protocol proposals require higher voting power thresholds than Asset DAO proposals.
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
                      placeholder="E.g., Add LINK Token Support"
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
                  <FormLabel>Proposal Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-32 resize-y"
                      placeholder="Describe your proposal in detail, including its rationale and expected impact..."
                    />
                  </FormControl>
                  <FormDescription className="text-muted-foreground">
                    Provide a detailed explanation of your proposal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="proposalType"
              render={({ field }) => (
                <FormItem className="form-group">
                  <FormLabel>Proposal Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select proposal type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="parameter-update">Parameter Update</SelectItem>
                      <SelectItem value="token-whitelist">Token Whitelist</SelectItem>
                      <SelectItem value="role-management">Role Management</SelectItem>
                      <SelectItem value="custom-execution">Custom Execution</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-muted-foreground">
                    {field.value === "parameter-update" && "Update governance parameters like voting period, execution delay, and quorum"}
                    {field.value === "token-whitelist" && "Add or remove ERC-20 tokens from the protocol's approved list"}
                    {field.value === "role-management" && "Update key on-chain addresses (treasury, admin, owner)"}
                    {field.value === "custom-execution" && "Bundle arbitrary calls across any contracts into a single governance action"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Conditional fields based on proposal type */}
            {proposalType === "parameter-update" && (
              <>
                <FormField
                  control={form.control}
                  name="parameterType"
                  render={({ field }) => (
                    <FormItem className="form-group">
                      <FormLabel>Parameter Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parameter type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="voting-period">Voting Period</SelectItem>
                          <SelectItem value="execution-delay">Execution Delay</SelectItem>
                          <SelectItem value="quorum">Quorum</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-muted-foreground">
                        {field.value === "voting-period" && "Duration in blocks for proposal voting (e.g., 40320 blocks ≈ 1 week)"}
                        {field.value === "execution-delay" && "Delay before a passed proposal can be executed (e.g., 5760 blocks ≈ 1 day)"}
                        {field.value === "quorum" && "Minimum votes required to pass a proposal (e.g., 1000000 = 1M DLOOP)"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="parameterValue"
                  render={({ field }) => (
                    <FormItem className="form-group">
                      <FormLabel>Parameter Value</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 40320"
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground">
                        The new value you propose (integer format only, no decimals)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {proposalType === "token-whitelist" && (
              <>
                <FormField
                  control={form.control}
                  name="tokenAddress"
                  render={({ field }) => (
                    <FormItem className="form-group">
                      <FormLabel>Token Contract Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="font-mono"
                          placeholder="0x..."
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground">
                        The ERC-20 token contract address to whitelist or remove
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isWhitelisted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[hsl(var(--border))] p-4">
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={e => field.onChange(e.target.checked)}
                            className="rounded border-[hsl(var(--border))] h-4 w-4 text-[hsl(var(--primary))]"
                          />
                          <span>Add token to whitelist</span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-muted-foreground text-sm mt-1 ml-6">
                        Check to add token to whitelist, uncheck to remove from whitelist
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {proposalType === "role-management" && (
              <>
                <FormField
                  control={form.control}
                  name="roleType"
                  render={({ field }) => (
                    <FormItem className="form-group">
                      <FormLabel>Role Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="treasury">Treasury</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-muted-foreground">
                        {field.value === "treasury" && "The treasury address manages protocol assets"}
                        {field.value === "admin" && "The admin address has special permissions for protocol operation"}
                        {field.value === "owner" && "The owner address has the highest level of control (use with caution)"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="newAddress"
                  render={({ field }) => (
                    <FormItem className="form-group">
                      <FormLabel>New Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="font-mono"
                          placeholder="0x..."
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground">
                        The new account address to assign to this role
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {proposalType === "custom-execution" && (
              <>
                <Alert className="bg-amber-600/10 border-amber-600/20 mb-4">
                  <InfoIcon className="h-4 w-4 text-amber-400" />
                  <AlertTitle>Advanced Use Only</AlertTitle>
                  <AlertDescription className="text-sm">
                    Custom execution proposals allow you to execute arbitrary function calls on any contract.
                    This is an advanced feature and requires detailed knowledge of smart contract interactions.
                  </AlertDescription>
                </Alert>
                
                <FormField
                  control={form.control}
                  name="targets"
                  render={({ field }) => (
                    <FormItem className="form-group">
                      <FormLabel>Target Addresses</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="font-mono"
                          placeholder={`["0x1234...", "0x5678..."]`}
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground">
                        JSON array of target contract addresses
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="values"
                  render={({ field }) => (
                    <FormItem className="form-group">
                      <FormLabel>ETH Values</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="font-mono"
                          placeholder={`["0", "0"]`}
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground">
                        JSON array of ETH values to send with each call (usually ["0", "0"])
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="calldatas"
                  render={({ field }) => (
                    <FormItem className="form-group">
                      <FormLabel>Calldata</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="font-mono"
                          placeholder={`["0x1234abcd...", "0x5678efgh..."]`}
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground">
                        JSON array of ABI-encoded function calls
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <DialogFooter className="pt-4 border-t border-[hsl(var(--border))] gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Create Proposal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}