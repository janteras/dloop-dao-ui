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

interface Delegation {
  id: string;
  to: string;
  toName?: string;
  toType: 'Human' | 'AI Node';
  amount: number;
  date: number;
}

interface UndelegateTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  delegation: Delegation;
  onSuccess?: () => void;
}

export function UndelegateTokensModal({
  isOpen,
  onClose,
  delegation,
  onSuccess,
}: UndelegateTokensModalProps) {
  const { isConnected, signer } = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const displayName = delegation.toName || shortenAddress(delegation.to);

  const onSubmit = async (data: FormValues) => {
    if (!isConnected || !signer) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    if (data.amount > delegation.amount) {
      toast({
        title: 'Invalid Amount',
        description: `You can only undelegate up to ${delegation.amount} DLOOP from this delegation.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, this would interact with the contract
      const token = getContract('DLoopToken', signer);
      const tx = await token.undelegateTokens(
        delegation.to,
        ethers.parseEther(data.amount.toString())
      );
      await tx.wait();

      toast({
        title: 'Undelegation Successful',
        description: `You have successfully undelegated ${data.amount} DLOOP from ${displayName}.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      resetAndClose();
    } catch (error: any) {
      console.error('Error undelegating tokens:', error);
      toast({
        title: 'Undelegation Failed',
        description: error.message || 'There was an error undelegating your tokens. Please try again.',
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
    form.setValue('amount', delegation.amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Undelegate DLOOP Tokens</DialogTitle>
            <DialogDescription>
              Undelegate your DLOOP tokens from {displayName} ({delegation.toType}). This will decrease their voting power.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center">
              <Label>Delegated To</Label>
              <span className="text-sm text-muted-foreground">{displayName}</span>
            </div>

            <div className="flex justify-between items-center">
              <Label>Currently Delegated</Label>
              <span className="text-sm text-muted-foreground">{delegation.amount} DLOOP</span>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="amount">Amount to Undelegate</Label>
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
              {isSubmitting ? 'Undelegating...' : 'Undelegate Tokens'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}