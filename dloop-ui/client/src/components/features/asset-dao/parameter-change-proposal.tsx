import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ethers } from 'ethers';
import { EnhancedAssetDAOService, ProposalType } from '@/services/enhanced-assetDaoService';
import { ErrorHandler, ErrorCategory } from '@/lib/error-handler';
import { NotificationService } from '@/services/notification-service';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { handleAssetDAOError } from '@/lib/contractErrorHandler';
import { ADDRESSES } from '@/config/contracts';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Form validation schema for parameter change proposals
const parameterChangeSchema = z.object({
  parameter: z.string().min(1, "Please select a parameter to change"),
  value: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Value must be a positive number" }
  ),
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description cannot exceed 2000 characters")
});

type ParameterChangeFormValues = z.infer<typeof parameterChangeSchema>;

interface ParameterChangeProposalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ParameterChangeProposalDialog({ isOpen, onClose }: ParameterChangeProposalProps) {
  const { isConnected, signer } = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Define DAO parameters that can be changed
  const parameters = [
    { name: 'quorum', label: 'Quorum Requirement', description: 'Percentage of total tokens required for proposal quorum (in basis points, e.g. 1000 = 10%)', type: 'number' },
    { name: 'votingPeriod', label: 'Voting Period', description: 'Duration of voting period in seconds', type: 'number' },
    { name: 'executionDelay', label: 'Execution Delay', description: 'Time delay before proposal execution (in seconds)', type: 'number' },
    { name: 'minProposalStake', label: 'Min Proposal Stake', description: 'Minimum token amount required to create a proposal', type: 'token' },
    { name: 'minVotingBuffer', label: 'Min Voting Buffer', description: 'Minimum time a proposal must remain active (in seconds)', type: 'number' },
  ];
  
  // Initialize form with default values
  const form = useForm<ParameterChangeFormValues>({
    resolver: zodResolver(parameterChangeSchema),
    defaultValues: {
      parameter: '',
      value: '',
      title: '',
      description: ''
    }
  });
  
  const handleSubmit = async (data: ParameterChangeFormValues) => {
    if (!isConnected || !signer) {
      setError("Please connect your wallet to create a proposal");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setTxHash(null);
    
    try {
      // Map parameter names to contract addresses
      const parameterAddresses = {
        'quorum': ADDRESSES.AssetDAO,
        'votingPeriod': ADDRESSES.AssetDAO,
        'executionDelay': ADDRESSES.AssetDAO,
        'minProposalStake': ADDRESSES.AssetDAO,
        'minVotingBuffer': ADDRESSES.AssetDAO,
      };
      
      // Format value based on parameter type
      let formattedValue: ethers.BigNumberish;
      const selectedParam = parameters.find(p => p.name === data.parameter);
      
      if (data.parameter === 'quorum') {
        // Quorum is in basis points (e.g., 1000 = 10%)
        formattedValue = BigInt(data.value);
      } else if (data.parameter === 'minProposalStake') {
        // Token amount with 18 decimals
        formattedValue = ethers.parseEther(data.value);
      } else {
        // Time parameters in seconds
        formattedValue = BigInt(data.value);
      }
      
      // Create description text with formatted details
      const fullDescription = `${data.title}\n\n${data.description}\n\nParameter: ${selectedParam?.label}\nNew Value: ${data.value}${data.parameter === 'quorum' ? ' basis points' : ''}`;
      
      // Create proposal using the service
      const receipt = await EnhancedAssetDAOService.createParameterChangeProposal(
        signer,
        parameterAddresses[data.parameter as keyof typeof parameterAddresses],
        formattedValue,
        fullDescription
      );
      
      setTxHash(receipt.hash);
      
      toast({
        title: "Proposal Created",
        description: "Your parameter change proposal has been created successfully.",
      });
      
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (error) {
      // Use our enhanced error handling
      const appError = ErrorHandler.handleContractError(
        error, 
        'AssetDAO', 
        'createParameterChangeProposal'
      );
      
      setError(appError.message);
      
      // Use notification service for consistent error display
      NotificationService.error(appError.message, {
        title: "Failed to Create Proposal"
      });
      
      // Also show in toast for compatibility
      toast({
        title: "Failed to Create Proposal",
        description: appError.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create Parameter Change Proposal</DialogTitle>
          <DialogDescription>
            Propose changes to the AssetDAO governance parameters. Parameter changes require voting and will only take effect after proposal execution.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="parameter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parameter</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select parameter to change" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {parameters.map(param => (
                        <SelectItem key={param.name} value={param.name}>
                          {param.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {parameters.find(p => p.name === field.value)?.description || "Select a parameter to see its description"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Value</FormLabel>
                  <FormControl>
                    <Input {...field} type="text" />
                  </FormControl>
                  <FormDescription>
                    {form.watch("parameter") === "quorum" 
                      ? "Value in basis points (e.g., 1000 = 10%)" 
                      : form.watch("parameter") === "minProposalStake" 
                        ? "Value in DLOOP tokens" 
                        : "Value in seconds"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, concise title for your proposal
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      className="min-h-[120px]" 
                      placeholder="Explain why this parameter change is needed and what impact it will have"
                    />
                  </FormControl>
                  <FormDescription>
                    Provide context and justification for the parameter change
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {txHash && (
              <Alert>
                <AlertTitle>Transaction Submitted</AlertTitle>
                <AlertDescription>
                  Your proposal has been submitted successfully!
                  <br />
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    View on Etherscan
                  </a>
                </AlertDescription>
              </Alert>
            )}
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !isConnected}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creating..." : "Create Proposal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
