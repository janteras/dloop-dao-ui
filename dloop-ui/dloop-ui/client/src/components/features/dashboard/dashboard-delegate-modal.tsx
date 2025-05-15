'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ethers } from 'ethers';
import { shortenAddress } from '@/lib/utils';
import { TokenDelegationService } from '@/services/tokenDelegationService';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, ArrowRight, CheckCircle } from 'lucide-react';

const formSchema = z.object({
  amount: z.coerce
    .number()
    .min(0.000001, 'Amount must be at least 0.000001')
    .refine((val) => val > 0, {
      message: 'Amount must be greater than 0',
    }),
  recipientAddress: z
    .string()
    .min(1, 'Recipient address is required')
    .refine(
      (value) => {
        try {
          return ethers.isAddress(value);
        } catch {
          return false;
        }
      },
      {
        message: 'Please enter a valid Ethereum address',
      }
    )
});

type FormValues = z.infer<typeof formSchema>;

interface DashboardDelegateModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess?: () => void;
}

export function DashboardDelegateModal({
  isOpen,
  onClose,
  availableBalance,
  onSuccess
}: DashboardDelegateModalProps) {
  const { toast } = useToast();
  const { signer, address } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      recipientAddress: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!signer || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to delegate tokens.',
        variant: 'destructive',
      });
      return;
    }

    const { amount, recipientAddress } = values;
    
    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      // Check if address is valid
      if (!ethers.isAddress(recipientAddress)) {
        throw new Error('Invalid recipient address');
      }

      // Check if trying to delegate to self
      if (recipientAddress.toLowerCase() === address.toLowerCase()) {
        throw new Error('Cannot delegate to yourself');
      }

      // Format amount as string for the service
      const amountString = amount.toString();
      
      // Call the delegation service
      await TokenDelegationService.delegateTokens(
        signer,
        recipientAddress,
        amountString
      );

      // Show success state
      setIsSuccess(true);
      
      // Reset form
      form.reset();
      
      // Show success toast
      toast({
        title: 'Tokens delegated successfully',
        description: `${amount} DLOOP delegated to ${shortenAddress(recipientAddress)}`,
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after a brief delay to show success state
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Delegation error:', error);
      
      // Show error toast
      toast({
        title: 'Delegation failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delegate DLOOP Tokens</DialogTitle>
          <DialogDescription>
            Delegate your DLOOP tokens to another address to increase their voting power.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="recipientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                      disabled={isSubmitting || isSuccess}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the Ethereum address of the recipient
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
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        step="0.000001"
                        min="0.000001"
                        placeholder="0.0"
                        disabled={isSubmitting || isSuccess}
                        {...field}
                      />
                      <span className="text-sm font-medium">DLOOP</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Available balance: {availableBalance.toLocaleString()} DLOOP
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Delegated
                  </>
                ) : (
                  <>
                    Delegate
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
