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
import { getContract } from '@/lib/contracts';
import { shortenAddress } from '@/lib/utils';

const formSchema = z.object({
  amount: z.coerce
    .number()
    .min(0.000001, 'Amount must be at least 0.000001')
    .refine((val) => val > 0, {
      message: 'Amount must be greater than 0',
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface DelegateTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientAddress: string;
  recipientName?: string;
  recipientType: 'Human' | 'AI Node';
  availableBalance: number;
  onSuccess?: () => void;
}

export function DelegateTokensModal({
  isOpen,
  onClose,
  recipientAddress,
  recipientName,
  recipientType,
  availableBalance,
  onSuccess,
}: DelegateTokensModalProps) {
  const { isConnected, signer } = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const displayName = recipientName || shortenAddress(recipientAddress);

  const onSubmit = async (data: FormValues) => {
    if (!isConnected || !signer) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    if (data.amount > availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You have only ${availableBalance} DLOOP available to delegate.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, this would interact with the contract
      const token = getContract('DLoopToken', signer);
      const tx = await token.delegateTokens(
        recipientAddress,
        ethers.parseEther(data.amount.toString())
      );
      await tx.wait();

      toast({
        title: 'Delegation Successful',
        description: `You have successfully delegated ${data.amount} DLOOP to ${displayName}.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      resetAndClose();
    } catch (error: any) {
      console.error('Error delegating tokens:', error);
      toast({
        title: 'Delegation Failed',
        description: error.message || 'There was an error delegating your tokens. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    form.reset();
    onClose();
  };

  const maxAmount = () => {
    form.setValue('amount', availableBalance);
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Delegate DLOOP Tokens</DialogTitle>
            <DialogDescription>
              Delegate your DLOOP tokens to {displayName} ({recipientType}). Delegated tokens will increase their voting power while still remaining in your wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center">
              <Label>Recipient</Label>
              <span className="text-sm text-muted-foreground">{displayName}</span>
            </div>

            <div className="flex justify-between items-center">
              <Label>Available Balance</Label>
              <span className="text-sm text-muted-foreground">{availableBalance} DLOOP</span>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="amount">Amount to Delegate</Label>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={maxAmount}
                >
                  Max
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  {...form.register('amount')}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-sm text-muted-foreground">DLOOP</span>
                </div>
              </div>
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Delegating...' : 'Delegate Tokens'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}